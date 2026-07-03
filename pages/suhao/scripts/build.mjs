import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const entries = [
  "index.html",
  ".nojekyll",
  "README.md",
  "VERSION.txt",
  "pages",
  "assets",
  "router",
  "layout",
  "mock",
  "docs"
];

await mkdir(dist, { recursive: true });

for (const entry of entries) {
  await cp(path.join(root, entry), path.join(dist, entry), { recursive: true, force: true });
}

const topLevel = await readdir(dist);
console.log(`Build completed: ${dist}`);
console.log(`Included: ${topLevel.sort().join(", ")}`);
