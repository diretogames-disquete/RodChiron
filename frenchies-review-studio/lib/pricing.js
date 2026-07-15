// Rough cost estimation. Prices are USD per 1,000,000 tokens and DRIFT over time
// and by tier — treat every figure as an editable estimate. Override or extend
// them by editing `pricing.json` in the project root (any model id you add there
// wins over the defaults below).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = process.env.FRENCHIES_PRICING_FILE || join(HERE, "..", "pricing.json");

export const DEFAULT_PRICES = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

export function loadPrices() {
  let overrides = {};
  if (existsSync(FILE)) {
    try {
      overrides = JSON.parse(readFileSync(FILE, "utf8")) || {};
    } catch {
      /* malformed pricing.json — fall back to defaults */
    }
  }
  return { ...DEFAULT_PRICES, ...overrides };
}

/** Estimate cost from a normalized usage object {input, output}. Returns null if
 *  the model's price is unknown (e.g. an OpenAI-compatible model) or no usage. */
export function estimateCost(model, usage) {
  if (!usage) return null;
  const p = loadPrices()[model];
  if (!p || typeof p.input !== "number" || typeof p.output !== "number") return null;
  const inTok = Number(usage.input) || 0;
  const outTok = Number(usage.output) || 0;
  const input = (inTok / 1e6) * p.input;
  const output = (outTok / 1e6) * p.output;
  return { input, output, total: input + output, currency: "USD", estimated: true };
}
