---
name: publish-static-html
description: >-
  将用户提供的静态 HTML 原件发布到 GitHub Pages 并返回可分享链接。适用于用户扔 HTML
  文件、粘贴 HTML、说「发布/上线/分享链接/原型」、或提到 GitHub Pages 静态页面分享时。
---

# 静态 HTML 发布

## 仓库信息

- 工作目录：`/Users/yolandaw-/Documents/仓库`
- 远程：`https://github.com/yolandastarGit/static-pages.git`
- 分支：`main`
- 基础 URL：`https://yolandastarGit.github.io/static-pages`

## 触发即执行

用户给 HTML 后**直接发布**，不要只列步骤。

## 路径规则

```
pages/{项目slug}/index.html       # 整个系统静态文件
pages/{项目slug}/{页面slug}.html  # 子页面
```

- slug：小写英文、数字、连字符
- 中文项目名转拼音（苏豪 → `suhao`）
- 禁止中文、空格、特殊字符

## 工作流

```
- [ ] 1. 确定项目 slug 和页面名
- [ ] 2. 保存到 pages/{slug}/...
- [ ] 3. git add + commit + push origin main
- [ ] 4. 返回分享链接
```

```bash
cd "/Users/yolandaw-/Documents/仓库"
git add pages/{slug}/
git commit -m "publish: {slug}/{文件名}"
git push origin main
```

## 返回格式

```
已发布，部署约 1–2 分钟后可访问：

**主页面**：https://yolandastarGit.github.io/static-pages/pages/{slug}/
**完整路径**：https://yolandastarGit.github.io/static-pages/pages/{slug}/index.html
```

## 示例

**输入**：苏豪项目整个系统 HTML  
**保存**：`pages/suhao/index.html`  
**链接**：https://yolandastarGit.github.io/static-pages/pages/suhao/

**输入**：项目 B 的登录页，文件名 login  
**保存**：`pages/project-b/login.html`  
**链接**：https://yolandastarGit.github.io/static-pages/pages/project-b/login.html

## 异常

| 情况 | 处理 |
|---|---|
| 未指定项目名 | 从上下文推断；无法推断则问一句 |
| push 需登录 | 提示用户在终端执行 `git push origin main` |
| 覆盖已有文件 | 直接覆盖并 commit，无需二次确认 |

## 脚本（可选）

```bash
./scripts/publish.sh suhao index.html ./本地文件.html
```
