# CI/CD Workflows

This repository uses GitHub Actions for continuous integration and deployment.

## Available Workflows

### 1. CI Workflow (`ci.yml`)

**Trigger:** Push to master/main/develop branches, Pull Requests

**Jobs:**
- **test**: Runs test suite with coverage reporting
- **build**: Builds the application for both development and production
- **lint**: Performs TypeScript type checking
- **security**: Runs security scans (npm audit, Trivy)
- **worker-deploy**: Deploys Cloudflare Worker (master branch only)
- **pages-deploy**: Deploys to GitHub Pages (master branch only)

**Secrets Required:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

### 2. Release Workflow (`release.yml`)

**Trigger:** Push of version tags (e.g., `v1.0.0`)

**Jobs:**
- **release**: Creates GitHub release with build artifacts
  - Runs tests
  - Builds production version
  - Generates release notes from git log
  - Deploys Worker
  - Deploys to GitHub Pages

**Secrets Required:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `GITHUB_TOKEN`: GitHub token (auto-provided)

### 3. Manual Deploy Workflow (`deploy.yml`)

**Trigger:** Manual trigger via GitHub Actions UI

**Parameters:**
- `environment`: Development or Production
- `deploy_worker`: Whether to deploy Worker
- `deploy_pages`: Whether to deploy to GitHub Pages

**Secrets Required:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `GITHUB_TOKEN`: GitHub token (auto-provided)

## Setting Up Secrets

### Cloudflare Worker Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

**Get Cloudflare API Token:**
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Get API token from .wrangler/config file
```

**Get Cloudflare Account ID:**
```bash
# After login, account ID is in .wrangler/config/default.toml
# Or run:
wrangler whoami
```

## Workflow Status

You can view the status of all workflows in the Actions tab of the repository.

### Status Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/LemonStudio-hub/scp-os/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/LemonStudio-hub/scp-os/actions/workflows/release.yml/badge.svg)
```

## Deployment Environments

### Development
- Triggered by push to `develop` branch
- Built with development environment variables
- Deployed to staging (if configured)

### Production
- Triggered by push to `master` branch
- Built with production environment variables
- Deployed to Cloudflare Worker
- Deployed to GitHub Pages

## Manual Deployment

To trigger a manual deployment:

1. Go to Actions tab
2. Select "Manual Deploy" workflow
3. Click "Run workflow"
4. Choose parameters:
   - Environment: `development` or `production`
   - Deploy Worker: `true`/`false`
   - Deploy Pages: `true`/`false`

## Troubleshooting

### Workflow Failures

**Test Failures:**
- Check test logs in Actions tab
- Run tests locally: `npm test`

**Build Failures:**
- Check build logs for type errors
- Run type check locally: `npm run lint`

**Worker Deployment Failures:**
- Verify Cloudflare secrets are set correctly
- Check Worker configuration in `worker/wrangler.toml`
- Test Worker deployment locally: `cd worker && wrangler deploy`

**Pages Deployment Failures:**
- Verify GitHub Pages is enabled in repository settings
- Check branch is set to gh-pages or main/docs
- Verify build output exists in `dist/` directory

### Common Issues

**Node Version Mismatch:**
- Ensure CI uses Node.js 20
- Update `package.json` engines if needed

**Cache Issues:**
- Clear cache by clicking "Clear cache" in workflow run
- Or manually clear by incrementing cache key in setup-node action

**Secret Not Found:**
- Verify secrets are set in repository settings
- Check secret names match exactly (case-sensitive)

## Best Practices

1. **Always Test Before Pushing**
   - Run `npm test` locally
   - Run `npm run lint` locally
   - Run `npm run build` locally

2. **Use Feature Branches**
   - Create feature branches for new features
   - Create hotfix branches for bug fixes
   - Use pull requests for code review

3. **Semantic Versioning**
   - Use version tags: `v1.0.0`, `v1.0.1`, `v2.0.0`
   - Follow [Semantic Versioning](https://semver.org/)
   - Update `package.json` version field

4. **Changelog Maintenance**
   - Update CHANGELOG.md for each release
   - Follow [Keep a Changelog](https://keepachangelog.com/)
   - Include breaking changes, features, fixes

## Monitoring

### Workflow Runs

View all workflow runs in the Actions tab:
- https://github.com/LemonStudio-hub/scp-os/actions

### Build Status

Monitor build status in the Actions tab or use status badges in README.

### Deployment Status

Check deployment logs for:
- Cloudflare Worker deployment status
- GitHub Pages deployment status
- API availability after deployment

## Performance Monitoring

The CI workflow includes:
- Bundle size checking
- Test coverage reporting
- Security vulnerability scanning
- Build time optimization

## Support

For issues with CI/CD workflows:
1. Check existing Actions runs for similar issues
2. Review workflow logs for error messages
3. Open an issue in the repository
4. Tag with `ci/cd` label