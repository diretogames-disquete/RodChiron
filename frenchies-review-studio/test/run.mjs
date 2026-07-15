// End-to-end test with a MOCK upstream (no API key / network needed).
// Starts a fake Anthropic endpoint, points the app at it via ANTHROPIC_BASE_URL,
// starts the real server, and drives the real /api routes.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let pass = 0, fail = 0;
function ok(name, cond, extra = "") { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (extra ? " — " + extra : "")); } }

// Canned model reply, wrapped as a fenced JSON string to exercise the fence-stripping parser.
function cannedReply(input) {
  const n = Math.min(4, Math.max(2, Number(input.count) || 3));
  const hostile = /bbb|lawyer|attorney|lawsuit|sue|worst experience|rude/i.test(input.review || "");
  const obj = {
    detected_type: hostile ? "Negative – Hostile" : "Detailed Positive",
    technician: input.technician || null,
    needs_human_review: hostile,
    sensitivity_reason: hostile ? "Hostile tone and a BBB/complaint mention." : null,
    options: Array.from({ length: n }, (_, i) => ({
      angle: ["Anchor on the key phrase", "Differentiator-woven", "Testimonial invitation", "Take it offline"][i],
      response: `Option ${i + 1} response text.`,
      rationale: `Angle ${i + 1} rationale.`,
      char_count: 24,
    })),
    operational_flags: hostile ? [{ issue: "Front-desk communication", severity: "high", note: "Reviewer felt disrespected." }] : [],
    roster_note: null,
  };
  return "```json\n" + JSON.stringify(obj) + "\n```";
}

// 1) Mock upstream
const upstream = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    // sanity: server must send the required headers and a system prompt
    const hasKey = req.headers["x-api-key"] === "test-key";
    const hasVer = req.headers["anthropic-version"] === "2023-06-01";
    let parsed = {}; try { parsed = JSON.parse(body); } catch {}
    const sys = parsed.system || "";
    // recover the review count from the user message
    const um = parsed.messages?.[0]?.content || "";
    const countMatch = /Generate (\d+) strategically/.exec(um);
    const count = countMatch ? Number(countMatch[1]) : 3;
    const reviewMatch = /"""\n([\s\S]*?)\n"""/.exec(um);
    const review = reviewMatch ? reviewMatch[1] : "";
    globalThis.__lastSystem = sys;
    globalThis.__hasHeaders = hasKey && hasVer;
    globalThis.__hasSchema = Boolean(parsed.output_config?.format?.schema);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      content: [{ type: "text", text: cannedReply({ count, review, technician: /technician on this visit: ([^\n]+)/i.exec(um)?.[1]?.trim() || "" }) }],
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 20 },
      model: "mock",
    }));
  });
});

async function main() {
  await new Promise((r) => upstream.listen(0, r));
  const upPort = upstream.address().port;

  // 2) Start the real server pointed at the mock
  const PORT = 4123;
  const env = {
    ...process.env,
    PORT: String(PORT),
    ANTHROPIC_API_KEY: "test-key",
    ANTHROPIC_MODEL: "claude-sonnet-5",
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${upPort}`,
  };
  const srv = spawn("node", ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  srv.stderr.on("data", (d) => process.stderr.write("[srv] " + d));
  await waitFor(`http://127.0.0.1:${PORT}/api/config`);

  const base = `http://127.0.0.1:${PORT}`;
  try {
    // config
    const cfg = await (await fetch(`${base}/api/config`)).json();
    ok("config: salon name", cfg.salon?.name === "Frenchies Modern Nail Care");
    ok("config: technicians present", Array.isArray(cfg.technicians) && cfg.technicians.includes("Rheanna"));
    ok("config: model is sonnet-5", cfg.model === "claude-sonnet-5");
    ok("config: does NOT leak key", !("ANTHROPIC_API_KEY" in cfg) && cfg.apiKeyPresent === true);

    // static index
    const html = await (await fetch(`${base}/`)).text();
    ok("static: serves index.html", html.includes("Frenchies Review Studio"));

    // path traversal blocked
    const trav = await fetch(`${base}/../server.js`);
    ok("static: blocks path traversal", trav.status === 404 || !(await trav.text()).includes("createServer"));

    // fixtures
    const fx = await (await fetch(`${base}/api/fixtures`)).json();
    ok("fixtures: 7 examples", Array.isArray(fx) && fx.length === 7);

    // generate — positive, 3 options
    const gen = await (await fetch(`${base}/api/generate`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ review: "Rheanna was thorough, my best ever!", rating: 5, technician: "Rheanna", count: 3 }),
    })).json();
    ok("generate: returns result", !!gen.result);
    ok("generate: 3 options", gen.result?.options?.length === 3);
    ok("generate: options have angle+response+rationale", gen.result.options.every((o) => o.angle && o.response && o.rationale));
    ok("generate: technician passed through", gen.result.technician === "Rheanna");
    ok("generate: not flagged", gen.result.needs_human_review === false);

    // count 2 and 4
    const g2 = await (await fetch(`${base}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ review: "Clean, friendly!", rating: 5, count: 2 }) })).json();
    ok("generate: honors count=2", g2.result?.options?.length === 2);
    const g4 = await (await fetch(`${base}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ review: "Clean, friendly!", rating: 5, count: 4 }) })).json();
    ok("generate: honors count=4", g4.result?.options?.length === 4);

    // sensitive / hostile
    const hostile = await (await fetch(`${base}/api/generate`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ review: "WORST experience. Staff were rude. Filing with the BBB.", rating: 1, count: 3 }),
    })).json();
    ok("generate: hostile triggers human review", hostile.result?.needs_human_review === true);
    ok("generate: hostile has sensitivity_reason", !!hostile.result?.sensitivity_reason);
    ok("generate: hostile surfaces operational flag", hostile.result?.operational_flags?.length >= 1);

    // upstream received correct headers + schema
    ok("upstream: got x-api-key + anthropic-version", globalThis.__hasHeaders === true);
    ok("upstream: got structured-output schema", globalThis.__hasSchema === true);

    // system prompt content
    const sys = globalThis.__lastSystem || "";
    ok("system prompt: includes salon facts", sys.includes("Frenchies Modern Nail Care") && sys.includes("price_point_usd"));
    ok("system prompt: includes an exemplar", sys.includes("My best ever"));
    ok("system prompt: includes roster", sys.includes("Rheanna"));
    ok("system prompt: includes sensitive-case rules", /needs_human_review/.test(sys) && /BBB/.test(sys));
    ok("system prompt: forbids thank-you cliché", /Thank you for your feedback/.test(sys));

    // missing body
    const bad = await fetch(`${base}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
    ok("generate: 400 on empty input", bad.status === 400);

    // save exemplar appends to the file
    const exPath = join(ROOT, "brand", "voice-exemplars.md");
    const before = readFileSync(exPath, "utf8");
    const save = await (await fetch(`${base}/api/save-exemplar`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ review: "TEST review for exemplar", rating: 5, response: "TEST response for exemplar", type: "Short Positive" }),
    })).json();
    const after = readFileSync(exPath, "utf8");
    ok("save-exemplar: ok:true", save.ok === true);
    ok("save-exemplar: appended block", after.length > before.length && after.includes("TEST response for exemplar"));
    // restore the file so the repo stays clean
    writeFileSync(exPath, before, "utf8");
  } finally {
    srv.kill();
    upstream.close();
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
