import { Hono } from 'hono';
import type { Env } from '../types';
import { json, readJson, requestInfo } from '../http';
import { first, run } from '../db';
import { allowedEmailDomains, isAllowedEmailDomain, normalizeEmail } from '../email-domains';
import { hashPassword, signJwt, verifyPassword } from '../security';
import type { SecretBinding } from '../types';

type AppEnv = { Bindings: Env };

type VerificationRow = {
  email: string;
  code_hash: string;
  expires_at: number;
  sent_at: number;
  attempt_count: number;
};

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_CODE_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function jwtSecret(env: Env): string {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

function cleanNickname(value: string | null | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.slice(0, 20) || fallback;
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return null;
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return null;
  return password;
}

function normalizeVerificationCode(code: unknown): string | null {
  if (typeof code !== 'string') return null;
  const trimmed = code.trim();
  return /^\d{6}$/.test(trimmed) ? trimmed : null;
}

function createVerificationCode(): string {
  return String(Math.floor(Math.random() * 10 ** VERIFICATION_CODE_LENGTH)).padStart(VERIFICATION_CODE_LENGTH, '0');
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function issueRegisteredToken(env: Env, email: string): Promise<string> {
  return signJwt({ userId: email, email, accountType: 'registered' }, jwtSecret(env), 7 * 24 * 60 * 60);
}

async function resolveSecretValue(secret: SecretBinding | undefined): Promise<string | undefined> {
  if (typeof secret === 'string') return secret;
  if (secret && typeof secret.get === 'function') return secret.get();
  return undefined;
}

async function sendVerificationEmail(env: Env, email: string, code: string): Promise<void> {
  const resendApiKey = (await resolveSecretValue(env.KEY_RESEND)) || (await resolveSecretValue(env.RESEND_API_KEY));
  if (!resendApiKey) {
    throw new Error('KEY_RESEND is not configured');
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'SCP OS <auth@daum.pw>',
      to: [email],
      subject: 'SCP-OS verification code',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111"><p>Your SCP-OS verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p><p>This code expires in 10 minutes.</p></div>`,
      text: `Your SCP-OS verification code is ${code}. This code expires in 10 minutes.`,
    }),
  });

  if (response.ok) return;

  const payload = await response.json().catch(() => null);
  const payloadMessage =
    payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : null;
  const message = payloadMessage || `Resend request failed with HTTP ${response.status}`;
  throw new Error(message);
}

export function registerAuth(app: Hono<AppEnv>): void {
  app.get('/api/auth/email-domains', (c) => {
    return json({ success: true, data: allowedEmailDomains() });
  });

  app.post('/api/auth/send-code', async (c) => {
    const body = await readJson<{ email?: string }>(c.req.raw);
    const email = normalizeEmail(body?.email);
    if (!email) {
      return json({ code: 'VALIDATION_ERROR', message: 'Invalid email' }, 400);
    }
    if (!isAllowedEmailDomain(email)) {
      return json({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', message: 'Email provider is not allowed' }, 400);
    }

    const existing = await first<{ id: number }>(c.env.SCP_DB, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return json({ success: false, error: 'Email already registered' }, 409);
    }

    const now = Date.now();
    const current = await first<VerificationRow>(
      c.env.SCP_DB,
      'SELECT email, code_hash, expires_at, sent_at, attempt_count FROM email_verification_codes WHERE email = ?',
      [email],
    );
    if (current && now - current.sent_at < VERIFICATION_CODE_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((VERIFICATION_CODE_COOLDOWN_MS - (now - current.sent_at)) / 1000);
      return json(
        {
          success: false,
          error: `Please wait ${retryAfterSeconds}s before requesting another code`,
        },
        429,
      );
    }

    const code = createVerificationCode();
    const codeHash = await sha256Hex(code);

    try {
      await sendVerificationEmail(c.env, email, code);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('[Auth] Failed to send verification email:', detail);
      return json(
        {
          success: false,
          error: 'Failed to send verification email',
          detail: c.env.ENVIRONMENT === 'development' ? detail : undefined,
        },
        502,
      );
    }

    await run(
      c.env.SCP_DB,
      'INSERT INTO email_verification_codes (email, code_hash, expires_at, sent_at, attempt_count, last_attempt_at, request_ip) VALUES (?, ?, ?, ?, 0, NULL, ?) ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, sent_at = excluded.sent_at, attempt_count = 0, last_attempt_at = NULL, request_ip = excluded.request_ip',
      [email, codeHash, now + VERIFICATION_CODE_TTL_MS, now, requestInfo(c.req.raw).ip],
    );

    return json({ success: true, message: 'Verification code sent' });
  });

  app.post('/api/auth/guest', async (c) => {
    const body = await readJson<{ userId?: string; nickname?: string }>(c.req.raw);
    const userId = typeof body?.userId === 'string' && body.userId.length <= 128 ? body.userId : crypto.randomUUID();
    const nickname = cleanNickname(body?.nickname, 'Guest');
    await run(
      c.env.SCP_DB,
      'INSERT INTO users (user_id, nickname, account_type, created_at, last_active_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET nickname = excluded.nickname, account_type = excluded.account_type, last_active_at = CURRENT_TIMESTAMP',
      [userId, nickname, 'guest'],
    );
    const token = await signJwt({ userId, accountType: 'guest' }, jwtSecret(c.env), 7 * 24 * 60 * 60);
    return json({ success: true, token, user: { userId, nickname, accountType: 'guest' } });
  });

  app.post('/api/auth/register', async (c) => {
    const body = await readJson<{ email?: string; password?: string; nickname?: string; code?: string }>(c.req.raw);
    const email = normalizeEmail(body?.email);
    const password = validatePassword(body?.password);
    const code = normalizeVerificationCode(body?.code);
    if (!email || !password || !code) {
      return json({ code: 'VALIDATION_ERROR', message: 'Invalid email, password or verification code' }, 400);
    }
    if (!isAllowedEmailDomain(email)) {
      return json({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', message: 'Email provider is not allowed' }, 400);
    }

    const existing = await first<{ id: number }>(c.env.SCP_DB, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return json({ success: false, error: 'Email already registered' }, 409);

    const verification = await first<VerificationRow>(
      c.env.SCP_DB,
      'SELECT email, code_hash, expires_at, sent_at, attempt_count FROM email_verification_codes WHERE email = ?',
      [email],
    );
    const now = Date.now();
    if (!verification || verification.expires_at < now) {
      await run(c.env.SCP_DB, 'DELETE FROM email_verification_codes WHERE email = ?', [email]);
      return json({ success: false, error: 'Verification code expired or missing' }, 400);
    }
    if (verification.attempt_count >= VERIFICATION_CODE_MAX_ATTEMPTS) {
      return json({ success: false, error: 'Too many invalid attempts, request a new code' }, 429);
    }

    const providedHash = await sha256Hex(code);
    if (providedHash !== verification.code_hash) {
      await run(
        c.env.SCP_DB,
        'UPDATE email_verification_codes SET attempt_count = attempt_count + 1, last_attempt_at = ? WHERE email = ?',
        [now, email],
      );
      return json({ success: false, error: 'Verification code is incorrect' }, 400);
    }

    const nickname = cleanNickname(body?.nickname, email.split('@')[0]);
    const passwordHash = await hashPassword(password);
    await run(
      c.env.SCP_DB,
      'INSERT INTO users (user_id, email, password_hash, nickname, account_type, created_at, last_active_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [email, email, passwordHash, nickname, 'registered'],
    );
    await run(c.env.SCP_DB, 'INSERT OR IGNORE INTO user_storage (user_id, max_bytes) VALUES (?, ?)', [
      email,
      512 * 1024 * 1024,
    ]);
    await run(c.env.SCP_DB, 'DELETE FROM email_verification_codes WHERE email = ?', [email]);
    const token = await issueRegisteredToken(c.env, email);
    return json({ success: true, token, user: { userId: email, email, nickname, accountType: 'registered' } });
  });

  app.post('/api/auth/login', async (c) => {
    const body = await readJson<{ email?: string; password?: string }>(c.req.raw);
    const email = normalizeEmail(body?.email);
    const password = validatePassword(body?.password);
    if (!email || !password) {
      return json({ code: 'VALIDATION_ERROR', message: 'Invalid email or password' }, 400);
    }
    if (!isAllowedEmailDomain(email)) {
      return json({ code: 'EMAIL_DOMAIN_NOT_ALLOWED', message: 'Email provider is not allowed' }, 400);
    }
    const user = await first<{
      user_id: string;
      email: string;
      nickname: string;
      password_hash: string;
      is_banned: number;
    }>(
      c.env.SCP_DB,
      'SELECT user_id, email, nickname, password_hash, is_banned FROM users WHERE email = ? AND account_type = ?',
      [email, 'registered'],
    );
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return json({ success: false, error: 'Email or password is incorrect' }, 401);
    }
    if (user.is_banned) return json({ success: false, error: 'Account disabled' }, 403);
    await run(c.env.SCP_DB, 'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE email = ?', [email]);
    const token = await issueRegisteredToken(c.env, email);
    return json({
      success: true,
      token,
      user: { userId: user.user_id, email: user.email, nickname: user.nickname, accountType: 'registered' },
    });
  });

  app.post('/api/auth/token', async (c) => {
    const body = await readJson<{ userId?: string }>(c.req.raw);
    const userId = body?.userId;
    if (!userId || typeof userId !== 'string' || userId.length > 128) {
      return json({ code: 'VALIDATION_ERROR', message: 'Missing or invalid userId' }, 400);
    }
    const user = await first<{ account_type: string }>(
      c.env.SCP_DB,
      'SELECT account_type FROM users WHERE user_id = ?',
      [userId],
    );
    if (user?.account_type !== 'guest') {
      return json({ code: 'FORBIDDEN', message: 'Token refresh is only available for guest sessions' }, 403);
    }
    const token = await signJwt({ userId, accountType: 'guest' }, jwtSecret(c.env), 7 * 24 * 60 * 60);
    return json({ success: true, token });
  });
}
