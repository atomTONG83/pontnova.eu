# Pontnova.eu Cloudflare Pages 发布说明

Pontnova.eu 已迁移到 Cloudflare Pages。当前 Cloudflare Pages 项目名为 `pontnova`，绑定域名为：

- `pontnova.eu`
- `www.pontnova.eu`
- `pontnova.pages.dev`

## 1. 正式更新入口

正式更新应从本地基座 `atom-ip-sentinel` 发起，不再使用 GitHub Pages。

标准链路：

1. `atom-ip-sentinel` 完成抓取、清洗、去重、AI 中文分析、英文 companion、日报/周报和语音日报生成。
2. 后台更新中心执行 `pontnova.eu` 同步。
3. 后台在 Pontnova `origin/main` 上创建独立发布工作树。
4. 运行 `scripts/sync_eu_ip_sentinel_snapshot.py`，把本地基座的公开快照同步到 Pontnova 静态数据目录。
5. 若快照有变化，commit 并 push 到 `origin/main`，保留源码与静态数据留痕。
6. 构建最小 Cloudflare 发布目录 `.cloudflare-pages/pontnova`。
7. 通过 Wrangler 执行：

```bash
npx wrangler pages deploy .cloudflare-pages/pontnova \
  --project-name pontnova \
  --branch main \
  --skip-caching \
  --commit-dirty
```

## 2. 手动兜底发布

只有在后台更新中心不可用时，才从本仓库手动执行：

```bash
cd "/Users/atom1983/Claude Projects/20260313 /pontnova.eu"
./deploy.sh
```

如只想重新部署当前静态文件、不重新从本地基座同步快照：

```bash
SKIP_SYNC=1 ./deploy.sh
```

## 3. 发布目录边界

Cloudflare Pages 只接收以下公开文件和目录：

- `index.html`
- `eu_ip_sentinel.html`
- `eu_ip_sentinel_en.html`
- `ae-trace.html`
- `workload.html`
- `atom_ip_workload.html`
- `robots.txt`
- `eu_ip_sentinel_assets/`

仓库中的部署文档、开发记录、脚本和 Wrangler 本地缓存不会进入 Cloudflare 发布目录。

## 4. 系统分工

- `atom-ip-sentinel`：本地基座，唯一可信数据源；负责抓取、清洗、AI 分析、英文 companion、日报、周报、专题和语音日报。
- `pontnova.eu`：Pontnova 品牌公开展示站；只消费本地基座同步出的静态快照，不单独抓取或分析。
- Cloudflare Pages：静态承载与域名发布层；不作为内容编辑源。

## 5. 维护边界

- 改抓取、AI、去重、英文化、日报或语音日报：只改 `atom-ip-sentinel`。
- 改 Pontnova 展示样式、入口或品牌内容：只改 `pontnova.eu`。
- 不在 Pontnova 静态 JSON 中手工修改资讯数据本体。
- 不再启用 GitHub Pages 或 GoDaddy/GitHub Pages DNS 口径。

## 6. 发布前检查

建议每次正式发布前完成：

```bash
python3 -m py_compile backend/deploy_hub.py
node --check eu_ip_sentinel_assets/js/app.js
bash -n deploy.sh
npx wrangler pages project list
```

英文公开内容还应满足：

- 公开可发布层英文 companion 100% ready。
- 英文标题、摘要、洞察和页面正文无中文残留。
- 中英文内容基于同一中文基座 source hash 对齐。
- 英文语音日报 `daily-latest-en.mp3` 可用。
