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
# 1. Add your API key
cp .env.example .env        # then edit .env and paste your ANTHROPIC_API_KEY

# 2. Run it
npm start                   # or: node server.js

# 3. Open http://localhost:3000
```

Get an API key at <https://console.anthropic.com/> (Settings → API Keys). The key
is read from `.env` **server-side** and never sent to the browser. `.env` is
git-ignored.

**Model:** defaults to the current Sonnet-class model, `claude-sonnet-5`. Change it
with `ANTHROPIC_MODEL` in `.env`.

---

## Using it

1. Paste the review and pick a star rating (1–5).
2. Optionally set the technician, platform, context notes ("regular client,"
   "resolved offline"), and how many options you want (2–4).
3. **Generate.** You get:
   - the **detected review type** (editable),
   - the technician detected,
   - a **"Needs human review"** banner when the case is sensitive,
   - option **cards** — angle label, editable response, one-line rationale, live
     character count, **Copy**, and **Save as exemplar**,
   - an **operational flags** panel (for you — not part of the public reply),
   - a **roster note** if the review named a technician not on file.
4. **Regenerate** re-rolls fresh angles. Edit any response inline before copying.

Nothing is ever posted automatically.

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
- **Model call:** made **server-side** from the `/api/generate` route
  (`lib/anthropic.js`). The Anthropic Messages API is called with
  `output_config.format` (structured outputs) so the model returns valid JSON;
  a fence-stripping `JSON.parse`-in-`try/catch` parser is the fallback, and the UI
  shows a friendly error + **Regenerate** on any failure. Never crashes on a bad
  response.
- **System prompt** is assembled at request time by `buildSystemPrompt()`
  (`lib/buildSystemPrompt.js`) from the brand files, salon facts, technician roster,
  review taxonomy, multi-angle logic, and the sensitive-case rules — the voice is
  data-driven, not baked into code.
- **State** is in-memory during the session (no browser storage). The only thing
  written to disk is a saved exemplar, and only when you click the button.

### API routes

| Route | Purpose |
|---|---|
| `GET /api/config` | Salon name, technician list, platforms, model (no secrets). |
| `GET /api/fixtures` | The seeded test reviews for "Load example." |
| `POST /api/generate` | `{review, rating, technician, platform, context, count}` → structured options. |
| `POST /api/save-exemplar` | Appends an approved review+response to `voice-exemplars.md`. |

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

- The API key stays server-side (read from `.env`, never exposed to the browser).
- Reviews you paste are sent to the Anthropic API to generate responses.
- Nothing is auto-posted; you always pick and can edit first.
- Sensitive cases (hostility, legal/BBB, health-harm, unsanitary claims,
  misdirected reviews) are flagged for human sign-off and never presented as
  confident one-click replies.
