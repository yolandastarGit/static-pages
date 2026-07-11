# AI CRM Publishing Space

This directory is the new independent publishing package for the AI CRM prototype.

Canonical publishing path:

`/Users/yolandaw-/Documents/工作文件/项目资料 /suhao-crm/Publishing space`

## Scope

- Source direction: development workspace (`suhao-crm/`) → publishing space.
- This package is independent from the previous release directory.
- Do not sync changes from this package back to the development docs.
- Do not use the old release directory for future publishing work unless explicitly instructed.

## Document authority

- **业务需求唯一权威：** 工作区 `prd/PRD_v1.md`（本包同步副本：`docs/prd/PRD_v1.md`）。
- **权限摘录：** `docs/prd/角色权限说明文档.md`（须与 PRD_v1 对齐，不另立规则）。
- **菜单树：** `docs/prd/菜单结构.md`（导航参考；以 PRD §3 / §4.3 为准）。
- 已删除历史分册 PRD、旧基线 `需求文档.md`、旧 Master PRD（`AI_CRM_产品需求总文档.md`）等冲突资料；设计规范类文档保留在 `docs/design/`、`docs/*.md`。

## Structure

- `index.html`: entry page that opens the workbench.
- `pages/`: static HTML pages.
- `assets/`: CSS and JavaScript assets.
- `router/`, `layout/`, `mock/`: runtime support files copied from the current development docs.
- `docs/design/`: product and design source documents (非业务 PRD 权威).
- `docs/prd/`: **仅** PRD_v1 + 角色权限 + 菜单结构.
- `scripts/`: local validation and build helpers.

## Commands

```bash
npm run check
npm run build
```

`npm run build` creates `dist/` without deleting source files.
