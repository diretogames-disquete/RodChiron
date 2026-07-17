# Combat Medic Dashboard — MARCH·PAWS

A concept **TCCC (Tactical Combat Casualty Care) heads-up display** for a combat
medic. It presents two HUD design directions for a holographic casualty display
built around the full **MARCH·PAWS** protocol, driven by a library of **50
scripted casualty scenarios** (GSW, IED, blast, burn, crush, MVC). Vitals respond
live to each scenario's injuries and interventions, and performance is scored
against JTS Clinical Practice Guideline benchmarks.

- **Variant A — TACMED-19:** grounded, near-term rugged tactical. Dense
  instrumentation; amber/red/green semantics; feels like issued kit.
- **Variant B — AEGIS Predictive:** speculative AI-augmented hologram. Translucent
  cyan glass, predictive vitals, auto-populated 9-line, P(survival) ring, and a
  rotating 3D anatomical injury model.

A floating control panel (top-right) lets you pick a scenario, play/scrub the
timeline, switch **FOCUS** (both variants / TACMED only / AEGIS only), retint the
hologram, toggle the performance overlay, and enable procedural tactical audio.
In a single-variant FOCUS mode an **editable teleprompter narration** appears and
auto-scrolls.

---

## Run it

### Option 1 — `standalone.html` (recommended: just double-click)

`standalone.html` is a **single self-contained file** — every library, the 3D
model, and all scenario data are embedded. **Double-click it** and it runs in your
browser with **no install, no server, and no internet required** (an internet
connection only improves the web-font; everything else is offline).

This is the easiest way to view or demo the dashboard.

### Option 2 — the editable multi-file source (`index.html`)

`index.html` loads its `.jsx` modules through in-browser Babel, so it must be
**served over HTTP** (opening it directly from `file://` won't work — the browser
blocks the module fetches). It also pulls React, Three.js, and Babel from a CDN,
so this path **needs an internet connection**.

No-terminal launchers are included — after installing [Node.js](https://nodejs.org)
(LTS) once, just double-click:

- **macOS:** `serve.command` (first time only: if macOS blocks it, right-click →
  **Open** → **Open**).
- **Windows:** `serve.bat`.

Either one starts a tiny local server and opens
**http://localhost:4173/** in your browser. Keep the window open while you use it;
close it to stop. From a terminal you can also run `node serve.mjs` (optionally
`node serve.mjs <port>`).

Use this version when you want to **edit** the design (colors, scenarios,
components); use `standalone.html` when you just want it to run.

---

## What's in here

| File | Role |
|---|---|
| `standalone.html` | Self-contained, offline, double-click build. **Start here.** |
| `index.html` | Editable entry point; loads the modules below (must be served). |
| `serve.mjs` | Zero-dependency Node static server for `index.html`. |
| `serve.command` / `serve.bat` | Double-click launchers for macOS / Windows. |
| `scenarios.jsx` | The 50-scenario MARCH·PAWS casualty library + site/anatomy registry. |
| `sim.jsx` | Parameterized simulation engine — `setScenario(i)`, `vitalsAt(t)`. |
| `body3d.jsx` | GLB anatomical hologram (Three.js) with injury/intervention markers; falls back to a 2D SVG body map if WebGL or the model is unavailable. |
| `variant-a.jsx` | Variant A — TACMED-19 HUD. |
| `variant-b.jsx` | Variant B — AEGIS Predictive HUD. |
| `tweaks.jsx` | Auxiliary panel + protocol constants. |
| `tacaudio.js` | Procedural tactical ambience (WebAudio; no audio assets). |
| `body-model-data.js` | The 3D body model as an embedded data-URI (so the model loads without a server fetch). |
| `assets/body-model.glb` | The same 3D model as a standalone file (fallback load path). |

## Notes

- **3D model:** `body3d.jsx` loads the model from the embedded data-URI in
  `body-model-data.js` first, falling back to `assets/body-model.glb`. If WebGL or
  the model can't load, it degrades to a 2D SVG body map — no hard failure.
- **Audio** starts muted and only begins after you click the **AUDIO** button, per
  browser autoplay policy.
- **Editing the voice of the design** is data-driven: scenarios live in
  `scenarios.jsx`, the simulation response in `sim.jsx`, and each HUD's layout in
  its `variant-*.jsx`.

## Provenance

Exported from a **Claude Design** (claude.ai/design) HTML/CSS/JS prototype and
brought into this repository as a self-contained project. The `.jsx` files use
in-browser Babel (`type="text/babel"`) exactly as authored — no build step.
