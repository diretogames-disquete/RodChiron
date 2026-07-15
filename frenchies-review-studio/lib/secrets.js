// Local, git-ignored secrets store. Keys are written to disk on THIS machine and
// are never returned to the browser (only a masked last-4 preview is exposed).
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
// Overridable for tests so we never touch a real user's secrets file.
const FILE = process.env.FRENCHIES_SECRETS_FILE || join(HERE, "..", ".secrets.json");

function read() {
  if (!existsSync(FILE)) return { active: null, providers: {} };
  try {
    const o = JSON.parse(readFileSync(FILE, "utf8"));
    return { active: o.active || null, providers: o.providers || {} };
  } catch {
    return { active: null, providers: {} };
  }
}

function write(store) {
  // 0600 — owner read/write only.
  writeFileSync(FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
  try { chmodSync(FILE, 0o600); } catch { /* best effort (e.g. Windows) */ }
}

export function getStore() {
  return read();
}

/** Upsert one provider's config. Only fields explicitly provided are changed. */
export function setKey(provider, { apiKey, model, baseUrl, label } = {}) {
  const s = read();
  const cur = s.providers[provider] || {};
  s.providers[provider] = {
    ...cur,
    ...(apiKey !== undefined && apiKey !== "" ? { apiKey } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(label !== undefined ? { label } : {}),
  };
  if (!s.active) s.active = provider;
  write(s);
  return s;
}

export function removeKey(provider) {
  const s = read();
  delete s.providers[provider];
  if (s.active === provider) s.active = Object.keys(s.providers)[0] || null;
  write(s);
  return s;
}

export function setActive(provider) {
  const s = read();
  s.active = provider;
  write(s);
  return s;
}
