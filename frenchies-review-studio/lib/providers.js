// Multi-provider model layer. Each provider knows its own wire format; the app
// talks to whichever one is "active". Keys are resolved from the local secrets
// store first, then from environment variables (so existing .env keys keep
// working). Nothing here ever sends a key to the browser.
import { OUTPUT_SCHEMA } from "./schema.js";
import { getStore } from "./secrets.js";

export const PROVIDERS = [
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-5",
    models: ["claude-sonnet-5", "claude-opus-4-8", "claude-haiku-4-5"],
    needsBaseUrl: false,
    keyHint: "sk-ant-…",
    docs: "https://console.anthropic.com/",
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    needsBaseUrl: false,
    keyHint: "sk-…",
    docs: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    label: "Google (Gemini)",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    needsBaseUrl: false,
    keyHint: "AIza…",
    docs: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai_compatible",
    label: "OpenAI-compatible (OpenRouter, Groq, DeepSeek, local…)",
    defaultBaseUrl: "",
    defaultModel: "",
    models: [],
    needsBaseUrl: true,
    keyHint: "provider key",
    baseUrlHint: "https://openrouter.ai/api/v1",
    docs: "https://openrouter.ai/keys",
  },
];

const ENV = {
  anthropic: { key: "ANTHROPIC_API_KEY", base: "ANTHROPIC_BASE_URL", model: "ANTHROPIC_MODEL" },
  openai: { key: "OPENAI_API_KEY", base: "OPENAI_BASE_URL", model: "OPENAI_MODEL" },
  google: { key: "GOOGLE_API_KEY", base: "GOOGLE_BASE_URL", model: "GOOGLE_MODEL" },
  openai_compatible: { base: "OPENAI_COMPAT_BASE_URL", model: "OPENAI_COMPAT_MODEL" },
};

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) || null;
}

/** Merge stored secrets with env fallbacks and provider defaults. */
export function resolveConfig(id) {
  const p = getProvider(id);
  if (!p) return null;
  const stored = getStore().providers[id] || {};
  const env = ENV[id] || {};
  const apiKey = stored.apiKey || (env.key ? process.env[env.key] : "") || "";
  const baseUrl =
    (stored.baseUrl || (env.base ? process.env[env.base] : "") || p.defaultBaseUrl || "").replace(
      /\/+$/,
      ""
    );
  const model = stored.model || (env.model ? process.env[env.model] : "") || p.defaultModel || "";
  const keySource = stored.apiKey ? "saved" : apiKey ? "env" : null;
  return { id, apiKey, baseUrl, model, keySource, label: stored.label || p.label };
}

export function isConfigured(id) {
  const p = getProvider(id);
  const c = resolveConfig(id);
  if (!p || !c) return false;
  if (p.needsBaseUrl && !c.baseUrl) return false;
  return Boolean(c.apiKey && c.model);
}

/** Which provider a generation should use. */
export function activeProvider() {
  const s = getStore();
  if (s.active && isConfigured(s.active)) return s.active;
  return PROVIDERS.map((p) => p.id).find(isConfigured) || s.active || "anthropic";
}

/** Browser-safe status for every provider (no full keys — last 4 only). */
export function redactedStatus() {
  return PROVIDERS.map((p) => {
    const c = resolveConfig(p.id);
    return {
      id: p.id,
      label: p.label,
      needsBaseUrl: p.needsBaseUrl,
      models: p.models,
      defaultModel: p.defaultModel,
      keyHint: p.keyHint,
      baseUrlHint: p.baseUrlHint || "",
      docs: p.docs,
      configured: isConfigured(p.id),
      hasKey: Boolean(c.apiKey),
      keySource: c.keySource,
      last4: c.apiKey ? c.apiKey.slice(-4) : null,
      model: c.model,
      baseUrl: c.baseUrl,
    };
  });
}

// ---------- robust JSON extraction (shared) ----------
export function parseModelJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "Empty response from the model." };
  }
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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

// ---------- dispatch ----------
export async function callProvider(id, { system, user, maxTokens = 3000, signal } = {}) {
  const p = getProvider(id);
  if (!p) return { ok: false, status: 0, error: `Unknown provider: ${id}` };
  const cfg = resolveConfig(id);
  if (!cfg.apiKey)
    return { ok: false, status: 0, error: `No API key for ${p.label}. Add one under "API keys".` };
  if (p.needsBaseUrl && !cfg.baseUrl)
    return { ok: false, status: 0, error: `${p.label} needs a base URL.` };
  if (!cfg.model) return { ok: false, status: 0, error: `No model set for ${p.label}.` };

  try {
    if (id === "anthropic") return await callAnthropic(cfg, { system, user, maxTokens, signal });
    if (id === "google") return await callGoogle(cfg, { system, user, maxTokens, signal });
    // openai + openai_compatible share the Chat Completions shape
    return await callOpenAILike(id, cfg, { system, user, maxTokens, signal });
  } catch (e) {
    return { ok: false, status: 0, error: `Network error reaching ${p.label}: ${e.message}` };
  }
}

async function readJsonSafe(res) {
  const raw = await res.text();
  try {
    return { raw, json: JSON.parse(raw) };
  } catch {
    return { raw, json: null };
  }
}

async function callAnthropic(cfg, { system, user, maxTokens, signal }) {
  const res = await fetch(`${cfg.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    }),
    signal,
  });
  const { raw, json } = await readJsonSafe(res);
  if (!res.ok)
    return { ok: false, status: res.status, error: apiErr("Anthropic", res.status, json, raw) };
  if (json && json.stop_reason === "refusal")
    return { ok: false, status: 200, error: "The model declined this request. Review it manually." };
  const text = (Array.isArray(json?.content) ? json.content : [])
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
  return { ok: true, status: 200, text, usage: json?.usage || null, model: cfg.model };
}

async function callOpenAILike(id, cfg, { system, user, maxTokens, signal }) {
  const body = {
    model: cfg.model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  // Only the first-party OpenAI endpoint reliably supports JSON mode; leave it
  // off for arbitrary OpenAI-compatible endpoints (they vary) and lean on the
  // prompt + robust parser instead.
  if (id === "openai") body.response_format = { type: "json_object" };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
    signal,
  });
  const { raw, json } = await readJsonSafe(res);
  const label = id === "openai" ? "OpenAI" : "Provider";
  if (!res.ok) return { ok: false, status: res.status, error: apiErr(label, res.status, json, raw) };
  const choice = json?.choices?.[0];
  if (choice?.finish_reason === "content_filter")
    return { ok: false, status: 200, error: "The provider filtered this request. Review it manually." };
  const text = typeof choice?.message?.content === "string" ? choice.message.content : "";
  return { ok: true, status: 200, text, usage: json?.usage || null, model: cfg.model };
}

async function callGoogle(cfg, { system, user, maxTokens, signal }) {
  const url = `${cfg.baseUrl}/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(
    cfg.apiKey
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: maxTokens },
    }),
    signal,
  });
  const { raw, json } = await readJsonSafe(res);
  if (!res.ok) return { ok: false, status: res.status, error: apiErr("Gemini", res.status, json, raw) };
  const cand = json?.candidates?.[0];
  const block = json?.promptFeedback?.blockReason || cand?.finishReason;
  if (block && block !== "STOP" && block !== "MAX_TOKENS" && !cand?.content)
    return { ok: false, status: 200, error: `Gemini blocked this request (${block}). Review it manually.` };
  const text = (cand?.content?.parts || [])
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("");
  return { ok: true, status: 200, text, usage: json?.usageMetadata || null, model: cfg.model };
}

function apiErr(label, status, json, raw) {
  const msg =
    (json && json.error && (json.error.message || json.error)) ||
    (typeof json?.message === "string" && json.message) ||
    raw ||
    `HTTP ${status}`;
  return `${label} API error (${status}): ${typeof msg === "string" ? msg : JSON.stringify(msg)}`;
}
