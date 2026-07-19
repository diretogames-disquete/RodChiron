// Loads brand knowledge from files at runtime. Never hardcode voice rules in app
// logic — everything the model uses to write comes from /brand.
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CASES, sanitizeCases } from "./schema.js";

const HERE = dirname(fileURLToPath(import.meta.url));
export const BRAND_DIR = join(HERE, "..", "brand");

function readIfExists(name) {
  const p = join(BRAND_DIR, name);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
function readJsonIfExists(name, fallback) {
  const raw = readIfExists(name);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[brand] ${name} is not valid JSON — using fallback. ${e.message}`);
    return fallback;
  }
}

/**
 * Split the exemplars markdown into blocks (each starts with "## "), keep the
 * most recent `limit` (newest are appended to the end of the file by the
 * learning loop), so the house voice sharpens with use and the prompt stays lean.
 */
export function loadExemplars(limit = 10) {
  const raw = readIfExists("voice-exemplars.md");
  if (!raw) return [];
  const blocks = raw
    .split(/\n(?=## )/g)
    .map((b) => b.trim())
    .filter((b) => b.startsWith("## "));
  return blocks.slice(-limit);
}

/** Read the whole brand config fresh so edits take effect without a restart. */
export function loadBrand() {
  return {
    salon: readJsonIfExists("salon-facts.json", {
      name: "Frenchies Modern Nail Care",
      city: "Winston-Salem, NC",
      price_point_usd: 80,
      signoff: "— The Frenchies Team",
    }),
    technicians: readJsonIfExists("technicians.json", []),
    // The case library is editable data too: brand/review-cases.json ships with
    // the 22 v2.0 cases; edit, add, or remove cases there and the prompt, the
    // dropdown, and the approval floor all follow. Falls back to the built-ins.
    cases: sanitizeCases(readJsonIfExists("review-cases.json", null)) || CASES,
    voice: readIfExists("brand-voice.md"),
    library: readIfExists("review-response-library.md"),
    operationalFlags: readIfExists("operational-flags.md"),
    exemplars: loadExemplars(),
  };
}

/** Append an approved review+response to voice-exemplars.md (the learning loop). */
export function appendExemplar({ review, rating, response, type, note, date }) {
  const stars = Number(rating) ? `${Number(rating)}★` : "—";
  const safe = (s) => String(s ?? "").replace(/"/g, '\\"');
  const block =
    `\n## Approved ${date}${type ? ` — ${type}` : ""}\n` +
    `> **Review (${stars}):** "${safe(review)}"\n` +
    `> **Response:** "${safe(response)}"\n` +
    (note ? `> **Note:** ${String(note).replace(/\n/g, " ")}\n` : "");
  appendFileSync(join(BRAND_DIR, "voice-exemplars.md"), block, "utf8");
  return block;
}
