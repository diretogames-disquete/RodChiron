// End-to-end test with a MOCK upstream that emulates all provider wire formats
// (Anthropic /v1/messages, OpenAI /chat/completions, Google :generateContent).
// No API key or network needed. Secrets go to a throwaway file via
// FRENCHIES_SECRETS_FILE so a real user's .secrets.json is never touched.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (extra ? " — " + extra : "")); } };

function cannedObject(count = 3) {
  const angles = ["Anchor on the key phrase", "Differentiator-woven", "Testimonial invitation", "Take it offline"];
  return {
    detected_type: "Detailed Positive", approval_level: "auto", technician: "Rheanna",
    needs_human_review: false, sensitivity_reason: null,
    options: Array.from({ length: count }, (_, i) => ({
      angle: angles[i], response: `Option ${i + 1}.`, rationale: `why ${i + 1}`, char_count: 9,
    })),
    left_out: ["No invented visit details — integrity rule."], fragile_note: null,
    operational_flags: [], roster_note: null,
  };
}
// Reflect the requested option count back (the real model reads it from the prompt).
const countFrom = (body) => Number(/Generate (\d+) strategically/.exec(body || "")?.[1]) || 3;

const hits = []; // record which provider path was called
const upstream = createServer((req, res) => {
  let body = ""; req.on("data", (c) => (body += c));
  req.on("end", () => {
    const url = req.url || "";
    const json = JSON.stringify(cannedObject(countFrom(body)));
    if (url.includes("/v1/messages")) {
      hits.push("anthropic");
      globalThis.__anthHeaders = req.headers["x-api-key"] === "test-key" && req.headers["anthropic-version"] === "2023-06-01";
      globalThis.__anthSchema = Boolean(JSON.parse(body || "{}").output_config?.format?.schema);
      globalThis.__lastSystem = JSON.parse(body || "{}").system || "";
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ content: [{ type: "text", text: "```json\n" + json + "\n```" }], stop_reason: "end_turn", usage: { input_tokens: 1200, output_tokens: 300 } }));
    }
    if (url.includes("/chat/completions")) {
      hits.push("openai");
      globalThis.__oaiAuth = req.headers["authorization"] === "Bearer sk-openaiTESTKEY";
      globalThis.__oaiModel = JSON.parse(body || "{}").model;
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ choices: [{ message: { content: json }, finish_reason: "stop" }], usage: { prompt_tokens: 1000, completion_tokens: 250, total_tokens: 1250 } }));
    }
    if (url.includes(":generateContent")) {
      hits.push("google");
      globalThis.__gKey = url.includes("key=AIzaTESTKEY");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: json }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 200, totalTokenCount: 1100 } }));
    }
    res.writeHead(404); res.end("nope");
  });
});

async function main() {
  await new Promise((r) => upstream.listen(0, r));
  const up = `http://127.0.0.1:${upstream.address().port}`;

  const secretsFile = join(mkdtempSync(join(tmpdir(), "frenchies-")), "secrets.json");
  const PORT = 4123;
  const env = {
    ...process.env,
    PORT: String(PORT),
    FRENCHIES_SECRETS_FILE: secretsFile,
    // Anthropic via env key (proves env fallback still works)
    ANTHROPIC_API_KEY: "test-key",
    ANTHROPIC_BASE_URL: up,
    // No OPENAI/GOOGLE env keys — those get added through the UI/API in the test.
  };
  const srv = spawn("node", ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  srv.stderr.on("data", (d) => process.stderr.write("[srv] " + d));
  const base = `http://127.0.0.1:${PORT}`;
  await waitFor(`${base}/api/config`);
  const post = (path, obj, method = "POST") =>
    fetch(base + path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(obj) }).then((r) => r.json().then((j) => ({ status: r.status, j })));

  try {
    // config shape
    let cfg = await (await fetch(`${base}/api/config`)).json();
    ok("config: providers list has 4", Array.isArray(cfg.providers) && cfg.providers.length === 4);
    ok("config: anthropic configured via env", cfg.providers.find((p) => p.id === "anthropic")?.configured === true);
    ok("config: anthropic keySource=env", cfg.providers.find((p) => p.id === "anthropic")?.keySource === "env");
    ok("config: active is anthropic", cfg.active === "anthropic");
    ok("config: openai not configured yet", cfg.providers.find((p) => p.id === "openai")?.configured === false);
    ok("config: editable case library exposed", Array.isArray(cfg.cases) && cfg.cases.length === 22 && cfg.cases[0].name === "Wordless Star" && cfg.cases.every((c) => c.name && c.family && c.approval));
    ok("config: never leaks a full key", !JSON.stringify(cfg).includes("test-key"));

    // generate on the active (anthropic) provider
    let g = await post("/api/generate", { review: "Rheanna was thorough, my best ever!", rating: 5, technician: "Rheanna", count: 3 });
    ok("generate: anthropic returns 3 options", g.j.result?.options?.length === 3);
    ok("generate: meta.provider = anthropic", g.j.meta?.provider === "anthropic");
    ok("meta.usage normalized (anthropic)", g.j.meta?.usage?.input === 1200 && g.j.meta?.usage?.output === 300);
    ok("meta.cost estimated (sonnet-5)", g.j.meta?.cost && Math.abs(g.j.meta.cost.total - ((1200 / 1e6) * 3 + (300 / 1e6) * 15)) < 1e-9);
    ok("upstream: anthropic got correct headers", globalThis.__anthHeaders === true);
    ok("upstream: anthropic got structured schema", globalThis.__anthSchema === true);
    ok("system prompt: has salon facts + exemplar", /Frenchies Modern Nail Care/.test(globalThis.__lastSystem) && /My best ever/.test(globalThis.__lastSystem));

    // v2.0 Master Prompt Library integration
    const sys = globalThis.__lastSystem || "";
    ok("v2 prompt: 22-case library present", /22 cases, 5 families/.test(sys) && /Wordless Star/.test(sys) && /Discrimination or Harassment Claim/.test(sys));
    ok("v2 prompt: escalation ladder + audience frame", /escalation ladder/i.test(sys) && /~50 prospective clients/.test(sys));
    ok("v2 prompt: policy-dispute doctrine line", /a rule I only enforce sometimes/.test(sys));
    ok("v2 prompt: owner + FTC constraint present", /Kira/.test(sys) && /FTC Consumer Review Rule/.test(sys));
    ok("v2 prompt: new output fields in contract", /approval_level/.test(sys) && /left_out/.test(sys) && /fragile_note/.test(sys));
    {
      const { normalizeResult, sanitizeCases } = await import("../lib/schema.js");
      const floored = normalizeResult({ detected_type: "Injury or Health Claim", approval_level: "auto", needs_human_review: false, options: [] });
      ok("v2 normalize: approval floored to case level", floored.approval_level === "legal" && floored.needs_human_review === true);
      const kept = normalizeResult({ detected_type: "Short Positive", approval_level: "owner", options: [] });
      ok("v2 normalize: stricter model call kept", kept.approval_level === "owner" && kept.needs_human_review === true);
      // editable case list: a custom case's approval floor applies too
      const custom = sanitizeCases([{ name: "Ghosted Booking", family: "Mixed & neutral", approval: "owner", trigger: "t", strategy: "s" }]);
      const cf = normalizeResult({ detected_type: "Ghosted Booking", approval_level: "auto", options: [] }, custom);
      ok("v2 normalize: custom case floors approval", cf.approval_level === "owner" && cf.needs_human_review === true);
      ok("v2 sanitize: junk rows dropped, defaults applied", sanitizeCases([{ name: " X " , approval: "bogus" }, { nope: 1 }])?.length === 1 && sanitizeCases([{ name: "X", approval: "bogus" }])[0].approval === "check");
    }

    // add an OpenAI key via the API
    let r = await post("/api/providers/key", { provider: "openai", apiKey: "sk-openaiTESTKEY", model: "gpt-4o-mini", baseUrl: up });
    ok("set-key: openai ok", r.status === 200 && r.j.ok === true);
    ok("set-key: response never returns the full key", !JSON.stringify(r.j).includes("sk-openaiTESTKEY"));
    ok("set-key: openai now configured, last4=TKEY", r.j.providers.find((p) => p.id === "openai")?.configured === true && r.j.providers.find((p) => p.id === "openai")?.last4 === "TKEY");

    // switch active to openai and generate
    r = await post("/api/providers/active", { provider: "openai" });
    ok("set-active: openai", r.status === 200 && r.j.active === "openai");
    g = await post("/api/generate", { review: "Clean and friendly!", rating: 5, count: 2 });
    ok("generate: openai path used", hits[hits.length - 1] === "openai");
    ok("generate: openai bearer auth sent", globalThis.__oaiAuth === true);
    ok("generate: honored count=2 on openai", g.j.result?.options?.length === 2);
    ok("generate: meta.provider=openai", g.j.meta?.provider === "openai");

    // add Google key (uses its own base URL override) + switch + generate
    r = await post("/api/providers/key", { provider: "google", apiKey: "AIzaTESTKEY", model: "gemini-1.5-flash", baseUrl: up });
    ok("set-key: google ok", r.status === 200 && r.j.providers.find((p) => p.id === "google")?.configured === true);
    r = await post("/api/providers/active", { provider: "google" });
    g = await post("/api/generate", { review: "Best pedicure ever", rating: 5, count: 3 });
    ok("generate: google path used", hits[hits.length - 1] === "google");
    ok("generate: google key in query string", globalThis.__gKey === true);
    ok("generate: google returns options", g.j.result?.options?.length === 3);

    ok("meta.usage normalized (google)", g.j.meta?.usage?.input === 900 && g.j.meta?.usage?.output === 200);
    ok("meta.cost estimated (gemini-flash)", g.j.meta?.cost && g.j.meta.cost.total > 0);

    // per-request provider + model override
    g = await post("/api/generate", { review: "override test", rating: 5, count: 2, provider: "openai", model: "gpt-4o" });
    ok("generate: per-request provider override", g.j.meta?.provider === "openai");
    ok("generate: per-request model override reaches provider", globalThis.__oaiModel === "gpt-4o");
    ok("generate: meta.model reflects override", g.j.meta?.model === "gpt-4o");
    ok("generate: cost uses overridden model price", g.j.meta?.cost && Math.abs(g.j.meta.cost.total - ((1000 / 1e6) * 2.5 + (250 / 1e6) * 10)) < 1e-9);

    // cannot activate an unconfigured provider
    r = await post("/api/providers/active", { provider: "openai_compatible" });
    ok("set-active: rejects unconfigured provider", r.status === 400);

    // remove openai key
    r = await post("/api/providers/key", { provider: "openai" }, "DELETE");
    ok("remove-key: openai removed", r.j.providers.find((p) => p.id === "openai")?.configured === false);

    // config never leaks any saved key
    cfg = await (await fetch(`${base}/api/config`)).json();
    ok("config: no saved keys leak", !JSON.stringify(cfg).includes("AIzaTESTKEY") && !JSON.stringify(cfg).includes("sk-openai"));

    // secrets file exists and is readable JSON (persistence)
    ok("secrets: file written", existsSync(secretsFile) && typeof JSON.parse(readFileSync(secretsFile, "utf8")) === "object");

    // static + save-exemplar still work
    const html = await (await fetch(`${base}/`)).text();
    ok("static: serves index.html", html.includes("Review Response Studio"));
    const exPath = join(ROOT, "brand", "voice-exemplars.md");
    const before = readFileSync(exPath, "utf8");
    r = await post("/api/save-exemplar", { review: "TEST review", rating: 5, response: "TEST response", type: "Short Positive" });
    const after = readFileSync(exPath, "utf8");
    ok("save-exemplar: appended", r.j.ok === true && after.includes("TEST response"));
    writeFileSync(exPath, before, "utf8"); // restore
  } finally {
    srv.kill();
    upstream.close();
    try { rmSync(dirname(secretsFile), { recursive: true, force: true }); } catch {}
  }

  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

async function waitFor(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("server did not start: " + url);
}

main().catch((e) => { console.error(e); process.exit(1); });
