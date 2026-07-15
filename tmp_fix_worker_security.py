#!/usr/bin/env python3
"""Fail-closed JWT secrets + untrack .env* on the current branch tip."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)


def write_if_changed(path: Path, content: str) -> bool:
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old == content:
        return False
    path.write_text(content, encoding="utf-8", newline="\n")
    return True


def ensure_require_jwt_secret(helpers: str) -> str:
    if "function requireJwtSecret" in helpers:
        return helpers
    needle = "export type { AppEnv, Ctx, RouteHandler }\n"
    insert = (
        needle
        + "\n"
        + "/** Fail closed — never fall back to a hardcoded JWT signing secret. */\n"
        + "export function requireJwtSecret(env: Env): string {\n"
        + "  const secret = env.JWT_SECRET?.trim()\n"
        + "  if (!secret) throw new Error('JWT_SECRET is not configured')\n"
        + "  return secret\n"
        + "}\n"
    )
    if needle not in helpers:
        # try with semicolons
        needle_sc = "export type { AppEnv, Ctx, RouteHandler };\n"
        insert_sc = (
            needle_sc
            + "\n"
            + "/** Fail closed — never fall back to a hardcoded JWT signing secret. */\n"
            + "export function requireJwtSecret(env: Env): string {\n"
            + "  const secret = env.JWT_SECRET?.trim();\n"
            + "  if (!secret) throw new Error('JWT_SECRET is not configured');\n"
            + "  return secret;\n"
            + "}\n"
        )
        if needle_sc in helpers:
            return helpers.replace(needle_sc, insert_sc, 1)
        raise RuntimeError("Could not find export type anchor in helpers.ts")
    return helpers.replace(needle, insert, 1)


def fix_helpers(path: Path) -> bool:
    if not path.exists():
        print("helpers.ts missing")
        return False
    text = path.read_text(encoding="utf-8")
    original = text

    text = ensure_require_jwt_secret(text)

    # adminSecret fail-closed
    text = re.sub(
        r"export function adminSecret\(env: Env\): string \{\s*"
        r"return env\.ADMIN_JWT_SECRET \|\| env\.JWT_SECRET \|\| 'admin-secret-key'\s*"
        r"\}",
        "export function adminSecret(env: Env): string {\n"
        "  const secret = env.ADMIN_JWT_SECRET?.trim() || env.JWT_SECRET?.trim()\n"
        "  if (!secret) throw new Error('ADMIN_JWT_SECRET/JWT_SECRET is not configured')\n"
        "  return secret\n"
        "}",
        text,
        count=1,
    )
    text = re.sub(
        r"export function adminSecret\(env: Env\): string \{\s*"
        r"return env\.ADMIN_JWT_SECRET \|\| env\.JWT_SECRET \|\| 'admin-secret-key';\s*"
        r"\}",
        "export function adminSecret(env: Env): string {\n"
        "  const secret = env.ADMIN_JWT_SECRET?.trim() || env.JWT_SECRET?.trim();\n"
        "  if (!secret) throw new Error('ADMIN_JWT_SECRET/JWT_SECRET is not configured');\n"
        "  return secret;\n"
        "}",
        text,
        count=1,
    )

    # requiredUser fail-closed
    bad_required = (
        "export async function requiredUser(c: Ctx): Promise<string | Response> {\n"
        "  const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET || 'scp-os-default-secret')\n"
        "  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401)\n"
        "}"
    )
    good_required = (
        "export async function requiredUser(c: Ctx): Promise<string | Response> {\n"
        "  let secret: string\n"
        "  try {\n"
        "    secret = requireJwtSecret(c.env)\n"
        "  } catch {\n"
        "    return json({ code: 'MISCONFIGURED', message: 'JWT_SECRET is not configured' }, 503)\n"
        "  }\n"
        "  const id = await userFromRequest(c.req.raw, secret)\n"
        "  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401)\n"
        "}"
    )
    if bad_required in text:
        text = text.replace(bad_required, good_required)

    bad_required_sc = (
        "export async function requiredUser(c: Ctx): Promise<string | Response> {\n"
        "  const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET || 'scp-os-default-secret');\n"
        "  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401);\n"
        "}"
    )
    good_required_sc = (
        "export async function requiredUser(c: Ctx): Promise<string | Response> {\n"
        "  let secret: string;\n"
        "  try {\n"
        "    secret = requireJwtSecret(c.env);\n"
        "  } catch {\n"
        "    return json({ code: 'MISCONFIGURED', message: 'JWT_SECRET is not configured' }, 503);\n"
        "  }\n"
        "  const id = await userFromRequest(c.req.raw, secret);\n"
        "  return id || json({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }, 401);\n"
        "}"
    )
    if bad_required_sc in text:
        text = text.replace(bad_required_sc, good_required_sc)

    # residual string fallbacks
    text = text.replace(
        "c.env.JWT_SECRET || 'scp-os-default-secret'",
        "requireJwtSecret(c.env)",
    )
    text = text.replace(
        "env.JWT_SECRET || 'scp-os-default-secret'",
        "requireJwtSecret(env)",
    )
    text = text.replace(
        "env.ADMIN_JWT_SECRET || env.JWT_SECRET || 'admin-secret-key'",
        "(env.ADMIN_JWT_SECRET?.trim() || env.JWT_SECRET?.trim() || (() => { throw new Error('ADMIN_JWT_SECRET/JWT_SECRET is not configured') })())",
    )

    if "scp-os-default-secret" in text or "admin-secret-key" in text:
        print("WARNING: helpers.ts still has default secrets after rewrite")

    if text == original:
        print("helpers.ts unchanged")
        return False
    path.write_text(text, encoding="utf-8", newline="\n")
    print("helpers.ts updated")
    return True


def fix_app(path: Path) -> bool:
    if not path.exists():
        print("app.ts missing")
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    old = "const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET || 'scp-os-default-secret')"
    new = "const secret = c.env.JWT_SECRET?.trim()\n    const id = secret ? await userFromRequest(c.req.raw, secret) : null"
    text = text.replace(old, new)
    old_sc = "const id = await userFromRequest(c.req.raw, c.env.JWT_SECRET || 'scp-os-default-secret');"
    new_sc = "const secret = c.env.JWT_SECRET?.trim();\n    const id = secret ? await userFromRequest(c.req.raw, secret) : null;"
    text = text.replace(old_sc, new_sc)
    if text == original:
        print("app.ts unchanged")
        return False
    path.write_text(text, encoding="utf-8", newline="\n")
    print("app.ts updated")
    return True


def fix_auth(path: Path) -> bool:
    if not path.exists():
        print("auth.ts missing")
        return False
    text = path.read_text(encoding="utf-8")
    original = text

    # Simple guest token route pattern
    text = text.replace(
        "const token = await signJwt({ userId }, c.env.JWT_SECRET || 'scp-os-default-secret', 7 * 24 * 60 * 60)",
        "const secret = c.env.JWT_SECRET?.trim()\n"
        "    if (!secret) return json({ code: 'MISCONFIGURED', message: 'JWT_SECRET is not configured' }, 503)\n"
        "    const token = await signJwt({ userId }, secret, 7 * 24 * 60 * 60)",
    )
    text = text.replace(
        "const token = await signJwt({ userId }, c.env.JWT_SECRET || 'scp-os-default-secret', 7 * 24 * 60 * 60);",
        "const secret = c.env.JWT_SECRET?.trim();\n"
        "    if (!secret) return json({ code: 'MISCONFIGURED', message: 'JWT_SECRET is not configured' }, 503);\n"
        "    const token = await signJwt({ userId }, secret, 7 * 24 * 60 * 60);",
    )

    # generic residual
    if "scp-os-default-secret" in text:
        text = text.replace(
            "c.env.JWT_SECRET || 'scp-os-default-secret'",
            "(() => { const s = c.env.JWT_SECRET?.trim(); if (!s) throw new Error('JWT_SECRET is not configured'); return s; })()",
        )
        text = text.replace(
            "env.JWT_SECRET || 'scp-os-default-secret'",
            "(() => { const s = env.JWT_SECRET?.trim(); if (!s) throw new Error('JWT_SECRET is not configured'); return s; })()",
        )

    if "scp-os-default-secret" in text:
        print("WARNING: auth.ts still has default secret")

    if text == original:
        print("auth.ts unchanged")
        return False
    path.write_text(text, encoding="utf-8", newline="\n")
    print("auth.ts updated")
    return True


def ensure_gitignore() -> bool:
    path = ROOT / ".gitignore"
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    needed = [
        ".env.production",
        ".env.development",
        "**/.env.production",
        "**/.env.development",
    ]
    missing = [line for line in needed if line not in text.splitlines()]
    if not missing:
        print(".gitignore env entries ok")
        return False
    block = (
        "\n# Environment files (never commit secrets — JWT etc. belong in Worker secrets only)\n"
        ".env\n"
        ".env.local\n"
        ".env.*.local\n"
        ".env.production\n"
        ".env.development\n"
        "**/.env\n"
        "**/.env.local\n"
        "**/.env.production\n"
        "**/.env.development\n"
        "!.env.example\n"
        "!**/.env.example\n"
    )
    if ".env.production" not in text:
        path.write_text(text.rstrip() + "\n" + block, encoding="utf-8", newline="\n")
        print(".gitignore updated")
        return True
    print(".gitignore partially present; skipping append")
    return False


def untrack_env() -> bool:
    changed = False
    for rel in (".env.production", ".env.development"):
        r = run(["git", "ls-files", "--error-unmatch", rel])
        if r.returncode == 0:
            run(["git", "rm", "--cached", "-f", rel])
            print(f"untracked {rel}")
            changed = True
    return changed


def main() -> None:
    changed = False
    changed |= fix_helpers(ROOT / "packages/worker/src/helpers.ts")
    changed |= fix_app(ROOT / "packages/worker/src/app.ts")
    changed |= fix_auth(ROOT / "packages/worker/src/routes/auth.ts")
    changed |= ensure_gitignore()
    changed |= untrack_env()

    # Final verification
    leftovers = []
    for rel in (
        "packages/worker/src/helpers.ts",
        "packages/worker/src/app.ts",
        "packages/worker/src/routes/auth.ts",
    ):
        p = ROOT / rel
        if p.exists():
            t = p.read_text(encoding="utf-8")
            if "scp-os-default-secret" in t or "admin-secret-key" in t:
                leftovers.append(rel)
    if leftovers:
        print("FAIL leftovers:", ", ".join(leftovers))
        raise SystemExit(1)
    print("OK" if changed else "OK (no file changes needed)")


if __name__ == "__main__":
    main()
