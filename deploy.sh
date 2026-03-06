#!/bin/bash

# Pontnova.eu GitHub Pages 部署脚本

echo "🚀 开始部署 pontnova.eu 到 GitHub Pages..."

# 进入网站目录
cd /Users/atom1983/.openclaw/workspace/core/pontnova_site

# 检查 Git 仓库
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git branch -M main
fi

# 添加文件
echo "📝 添加文件..."
git add .

# 提交
echo "💾 提交更改..."
git commit -m "Deploy pontnova.eu landing page - $(date '+%Y-%m-%d %H:%M:%S')"

# 推送到 GitHub
echo "☁️ 推送到 GitHub..."
git remote add origin git@github.com:atomtong83/pontnova.eu.git 2>/dev/null || true
git push -u origin main --force

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址：https://atomtong83.github.io/pontnova.eu/"
echo ""
echo "⚠️  下一步："
echo "1. 在 GitHub 仓库设置中启用 GitHub Pages"
echo "2. 设置自定义域名 pontnova.eu"
echo "3. 在 GoDaddy 更新 DNS 记录"
