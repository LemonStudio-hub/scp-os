# Cloudflare Pages Deployment Fix Guide

## 🔍 Issues Identified

The following problems were causing deployment failures on Cloudflare Pages:

### 1. **Service Worker Not Compiled** (✅ FIXED IN CODE)
- **Problem**: `sw.ts` was being copied as-is without TypeScript compilation
- **Impact**: Invalid JavaScript in production causing runtime errors
- **Fix**: Modified `vite.config.ts` to use esbuild to compile `sw.ts` → `sw.js`

### 2. **Memory Issues During Build** (✅ FIXED IN CODE)
- **Problem**: Build process running out of memory on Cloudflare Pages
- **Impact**: Build process being killed (OOM)
- **Fix**: Added `NODE_OPTIONS='--max-old-space-size=4096'` to all build commands

### 3. **Build Output Directory Not Cleaned** (✅ FIXED IN CODE)
- **Problem**: Old build artifacts not being cleaned before new builds
- **Impact**: Stale files causing conflicts
- **Fix**: Added `emptyOutDir: true` to vite build config

### 4. **Cloudflare Pages Build Settings Not Configured** (⚠️ MANUAL FIX REQUIRED)
- **Problem**: Cloudflare Pages dashboard doesn't have correct build settings
- **Impact**: Build fails because it doesn't know how to build the project
- **Fix**: Requires manual configuration in Cloudflare Dashboard (see below)

---

## ⚠️ Manual Configuration Required

Cloudflare Pages **cannot** be fully configured through code alone. You must configure the build settings in the Cloudflare Dashboard:

### Step-by-Step Configuration

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com
   - Select your account
   - Go to **Workers & Pages** → **scpos**

2. **Configure Build Settings**
   - Click on **Settings** → **Build & deployments**
   - Update the following settings:

   | Setting | Value |
   |---------|-------|
   | **Production branch** | `main` |
   | **Build command** | `pnpm install --frozen-lockfile && pnpm run build:production` |
   | **Build output directory** | `dist` |
   | **Root directory (advanced)** | (leave blank - use repository root) |

3. **Configure Environment Variables**
   - In the same **Build & deployments** section, add these environment variables:

   | Variable | Value |
   |----------|-------|
   | `NODE_VERSION` | `20` |
   | `PNPM_VERSION` | `8.15.0` |

4. **Save and Redeploy**
   - Click **Save and deploy**
   - Or trigger a new deployment by pushing to the `main` branch

---

## ✅ Code Fixes Already Applied

The following fixes have been committed and pushed:

### 1. Updated Build Commands (packages/app/package.json)
```json
{
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vue-tsc -b && vite build",
  "build:development": "NODE_OPTIONS='--max-old-space-size=4096' vue-tsc -b && vite build --mode development",
  "build:production": "NODE_OPTIONS='--max-old-space-size=4096' vue-tsc -b && vite build --mode production"
}
```

### 2. Fixed Service Worker Compilation (packages/app/vite.config.ts)
- Added esbuild to compile TypeScript Service Worker to JavaScript
- The `sw.ts` file is now properly compiled to `sw.js` instead of being copied raw

### 3. Added Clean Build Output
- Added `emptyOutDir: true` to ensure clean builds

### 4. Added esbuild Dependency
- Added `esbuild` as a dev dependency for TypeScript compilation

---

## 🔍 Verification

After configuring the Cloudflare Dashboard settings, verify the deployment:

1. Check the deployment logs in the Cloudflare Dashboard
2. The build should complete successfully
3. The site should be accessible at: https://scpos.pages.dev

You can also check deployments via CLI:
```bash
wrangler pages deployment list --project-name=scpos
```

---

## 📝 Notes

- **wrangler.toml** is for Cloudflare Workers, not Pages
- Cloudflare Pages build settings must be configured in the Dashboard
- The Git integration will automatically trigger builds on push to configured branches
- All code fixes have been committed and pushed to the `main` branch

---

## 🆘 Troubleshooting

If the deployment still fails after configuring the dashboard:

1. **Check the build logs** in the Cloudflare Dashboard
2. **Verify pnpm-lock.yaml** is up to date
3. **Check Node.js version** compatibility (should be 20+)
4. **Review memory usage** - the build now uses 4GB max memory
5. **Verify build output directory** is `dist` at the repository root
