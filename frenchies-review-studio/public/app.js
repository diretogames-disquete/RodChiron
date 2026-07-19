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
  quickSwitch: $("#quickSwitch"),
  keysBtn: $("#keysBtn"),
  activeLabel: $("#activeLabel"),
  pdot: $("#pdot"),
  keysOverlay: $("#keysOverlay"),
  keysClose: $("#keysClose"),
  keysDone: $("#keysDone"),
  provList: $("#provList"),
  activeHint: $("#activeHint"),
  reviewText: $("#reviewText"),
  stars: $("#stars"),
  clearStar: $("#clearStar"),
  optionCount: $("#optionCount"),
  runWith: $("#runWith"),
  runProvider: $("#runProvider"),
  runModel: $("#runModel"),
  runModels: $("#runModels"),
  usageBar: $("#usageBar"),
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
  approvalChip: $("#approvalChip"),
  fragileNote: $("#fragileNote"),
  leftOutPanel: $("#leftOutPanel"),
  leftOutList: $("#leftOutList"),
  flagsPanel: $("#flagsPanel"),
  flagsList: $("#flagsList"),
  placeholder: $("#placeholder"),
  loading: $("#loading"),
  errorBox: $("#errorBox"),
  toast: $("#toast"),
};

// v2.0 case library — FALLBACK client copy (names/families/approvals only).
// The live list comes from GET /api/config, which reads the editable
// brand/review-cases.json, so edits and added cases show up here without
// touching this file. This copy only covers a config fetch failing.
let CASES = [
  { name: "Wordless Star", family: "Positive", approval: "auto" },
  { name: "Short Positive", family: "Positive", approval: "auto" },
  { name: "Medium Positive", family: "Positive", approval: "auto" },
  { name: "Detailed Positive", family: "Positive", approval: "auto" },
  { name: "First-Visit Convert", family: "Positive", approval: "auto" },
  { name: "Membership Convert", family: "Positive", approval: "check" },
  { name: "Loyal Regular", family: "Positive", approval: "auto" },
  { name: "Event & Bridal", family: "Positive", approval: "auto" },
  { name: "Mixed Review", family: "Mixed & neutral", approval: "check" },
  { name: "Lukewarm Middle", family: "Mixed & neutral", approval: "check" },
  { name: "Silent Low Star", family: "Mixed & neutral", approval: "check" },
  { name: "Negative – Service", family: "Negative", approval: "owner" },
  { name: "Negative – Communication", family: "Negative", approval: "owner" },
  { name: "Negative – Pricing", family: "Negative", approval: "owner" },
  { name: "Negative – Policy Dispute", family: "Negative", approval: "owner" },
  { name: "Negative – Hostile", family: "Negative", approval: "owner" },
  { name: "Injury or Health Claim", family: "Negative", approval: "legal" },
  { name: "Legacy Unanswered", family: "Time-shifted", approval: "check" },
  { name: "Resolved or Updated", family: "Time-shifted", approval: "check" },
  { name: "Misdirected Review", family: "Edge & escalation", approval: "owner" },
  { name: "Suspicious or Fake", family: "Edge & escalation", approval: "owner" },
  { name: "Discrimination or Harassment Claim", family: "Edge & escalation", approval: "legal" },
];
let FAMILIES = ["Positive", "Mixed & neutral", "Negative", "Time-shifted", "Edge & escalation"];
let REVIEW_TYPES = CASES.map((c) => c.name);
function adoptCases(list) {
  if (!Array.isArray(list) || !list.length) return;
  CASES = list.filter((c) => c && typeof c.name === "string" && c.name.trim());
  FAMILIES = [];
  for (const c of CASES) if (!FAMILIES.includes(c.family)) FAMILIES.push(c.family);
  REVIEW_TYPES = CASES.map((c) => c.name);
}
const APPROVAL_META = {
  auto: { label: "Auto", desc: "Any trained team member can post after a read-through." },
  check: { label: "Check", desc: "One second pair of eyes — usually the salon lead — before posting." },
  owner: { label: "Owner", desc: "The owner reads and approves personally. No exceptions." },
  legal: { label: "Legal", desc: "Owner plus outside counsel or franchise support before a public word." },
};

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
const fmtN = (n) => (Number(n) || 0).toLocaleString();
function fmtUSD(n) {
  const v = Number(n) || 0;
  if (v === 0) return "$0";
  if (v < 0.01) return "$" + v.toFixed(5);
  if (v < 1) return "$" + v.toFixed(4);
  return "$" + v.toFixed(2);
}
function shortLabelById(id) {
  const p = (state.config?.providers || []).find((x) => x.id === id);
  return p ? shortLabel(p) : id || "";
}

// ---- init ----
async function init() {
  try {
    const cfg = await (await fetch("/api/config")).json();
    state.config = cfg;
    adoptCases(cfg.cases);
    if (cfg.salon?.name) {
      el.salonName.textContent = cfg.salon.name;
      el.salonSub.textContent = `Review Response Studio${cfg.salon.city ? " · " + cfg.salon.city : ""}`;
      document.title = `${cfg.salon.name} — Review Studio`;
    }
    applyProviderState(cfg);
    // model suggestion datalists
    for (const p of cfg.providers || []) {
      const dl = document.getElementById(`${p.id}Models`);
      if (dl && p.models) dl.innerHTML = p.models.map((m) => `<option value="${esc(m)}"></option>`).join("");
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
  // review cases dropdown, grouped by family
  for (const fam of FAMILIES) {
    const g = document.createElement("optgroup");
    g.label = fam;
    for (const c of CASES.filter((x) => x.family === fam)) {
      const o = document.createElement("option");
      o.value = c.name; o.textContent = c.name;
      g.appendChild(o);
    }
    el.typeSelect.appendChild(g);
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
    provider: el.runProvider.value || undefined,
    model: el.runModel.value.trim() || undefined,
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
  el.approvalChip.classList.add("hidden");
  el.fragileNote.classList.add("hidden");
  el.leftOutPanel.classList.add("hidden");
  el.usageBar.classList.add("hidden");
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
      if (data.needsSetup) openKeys();
      return;
    }
    state.lastResult = data.result;
    render(data.result, input);
    renderUsage(data.meta);
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

  // approval chip
  const lvl = APPROVAL_META[result.approval_level] ? result.approval_level : null;
  if (lvl) {
    el.approvalChip.className = `approval ${lvl}`;
    el.approvalChip.textContent = APPROVAL_META[lvl].label;
    el.approvalChip.title = APPROVAL_META[lvl].desc;
    el.approvalChip.classList.remove("hidden");
  }

  // human review banner
  if (result.needs_human_review) {
    const who = lvl === "legal" ? "owner + counsel sign-off" : lvl === "owner" ? "owner sign-off" : "a second pair of eyes";
    el.humanBanner.innerHTML =
      `<span>⚠</span><span><b>Needs ${who}</b>${
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

  // fragility warning — which passage not to trim, and which direction not to edit
  if (result.fragile_note) {
    el.fragileNote.innerHTML =
      `<span>⚑</span><span><b>Fragile wording</b> — ${esc(result.fragile_note)}</span>`;
    el.fragileNote.classList.remove("hidden");
  }

  // deliberately left out (and the risk each omission avoids)
  if (result.left_out && result.left_out.length) {
    el.leftOutList.innerHTML = result.left_out.map((x) => `<li>${esc(x)}</li>`).join("");
    el.leftOutPanel.classList.remove("hidden");
  }

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

// ---- providers & API keys ----
function shortLabel(p) { return (p?.label || "").replace(/\s*\(.*\)$/, "") || (p?.id ?? ""); }

function applyProviderState(cfg) {
  state.config = cfg;
  const providers = cfg.providers || [];
  const active = cfg.active;
  const activeP = providers.find((p) => p.id === active);
  if (cfg.anyConfigured && activeP && activeP.configured) {
    el.activeLabel.textContent = `${shortLabel(activeP)} · ${activeP.model}`;
    el.keysBtn.classList.remove("warn");
  } else {
    el.activeLabel.textContent = "Set up API keys";
    el.keysBtn.classList.add("warn");
  }
  const configured = providers.filter((p) => p.configured);
  if (configured.length >= 2) {
    el.quickSwitch.innerHTML = configured
      .map((p) => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${esc(shortLabel(p))} · ${esc(p.model)}</option>`)
      .join("");
    el.quickSwitch.classList.remove("hidden");
  } else {
    el.quickSwitch.classList.add("hidden");
  }
  syncRunPicker(cfg);
}

// "Run this with" per-request provider + model picker (defaults to active).
function syncRunPicker(cfg) {
  const configured = (cfg.providers || []).filter((p) => p.configured);
  if (!configured.length) {
    el.runWith.classList.add("hidden");
    return;
  }
  el.runWith.classList.remove("hidden");
  const prev = el.runProvider.value;
  el.runProvider.innerHTML = configured.map((p) => `<option value="${p.id}">${esc(shortLabel(p))}</option>`).join("");
  el.runProvider.value = configured.some((p) => p.id === prev) ? prev : cfg.active;
  updateRunModel(el.runProvider.value !== prev);
}
function updateRunModel(setDefault) {
  const p = (state.config?.providers || []).find((x) => x.id === el.runProvider.value);
  if (!p) return;
  el.runModels.innerHTML = (p.models || []).map((m) => `<option value="${esc(m)}"></option>`).join("");
  if (setDefault || !el.runModel.value.trim()) el.runModel.value = p.model || p.defaultModel || "";
}
function renderUsage(meta) {
  if (!meta) return el.usageBar.classList.add("hidden");
  let s = `Generated with <b>${esc(shortLabelById(meta.provider))}</b> · ${esc(meta.model || "")}`;
  if (meta.usage && (meta.usage.input || meta.usage.output)) {
    s += ` <span class="sep">·</span> ${fmtN(meta.usage.input)} in / ${fmtN(meta.usage.output)} out tokens`;
  }
  if (meta.cost && typeof meta.cost.total === "number") {
    s += ` <span class="sep">·</span> <span class="cost">~${fmtUSD(meta.cost.total)}</span> <span class="muted">est.</span>`;
  }
  el.usageBar.innerHTML = s;
  el.usageBar.classList.remove("hidden");
}

function renderProviderList() {
  const providers = state.config?.providers || [];
  const active = state.config?.active;
  el.provList.innerHTML = providers
    .map((p) => {
      const status = p.configured
        ? `configured — ${p.keySource === "env" ? "from .env" : "saved"} · ••••${esc(p.last4 || "")}`
        : p.hasKey
        ? "key set — add a model"
        : "not set";
      return `
      <div class="prow ${p.id === active ? "active" : ""}" data-prow="${p.id}">
        <div class="ptop">
          <label class="pradio">
            <input type="radio" name="activeProvider" value="${p.id}" ${p.id === active ? "checked" : ""} ${p.configured ? "" : "disabled"} />
            ${esc(shortLabel(p))}
          </label>
          <span class="pstatus ${p.configured ? "ok" : ""}">${status}</span>
          <a class="pdocs" href="${esc(p.docs)}" target="_blank" rel="noopener">get a key ↗</a>
        </div>
        <div class="pfields">
          ${p.needsBaseUrl ? `<div class="frow"><label>Base URL</label><input type="text" data-field="baseUrl" placeholder="${esc(p.baseUrlHint || "https://…/v1")}" value="${esc(p.baseUrl || "")}" /></div>` : ""}
          <div class="frow"><label>Model</label><input type="text" data-field="model" list="${p.id}Models" placeholder="${esc(p.defaultModel || "model id")}" value="${esc(p.model || "")}" /></div>
          <div class="frow">
            <label>API key</label>
            <input type="password" data-field="apiKey" autocomplete="off" placeholder="${p.hasKey ? "•••• saved — leave blank to keep" : esc(p.keyHint || "paste key")}" />
            <button class="btn save" data-save="${p.id}">Save</button>
            ${p.keySource === "saved" ? `<button class="btn remove" data-remove="${p.id}">Remove</button>` : ""}
          </div>
        </div>
      </div>`;
    })
    .join("");
  const ap = providers.find((p) => p.id === active);
  el.activeHint.textContent = ap ? `Active: ${shortLabel(ap)}` : "No active provider — add a key, then pick one.";

  el.provList.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => saveKey(b.dataset.save)));
  el.provList.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removeKey(b.dataset.remove)));
  el.provList.querySelectorAll('input[name="activeProvider"]').forEach((r) =>
    r.addEventListener("change", () => { if (r.checked) setActiveProvider(r.value); })
  );
}

async function refreshConfig() {
  try {
    applyProviderState(await (await fetch("/api/config")).json());
  } catch (e) { /* ignore */ }
}

async function saveKey(provider) {
  const row = el.provList.querySelector(`[data-prow="${provider}"]`);
  if (!row) return;
  const get = (f) => row.querySelector(`[data-field="${f}"]`);
  const body = { provider };
  const key = get("apiKey")?.value.trim();
  if (key) body.apiKey = key;
  body.model = get("model")?.value.trim() || "";
  if (get("baseUrl")) body.baseUrl = get("baseUrl").value.trim();
  try {
    const res = await fetch("/api/providers/key", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) return toast(data.error || "Could not save.");
    if (get("apiKey")) get("apiKey").value = ""; // never keep the key in the field
    await refreshConfig();
    renderProviderList();
    toast("Saved ✓");
  } catch (e) { toast("Could not save: " + e.message); }
}

async function removeKey(provider) {
  try {
    const res = await fetch("/api/providers/key", {
      method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return toast(data.error || "Could not remove.");
    await refreshConfig();
    renderProviderList();
    toast("Key removed.");
  } catch (e) { toast("Could not remove: " + e.message); }
}

async function setActiveProvider(provider) {
  try {
    const res = await fetch("/api/providers/active", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider }),
    });
    const data = await res.json();
    await refreshConfig();
    if (el.keysOverlay.classList.contains("show")) renderProviderList();
    if (!res.ok || data.error) return toast(data.error || "Could not switch.");
    toast("Now using " + shortLabel((state.config.providers || []).find((p) => p.id === provider) || { id: provider }));
  } catch (e) { toast("Could not switch: " + e.message); }
}

function openKeys() {
  renderProviderList();
  el.keysOverlay.classList.add("show");
  el.keysOverlay.setAttribute("aria-hidden", "false");
}
function closeKeys() {
  el.keysOverlay.classList.remove("show");
  el.keysOverlay.setAttribute("aria-hidden", "true");
}
el.keysBtn.addEventListener("click", openKeys);
el.keysClose.addEventListener("click", closeKeys);
el.keysDone.addEventListener("click", closeKeys);
el.keysOverlay.addEventListener("click", (e) => { if (e.target === el.keysOverlay) closeKeys(); });
el.quickSwitch.addEventListener("change", () => setActiveProvider(el.quickSwitch.value));
el.runProvider.addEventListener("change", () => updateRunModel(true));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && el.keysOverlay.classList.contains("show")) closeKeys(); });

el.generateBtn.addEventListener("click", generate);
el.regenBtn.addEventListener("click", generate);
el.reviewText.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
});

init();
