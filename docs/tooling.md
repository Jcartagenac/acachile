# Tooling & Automation

This document centralises the commands and helper scripts that keep the ACA Chile project healthy. Everything here is safe to run locally; production changes still require Cloudflare credentials or CI.

## npm Scripts (root workspace)

| Command | Description |
| --- | --- |
| `npm run lint` | Runs the focused ESLint suite (frontend utilities + backend helpers). |
| `npm run typecheck` | Executes the TypeScript checks for the shared utility layer and a curated subset of Pages Functions. |
| `npm run test` | Executes the Vitest suite (frontend + backend helpers). |
| `npm run verify` | Convenience wrapper that runs lint → typecheck → tests in sequence. |

## Frontend workspace (`npm run <script> -w frontend`)

| Command | Description |
| --- | --- |
| `dev` | Starts Vite with HMR on `localhost:5173`. |
| `build` | Runs the typecheck subset and produces a production build in `frontend/dist`. |
| `test` / `test:watch` | Runs the Vitest suite once or in watch mode. |
| `lint` | Lints the curated quality-scope files (shared utilities and backend helpers). |
| `typecheck` | Delegates to `typecheck:frontend` + `typecheck:backend`. |
| `typecheck:frontend` | Checks TypeScript for shared utils and client-side helpers. |
| `typecheck:backend` | Checks TypeScript for key Pages Functions utilities (`api/health`, health helpers). |
| `verify` | Same as the root command, but scoped to the workspace. |
| `deploy` | Builds and deploys `frontend/dist` to Cloudflare Pages (requires authenticated `wrangler`). |
| `deploy:auto` | Smart deploy helper that inspects bindings before pushing (custom script). |
| `setup-bindings` | Runs `frontend/scripts/dashboard-helper.cjs` to sync Pages bindings. |
| `check-bindings` | Calls `/api/bindings` for the currently deployed environment. |
| `health-check` | Calls `/api/health` for quick smoke validation. |

## Operational Scripts

| Script | Location | Description |
| --- | --- | --- |
| `start-dev.sh` | root | Launches the historical worker + frontend dev servers (keep in sync if you reinstate the worker). |
| `stop-dev.sh` | root | Stops background dev processes launched by `start-dev.sh`. |
| `auto-dns-setup.sh` | root | Utility to provision DNS entries from the documented defaults. |
| `setup-r2-master.sh` / `setup-r2-complete.js` | root | Assist in provisioning Cloudflare R2 buckets and access keys. |
| `frontend/scripts/intelligent-deploy.cjs` | frontend | Chooses the safest deployment strategy based on binding state. |
| `frontend/scripts/dashboard-helper.cjs` | frontend | Generates a bindings dashboard JSON snapshot. |

## Quality Workflow

1. `npm install`
2. `cp .env.example .env.local` (adjust values)
3. `npm run verify`

The CI workflow (`.github/workflows/ci.yml`) runs the same `npm run verify` command on every push and pull request.
