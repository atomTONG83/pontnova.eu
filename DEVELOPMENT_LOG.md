## 2026-04-22

### Public Sentinel source-list refresh

- Issue: the public Pontnova sentinel snapshot still carried the older `53`-source payload after the French source expansion had already been completed in the backend registry.
- Root cause: Pontnova reads the same `sources_payload` from the local sentinel backend during snapshot generation. Because the backend was not stably alive on port `8013`, the generated public bundle lagged behind the actual source configuration.
- Changes:
  - rechecked the live `/api/sources` response and verified it now returns `60` active sources
  - regenerated the Pontnova public snapshot bundle from the refreshed backend payload
  - refreshed the public data files so the added French sources now travel with the website snapshot itself
- Added public sources now included:
  - `blip`, `pmdm`, `rfpi`, `iptalk`, `dreyfus`, `schmittbrevet`, `schmittmarque`
- Risk control:
  - this refresh stays in the data bundle layer only
  - rollback can be handled by restoring the previous snapshot data package if needed

### Public Sentinel time-window parity

- Issue: the public Pontnova sentinel page did not expose the stream time filters (`全部 / 近3天 / 近7天 / 近30天 / 自定义`), so users could not quickly narrow the feed by recency from the public site.
- Root cause: the public showcase app already supported `date_from` / `date_to` filtering at the data-query layer, but the UI layer still lacked the corresponding time-filter controls.
- Changes:
  - added public time-window presets in the stream filter bar
  - added custom start/end date inputs with an explicit apply action
  - wired selected ranges into the public news query params
  - surfaced active time filters in focused-view labels
  - added matching dark-theme and mobile styles
  - bumped public asset version tokens in `eu_ip_sentinel.html` to force cache refresh
- Risk control:
  - limited this release to the public sentinel shell only
  - did not alter the broader Pontnova landing page structure
  - rollback is straightforward by restoring the prior public asset bundle and version token

## 2026-05-20

### Cloudflare Pages publishing migration

- Context: `pontnova.eu` has been moved from GitHub Pages to Cloudflare Pages. The Cloudflare Pages project is `pontnova`, with `pontnova.eu`, `www.pontnova.eu`, and `pontnova.pages.dev` bound to the project.
- Changes:
  - replaced the old GitHub Pages `deploy.sh` workflow with a Wrangler Pages deploy workflow
  - added `wrangler.toml` for the Cloudflare Pages project configuration
  - added `.gitignore` rules for Wrangler cache and generated deploy staging directories
  - updated `DEPLOY_INSTRUCTIONS.md` to make `atom-ip-sentinel` the canonical publish entry and this repo's script a manual fallback
- Publishing boundary:
  - Cloudflare receives only public static files and `eu_ip_sentinel_assets/`
  - deployment docs, development logs, scripts, and local Wrangler cache are excluded from the Cloudflare upload bundle
- Risk control:
  - source snapshots remain committed to `origin/main` for traceability
  - Cloudflare deployment is performed by direct Wrangler upload, independent of GitHub Pages

## 2026-05-21

### Chinese / English public-list parity

- Issue: the Chinese public list used the broader relevant feed, while the English public list used the safer publishable feed plus complete-English filtering. This made the English page appear materially shorter for same-day items.
- Root cause: several same-day Chinese items were `verification_publishable=0` (`fail` or `review`) but still visible in the Chinese default list. English correctly withheld them, but the two language views no longer shared a content universe.
- Changes:
  - aligned Chinese and English default list queries on `publishable_only=true`
  - kept complete-English filtering in English mode to prevent Chinese fallback
  - refreshed cache-buster tokens for the public JS bundle
  - regenerated the static snapshot after the local base completed English companion coverage for the publishable layer
- Result:
  - 2026-05-21 publishable same-day items: 4
  - 2026-05-21 publishable English-ready items: 4
  - public English page and public Chinese page now use the same publishable content set

## 2026-06-14

### Pontnova private workbench v1

- Context:
  - Request: build a simplified Pontnova version of the Atom workbench, using the Atom workbench architecture as reference and the 2026-05-20 Pontnova Cloudflare deployment notes as the deployment baseline.
  - Scope intentionally excludes patent prosecution / patent application workflow business.
  - Initial use cases are consulting, fundraising, training, workshop, and general Pontnova project coordination.
  - Production host remains Cloudflare Pages project `pontnova`.

- Reference material reviewed:
  - `/Volumes/LaCie/Codex/20260514 atom 工作台/README.md`
  - `/Volumes/LaCie/Codex/20260514 atom 工作台/ARCHITECTURE.md`
  - `/Volumes/LaCie/Codex/20260514 atom 工作台/DEPLOY.md`
  - `/Volumes/LaCie/Codex/20260520 PN/PONTNOVA_HANDOFF.md`
  - `/Volumes/LaCie/Codex/20260520 PN/PONTNOVA_CLOUDFLARE_MIGRATION.md`
  - Cloudflare Pages Functions documentation, especially Pages Functions and advanced `_worker.js` mode.

- Product decisions:
  - Keep the working shape of Atom workbench: dashboard, project list, tasks, deadlines / key dates, document index, import / export.
  - Remove legal-matter-specific modules: patent applications, official deadline calculation, case number generation, prosecution workflows, audit CRUD, timer integration, database-backed legal records.
  - Use a lightweight static first implementation for v1 so it can live safely inside the existing static Pontnova Cloudflare Pages deployment.
  - Store v1 workbench data in browser `localStorage` under `pontnova-workbench-v1`.
  - Include JSON export / import so local data can be backed up or moved before a later database version.

- Routes added:
  - `/workbench/login` - password login page, noindex.
  - `/workbench/` - protected Pontnova workbench app.
  - `/workbench/api/login` - Cloudflare Pages Function login handler.
  - `/workbench/api/logout` - Cloudflare Pages Function logout handler.

- Files added in `pontnova.eu`:
  - `_worker.js`
    - Cloudflare Pages advanced-mode Worker.
    - Protects `/workbench/` with an HMAC-signed HttpOnly session cookie.
    - Serves public static assets through `env.ASSETS.fetch(request)`.
    - Adds private/noindex/security headers for protected workbench responses.
    - Supports both `PONTNOVA_WORKBENCH_PASSWORD_SHA256` and fallback `PONTNOVA_WORKBENCH_PASSWORD`.
    - Uses `PONTNOVA_WORKBENCH_SESSION_SECRET` for session signing.
    - Handles `GET` and `HEAD` for `/workbench/login`, so uptime probes do not get false 404s.
  - `workbench/index.html`
    - Static app shell.
    - Views: dashboard, projects, tasks, calendar/key dates, documents.
    - Modal form for creating projects, tasks, deadlines, and document links.
  - `workbench/styles.css`
    - Responsive Pontnova internal-workbench visual system.
    - Desktop sidebar layout and mobile single-column layout.
    - Avoids marketing-page hero treatment; the first screen is the working app.
  - `workbench/app.js`
    - Seed project data for consulting, fundraising, training, and workshop.
    - Filtering/search, task completion, modal creation flows, JSON import/export.
    - No external runtime dependency.

- Files changed in `pontnova.eu`:
  - `deploy.sh`
    - Added `workbench` and `_worker.js` to `PUBLIC_PATHS`.
    - This ensures manual Cloudflare Pages direct uploads include the protected workbench and edge auth Worker.

- Files changed in `atom-ip-sentinel`:
  - `/Users/atom1983/Claude Projects/20260313 /atom-ip-sentinel/backend/deploy_hub.py`
    - Added `workbench` and `_worker.js` to `PONTNOVA_PUBLIC_PATHS`.
    - This keeps the scheduled / backend-driven Pontnova publishing path aligned with the manual deploy script.
    - Important because Pontnova production deploys are normally built from a clean `origin/main` worktree.

- Security:
  - The workbench is protected at the Cloudflare edge layer, not just hidden in front-end navigation.
  - Session cookie:
    - name: `pn_workbench_session`
    - scope: `Path=/workbench`
    - flags: `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS
    - max age: 12 hours
  - Production secret names:
    - `PONTNOVA_WORKBENCH_PASSWORD_SHA256`
    - `PONTNOVA_WORKBENCH_SESSION_SECRET`
  - The plaintext workbench password was not committed to code or written into this log.
  - Temporary local files used to generate the password, hash, and session secret were removed after deployment.
  - Protected responses set:
    - `Cache-Control: no-store`
    - `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`

- Cloudflare setup:
  - Verified Wrangler authentication with account access to the `pontnova` Pages project.
  - Created / updated production Pages secrets:
    - `PONTNOVA_WORKBENCH_SESSION_SECRET`
    - `PONTNOVA_WORKBENCH_PASSWORD_SHA256`
  - One transient Cloudflare API `504 Gateway Timeout` occurred while creating the password-hash secret; retry succeeded.

- Git / deployment:
  - Current feature work was isolated from the dirty local Pontnova branch by creating clean publish worktrees from `origin/main`.
  - Production commits pushed to `origin/main`:
    - `3bedc06 Add Pontnova private workbench`
    - `1822a4c Handle workbench login HEAD checks`
  - Cloudflare Pages deployments:
    - First successful preview: `https://35f55665.pontnova.pages.dev`
    - Final successful preview: `https://db3d497d.pontnova.pages.dev`
  - Production URL:
    - `https://pontnova.eu/workbench/login`

- Verification performed:
  - Static syntax checks:
    - `node --check workbench/app.js`
    - `node --input-type=module --check < _worker.js`
  - Local Cloudflare Pages preview:
    - ran `npx wrangler pages dev .cloudflare-pages/pontnova --port 8788 --ip 127.0.0.1` with local bindings
    - verified unauthenticated `/workbench/` redirects to `/workbench/login`
    - verified wrong password returns `401 Unauthorized`
    - verified correct password sets `pn_workbench_session` and returns the workbench page
    - verified dashboard seed projects render
    - verified task creation through the UI and visible task rendering
    - checked desktop and mobile layouts with the in-app browser
  - Production:
    - `https://pontnova.eu/workbench/` unauthenticated returns `302` to `/workbench/login`
    - `https://pontnova.eu/workbench/login` responds to `HEAD` with `200`
    - correct password returns `302` to `/workbench/` and sets secure HttpOnly cookie
    - authenticated `/workbench/` returns `200` and contains `Pontnova 工作台` / `项目总览`

- Current limitations:
  - Data is local to the browser unless the user exports/imports JSON.
  - No shared multi-user database yet.
  - No audit log, per-user identity, file API integration, or server-side project persistence yet.
  - No rate limiting on login attempts yet.
  - Workbench v1 is not linked from the public homepage; access is by direct URL.

- Recommended next steps:
  - Add Cloudflare KV or D1 persistence once the project data model stabilizes.
  - Add a small audit trail before storing client-sensitive material.
  - Add login rate limiting, preferably using KV or Durable Object counters.
  - Add backup workflow: scheduled export or explicit "download backup" habit before major edits.
  - Decide whether to keep data entirely private under `/workbench` or later add selected public-facing workshop/project pages.

- Rollback:
  - Revert `1822a4c` and `3bedc06` from `origin/main`.
  - Redeploy the previous Cloudflare Pages bundle.
  - Optionally remove the two Pages secrets from the Cloudflare dashboard.

### Pontnova workbench cloud database upgrade

- Context:
  - The first workbench version stored data in browser `localStorage`.
  - Requirement update: workbench data should live in a cloud database.
  - Chosen backend: Cloudflare D1, because the existing production stack is Cloudflare Pages and the workbench data is structured relational data.

- Cloudflare D1:
  - Database name: `pontnova-workbench`
  - Database ID: `509ae21d-1238-401c-bb6a-966ad436dacb`
  - Region reported by Wrangler: `WEUR`
  - Pages/Worker binding: `WORKBENCH_DB`

- Schema:
  - Added migration `migrations/0001_workbench_schema.sql`.
  - Tables:
    - `projects`
    - `tasks`
    - `deadlines`
    - `documents`
    - `audit_log`
  - Seed rows:
    - 4 projects
    - 4 tasks
    - 3 deadlines
    - 3 documents

- Application changes:
  - `_worker.js`
    - Added protected `/workbench/api/state`.
    - `GET /workbench/api/state` reads the full workbench state from D1.
    - `PUT /workbench/api/state` validates and replaces the full workbench state in D1 using prepared statements and `db.batch()`.
    - Malformed JSON returns `400`.
    - Missing D1 binding returns `503`.
  - `workbench/app.js`
    - Workbench now loads local cache first, then hydrates from cloud state.
    - Mutations still save local cache immediately.
    - Mutations also queue a D1 save through `/workbench/api/state`.
    - If cloud save fails, local data is retained and the UI reports a warning.
  - `workbench/index.html` / `workbench/styles.css`
    - Added cloud sync status indicator.
  - `wrangler.toml`
    - Added D1 binding configuration for `WORKBENCH_DB`.

- Migration / verification:
  - Created D1 database with Wrangler.
  - Applied migration locally:
    - `npx wrangler d1 migrations apply pontnova-workbench --local`
  - Applied migration remotely:
    - `npx wrangler d1 migrations apply pontnova-workbench --remote`
  - Verified remote counts:
    - projects: 4
    - tasks: 4
    - deadlines: 3
    - documents: 3
  - Verified local Pages dev binding exposes `env.WORKBENCH_DB`.
  - Verified authenticated local API:
    - `GET /workbench/api/state` returns cloud-backed state.
    - `PUT /workbench/api/state` persists a test task and returns counts.
  - Verified workbench page shows cloud sync status.

- Current behavior:
  - Cloud database is now the source of truth once a user is logged in.
  - Browser cache remains a resilience layer and fast first paint cache.
  - JSON export/import remains available for backup and manual migration.

- Follow-up:
  - Replace full-state `PUT` with per-record CRUD if multi-user concurrent editing becomes important.
  - Add login rate limiting.
  - Expand `audit_log` to record semantic operations rather than full state replacements.
  - Add regular D1 export backup routine.

### Pontnova workbench v2 interaction and Atom-style UI upgrade

- Date: 2026-06-14
- Context:
  - User feedback: project/task content felt static and could not be opened like Atom workbench.
  - Goal: move closer to Atom workbench's dashboard, calendar, and visualization style, while excluding patent application workflow and patent task management.
  - Scope remains Pontnova consulting, fundraising, training, and workshop project work.

- Reference checked:
  - Atom workbench dashboard at `/Volumes/LaCie/Codex/20260514 atom 工作台/src/app/app/page.tsx`
  - Atom calendar page and month grid components.
  - Atom platform mind map component.

- Main UI changes:
  - Added a sixth navigation view: `图谱`.
  - Added right-side detail drawer for opening records without leaving the dashboard.
  - Reworked project cards, task rows, deadline rows, and document cards as clickable work items.
  - Added a month/week/day calendar toolbar with previous, today, next controls.
  - Added relationship map SVG showing project -> tasks -> deadlines -> documents.
  - Updated visual system from the first warm beige version to a cleaner Pontnova operations palette:
    - light blue-gray background
    - dark teal sidebar
    - teal primary action
    - blue/amber/rose/green semantic accents
  - Updated login page inline style to match the new workbench palette.

- Interaction changes:
  - Project detail drawer:
    - shows progress, owner, priority, stage, related tasks, related deadlines, related documents
    - supports editing stage, priority, progress, owner, and next step
    - supports adding task, deadline, or document directly under that project
  - Task detail drawer:
    - supports editing title, project, owner, due date, status, and priority
    - links back to the parent project
  - Deadline detail drawer:
    - supports editing title, project, kind, date, and risk
    - links back to the parent project
  - Document detail drawer:
    - supports editing title, project, type, path/link, and notes
    - links back to the parent project
  - Calendar:
    - month view shows task/deadline chips inside each day cell
    - week view shows a 7-day agenda
    - day view shows a single-day agenda
    - clicking a day opens that day's schedule in the drawer
    - clicking a task/deadline event opens its own drawer
  - Project map:
    - project nodes are clickable
    - task/deadline/document counts are visualized as connected nodes

- Files changed:
  - `workbench/index.html`
    - added map nav/view, calendar toolbar, detail drawer markup
    - added versioned CSS/JS URLs to prevent stale browser cache after deployment
  - `workbench/app.js`
    - replaced the original list-only rendering with record-level drawers, calendar modes, map rendering, and richer event delegation
    - retained D1-backed state loading and saving via `/workbench/api/state`
  - `workbench/styles.css`
    - rebuilt workbench styling for dashboard, cards, table links, calendar, map, drawer, forms, and responsive layout
  - `_worker.js`
    - updated login page colors to match workbench v2

- Local verification:
  - `node --check workbench/app.js`
  - `node --check _worker.js`
  - Local Pages preview opened at `http://127.0.0.1:8788/workbench/`
  - Verified project card opens project drawer.
  - Verified task row opens task drawer.
  - Verified calendar month day opens day drawer.
  - Verified week/day calendar switches render correct agenda counts.
  - Verified project map node opens project drawer.
  - Captured desktop and mobile viewport screenshots to check layout and text fit.

- Notes:
  - Local preview D1 binding can create a temporary local database name in Wrangler; production remains bound to `WORKBENCH_DB` / `pontnova-workbench`.
  - Production D1 is the intended source of truth after deployment.
  - After production smoke testing, CSS/JS URLs were versioned as `20260614-v2` so existing browser sessions fetch the new interaction code.

- Follow-up:
  - Add drag/drop task ordering if daily task planning becomes important.
  - Add record-level CRUD API before multi-user simultaneous editing.
  - Add calendar import/export only if Pontnova needs external calendar sync.
