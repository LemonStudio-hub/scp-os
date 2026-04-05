# Cloudflare Pages Deployment Guide

## ✅ **Current Status** - Working

The Cloudflare Pages deployment is fully operational:

- **Production URL**: https://scpos.pages.dev
- **API Endpoint**: https://api.scpos.site (Cloudflare Worker)

---

## 🔧 Deployment Configuration

### Cloudflare Pages Settings

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `pnpm install --frozen-lockfile && pnpm run build:production` |
| **Build output directory** | `dist` |
| **Root directory** | (repository root) |

### Environment Variables

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |
| `PNPM_VERSION` | `8.15.0` |

---

## 🚀 How to Deploy

1. **Push to `main` branch** - Cloudflare Pages automatically triggers build
2. **Check deployment status**:
   ```bash
   wrangler pages deployment list --project-name=scpos
   ```
3. **View deployment logs**: Cloudflare Dashboard → Workers & Pages → scpos → Deployments

---

## 🐛 Troubleshooting

### Build Fails

1. **Check build logs** in Cloudflare Dashboard
2. **Verify all dependencies** are in package.json
3. **Test build locally**:
   ```bash
   pnpm install --frozen-lockfile
   pnpm run build:production
   ```
4. **Check Node.js version** (should be 20+)

### Common Issues (Fixed)

- ✅ `uuid` dependency missing → Added
- ✅ Service Worker not compiled → Fixed with esbuild
- ✅ Memory limits → Added `NODE_OPTIONS='--max-old-space-size=4096'`
- ✅ Build output not cleaned → Added `emptyOutDir: true`
- ✅ CORS blocking → Added `https://scpos.site` to allowed origins

### Service Worker Cache

If users don't see updates:
1. Service Worker version is now `scp-os-v2`
2. HTML uses network-first strategy (always fresh)
3. Users can hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`

---

## 📊 Deployment History

| Date | Commit | Status | Notes |
|------|--------|--------|-------|
| 2026-04-05 | 53b3d3f | ✅ Success | Responsive terminal output |
| 2026-04-05 | 8986333 | ✅ Success | ASCII art headers, slower logs |
| 2026-04-05 | e19774e | ✅ Success | Terminal commands fix |
| 2026-04-05 | 28b9e28 | ✅ Success | Multi-room chat system |
| 2026-04-04 | 84c0df9 | ✅ Success | Service Worker cache fix |
| 2026-04-04 | 8f34887 | ✅ Success | Theme reactive chat |
| 2026-04-04 | 6041130 | ✅ Success | Chat icon on home screen |
| 2026-04-04 | 42760ca | ✅ Success | uuid dependency fix |

---

## 📝 Notes

- `wrangler.toml` is for Cloudflare Workers, NOT Pages
- Pages configuration must be set in Cloudflare Dashboard
- All environment variables must match between local and CI

**Last Updated**: 2026-04-05
**Status**: ✅ All issues resolved, deployment working
