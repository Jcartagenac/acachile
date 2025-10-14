# Cloudflare Pages Build Configuration

## Build Settings
- **Build command**: `npm run build --workspace=frontend`
- **Build output directory**: `frontend/dist`
- **Root directory**: `/`

## Environment Variables
- **NODE_VERSION**: `18`
- **NPM_VERSION**: `10`

## Build Process
1. Install dependencies with npm ci (now synced)
2. Build frontend workspace only
3. Deploy from frontend/dist directory

## Notes
- Updated package-lock.json to sync with Wrangler 4.43.0
- Using workspace-specific build command
- Excluding worker and shared from Pages build