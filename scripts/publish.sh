#!/usr/bin/env bash
# 发布静态页面到 GitHub Pages
#
# 用法:
#   ./scripts/publish.sh <项目slug>              # 发布整个 pages/{slug}/ 目录
#   ./scripts/publish.sh <项目slug> index        # 仅发布 index.html
#   ./scripts/publish.sh <项目slug> login ./x.html  # 复制单页并发布
#
# 示例:
#   ./scripts/publish.sh suhao
set -euo pipefail

REPO="static-pages"
GITHUB_USER="yolandastarGit"
BASE_URL="https://${GITHUB_USER}.github.io/${REPO}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  cat <<'EOF'
用法: ./scripts/publish.sh <项目slug> [页面名] [源文件]

示例:
  ./scripts/publish.sh suhao              # 发布整个苏豪项目（含 build + push）
  ./scripts/publish.sh suhao index        # 仅发布 index.html
  ./scripts/publish.sh suhao login ./login.html
EOF
  exit 1
}

[[ $# -lt 1 ]] && usage

SLUG="$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')"
PAGE="${2:-}"
SOURCE="${3:-}"
PROJECT="pages/${SLUG}"

cd "$ROOT"
[[ -d "$PROJECT" ]] || { echo "错误: 目录不存在 ${PROJECT}"; exit 1; }

# 整项目发布（最常见）
if [[ -z "$PAGE" && -z "$SOURCE" ]]; then
  if [[ -f "${PROJECT}/scripts/build.mjs" ]]; then
    echo "→ 构建 ${SLUG} ..."
    node "${PROJECT}/scripts/build.mjs"
    if [[ -d "${PROJECT}/dist" ]]; then
      echo "→ 同步 dist/ 到发布目录 ..."
      rsync -a "${PROJECT}/dist/" "${PROJECT}/"
    fi
  fi

  git add "${PROJECT}/"
  if git diff --cached --quiet; then
    echo "无变更，跳过提交"
  else
    git commit -m "publish: ${SLUG}"
    GIT_HTTP_VERSION=1.1 git push origin main
    echo ""
    echo "✓ 已推送"
  fi

  echo "主页面: ${BASE_URL}/${PROJECT}/"
  exit 0
fi

# 单页发布
PAGE="${PAGE:-index}"
[[ "$PAGE" != *.html ]] && PAGE="${PAGE}.html"
DEST="${PROJECT}/${PAGE}"
mkdir -p "$PROJECT"

if [[ -n "$SOURCE" ]]; then
  [[ -f "$SOURCE" ]] || { echo "错误: 找不到文件 $SOURCE"; exit 1; }
  cp "$SOURCE" "$DEST"
elif [[ ! -f "$DEST" ]]; then
  echo "错误: $DEST 不存在，请提供源文件路径"
  exit 1
fi

git add "$DEST"
if git diff --cached --quiet; then
  echo "无变更，跳过提交"
else
  git commit -m "publish: ${SLUG}/${PAGE}"
  GIT_HTTP_VERSION=1.1 git push origin main
  echo "✓ 已推送"
fi

echo ""
[[ "$PAGE" == "index.html" ]] && echo "主页面: ${BASE_URL}/${PROJECT}/"
echo "完整链接: ${BASE_URL}/${PROJECT}/${PAGE}"
