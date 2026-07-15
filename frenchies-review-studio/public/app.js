"use strict";
// Frenchies Review Studio — front end. In-memory session state only (no browser
// storage). The API key never touches the browser; everything model-related goes
// through the server.

const $ = (s) => document.querySelector(s);
const state = {
  config: null,
  rating: null,
  lastResult: null, // the parsed model result currently displayed
  fixtures: [],
  types: [],
};

const el = {
  salonName: $("#salonName"),
  salonSub: $("#salonSub"),
  modelChip: $("#modelChip"),
  reviewText: $("#reviewText"),
  stars: $("#stars"),
  clearStar: $("#clearStar"),
  optionCount: $("#optionCount"),
  techSelect: $("#techSelect"),
  techFree: $("#techFree"),
  platformSelect: $("#platformSelect"),
  contextNote: $("#contextNote"),
  generateBtn: $("#generateBtn"),
  exampleSelect: $("#exampleSelect"),
  resultsHead: $("#resultsHead"),
  typeSelect: $("#typeSelect"),
  techDetected: $("#techDetected"),
  regenBtn: $("#regenBtn"),
  humanBanner: $("#humanBanner"),
  rosterNote: $("#rosterNote"),
  cards: $("#cards"),
  flagsPanel: $("#flagsPanel"),
  flagsList: $("#flagsList"),
  placeholder: $("#placeholder"),
  loading: $("#loading"),
  errorBox: $("#errorBox"),
  toast: $("#toast"),
};

const REVIEW_TYPES = [
  "Wordless Star", "Short Positive", "Medium Positive", "Detailed Positive",
  "Mixed", "Negative – Service", "Negative – Communication", "Negative – Pricing",
  "Negative – Hostile", "Legacy Unanswered", "Resolved/Updated",
];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  clearTimeout(el.toast._t);
  el.toast._t = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

// ---- init ----
async function init() {
  try {
    const cfg = await (await fetch("/api/config")).json();
    state.config = cfg;
    if (cfg.salon?.name) {
      el.salonName.textContent = cfg.salon.name;
      el.salonSub.textContent = `Review Response Studio${cfg.salon.city ? " · " + cfg.salon.city : ""}`;
      document.title = `${cfg.salon.name} — Review Studio`;
    }
    el.modelChip.textContent = cfg.model || "";
    if (cfg.apiKeyPresent === false) {
      el.modelChip.textContent = "⚠ no API key — see README";
      el.modelChip.classList.add("warn");
    }
    // technicians
    for (const name of cfg.technicians || []) {
      const o = document.createElement("option");
      o.value = name; o.textContent = name;
      el.techSelect.appendChild(o);
    }
    // platforms
    for (const p of cfg.platforms || []) {
      const o = document.createElement("option");
      o.value = p; o.textContent = p;
      el.platformSelect.appendChild(o);
    }
  } catch (e) {
    console.error(e);
  }
  // review types dropdown
  for (const t of REVIEW_TYPES) {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    el.typeSelect.appendChild(o);
  }
  // fixtures
  try {
    state.fixtures = await (await fetch("/api/fixtures")).json();
    state.fixtures.forEach((f, i) => {
      const o = document.createElement("option");
      o.value = String(i); o.textContent = f.label || `Example ${i + 1}`;
      el.exampleSelect.appendChild(o);
    });
  } catch (e) { /* ignore */ }
}

// ---- stars ----
function paintStars() {
  el.stars.querySelectorAll("button[data-star]").forEach((b) => {
    b.classList.toggle("on", state.rating != null && Number(b.dataset.star) <= state.rating);
  });
}
el.stars.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-star]");
  if (!b) return;
  state.rating = Number(b.dataset.star);
  paintStars();
});
el.clearStar.addEventListener("click", () => { state.rating = null; paintStars(); });

// ---- examples ----
el.exampleSelect.addEventListener("change", () => {
  const i = el.exampleSelect.value;
  if (i === "") return;
  const f = state.fixtures[Number(i)];
  if (!f) return;
  el.reviewText.value = f.review || "";
  state.rating = f.rating ?? null;
  paintStars();
  el.techFree.value = f.technician || "";
  el.techSelect.value = (state.config?.technicians || []).includes(f.technician) ? f.technician : "";
  el.platformSelect.value = f.platform || "";
  el.contextNote.value = f.context || "";
});

// keep the two technician inputs coordinated
el.techSelect.addEventListener("change", () => { if (el.techSelect.value) el.techFree.value = ""; });

function collectInput() {
  const tech = el.techFree.value.trim() || el.techSelect.value || "";
  return {
    review: el.reviewText.value,
    rating: state.rating,
    technician: tech,
    platform: el.platformSelect.value,
    context: el.contextNote.value.trim(),
    count: Number(el.optionCount.value) || 3,
  };
}

// ---- generate ----
async function generate() {
  const input = collectInput();
  if (!input.review.trim() && input.rating == null) {
    toast("Add a review and/or a star rating first.");
    return;
  }
  el.placeholder.classList.add("hidden");
  el.errorBox.classList.add("hidden");
  el.resultsHead.classList.add("hidden");
  el.cards.innerHTML = "";
  el.flagsPanel.classList.add("hidden");
  el.humanBanner.classList.add("hidden");
  el.rosterNote.classList.add("hidden");
  el.loading.classList.remove("hidden");
  el.generateBtn.disabled = true;
  el.regenBtn.disabled = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      showError(data.error || `Request failed (${res.status}).`);
      return;
    }
    state.lastResult = data.result;
    render(data.result, input);
  } catch (e) {
    showError(`Something went wrong: ${e.message}`);
  } finally {
    el.loading.classList.add("hidden");
    el.generateBtn.disabled = false;
    el.regenBtn.disabled = false;
  }
}

function showError(msg) {
  el.errorBox.innerHTML =
    `${esc(msg)}<br><button class="ghost" id="retryBtn">↻ Try again</button>`;
  el.errorBox.classList.remove("hidden");
  $("#retryBtn")?.addEventListener("click", generate);
}

// ---- render ----
function render(result, input) {
  // head
  el.resultsHead.classList.remove("hidden");
  el.typeSelect.value = REVIEW_TYPES.includes(result.detected_type) ? result.detected_type : "";
  if (!REVIEW_TYPES.includes(result.detected_type) && result.detected_type) {
    // add ad-hoc type so it shows
    const o = document.createElement("option");
    o.value = result.detected_type; o.textContent = result.detected_type;
    el.typeSelect.appendChild(o);
    el.typeSelect.value = result.detected_type;
  }
  el.techDetected.innerHTML = result.technician
    ? `Technician: <b>${esc(result.technician)}</b>`
    : `<span class="muted">No technician named</span>`;

  // human review banner
  if (result.needs_human_review) {
    el.humanBanner.innerHTML =
      `<span>⚠</span><span><b>Needs owner / legal sign-off</b>${
        result.sensitivity_reason ? " — " + esc(result.sensitivity_reason) : ""
      }<br>These are drafts only. Read carefully and edit before anything is posted.</span>`;
    el.humanBanner.classList.remove("hidden");
  }

  // roster note
  if (result.roster_note) {
    el.rosterNote.textContent = "👤 " + result.roster_note;
    el.rosterNote.classList.remove("hidden");
  }

  // cards
  el.cards.innerHTML = "";
  result.options.forEach((op, idx) => {
    const card = document.createElement("div");
    card.className = "card" + (result.needs_human_review ? " flagged" : "");
    card.innerHTML = `
      <div class="chead">
        <span class="angle">${esc(op.angle)}</span>
        ${result.needs_human_review ? '<span class="badge">draft — needs review</span>' : ""}
      </div>
      <div class="cbody">
        <textarea class="response" rows="3" aria-label="Response option ${idx + 1}"></textarea>
        <div class="why"><span class="k">Why this angle:</span><span>${esc(op.rationale)}</span></div>
      </div>
      <div class="cfoot">
        <span class="count"></span>
        <button class="btn copy">Copy</button>
        <button class="btn save">Save as exemplar</button>
      </div>`;
    const ta = card.querySelector(".response");
    const count = card.querySelector(".count");
    ta.value = op.response;
    const updateCount = () => { count.textContent = `${ta.value.length} chars`; };
    updateCount();
    ta.addEventListener("input", updateCount);
    // auto-size
    const autosize = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
    setTimeout(autosize, 0);
    ta.addEventListener("input", autosize);

    card.querySelector(".copy").addEventListener("click", (e) => {
      navigator.clipboard.writeText(ta.value).then(() => {
        const b = e.target; b.textContent = "Copied ✓"; b.classList.add("done");
        setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1400);
      }, () => toast("Copy failed — select and copy manually."));
    });
    card.querySelector(".save").addEventListener("click", () =>
      saveExemplar(input, ta.value, el.typeSelect.value));
    el.cards.appendChild(card);
  });

  // flags
  if (result.operational_flags && result.operational_flags.length) {
    el.flagsList.innerHTML = result.operational_flags.map((f) => `
      <div class="flag">
        <span class="sev ${esc(f.severity)}">${esc(f.severity)}</span>
        <div><span class="fissue">${esc(f.issue)}</span> — <span class="fnote">${esc(f.note)}</span></div>
      </div>`).join("");
    el.flagsPanel.classList.remove("hidden");
  } else {
    el.flagsPanel.classList.add("hidden");
  }
}

async function saveExemplar(input, responseText, type) {
  if (!responseText.trim()) { toast("Nothing to save."); return; }
  try {
    const res = await fetch("/api/save-exemplar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        review: input.review,
        rating: input.rating,
        response: responseText,
        type,
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) toast("Saved to the voice library ✓");
    else toast(data.error || "Could not save.");
  } catch (e) {
    toast("Could not save: " + e.message);
  }
}

el.generateBtn.addEventListener("click", generate);
el.regenBtn.addEventListener("click", generate);
el.reviewText.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
});

init();
