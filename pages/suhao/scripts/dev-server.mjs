import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const publicRoot = root;
const portArgIndex = process.argv.findIndex((arg) => arg === "--port");
const port = Number(portArgIndex > -1 ? process.argv[portArgIndex + 1] : process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function safePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const resolved = normalize(join(publicRoot, cleanPath || "index.html"));
  if (!resolved.startsWith(publicRoot)) return join(publicRoot, "index.html");
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    const requestedPath = safePath(req.url || "/");
    const filePath = existsSync(requestedPath) && !requestedPath.endsWith("/")
      ? requestedPath
      : join(publicRoot, "index.html");
    const ext = extname(filePath);
    const fallbackToIndex = !existsSync(filePath) || (!contentTypes[ext] && req.url?.startsWith("/app"));
    const finalPath = fallbackToIndex ? join(publicRoot, "index.html") : filePath;
    const data = await readFile(finalPath);
    res.writeHead(200, {
      "Content-Type": contentTypes[extname(finalPath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Development server error: ${error.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`AI CRM admin is running at http://${host}:${port}`);
});
