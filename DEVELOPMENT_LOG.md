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

### Pontnova workbench v3 Atom parity expansion

- Date: 2026-06-14
- Context:
  - User feedback: Atom workbench projects/cases all have case numbers; Pontnova v2 still did not feel like a complete replication.
  - Goal: replicate most non-patent-prosecution Atom workbench capabilities, while keeping Pontnova scoped to consulting, fundraising, training, workshops, and operations.
  - Patent prosecution-specific blocks remain excluded.

- Atom workbench concepts mapped:
  - Atom `Program` -> Pontnova business line (`咨询`, `投融资`, `培训`, `Workshop`, `运营`)
  - Atom `Case.caseNumber` -> Pontnova `projectNo`, e.g. `PN-CONS-2026-001`
  - Atom case detail -> Pontnova project dossier drawer
  - Atom tasks/deadlines/documents -> Pontnova tasks/nodes/materials
  - Atom OKR -> Pontnova objectives and key results
  - Atom time entries/workload -> Pontnova investment/workload records
  - Atom audit trail -> Pontnova activity feed
  - Atom calendar/map -> Pontnova calendar and project relationship map

- Database changes:
  - Added migration `migrations/0002_workbench_atom_parity.sql`.
  - Extended `projects` with:
    - `project_no`
    - `opened_at`
    - `due_date`
    - `budget`
    - `contact`
    - `goal`
    - `health`
  - Added new tables:
    - `objectives`
    - `key_results`
    - `time_entries`
    - `activities`
  - Seeded project numbers for the 4 existing projects.
  - Seeded initial OKR, key results, workload, and activity records.

- Application changes:
  - `_worker.js`
    - `/workbench/api/state` now reads/writes projects, tasks, deadlines, documents, objectives, key results, time entries, and activities.
    - PUT sanitization now covers project numbers, project dates, health state, OKR fields, workload rows, and activity feed rows.
  - `workbench/index.html`
    - Added nav/views for `目标`, `投入`, and `动态`.
    - Added business-line cards to overview and project pages.
    - Versioned assets as `20260614-v3`.
  - `workbench/app.js`
    - Rebuilt state model around project dossiers with `projectNo`.
    - Added business-line aggregation, OKR cards, workload chart/table, and activity feed.
    - Project drawer now includes project number, contact, opened/due dates, budget/package, goal, health, linked objectives, workload, and activity actions.
    - Added create/edit flows for objectives and time entries.
    - Activity records are created when major project/task/node/document/objective/time changes happen.
  - `workbench/styles.css`
    - Added styles for project numbers, business-line cards, OKR cards, workload bars, activity feed, and health/status states.

- Local verification:
  - `node --check workbench/app.js`
  - `node --check _worker.js`
  - Applied local D1 migration 0002 successfully.
  - Local Pages preview opened at `http://127.0.0.1:8788/workbench/`.
  - Verified overview renders:
    - 9 nav items
    - business-line cards
    - project numbers
    - objective cards
    - workload metrics
    - activity feed
  - Verified project dossier opens and includes project number plus quick-add time entry.
  - Verified objective drawer opens and shows key results.
  - Verified workload page shows bars/table.
  - Verified activity page shows activity rows.
  - Browser console error log was empty.
  - Captured desktop and mobile screenshots for layout checks.

- Notes:
  - Local Wrangler Pages D1 binding may still use a temporary database namespace and show fallback sync in the browser, but migration 0002 applied successfully to the configured local D1 database.
  - Production verification must run after applying remote migration 0002.

### Local retained copy

- Date: 2026-06-14
- Purpose:
  - Keep a clean local retained copy of the Pontnova workbench v3 source for future development and rollback reference.
  - Source is the deployed `origin/main` commit, not the dirty working directory.
- Source commit:
  - `7479ec05980d272f1b4ec0ef7c4ff75b5b9a9f82`
- Local copy:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v3-7479ec0`
- Archive:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v3-7479ec0.tar.gz`
- SHA-256:
  - `7ecd4e59652f3618552a1b5a954e0cc588d9cd2a28319a4d6d9761c329a50b3c`
- Manifest:
  - `LOCAL_BACKUP_MANIFEST.md`

## 2026-06-14 Workbench v4 Atom-style dashboard refinement

### Request

- User feedback:
  - Atom workbench home dashboard is clearer and better looking.
  - PN workbench home page still felt cluttered.
  - After login, the first screen should behave like a dashboard/kanban.
  - Project, task, deadline, and OKR details still need to be clickable.

### Scope

- Keep the Pontnova simplified business scope:
  - consulting
  - fundraising
  - training
  - workshop
- Do not add patent-application workflow modules.
- Do not change D1 schema in this iteration.
- Continue using cloud D1 state and project-number-based records.

### UI / UX changes

- Rebuilt the workbench home page into an Atom-style board:
  - hero panel with date, operating principle, quick task/node actions, and 4 key metrics
  - workload analytics panel with range controls, KPI cards, daily histogram, project distribution, top workload projects, and weekly trend
  - current tasks section using compact table-like rows
  - deadline radar section for near-term project nodes
  - compact OKR summary section
  - portfolio section for business-line cards
  - bottom entry cards for Newsdesk, Audit Trail, and Platform Map
- Hid the old topbar on the dashboard view so the first viewport starts directly with the board.
- Added sidebar `+ 新增项目` so users can create project dossiers from the dashboard.
- Updated navigation labels:
  - 看板
  - 项目
  - 日程
  - OKR
  - 任务
  - 投入分析
  - 资料索引
  - 活动日志
  - 平台图谱
- Shifted the visual style to Atom-like warm cream, terracotta, brown, green, and blue accents.

### Interaction changes

- Dashboard task rows open task detail drawers.
- Dashboard deadline rows open deadline detail drawers.
- Dashboard OKR rows open objective detail drawers.
- Project cards in the project view still open editable project dossiers with project numbers.
- Workload range controls now update dashboard analytics:
  - 7 天
  - 30 天
  - 90 天
  - 1 年
  - 全部

### Files changed

- `workbench/index.html`
  - Replaced the previous overview layout with a board-first dashboard structure.
  - Added dashboard containers for metrics, workload charts, task rows, deadline radar, OKR summary, portfolio, and bottom cards.
  - Bumped workbench assets to `20260614-v4`.
- `workbench/app.js`
  - Added dashboard range state.
  - Added renderers for hero metrics, workload analytics, histogram, distributions, trend, task rows, deadline radar rows, and compact OKR rows.
  - Updated view switching so returning to the dashboard re-renders the new board.
  - Removed old dashboard task-card overwrites.
- `workbench/styles.css`
  - Added Atom-inspired warm palette.
  - Added board, hero, analytics, histogram, radar, task-row, OKR-row, and responsive styles.
  - Added mobile rules to avoid horizontal overflow.

### Local verification

- `node --check workbench/app.js`
- `node --check _worker.js`
- Local static preview:
  - `http://127.0.0.1:3003/workbench/`
- Browser verification:
  - Dashboard opens as the first view.
  - Hero headline renders:
    - `先看期限，再看项目，把今天的时间放到最重要的事上。`
  - Dashboard rendered:
    - 4 hero metric cards
    - 4 current task rows
    - 3 deadline radar rows
    - 2 compact OKR rows
    - 5 portfolio cards
  - Project card opens project drawer with project number and save button.
  - Dashboard task row opens task drawer.
  - Dashboard deadline row opens deadline drawer.
  - Dashboard OKR row opens objective drawer.
  - Workload range switch to `90 天` updates active range and histogram metadata.
  - Mobile viewport `390 x 844` has no horizontal overflow.
  - Browser console had no warnings or errors.

### Deployment note

- No D1 migration is required for v4 because this iteration only changes frontend layout and dashboard rendering.

### Production deployment

- Source commit:
  - `b7a2289c459e663d35ad22304e3627586ff41d2c`
- Commit message:
  - `Refine Pontnova workbench dashboard layout`
- Pushed to:
  - `origin/main`
- Cloudflare Pages deploy:
  - `https://9d56f0c9.pontnova.pages.dev`
- Production URL:
  - `https://pontnova.eu/workbench/`

### Production verification

- Login API:
  - `302`
- Authenticated workbench HTML:
  - `200`
- Authenticated state API:
  - `200`
- Production HTML confirmed:
  - `/workbench/styles.css?v=20260614-v4`
  - `/workbench/app.js?v=20260614-v4`
  - Hero headline present.
- Production D1 state confirmed:
  - 4 projects
  - 4 tasks
  - 3 deadlines
  - 3 objectives
  - 3 time entries
  - 3 activities
  - Project numbers:
    - `PN-CONS-2026-001`
    - `PN-FUND-2026-001`
    - `PN-TRN-2026-001`
    - `PN-WS-2026-001`
- Browser production verification:
  - Dashboard view active.
  - Old topbar hidden on dashboard.
  - Hero board visible.
  - Sync status shows `已连接云端数据库`.
  - Project drawer opens from project card.
  - Task drawer opens from dashboard task row.
  - Browser console had no warnings or errors.

### Local retained copy v4

- Local copy:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-b7a2289`
- Archive:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-b7a2289.tar.gz`
- SHA-256:
  - `baa5683245a97d1e6e58a166a3a75c8506dd5055fa91c136f95226e8cdce3501`
- Manifest:
  - `LOCAL_BACKUP_MANIFEST.md`
- Archive content spot-check:
  - `workbench/index.html`
  - `workbench/app.js`
  - `workbench/styles.css`
  - `_worker.js`
  - `migrations/0002_workbench_atom_parity.sql`
  - `DEVELOPMENT_LOG.md`

## 2026-06-14 Workbench v4.2 fix sidebar view switching

### Request

- User reported that clicking sidebar items did not jump to the corresponding workbench sections.

### Root cause

- Sidebar click handlers were firing, and `body[data-view]`, active nav state, and the title were changing.
- However, `.dashboard-board { display: grid; }` appeared after `.view { display: none; }`, so the dashboard view stayed visible even when it was not active.
- This made other sections appear not to open.

### Changes

- Changed dashboard display CSS:
  - `.dashboard-board` now only provides layout gap.
  - `.dashboard-board.is-active` now owns `display: grid`.
- Added `window.scrollTo({ top: 0, behavior: "auto" })` inside `setView()` so sidebar navigation always jumps to the top of the selected section.
- Bumped workbench asset query version to `20260614-v4-2`.

### Local verification

- `node --check workbench/app.js`
- `node --check _worker.js`
- Local static preview:
  - `http://127.0.0.1:3006/workbench/`
- Browser sidebar verification:
  - `项目` -> only `projectsView` visible.
  - `日程` -> only `calendarView` visible.
  - `OKR` -> only `objectivesView` visible.
  - `任务` -> only `tasksView` visible.
  - `投入分析` -> only `workloadView` visible.
  - `资料索引` -> only `documentsView` visible.
  - `活动日志` -> only `auditView` visible.
  - `平台图谱` -> only `mapView` visible.
  - `看板` -> only `dashboardView` visible.
  - Each sidebar click returned `scrollY = 0`.
  - Browser console had no warnings or errors.

### Deployment note

- No D1 migration required.

### Production deployment

- Source commit:
  - `22ff54014da4624c9ea31272589017cd257b335b`
- Commit message:
  - `Fix Pontnova sidebar view switching`
- Pushed to:
  - `origin/main`
- Cloudflare Pages deploy:
  - `https://6e569cff.pontnova.pages.dev`
- Production URL:
  - `https://pontnova.eu/workbench/`

### Production verification

- Login API:
  - `302`
- Authenticated workbench HTML:
  - `200`
- Authenticated state API:
  - `200`
- Production HTML confirmed:
  - `/workbench/styles.css?v=20260614-v4-2`
  - `/workbench/app.js?v=20260614-v4-2`
- Production D1 state confirmed:
  - 4 projects
  - 4 tasks
  - 3 deadlines
  - 3 objectives
- Browser production sidebar verification:
  - `项目` -> only `projectsView` visible.
  - `日程` -> only `calendarView` visible.
  - `OKR` -> only `objectivesView` visible.
  - `任务` -> only `tasksView` visible.
  - `投入分析` -> only `workloadView` visible.
  - `资料索引` -> only `documentsView` visible.
  - `活动日志` -> only `auditView` visible.
  - `平台图谱` -> only `mapView` visible.
  - `看板` -> only `dashboardView` visible.
  - Each sidebar click returned `scrollY = 0`.
  - Browser console had no warnings or errors.

### Local retained copy v4.2

- Local copy:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-2-22ff540`
- Archive:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-2-22ff540.tar.gz`
- SHA-256:
  - `e269747c12c6c717293335c5a137f17554e245279afc82db51be8440508462a0`
- Manifest:
  - `LOCAL_BACKUP_MANIFEST.md`
- Archive content spot-check:
  - `workbench/index.html`
  - `workbench/app.js`
  - `workbench/styles.css`
  - `_worker.js`
  - `migrations/0002_workbench_atom_parity.sql`
  - `DEVELOPMENT_LOG.md`

## 2026-06-14 Workbench v4.1 remove Newsdesk dashboard card

### Request

- User marked the dashboard `Newsdesk / UPC / EU IP 资讯台` card as no longer needed.

### Changes

- Removed the `Newsdesk` card from the dashboard bottom section.
- Removed the `UPC / EU IP 资讯台` text and `查看资料索引` button from the dashboard.
- Removed unused `.newsdesk-card` styles.
- Changed the bottom dashboard section from 3 cards to 2 equal-width cards:
  - `数据完整性`
  - `平台地图`
- Bumped workbench asset query version to `20260614-v4-1`.

### Local verification

- `node --check workbench/app.js`
- `node --check _worker.js`
- Local static preview:
  - `http://127.0.0.1:3005/workbench/`
- Browser verification:
  - Dashboard bottom cards are now only:
    - `数据完整性`
    - `平台地图`
  - `Newsdesk`, `UPC / EU IP 资讯台`, and `查看资料索引` no longer appear in the workbench HTML/CSS/JS.
  - Desktop bottom grid renders as two columns.
  - Mobile viewport `390 x 844` renders as one column.
  - Mobile viewport had no horizontal overflow.
  - Browser console had no warnings or errors.

### Deployment note

- No D1 migration required.

### Production deployment

- Source commit:
  - `16ee13ec9bc2819c68f937fe31a07c44b78a4c65`
- Commit message:
  - `Remove Pontnova dashboard newsdesk card`
- Pushed to:
  - `origin/main`
- Cloudflare Pages deploy:
  - `https://9bb69d9b.pontnova.pages.dev`
- Production URL:
  - `https://pontnova.eu/workbench/`

### Production verification

- Login API:
  - `302`
- Authenticated workbench HTML:
  - `200`
- Authenticated state API:
  - `200`
- Production HTML confirmed:
  - `/workbench/styles.css?v=20260614-v4-1`
  - `/workbench/app.js?v=20260614-v4-1`
- Production D1 state confirmed:
  - 4 projects
  - 4 tasks
  - 3 deadlines
  - 3 objectives
- Browser production verification:
  - Dashboard bottom cards are now only:
    - `数据完整性`
    - `平台地图`
  - `Newsdesk`, `UPC / EU IP 资讯台`, and `查看资料索引` are not visible.
  - Sync status shows `已连接云端数据库`.
  - Browser console had no warnings or errors.

### Local retained copy v4.1

- Local copy:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-1-16ee13e`
- Archive:
  - `/Volumes/LaCie/Codex/20260614 PN 工作台/保留副本/pontnova.eu-20260614-v4-1-16ee13e.tar.gz`
- SHA-256:
  - `21de332703bc74048b3cc475249a580372ce4214a019123841777bcb55c21838`
- Manifest:
  - `LOCAL_BACKUP_MANIFEST.md`
- Archive content spot-check:
  - `workbench/index.html`
  - `workbench/app.js`
  - `workbench/styles.css`
  - `_worker.js`
  - `migrations/0002_workbench_atom_parity.sql`
  - `DEVELOPMENT_LOG.md`
