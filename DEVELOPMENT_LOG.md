## 2026-04-22

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
