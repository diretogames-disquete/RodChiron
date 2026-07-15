// Server-side Anthropic Messages API call. The API key NEVER reaches the browser.
import { OUTPUT_SCHEMA } from "./schema.js";

// Current Sonnet-class model (confirmed against Anthropic's model catalog:
// "Claude Sonnet 5" => "claude-sonnet-5"). Override with ANTHROPIC_MODEL.
export const DEFAULT_MODEL = "claude-sonnet-5";
const API_VERSION = "2023-06-01";

function baseUrl() {
  // Overridable for local testing / self-host. Trailing slash tolerated.
  return (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");
}

/**
 * Strip stray code fences / preamble and parse the model's JSON. Never throws
 * blindly — returns { ok, data, error }.
 */
export function parseModelJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "Empty response from the model." };
  }
  let t = text.trim();
  // Remove a leading ```json / ``` fence and a trailing ``` fence if present.
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Fall back to the outermost { ... } if there's surrounding prose.
  if (!t.startsWith("{")) {
    const first = t.indexOf("{");
    const last = t.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  }
  try {
    return { ok: true, data: JSON.parse(t) };
  } catch (e) {
    return { ok: false, error: `Could not parse model output as JSON: ${e.message}` };
  }
}

/** Pull all text blocks out of a Messages API response. */
export function extractText(apiJson) {
  const content = apiJson && Array.isArray(apiJson.content) ? apiJson.content : [];
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
}

/**
 * Call the Messages API. Returns { ok, text, status, error }.
 * Uses structured outputs (output_config.format) to force valid JSON.
 */
export async function callClaude({ system, user, maxTokens = 3000, signal } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      error:
        "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key, then restart the server.",
    };
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
  };

  let res;
  try {
    res = await fetch(`${baseUrl()}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    return { ok: false, status: 0, error: `Network error reaching the model: ${e.message}` };
  }

  let json;
  const raw = await res.text();
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json && json.error && json.error.message) || raw || `HTTP ${res.status}`;
    return { ok: false, status: res.status, error: `Model API error (${res.status}): ${msg}` };
  }

  if (json && json.stop_reason === "refusal") {
    return {
      ok: false,
      status: 200,
      error: "The model declined to answer this request. Please review it manually.",
    };
  }

  return { ok: true, status: 200, text: extractText(json), usage: json && json.usage, model };
}
