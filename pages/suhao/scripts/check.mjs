import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();

function normalizeStaticRef(ref) {
  return ref.split(/[?#]/)[0];
}

const requiredFiles = [
  "index.html",
  "pages/workbench.html",
  "pages/whatsapp.html",
  "pages/email.html",
  "pages/leads.html",
  "pages/customers.html",
  "pages/analytics.html",
  "pages/ai.html",
  "assets/css/tokens.css",
  "assets/css/app.css",
  "assets/js/app.js",
  "assets/js/pages-communication.js",
  "router/router.js",
  "layout/layout.js",
  "mock/data.js",
  "docs/design/AI_CRM_产品需求总文档.md",
  "docs/prd/菜单结构.md"
];

async function assertFile(file) {
  await access(path.join(root, file), constants.R_OK);
}

async function assertNoBrokenStaticReferences() {
  const pagesDir = path.join(root, "pages");
  const pageFiles = (await readdir(pagesDir)).filter((file) => file.endsWith(".html"));
  for (const file of pageFiles) {
    const html = await readFile(path.join(pagesDir, file), "utf8");
    const refs = [...html.matchAll(/(?:href|src)="\.\.\/([^"]+)"/g)].map((match) => normalizeStaticRef(match[1]));
    for (const ref of refs) {
      if (ref.startsWith("http")) continue;
      await assertFile(ref);
    }
  }
}

try {
  await Promise.all(requiredFiles.map(assertFile));
  await assertNoBrokenStaticReferences();
  console.log("Publishing space check passed.");
} catch (error) {
  console.error("Publishing space check failed:");
  console.error(error.message);
  process.exit(1);
}
