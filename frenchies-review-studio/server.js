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
import {
  callProvider,
  parseModelJson,
  redactedStatus,
  activeProvider,
  isConfigured,
  getProvider,
} from "./lib/providers.js";
import { setKey, removeKey, setActive } from "./lib/secrets.js";
import { estimateCost } from "./lib/pricing.js";
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

async function parseBody(req) {
  try {
    return JSON.parse((await readBody(req)) || "{}");
  } catch {
    return {};
  }
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
  const providers = redactedStatus();
  const active = activeProvider();
  const activeP = providers.find((p) => p.id === active) || null;
  sendJson(res, 200, {
    salon: {
      name: brand.salon.name,
      city: brand.salon.city,
      price_point_usd: brand.salon.price_point_usd,
    },
    technicians: (brand.technicians || []).map((t) => t.name).filter(Boolean),
    platforms: ["Google", "Yelp", "Facebook", "Other"],
    defaultCount: 3,
    active,
    activeConfigured: activeP ? activeP.configured : false,
    activeModel: activeP ? activeP.model : "",
    anyConfigured: providers.some((p) => p.configured),
    providers,
  });
}

function handleSetKey(req, res, body) {
  const { provider, apiKey, model, baseUrl, label } = body || {};
  if (!provider || !getProvider(provider))
    return sendJson(res, 400, { error: "Unknown provider." });
  setKey(provider, { apiKey, model, baseUrl, label });
  sendJson(res, 200, { ok: true, providers: redactedStatus(), active: activeProvider() });
}

function handleRemoveKey(req, res, body) {
  const { provider } = body || {};
  if (!provider || !getProvider(provider))
    return sendJson(res, 400, { error: "Unknown provider." });
  removeKey(provider);
  sendJson(res, 200, { ok: true, providers: redactedStatus(), active: activeProvider() });
}

function handleSetActive(req, res, body) {
  const { provider } = body || {};
  if (!provider || !getProvider(provider))
    return sendJson(res, 400, { error: "Unknown provider." });
  if (!isConfigured(provider))
    return sendJson(res, 400, { error: "That provider has no API key / model yet." });
  setActive(provider);
  sendJson(res, 200, { ok: true, providers: redactedStatus(), active: activeProvider() });
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

  // Use the provider named in the request if it's configured, else the active one.
  const requested = input.provider && isConfigured(input.provider) ? input.provider : null;
  const provider = requested || activeProvider();
  if (!isConfigured(provider)) {
    return sendJson(res, 400, {
      error: "No provider is set up yet. Open “API keys” and add a key for a provider.",
      needsSetup: true,
    });
  }

  const brand = loadBrand();
  const system = buildSystemPrompt(brand);
  const user = buildUserMessage({
    ...input,
    today: new Date().toISOString().slice(0, 10),
  });

  const model = typeof input.model === "string" && input.model.trim() ? input.model.trim() : undefined;
  const result = await callProvider(provider, { system, user, maxTokens: 3000, model });
  if (!result.ok) {
    return sendJson(res, 502, { error: result.error, retryable: true, provider });
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
    meta: {
      provider,
      model: result.model,
      usage: result.usage || null,
      cost: estimateCost(result.model, result.usage),
    },
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
    if (req.method === "POST" && url.startsWith("/api/providers/key"))
      return handleSetKey(req, res, await parseBody(req));
    if (req.method === "DELETE" && url.startsWith("/api/providers/key"))
      return handleRemoveKey(req, res, await parseBody(req));
    if (req.method === "POST" && url.startsWith("/api/providers/active"))
      return handleSetActive(req, res, await parseBody(req));
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
  const active = activeProvider();
  const p = redactedStatus().find((x) => x.id === active);
  if (p && p.configured) console.log(`  provider: ${p.label} · ${p.model}\n`);
  else console.log(`  ⚠ No provider set up yet — open the app and click “API keys”.\n`);
});
