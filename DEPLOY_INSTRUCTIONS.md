# 🚀 Pontnova.eu 部署指南

## ✅ 已完成

1. ✅ 页面文件已保存到：`/Users/atom1983/.openclaw/workspace/core/pontnova_site/index.html`
2. ✅ 部署脚本已创建：`deploy.sh`
3. ✅ Git 仓库已初始化

---

## 📋 下一步操作

### 方案 A：使用 GitHub CLI (推荐)

```bash
# 1. 创建 GitHub 仓库
gh repo create pontnova.eu --public --source=. --push

# 2. 启用 GitHub Pages
# 访问：https://github.com/atomtong83/pontnova.eu/settings/pages
# 选择 Branch: main, Folder: /

# 3. 设置自定义域名
# 在 GitHub Pages 设置中添加：pontnova.eu

# 4. 更新 GoDaddy DNS
# 类型：CNAME
# 名称：www
# 值：atomtong83.github.io
```

### 方案 B：手动创建

1. **访问 GitHub**: https://github.com/new
2. **创建仓库**: 
   - Repository name: `pontnova.eu`
   - Public
   - 不要初始化 README
3. **推送代码**:
```bash
cd /Users/atom1983/.openclaw/workspace/core/pontnova_site
git remote add origin git@github.com:atomtong83/pontnova.eu.git
git branch -M main
git push -u origin main
```

4. **启用 GitHub Pages**:
   - 访问：https://github.com/atomtong83/pontnova.eu/settings/pages
   - Source: Deploy from a branch
   - Branch: main / Folder: / (root)
   - Save

5. **设置自定义域名**:
   - 在 GitHub Pages 设置中
   - Custom domain: `pontnova.eu`
   - Save

6. **更新 GoDaddy DNS 记录**:
```
类型    名称    值                      TTL
CNAME   www     atomtong83.github.io    1 小时
A       @       185.199.108.153         1 小时
A       @       185.199.109.153         1 小时
A       @       185.199.110.153         1 小时
A       @       185.199.111.153         1 小时
```

---

## 🌐 访问地址

- **GitHub Pages**: https://atomtong83.github.io/pontnova.eu/
- **自定义域名**: https://pontnova.eu/ (DNS 生效后)

---

## ⚙️ DNS 生效时间

- GoDaddy DNS 更新：通常 15 分钟 -1 小时
- 全球 DNS 传播：最多 48 小时
- GitHub Pages SSL 证书：自动申请，约 5-10 分钟

---

## 🎨 页面特点

- ✅ 暗色主题 + 哑光金配色
- ✅ 自定义鼠标光标
- ✅ GSAP 滚动动画
- ✅ 电影级噪点覆盖层
- ✅ 毛玻璃面板效果
- ✅ 响应式设计

---

**需要我帮你执行哪个步骤？** 🚀

---

## 🛰️ 欧洲知识产权情报页更新治理（请勿混用）

### 1. 三套系统的正式分工

- `atom-ip-sentinel`
  - 本地后台 / 控制台
  - 唯一负责抓取、清洗、去重、AI 分析、日报、周报、专题与 SEP 洞察
  - 是唯一可信数据源

- `ATOM-IP-Insights`
  - `atom-ip.com` 公开展示站
  - 负责展示后台已经分析完成的静态前哨页面

- `pontnova.eu`
  - `Pontnova` 品牌公开展示站
  - 负责以 `Pontnova` 品牌方式展示后台已经分析完成的同一份静态内容

### 2. 标准更新流程

必须按下面的顺序执行，不允许反向维护：

1. 本地 `atom-ip-sentinel` 每日定时运行标准流水线
2. 后台完成抓取、清洗、去重、AI 分析、日报 / 周报 / 专题生成
3. `ATOM-IP-Insights` 运行：
   - `python3 scripts/sync_eu_ip_sentinel_snapshot.py`
4. `atom-ip.com` 发布最新静态快照
5. `pontnova.eu` 运行：
   - `python3 scripts/sync_eu_ip_sentinel_snapshot.py`
6. `pontnova.eu` 发布最新静态快照

### 3. 每日定时更新口径

- 每日定时更新只在本地后台执行
- `atom-ip.com` 和 `pontnova.eu` 不单独抓取，不单独分析
- 两个公开站统一消费后台分析后的结果
- 这样可以保证两个公开站内容口径一致、时间窗一致、AI 洞察一致

### 4. 维护边界

- 改抓取、改 AI、改去重、改分析逻辑：只改 `atom-ip-sentinel`
- 改 `atom-ip.com` 页面展示：只改 `ATOM-IP-Insights`
- 改 `pontnova.eu` 页面展示：只改 `pontnova.eu`
- 任何人都不要在 `atom-ip.com` 或 `pontnova.eu` 里手工修改资讯数据本体
- 两个公开站都只能从后台同步，不能互相同步，不能反向写回后台

### 5. 每日更新与版本口径

- 每日更新由本地 `atom-ip-sentinel` 后台统一发起
- 后台跑完抓取、去重、AI 分析与简报生成后，再同步静态快照到 `pontnova.eu`
- `pontnova.eu` 只负责品牌化公开展示，不负责抓取与分析
- 当前公开展示页版本号统一为 `V1`
