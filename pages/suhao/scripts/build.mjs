import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const version = process.env.DEPLOY_VERSION || new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

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

function injectVersion(content, file) {
  let next = content.replace(/from "(\.\/[^"]+\.js)(\?v=[^"]*)?"/g, `from "$1?v=${version}"`);
  if (file === "index.html") {
    next = next.replace(/href="\.\/src\/styles\.css(\?v=[^"]*)?"/, `href="./src/styles.css?v=${version}"`);
    next = next.replace(/src="\.\/src\/main\.js(\?v=[^"]*)?"/, `src="./src/main.js?v=${version}"`);
    next = next.replace(/<meta name="deploy-version" content="[^"]*"/, `<meta name="deploy-version" content="${version}"`);
  }
  if (file === "src/main.js") {
    next = next.replace(/^console\.info\("\[suhao deploy [^"]+"\);\n?/, "");
    next = `console.info("[suhao deploy ${version}]");\n${next}`;
  }
  return next;
}

const check = spawnSync(process.execPath, [join(root, "scripts/check.mjs")], {
  cwd: root,
  stdio: "inherit"
});

if (check.status !== 0) {
  process.exit(check.status || 1);
}

await rm(dist, { recursive: true, force: true });

for (const file of files) {
  const sourcePath = join(root, file);
  if (!existsSync(sourcePath)) {
    console.error(`Missing build input: ${file}`);
    process.exit(1);
  }
  const destPath = join(dist, file);
  await mkdir(dirname(destPath), { recursive: true });
  const content = await readFile(sourcePath, "utf8");
  await writeFile(destPath, injectVersion(content, file));
}

await writeFile(join(dist, "VERSION.txt"), `${version}\n`);
console.log(`Build completed: ${dist} (version ${version})`);
