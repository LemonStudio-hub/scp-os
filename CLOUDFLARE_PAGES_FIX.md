# Cloudflare Pages Deployment Fix Guide

## ✅ **RESOLVED** - Deployment Now Working!

The latest deployment (commit: 42760ca) has been **successfully deployed** and is accessible at: https://scpos.pages.dev

---

## 🔍 Issues Identified and Fixed

### 1. **Missing `uuid` Dependency** (✅ FIXED)
- **Problem**: `uuid` package was used in code but not listed in `packages/app/package.json` dependencies
- **Impact**: Build failed every time because the import `import { v4 as uuidv4 } from 'uuid'` couldn't resolve
- **Files affected**:
  - `src/application/services/terminal-application.service.ts`
  - `src/composables/useTabsRefactored.ts`
- **Fix**: Added `uuid@13.0.0` to dependencies and `@types/uuid` to devDependencies
- **Status**: ✅ **RESOLVED** - Package added and deployment successful

### 2. **Service Worker Not Compiled** (✅ FIXED)
- **Problem**: `sw.ts` was being copied as-is without TypeScript compilation
- **Impact**: Invalid JavaScript in production causing runtime errors
- **Fix**: Modified `vite.config.ts` to use esbuild to compile `sw.ts` → `sw.js`
- **Status**: ✅ **RESOLVED**

### 3. **Memory Issues During Build** (✅ FIXED)
- **Problem**: Build process running out of memory on Cloudflare Pages
- **Impact**: Build process being killed (OOM)
- **Fix**: Added `NODE_OPTIONS='--max-old-space-size=4096'` to all build commands
- **Status**: ✅ **RESOLVED**

### 4. **Build Output Directory Not Cleaned** (✅ FIXED)
- **Problem**: Old build artifacts not being cleaned before new builds
- **Impact**: Stale files causing conflicts
- **Fix**: Added `emptyOutDir: true` to vite build config
- **Status**: ✅ **RESOLVED**

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
