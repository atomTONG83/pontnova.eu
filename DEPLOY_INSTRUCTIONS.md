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
