#!/usr/bin/env bash
# 保存 HTML 并输出可分享的 GitHub Pages 链接
set -euo pipefail

REPO="static-pages"
GITHUB_USER="yolandastarGit"
BASE_URL="https://${GITHUB_USER}.github.io/${REPO}"

usage() {
  echo "用法: $0 <文件名.html> [源文件路径]"
  echo "示例: $0 demo.html ./my-page.html"
  exit 1
}

[[ $# -lt 1 ]] && usage

FILENAME="$(basename "$1")"
if [[ "$FILENAME" != *.html ]]; then
  FILENAME="${FILENAME}.html"
fi

DEST="pages/${FILENAME}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ $# -ge 2 ]]; then
  cp "$2" "$DEST"
else
  [[ -f "$1" ]] || { echo "错误: 找不到文件 $1"; exit 1; }
  cp "$1" "$DEST"
fi

git add "$DEST"
if git diff --cached --quiet; then
  echo "无变更，跳过提交"
else
  git commit -m "publish: ${FILENAME}"
  git push origin main
fi

echo ""
echo "页面地址:"
echo "${BASE_URL}/pages/${FILENAME}"
