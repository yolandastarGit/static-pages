import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "src/main.js",
  "src/styles.css",
  "src/data.js",
  "src/app.js"
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (!packageJson.scripts?.dev) {
  console.error("package.json must include npm run dev.");
  process.exit(1);
}

console.log("Project structure check passed.");
