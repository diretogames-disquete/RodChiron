# Frenchies Review Studio

A local web app for **Frenchies Modern Nail Care** (Winston-Salem, NC). Paste in a
client review and its star rating; it returns an **array of distinct, ready-to-post
response options** written in this salon's specific voice — each with a short "why
this angle" rationale — plus any operational flags the review reveals.

This is **not** a generic auto-responder. The tools on the market spit out one
interchangeable "Thank you for your feedback!" reply. This one offers a real
*choice* between different strategic approaches for each review, in a voice that
comes from **editable config files**, not a model default.

---

## What makes it different (by design)

- **Multiple genuine angles, not reworded clones.** The 2–4 options for a review
  differ in *strategy and tone* — choosing between them feels like a real decision.
- **Voice from this business's config.** All brand rules, salon facts, technician
  notes, and approved exemplars live in `/brand` and are read at runtime.
- **Transparent reasoning.** Every option shows a one-line "why this angle."
- **Human-in-the-loop for sensitive cases.** Hostile reviews, legal/BBB mentions,
  health-harm claims, unsanitary-practice accusations, and misdirected reviews
  trigger a **"Needs owner / legal sign-off"** banner and are marked as drafts.
- **Never fabricates.** No invented visit details, prices, staff names, or numbers.
  When tempted to invent, the model flags instead.

---

## Quick start

Requires **Node 20.12+** (Node 22 recommended). No dependencies to install.

```bash
npm start                   # or: node server.js
# then open http://localhost:3000
```

Then add at least one provider key — either in the app (click **API keys** in the
top-right) or via `.env` (`cp .env.example .env`). Keys are read **server-side**
and never sent to the browser.

## Two ways to run it

- **Server version (recommended): `npm start`** — the setup above. Your API key
  stays on a small local server and never touches the browser. Full brand-file
  editing.
- **Single standalone file: `standalone.html`** — just double-click it; no Node,
  no install. Everything runs in your browser. Because there's no server, the
  model call goes **straight from your browser to the provider**, which means:
  - Your API key is stored in **that browser** (localStorage) on your device.
    Fine for a personal tool on your own machine — just don't host the file
    publicly with a key saved.
  - Calls are subject to **CORS**. **Anthropic, Google (Gemini), and
    OpenAI-compatible providers (OpenRouter, Groq, DeepSeek, local) work well
    in-browser; first-party OpenAI is often blocked by CORS** (the settings panel
    flags this). If a provider is blocked, use the server version or route through
    OpenRouter.
  - The brand voice/exemplars/pricing are embedded in the file; the salon name,
    price, and technician roster are editable in-app (Settings → Salon & voice),
    and "Save as exemplar" persists in the browser. To change the voice
    principles, edit the `BRAND_DEFAULT` block in the file's source.

## Providers & API keys (bring your own, switch anytime)

Run the studio on whichever provider you want, so you control token costs:

| Provider | Notes |
|---|---|
| **Anthropic (Claude)** | `claude-sonnet-5` (default), `claude-opus-4-8`, `claude-haiku-4-5`. |
| **OpenAI (GPT)** | e.g. `gpt-4o-mini` (cheap), `gpt-4o`, `gpt-4.1`. |
| **Google (Gemini)** | e.g. `gemini-1.5-flash` (cheap), `gemini-1.5-pro`. |
| **OpenAI-compatible** | Any endpoint that speaks the OpenAI Chat Completions API — **OpenRouter, Groq, DeepSeek, Together, or a local model**. Enter a base URL, key, and model. This is the widest cost lever. |

**Click "API keys" in the header** to add a key per provider, set the model, and
choose which provider is **active**. A quick-switch dropdown appears in the header
once two or more are configured, so you can flip providers without opening the
panel. Model fields are free text with suggestions — if a provider ships a new
model, just type its id.

**How keys are handled (safely):**

- Keys you enter POST to the local server and are stored in a **git-ignored
  `.secrets.json` on this machine** (written `chmod 600`). They are the only thing
  besides saved exemplars that touches disk.
- The browser **never receives a full key** — the UI shows only the last 4 digits.
  The key field clears itself after saving.
- `.env` keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`) still work
  as a fallback; a UI-entered key for the same provider takes precedence.
- Each generation is sent only to the provider you have active (or one you name in
  the request).

---

## Using it

1. Paste the review and pick a star rating (1–5).
2. Optionally set the technician, platform, context notes ("regular client,"
   "resolved offline"), and how many options you want (2–4).
3. **Run this with** — pick the provider and model for *this* generation (defaults
   to your active provider). Overriding the model here doesn't change your saved
   default; it just runs this one on, say, a cheaper model.
4. **Generate.** You get:
   - the **detected review type** (editable),
   - the technician detected,
   - a **"Needs human review"** banner when the case is sensitive,
   - option **cards** — angle label, editable response, one-line rationale, live
     character count, **Copy**, and **Save as exemplar**,
   - an **operational flags** panel (for you — not part of the public reply),
   - a **roster note** if the review named a technician not on file.
5. **Regenerate** re-rolls fresh angles. Edit any response inline before copying.

A small bar above the results shows which provider + model actually ran, the
tokens used, and an **estimated cost** — so you can compare what each provider
costs you per review.

Nothing is ever posted automatically.

### Cost estimates

The cost figure is an estimate from `pricing.json` in the project root (USD per
1,000,000 tokens, input/output). **Edit it to match your real rates**, and add any
model id you use (e.g. an OpenRouter or DeepSeek model) to get a readout for it. A
model with no price listed simply shows token counts and no cost.

### The learning loop

When a response is right (as-is or after your edit), click **Save as exemplar**.
It appends the review + final response to `brand/voice-exemplars.md`. The app
prefers the **most recent** exemplars as few-shot anchors, so the house voice
sharpens with use instead of going stale.

---

## Editing the brand voice (no code)

Everything the model uses to write lives in `/brand` and is re-read on every
generation — edit a file, generate again, done:

| File | What it controls |
|---|---|
| `brand-voice.md` | The voice principles and the hard "never"s. |
| `voice-exemplars.md` | Approved responses loaded as few-shot anchors (the learning loop appends here). |
| `salon-facts.json` | The only facts the model may assert — name, city, `price_point_usd`, sterilization, etc. **Update the price here** (it anchors value-defense replies). |
| `technicians.json` | The roster (names, archetypes, notes) that feeds the dropdown and framing. Don't invent archetypes — leave blank until known. |
| `review-response-library.md` | Response patterns and opener-rotation banks. |
| `operational-flags.md` | The systemic issues to watch for. |
| `technician-profiles.md` | Longer human-readable technician context. |

---

## How it's built

- **Stack:** a small local Node HTTP server (`server.js`) + a static front end in
  `/public`. **Zero runtime dependencies** — uses Node's built-in `fetch` and
  `process.loadEnvFile()`. One command to run.
- **Model call:** made **server-side** from the `/api/generate` route. A small
  provider layer (`lib/providers.js`) handles each provider's wire format —
  Anthropic Messages API (with `output_config.format` structured outputs), OpenAI
  / OpenAI-compatible Chat Completions, and Google Gemini `generateContent`. A
  fence-stripping `JSON.parse`-in-`try/catch` parser normalizes every provider's
  output, and the UI shows a friendly error + **Regenerate** on any failure. Never
  crashes on a bad response. Keys are resolved by `lib/secrets.js` (local file)
  with `.env` fallback.
- **System prompt** is assembled at request time by `buildSystemPrompt()`
  (`lib/buildSystemPrompt.js`) from the brand files, salon facts, technician roster,
  review taxonomy, multi-angle logic, and the sensitive-case rules — the voice is
  data-driven, not baked into code.
- **State** is in-memory during the session (no browser storage). The only thing
  written to disk is a saved exemplar, and only when you click the button.

### API routes

| Route | Purpose |
|---|---|
| `GET /api/config` | Salon info, technicians, platforms, and per-provider status (redacted — last 4 only). |
| `GET /api/fixtures` | The seeded test reviews for "Load example." |
| `POST /api/generate` | `{review, rating, technician, platform, context, count, provider?}` → structured options from the active (or named) provider. |
| `POST /api/save-exemplar` | Appends an approved review+response to `voice-exemplars.md`. |
| `POST /api/providers/key` | `{provider, apiKey?, model?, baseUrl?}` → save a provider's config locally. |
| `DELETE /api/providers/key` | `{provider}` → remove a saved key. |
| `POST /api/providers/active` | `{provider}` → set the active provider. |

### Output contract

```json
{
  "detected_type": "Detailed Positive",
  "technician": "Rheanna",
  "needs_human_review": false,
  "sensitivity_reason": null,
  "options": [
    { "angle": "Anchor on the key phrase", "response": "…", "rationale": "…", "char_count": 172 }
  ],
  "operational_flags": [ { "issue": "…", "severity": "low|medium|high", "note": "…" } ],
  "roster_note": null
}
```

---

## Tests

`npm test` runs an end-to-end suite against a **mock upstream** — no API key or
network needed. It verifies config, static serving (incl. path-traversal
protection), the generate flow (option counts, technician pass-through, sensitive
/ hostile handling, operational flags), that the request carries the right headers
and structured-output schema, that the system prompt contains the salon facts /
exemplars / roster / sensitive-case rules, and that Save-as-exemplar appends to the
file. Seven review fixtures (`test/fixtures.json`) mirror the acceptance criteria,
including the pricing complaint, the hostile/BBB case, and the misdirected review.

---

## Privacy & safety

- API keys stay server-side — read from `.env` or the git-ignored `.secrets.json`
  (chmod 600), never exposed to the browser (the UI shows only the last 4 digits).
- Reviews you paste are sent to the **active provider** you chose, to generate
  responses.
- Nothing is auto-posted; you always pick and can edit first.
- Sensitive cases (hostility, legal/BBB, health-harm, unsanitary claims,
  misdirected reviews) are flagged for human sign-off and never presented as
  confident one-click replies.
