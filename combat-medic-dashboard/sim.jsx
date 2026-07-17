// sim.jsx — parameterized simulation engine driven by the active scenario.
// setScenario(i) swaps the whole state (casualty, injuries, script, duration);
// vitalsAt(t) responds to that scenario's injuries + intervention times.

const MARCH_PAWS = [
  { key: 'M',  label: 'Massive Hemorrhage', benchmark: 60,  plain: 'Tourniquet / pressure' },
  { key: 'A',  label: 'Airway',             benchmark: 120, plain: 'NPA / cric if needed' },
  { key: 'R',  label: 'Respiration',        benchmark: 180, plain: 'Seal chest / needle-D' },
  { key: 'C',  label: 'Circulation',        benchmark: 300, plain: 'IV/IO, TXA, blood' },
  { key: 'H',  label: 'Hypothermia / Head', benchmark: 420, plain: 'HPMK, GCS, pupils' },
  { key: 'P',  label: 'Pain',               benchmark: 600, plain: 'Ketamine / OTFC' },
  { key: 'A2', label: 'Antibiotics',        benchmark: 720, plain: 'Ertapenem 1g IV' },
  { key: 'W',  label: 'Wounds',             benchmark: 840, plain: 'Dress & document' },
  { key: 'S',  label: 'Splinting',          benchmark: 960, plain: 'SAM / traction' },
];

let CUR = null;

function setScenario(i) {
  CUR = SCENARIOS[Math.max(0, Math.min(SCENARIOS.length - 1, i))];
  window.CASUALTY = CUR.casualty;
  window.INJURIES = CUR.injuries;
  window.SIM_DURATION = CUR.duration;
  window.INTERVENTION_SCRIPT = CUR.script;
  window.CURRENT_SCENARIO = CUR;
}

const simClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fxTime(effect) { const e = CUR.script.find(s => s.effect === effect); return e ? e.t : Infinity; }
function hemostasisTime(site) { const e = CUR.script.find(s => s.effect === 'hemostasis' && s.site === site); return e ? e.t : Infinity; }

function vitalsAt(t) {
  const S = CUR;
  // EBL — integrate each bleed until its control time, then slow ooze
  let ebl = 0;
  S.injuries.forEach(inj => {
    if (inj.type !== 'hem') return;
    const stop = Math.min(hemostasisTime(inj.site), t);
    ebl += inj.rate * Math.max(0, Math.min(t, stop));
    if (t > stop) ebl += (t - stop) * 1.2;
  });
  if (S.flags.burn) ebl += Math.min(t, 300) * 0.8; // plasma loss proxy

  const tBlood = fxTime('blood'), tNeedle = fxTime('needle'), tSeal = fxTime('seal'),
        tAirway = fxTime('airway'), tHPMK = fxTime('hpmk'), tTQ = Math.min(...S.injuries.filter(i=>i.type==='hem').map(i=>hemostasisTime(i.site)), Infinity);

  let sbp = 122 - ebl * 0.042;
  if (t > tBlood) sbp += (t - tBlood) * 0.42;
  sbp = simClamp(sbp, 62, 122) + Math.sin(t * 0.6) * 1.6;

  let hr = 86 + (122 - sbp) * 1.9;
  if (t > tBlood) hr -= (t - tBlood) * 0.12;
  hr = simClamp(hr, 62, 168) + Math.sin(t * 0.8) * 2;

  let spo2 = 97;
  if (S.flags.pneumo) {
    const onset = 35;
    if (t > onset) spo2 -= Math.min((Math.min(t, tNeedle) - onset) * 0.28, 22);
    if (t > tSeal && t < tNeedle) spo2 += 2;
    if (t > tNeedle) spo2 += (t - tNeedle) * 0.3;
  }
  if (S.flags.airway) {
    if (t > 20) spo2 -= Math.min((Math.min(t, tAirway) - 20) * 0.35, 24);
    if (t > tAirway) spo2 += (t - tAirway) * 0.4;
  }
  if (S.flags.burn && !S.flags.pneumo) spo2 -= Math.min(t * 0.02, 4);
  spo2 = simClamp(spo2 + Math.sin(t * 1.2) * 0.4, 68, 99);

  const rr = simClamp(15 + (97 - spo2) * 0.9 + (122 - sbp) * 0.12, 12, 38);
  const etco2 = simClamp(38 - (122 - sbp) * 0.18 + (t > tBlood ? (t - tBlood) * 0.04 : 0), 22, 44);

  let temp = 36.8 - t * 0.0045;
  if (t > tHPMK) temp = Math.max(temp, 36.8 - tHPMK * 0.0045 - (t - tHPMK) * 0.0008);
  if (S.flags.burn) temp -= 0.15;

  let gcs = 15;
  if (S.flags.tbi) gcs = t > 60 ? 12 : 13;
  if (sbp < 85) gcs = Math.min(gcs, 13);
  if (sbp < 72) gcs = Math.min(gcs, 11);

  const si = hr / sbp;
  let pi = 2.4 - (122 - sbp) * 0.032;
  if (t > tBlood) pi += (t - tBlood) * 0.006;

  return {
    hr: Math.round(hr), sbp: Math.round(sbp), dbp: Math.round(sbp * 0.62 + 4),
    spo2: Math.round(spo2), rr: Math.round(rr), etco2: Math.round(etco2),
    temp: +temp.toFixed(1), gcs, si: +si.toFixed(2),
    pi: +simClamp(pi, 0.3, 5).toFixed(1), ebl: Math.round(ebl),
  };
}

function vitalsHistory(upTo, step) {
  const st = step || Math.max(2, Math.round(CUR.duration / 70));
  const out = [];
  for (let t = 0; t <= upTo; t += st) out.push({ t, ...vitalsAt(t) });
  return out;
}

function activeStepAt(t) {
  const done = CUR.script.filter(i => i.t <= t);
  if (!done.length) return 'M';
  const doneSteps = new Set(done.map(d => d.step));
  // next queued step in canonical order not yet complete; else last done
  for (const s of MARCH_PAWS) {
    const stepEntries = CUR.script.filter(e => e.step === s.key);
    if (stepEntries.length && stepEntries.some(e => e.t > t)) return s.key;
  }
  return done[done.length - 1].step;
}

function interventionsUpTo(t) { return CUR.script.filter(i => i.t <= t); }

function performanceAt(t) {
  const done = interventionsUpTo(t);
  const firsts = {};
  for (const i of done) if (!firsts[i.step]) firsts[i.step] = i.t;
  const benchmarks = Object.fromEntries(MARCH_PAWS.map(s => [s.key, s.benchmark]));
  let total = 0, counted = 0;
  const scored = [];
  for (const step of MARCH_PAWS) {
    if (firsts[step.key] == null) continue;
    counted++;
    const ratio = firsts[step.key] / step.benchmark;
    const score = Math.max(0, Math.min(100, 150 - ratio * 100));
    scored.push({ key: step.key, t: firsts[step.key], bench: step.benchmark, score });
    total += score;
  }
  const adherence = counted ? Math.round(total / counted) : 100;
  const order = Object.keys(firsts);
  const canonical = MARCH_PAWS.map(s => s.key);
  let orderOK = 0;
  for (let i = 1; i < order.length; i++) if (canonical.indexOf(order[i]) >= canonical.indexOf(order[i-1])) orderOK++;
  const orderScore = order.length > 1 ? Math.round((orderOK / (order.length - 1)) * 100) : 100;
  return { adherence, orderScore, firsts, scored, benchmarks, interventions: done.length };
}

Object.assign(window, {
  MARCH_PAWS, setScenario, vitalsAt, vitalsHistory, activeStepAt, interventionsUpTo, performanceAt,
});
setScenario(0);
