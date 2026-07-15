// Frenchies Review Studio — local server.
// - Serves the static UI from /public
// - Calls the Anthropic API server-side (key stays out of the browser)
// - Loads all brand voice/config from /brand at request time
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

import { loadBrand, appendExemplar } from "./lib/brand.js";
import { buildSystemPrompt, buildUserMessage } from "./lib/buildSystemPrompt.js";
import { callClaude, parseModelJson, DEFAULT_MODEL } from "./lib/anthropic.js";
import { normalizeResult } from "./lib/schema.js";

// Load .env if present (Node 20.12+/22 built-in; no dependency).
try {
  process.loadEnvFile();
} catch {
  /* no .env file — rely on the ambient environment */
}

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, "public");
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

async function readBody(req, limit = 200_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/" || rel === "") rel = "/index.html";
  // Prevent path traversal: resolve within PUBLIC_DIR only.
  const filePath = normalize(join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  try {
    const buf = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Read error");
  }
}

// ---- API handlers ----

function handleConfig(res) {
  const brand = loadBrand();
  sendJson(res, 200, {
    salon: {
      name: brand.salon.name,
      city: brand.salon.city,
      price_point_usd: brand.salon.price_point_usd,
    },
    technicians: (brand.technicians || []).map((t) => t.name).filter(Boolean),
    platforms: ["Google", "Yelp", "Facebook", "Other"],
    defaultCount: 3,
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    apiKeyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}

async function handleFixtures(res) {
  try {
    const raw = await readFile(join(HERE, "test", "fixtures.json"), "utf8");
    sendJson(res, 200, JSON.parse(raw));
  } catch {
    sendJson(res, 200, []);
  }
}

async function handleGenerate(req, res) {
  let input;
  try {
    input = JSON.parse((await readBody(req)) || "{}");
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }
  if (!input.review && !input.rating) {
    return sendJson(res, 400, { error: "Provide a review and/or a star rating." });
  }

  const brand = loadBrand();
  const system = buildSystemPrompt(brand);
  const user = buildUserMessage({
    ...input,
    today: new Date().toISOString().slice(0, 10),
  });

  const result = await callClaude({ system, user, maxTokens: 3000 });
  if (!result.ok) {
    return sendJson(res, 502, { error: result.error, retryable: true });
  }

  const parsed = parseModelJson(result.text);
  if (!parsed.ok) {
    return sendJson(res, 502, {
      error: `${parsed.error} You can try regenerating.`,
      retryable: true,
      raw: result.text,
    });
  }

  sendJson(res, 200, {
    result: normalizeResult(parsed.data),
    meta: { model: result.model, usage: result.usage || null },
  });
}

async function handleSaveExemplar(req, res) {
  let input;
  try {
    input = JSON.parse((await readBody(req)) || "{}");
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body." });
  }
  if (!input.review || !input.response) {
    return sendJson(res, 400, { error: "Need both a review and a response to save an exemplar." });
  }
  try {
    appendExemplar({
      review: input.review,
      rating: input.rating,
      response: input.response,
      type: input.type,
      note: input.note,
      date: new Date().toISOString().slice(0, 10),
    });
    sendJson(res, 200, { ok: true });
  } catch (e) {
    sendJson(res, 500, { error: `Could not save exemplar: ${e.message}` });
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url || "/";
    if (req.method === "GET" && url.startsWith("/api/config")) return handleConfig(res);
    if (req.method === "GET" && url.startsWith("/api/fixtures")) return handleFixtures(res);
    if (req.method === "POST" && url.startsWith("/api/generate")) return handleGenerate(req, res);
    if (req.method === "POST" && url.startsWith("/api/save-exemplar"))
      return handleSaveExemplar(req, res);
    if (req.method === "GET") return serveStatic(req, res, url);
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("Method not allowed");
  } catch (e) {
    console.error("[server] unhandled:", e);
    sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, () => {
  const brand = loadBrand();
  console.log(`\n  Frenchies Review Studio`);
  console.log(`  ${brand.salon.name} — ${brand.salon.city}`);
  console.log(`  ▸ http://localhost:${PORT}`);
  console.log(`  model: ${process.env.ANTHROPIC_MODEL || DEFAULT_MODEL}`);
  if (!process.env.ANTHROPIC_API_KEY)
    console.log(`  ⚠ ANTHROPIC_API_KEY not set — copy .env.example to .env and add your key.\n`);
  else console.log("");
});
