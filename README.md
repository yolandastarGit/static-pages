# 静态 HTML 分享仓库

通过 GitHub Pages 托管静态 HTML，生成可分享的公开链接。

## 链接格式

```
https://markyoyoh.github.io/static-pages/pages/你的文件名.html
```

## 首次设置（只需做一次）

### 1. 在 GitHub 创建仓库

1. 打开 https://github.com/new
2. 仓库名填 **`static-pages`**
3. 选 Public，不要勾选「Add a README file」
4. 点击 Create repository

### 2. 推送本地代码

```bash
cd "/Users/yolandaw-/Documents/仓库"
git remote add origin https://github.com/markyoyoh/static-pages.git
git push -u origin main
```

### 3. 开启 GitHub Pages

1. 打开 https://github.com/markyoyoh/static-pages/settings/pages
2. **Source** 选 **GitHub Actions**
3. 推送代码后，Actions 会自动部署（约 1–2 分钟）

## 日常发布

把 HTML 给我，我会：

1. 保存到 `pages/` 目录
2. 提交并推送到 GitHub
3. 返回可分享的链接

也可以用脚本：

```bash
chmod +x scripts/publish.sh
./scripts/publish.sh demo.html ./你的文件.html
```
