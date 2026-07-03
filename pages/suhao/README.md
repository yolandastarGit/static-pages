# AI CRM Publishing Space

This directory is the new independent publishing package for the AI CRM prototype.

Canonical publishing path:

`/Users/yolandaw-/Documents/工作文件/项目资料 /suhao-crm/Publishing space`

## Scope

- Source direction: development docs -> publishing space.
- This package is independent from the previous release directory.
- Do not sync changes from this package back to the development docs.
- Do not use the old release directory for future publishing work unless explicitly instructed.

## Structure

- `index.html`: entry page that opens the workbench.
- `pages/`: static HTML pages.
- `assets/`: CSS and JavaScript assets.
- `router/`, `layout/`, `mock/`: runtime support files copied from the current development docs.
- `docs/design/`: product and design source documents.
- `docs/prd/`: PRD documents and images.
- `scripts/`: local validation and build helpers.

## Commands

```bash
npm run check
npm run build
```

`npm run build` creates `dist/` without deleting source files.
