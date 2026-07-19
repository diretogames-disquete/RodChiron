# Frenchies Review Studio — Install & Operate Guide (technical)

A complete guide to installing, configuring, running, and maintaining the Review
Studio. This is the more technical of the two manuals; the companion
[`OWNER-GUIDE.md`](./OWNER-GUIDE.md) covers the same tool in plain language for a
business owner.

---

## 1. What it is

A local app that turns a pasted client review + star rating into an **array of
distinct, ready-to-post reply options** in the salon's own voice, each with a
one-line rationale, plus operational flags and a token/cost readout. It is **not**
an auto-responder: you always pick and can edit before anything is used, and it
never posts anything itself.

There are **two ways to run it**, sharing the same logic:

| | Server version | Standalone file |
|---|---|---|
| File | the `frenchies-review-studio/` folder | `standalone.html` (one file) |
| Needs | Node.js installed | just a browser |
| Where the API key lives | a local server (`.secrets.json` / `.env`), **not** the browser | your browser's `localStorage` |
| How the model is called | browser → your local server → provider | browser → provider (direct) |
| Brand config | editable files in `/brand` | embedded + in-app editor |
| Best when | you want keys off the browser; full file editing | you want zero install / one portable file |

Pick the server version if you want the tightest key isolation; pick the
standalone file if you want a double-click-and-go single file.

---

## 2. Requirements

- **Server version:** [Node.js](https://nodejs.org) **20.12 or newer** (Node 22
  recommended). No other dependencies — the app has **zero npm packages**.
- **Standalone file:** any modern browser (Chrome, Edge, Firefox, Safari). No
  Node.
- **Either way:** at least one **provider API key** (see §5).

Verify Node:

```bash
node --version    # expect v20.12+ or v22.x
```

---

## 3. Get the code

**Clone (preserves the executable bit on the macOS launcher):**

```bash
git clone https://github.com/diretogames-disquete/rodchiron.git
cd rodchiron
git checkout claude/1sg-personnel-dashboard-xieo1l
cd frenchies-review-studio
```

**Or download a ZIP:** on GitHub, switch to the branch → **Code ▸ Download ZIP** →
unzip → open the `frenchies-review-studio` folder.

**Or just the standalone file:** open `frenchies-review-studio/standalone.html` on
GitHub → click **Download raw file** (the ⬇ icon) → double-click the file.

---

## 4. Run it — server version

### 4a. One command

From inside the `frenchies-review-studio` folder:

```bash
npm start          # equivalent to: node server.js
```

You'll see:

```
Frenchies Review Studio
▸ http://localhost:3000
```

Open **http://localhost:3000**. Stop it with **Ctrl-C**.

### 4b. No-terminal launchers

Double-click, no terminal:

- **macOS:** `start.command` (first run: if macOS blocks it, right-click → **Open**
  → **Open**; if it opens in a text editor after a ZIP download, run
  `chmod +x start.command` once).
- **Windows:** `start.bat`.

Each checks for Node, starts the server, and opens the browser.

### 4c. Ports & env

Change the port if 3000 is taken:

```bash
PORT=3001 npm start           # macOS / Linux
# or set PORT in a .env file (see below)
```

Optional `.env` (keys and settings; copy from `.env.example`):

```ini
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=AIza...
# ANTHROPIC_MODEL=claude-sonnet-5
PORT=3000
```

Keys added **in the app** are stored in `.secrets.json` and **take precedence**
over `.env`. `.env` and `.secrets.json` are both git-ignored.

---

## 5. Providers & API keys

The app runs on whichever provider you choose, so you control cost:

| Provider | Get a key | Default model | Notes |
|---|---|---|---|
| Anthropic (Claude) | console.anthropic.com | `claude-sonnet-5` | Also `claude-opus-4-8`, `claude-haiku-4-5`. |
| OpenAI (GPT) | platform.openai.com/api-keys | `gpt-4o-mini` | Cheap default; also `gpt-4o`, `gpt-4.1`. |
| Google (Gemini) | aistudio.google.com/app/apikey | `gemini-1.5-flash` | Very cheap. |
| OpenAI-compatible | e.g. openrouter.ai/keys | — | Any endpoint speaking the OpenAI Chat Completions API — **OpenRouter, Groq, DeepSeek, Together, local**. Enter a base URL + key + model. Widest cost lever. **OpenRouter needs all three:** base URL `https://openrouter.ai/api/v1`, and a model in **`vendor/model`** form (e.g. `openai/gpt-4o-mini`, `google/gemini-flash-1.5`) — a bare `gpt-4o-mini` is rejected. Paid models need credits, or use a `:free` model. |

**Add / switch keys:** click **API keys** in the header. Per provider you can set
the key, the model (free text with suggestions — type any model id), and (for
OpenAI-compatible) a base URL, then choose which provider is **active**. A
**quick-switch** appears in the header once two or more are configured.

**Per-request override:** the **Run this with** picker (above *Generate*) lets you
pick the provider + model for a single generation without changing your default.

**Standalone CORS caveat:** because the standalone file calls providers directly
from the browser, it's subject to CORS. **Anthropic, Google, and OpenAI-compatible
providers (OpenRouter/Groq/etc.) work in-browser; first-party OpenAI is often
blocked** — the settings panel flags this. If a provider is blocked in the
standalone file, use the server version or route through OpenRouter. (The server
version has no CORS limitation — it can call any of them.)

---

## 6. Using it (workflow)

1. **Paste the review** and pick a **star rating** (1–5).
2. Optional: **technician** (dropdown or free text), **platform**
   (Google/Yelp/Facebook), **context notes** ("regular client", "resolved
   offline"), and **number of options** (2–4).
3. **Run this with** — choose provider + model for this run (defaults to active).
4. **Generate.** You get, in the results pane:
   - the **detected case** (editable dropdown — one of the 22 cases in 5
     families from the Master Prompt Library v2.0),
   - an **approval-level chip**: **Auto** / **Check** / **Owner** / **Legal**
     (hover it for what each level requires — see §9),
   - the technician detected,
   - a **"Needs owner sign-off"** banner on Owner- and Legal-level cases,
   - a **usage/cost bar** (provider · model · tokens · estimated cost),
   - **option cards** — angle label, an **editable** response, a one-line
     rationale, a live character count, **Copy**, and **Save as exemplar**,
   - a **"Deliberately left out"** panel — what the drafts intentionally omit
     and the risk each omission avoids,
   - a **fragility warning** when a passage would read badly if trimmed (it
     tells you which direction *not* to edit),
   - an **operational flags** panel (internal only — not part of the reply),
   - a **roster note** if a review named a technician not on file.
5. **Regenerate** re-rolls fresh angles. Edit any response inline before copying.
6. Paste your chosen reply into Google/Yelp/etc. yourself.

Keyboard: **Ctrl/Cmd-Enter** in the review box triggers Generate.

**The learning loop:** click **Save as exemplar** on a reply you like (as-is or
edited). The server version appends it to `brand/voice-exemplars.md`; the
standalone stores it in the browser. The app prefers the most recent exemplars as
few-shot anchors, so the voice sharpens with use.

---

## 7. Customizing the voice (brand config)

### Server version — editable files in `/brand`

Everything the model uses is re-read on every generation, so edit a file and
generate again:

| File | Controls |
|---|---|
| `brand-voice.md` | The voice principles and the never-say list. |
| `voice-exemplars.md` | Approved responses used as few-shot anchors (learning loop appends here). |
| `salon-facts.json` | The only facts the model may assert — name, city, **`owner`**, **`price_point_usd`**, sterilization, etc. |
| `technicians.json` | The roster (name, archetype, note). Don't invent archetypes. |
| `review-cases.json` | **The whole case library** — ships with the 22 v2.0 cases. Edit any case's name, family, trigger, strategy, or approval level, or add/remove cases; the prompt, the detected-case dropdown, and the approval floor all follow. Invalid entries are ignored; delete the file to restore the built-ins. |
| `review-response-library.md` | Response patterns + opener-rotation banks. |
| `operational-flags.md` | Systemic issues to watch for. |
| `technician-profiles.md` | Longer human-readable technician context. |
| `pricing.json` (project root) | USD per 1,000,000 tokens per model, for the cost estimate. |

### Standalone version — in-app + embedded

- **Settings ▸ Salon & voice:** edit salon name, city, **owner** (signs the
  tough replies), **price**, sign-off, and the full technician roster — each
  technician has a name, an archetype (how the voice frames her), and a private
  note. Persisted to the browser.
- **Settings ▸ Review cases:** the full case editor — every case's name, family,
  approval level, trigger, and strategy is editable; **＋ Add case** appends your
  own; ✕ removes one; **Reset** restores the 22 library defaults. The detected-
  case dropdown, the system prompt, and the enforced approval floor all follow
  your list on the next generation.
- **Voice principles, exemplars, pricing** are embedded in the file — edit the
  `BRAND_DEFAULT` and `PRICES` blocks in the HTML source to change them.
- **Voice library export/import:** carry your salon settings, roster, customized
  cases, and saved responses to another device (Settings ▸ Salon & voice ▸
  Export / Import). **API keys are never included** in the export.

---

## 8. Cost & tokens

The usage/cost bar shows `provider · model · N in / N out tokens · ~$cost (est.)`.
A single reply is typically a few hundred to ~1,500 input tokens and a few hundred
output tokens — **about a penny on the premium model, a fraction of a cent on the
budget models**.

- **Estimates** come from `pricing.json` (USD per 1M tokens, input/output). Edit it
  to match your real rates, and add any model id you use (e.g. an OpenRouter or
  DeepSeek model) to get a readout for it. Unknown models show tokens only.
- **To cut cost:** use the Run-this-with picker to run routine replies on a cheap
  model (`gpt-4o-mini`, `gemini-1.5-flash`, or a budget OpenRouter model) and
  reserve a premium model (`claude-sonnet-5`, `claude-opus-4-8`) for tricky ones.

---

## 9. Approval levels & sensitive-case handling (v2.0)

Every one of the 22 cases carries a minimum **approval level** — the governance
ladder from the Master Prompt Library:

| Level | Who signs off | Applies to |
|---|---|---|
| **Auto** | Any trained team member, after a read-through | Most positive cases (01–05, 07–08) |
| **Check** | A second pair of eyes — usually the salon lead | Membership Convert, all Mixed & neutral, Time-shifted |
| **Owner** | The owner personally, no exceptions | All negatives (service, communication, pricing, policy, hostile), Misdirected, Suspicious/Fake |
| **Legal** | Owner **plus** counsel / franchise support | Injury or Health Claim, Discrimination or Harassment Claim |

Two rails are enforced **in code**, not just in the prompt:

- **The approval floor.** If the model classifies a review into a case but
  under-calls the level, the app raises it to the case's floor — the stricter of
  the two always wins. (The model may also *raise* a level when the content
  demands it; that's honored.)
- **Owner/Legal ⇒ human review.** Those cases always show the sign-off banner and
  mark every card **"draft — needs review."** Never treat them as one-click safe.

The escalation ladder also classifies by the **highest-stakes element present**
(one line about bleeding inside a policy rant makes it an Injury case), and the
Suspicious/Fake case encodes the **FTC Consumer Review Rule** constraint: never
accuse a reviewer publicly and never threaten legal action to force a takedown —
report through the platform on factual grounds.

---

## 10. Data, privacy & backups

- **Keys:** server version → `.secrets.json` (chmod 600) or `.env`, **never sent to
  the browser** (only last-4 shown). Standalone → the browser's `localStorage`,
  sent only to the provider you run.
- **Reviews** you paste are sent to the **active provider** to generate a reply.
- **What's on disk (server):** `.secrets.json` (keys), `/brand/*` (voice + saved
  exemplars), `pricing.json`. Back these up to preserve your setup.
- **What's in the browser (standalone):** keys + salon overrides + saved responses.
  Use **Export voice library** to back up everything except keys.
- **OPSEC:** this is a productivity aid, not a system of record. Don't paste
  clients' full personal data; the salon-facts config captures only what the reply
  needs.

---

## 11. Architecture (brief)

- **Server:** a zero-dependency Node HTTP server (`server.js`) serving static files
  from `/public` and a small API. Uses Node's built-in `fetch` and
  `process.loadEnvFile()`.
- **Provider layer** (`lib/providers.js`): per-provider wire formats — Anthropic
  Messages API (with `output_config.format` structured outputs), OpenAI /
  OpenAI-compatible Chat Completions (`response_format: json_object` for
  first-party OpenAI), Google `generateContent` (`responseMimeType:
  application/json`). Config resolves from `.secrets.json` first, then `.env`.
- **Robust output:** a fence-stripping `JSON.parse`-in-`try/catch` parser
  (`parseModelJson`) plus `normalizeResult` coerce every provider's output into the
  contract, so a slightly-off response never crashes the UI; failures show a
  friendly error + Regenerate.
- **Prompt** (`lib/buildSystemPrompt.js`): assembled at request time from the brand
  files — the voice is data-driven, not hardcoded.

**API routes:** `GET /api/config`, `GET /api/fixtures`, `POST /api/generate`,
`POST /api/save-exemplar`, `POST|DELETE /api/providers/key`,
`POST /api/providers/active`.

**Tests:**

```bash
npm test    # 37 checks against a mock upstream — no key or network needed
```

Covers config, static serving + path-traversal, the generate flow, per-provider
usage normalization, the model override, sensitive handling, and that keys never
leak into any response.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| **"No provider is set up yet"** | Open **API keys**, add a key + model, set it active. |
| **`Model API error (401)`** | Wrong/expired API key. Re-paste it. |
| **`Model API error (404)` / unknown model** | The model id doesn't exist for that provider — type a valid one in the model field (Run-this-with or API keys panel). |
| **Standalone: "Couldn't reach … (CORS)"** | That provider blocks direct browser calls. Use Anthropic, Google, or OpenRouter — or the server version. |
| **Port 3000 in use** | `PORT=3001 npm start`, or set `PORT` in `.env`. |
| **macOS: `start.command` won't open** | Right-click → **Open** → **Open** (Gatekeeper). If it opens in a text editor, `chmod +x start.command` once. |
| **"Could not save (browser storage blocked?)"** | The standalone needs `localStorage`; don't run it in private/incognito with storage disabled. |
| **Malformed reply / parse error** | Click **Regenerate**; try a stronger model if it recurs. |
| **Prices look wrong in the cost bar** | Edit `pricing.json` (server) or the `PRICES` block (standalone) to your real rates. |

---

## 13. Updating & uninstalling

- **Update:** `git pull` (if cloned), or re-download. Your `.secrets.json`,
  `/brand` edits, and `pricing.json` are preserved (git-ignored / your own edits).
  For the standalone, **Export voice library** first, then replace the file, then
  **Import**.
- **Uninstall:** delete the folder (server) or the file (standalone). To wipe
  standalone data without deleting the file, clear the site's browser storage.

---

Companion guide for non-technical owners: [`OWNER-GUIDE.md`](./OWNER-GUIDE.md).
