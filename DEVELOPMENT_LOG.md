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
