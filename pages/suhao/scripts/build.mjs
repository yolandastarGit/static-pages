import { copyFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

const files = [
  "index.html",
  "src/app.js",
  "src/components.js",
  "src/data.js",
  "src/main.js",
  "src/pages.js",
  "src/router.js",
  "src/store.js",
  "src/styles.css"
];

const check = spawnSync(process.execPath, [join(root, "scripts/check.mjs")], {
  cwd: root,
  stdio: "inherit"
});

if (check.status !== 0) {
  process.exit(check.status || 1);
}

await rm(dist, { recursive: true, force: true });

for (const file of files) {
  if (!existsSync(join(root, file))) {
    console.error(`Missing build input: ${file}`);
    process.exit(1);
  }
  await mkdir(dirname(join(dist, file)), { recursive: true });
  await copyFile(join(root, file), join(dist, file));
}

console.log(`Build completed: ${dist}`);
