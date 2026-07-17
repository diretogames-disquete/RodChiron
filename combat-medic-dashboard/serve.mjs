#!/usr/bin/env node
// serve.mjs — zero-dependency static server for the Combat Medic Dashboard.
// The multi-file version (index.html) loads its .jsx modules through in-browser
// Babel, which fetches them over XHR — so the page must be *served*, not opened
// from file://. (For a no-server, double-click experience use standalone.html.)
//
// Usage:  node serve.mjs [port]      (default port 4173)
// Node 18+ (uses only built-ins). Auto-opens your default browser.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    // Resolve inside ROOT and reject any traversal outside it.
    const filePath = normalize(join(ROOT, urlPath));
    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain" }).end("404 Not Found");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" }).end("500 " + err.message);
  }
});

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    // A missing opener (e.g. no xdg-open) emits an async 'error' event; swallow
    // it so it never crashes the server — the URL is printed above regardless.
    child.on("error", () => {});
    child.unref();
  } catch { /* ignore */ }
}

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\n  Combat Medic Dashboard\n  Serving ${ROOT}\n  → ${url}\n\n  Opening your browser… (close this window to stop)\n`);
  openBrowser(url);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use.\n  Try another:  node serve.mjs ${PORT + 1}\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
