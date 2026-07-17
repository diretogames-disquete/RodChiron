// scenarios.jsx — 50-scenario MARCH PAWS library.
// Each scenario: casualty, mechanism, injuries (typed), scripted interventions
// with JTS-benchmarked timing, and a duration. Deterministic per-index jitter.

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// Site registry: x,y = 2D body map (0-100); a = fractional 3D anchor [x,y,z] in model bbox
const SITE_DEFS = {
  'head':      { x:50, y:8,  a:[0.50,0.94,0.55], name:'head' },
  'neck':      { x:50, y:15, a:[0.50,0.86,0.58], name:'neck' },
  'l-chest':   { x:44, y:32, a:[0.58,0.72,0.62], name:'L chest' },
  'r-chest':   { x:56, y:32, a:[0.42,0.72,0.62], name:'R chest' },
  'abdomen':   { x:50, y:45, a:[0.50,0.60,0.62], name:'abdomen' },
  'pelvis':    { x:50, y:53, a:[0.50,0.50,0.58], name:'pelvis' },
  'l-shoulder':{ x:37, y:25, a:[0.64,0.79,0.52], name:'L shoulder' },
  'r-shoulder':{ x:63, y:25, a:[0.36,0.79,0.52], name:'R shoulder' },
  'l-arm':     { x:29, y:42, a:[0.74,0.62,0.50], name:'L arm' },
  'r-arm':     { x:71, y:42, a:[0.26,0.62,0.50], name:'R arm' },
  'l-thigh':   { x:44, y:64, a:[0.57,0.34,0.54], name:'L thigh' },
  'r-thigh':   { x:56, y:64, a:[0.43,0.34,0.54], name:'R thigh' },
  'l-leg':     { x:42, y:82, a:[0.56,0.14,0.50], name:'L lower leg' },
  'r-leg':     { x:58, y:82, a:[0.44,0.14,0.50], name:'R lower leg' },
  'torso':     { x:50, y:38, a:[0.50,0.66,0.50], name:'torso' },
};

const SCN_TEMPLATES = [
  { mech:'GSW ×2 — L thigh, R chest', inj:[ {site:'l-thigh',type:'hem',sev:'critical',label:'GSW — L FEMORAL',rate:16}, {site:'r-chest',type:'pneumo',sev:'critical',label:'GSW — R CHEST'} ] },
  { mech:'IED blast — bilateral LE amputation', inj:[ {site:'l-leg',type:'hem',sev:'critical',label:'TRAUMATIC AMP — L BK',rate:22}, {site:'r-leg',type:'hem',sev:'critical',label:'TRAUMATIC AMP — R BK',rate:20}, {site:'torso',type:'burn',sev:'serious',label:'FLASH BURN — 9% TBSA'} ] },
  { mech:'Shrapnel — Zone II neck', inj:[ {site:'neck',type:'airway',sev:'critical',label:'SHRAPNEL — ZONE II NECK'}, {site:'head',type:'hem',sev:'serious',label:'FACIAL LACERATION',rate:5} ] },
  { mech:'GSW abdomen — junctional bleed', inj:[ {site:'abdomen',type:'hem',sev:'critical',label:'GSW — RUQ ABDOMEN',rate:14} ] },
  { mech:'Blast lung — bilateral', inj:[ {site:'r-chest',type:'pneumo',sev:'critical',label:'BLAST LUNG — BILAT'}, {site:'head',type:'tbi',sev:'serious',label:'TM RUPTURE / mTBI'} ] },
  { mech:'MVC rollover — femur fx + head strike', inj:[ {site:'r-thigh',type:'fx',sev:'serious',label:'CLOSED FEMUR FX — R'}, {site:'head',type:'tbi',sev:'serious',label:'CLOSED HEAD INJURY'} ] },
  { mech:'GSW — L axillary, arterial', inj:[ {site:'l-shoulder',type:'hem',sev:'critical',label:'GSW — L AXILLARY',rate:12} ] },
  { mech:'Vehicle fire — 28% TBSA burn', inj:[ {site:'torso',type:'burn',sev:'critical',label:'BURN — 28% TBSA'}, {site:'l-arm',type:'burn',sev:'serious',label:'CIRCUMFERENTIAL BURN — L ARM'} ] },
  { mech:'Fall from height — unstable pelvis', inj:[ {site:'pelvis',type:'hem',sev:'critical',label:'UNSTABLE PELVIS',rate:10}, {site:'r-arm',type:'fx',sev:'moderate',label:'R WRIST FX'} ] },
  { mech:'GSW ×3 — chest, abdomen, thigh', inj:[ {site:'l-chest',type:'pneumo',sev:'critical',label:'GSW — L CHEST'}, {site:'abdomen',type:'hem',sev:'critical',label:'GSW — LLQ',rate:12}, {site:'r-thigh',type:'hem',sev:'serious',label:'GSW — R THIGH',rate:8} ] },
  { mech:'Structure collapse — crush', inj:[ {site:'l-leg',type:'hem',sev:'serious',label:'CRUSH — L LOWER EXT',rate:7}, {site:'pelvis',type:'fx',sev:'serious',label:'PELVIC COMPRESSION FX'} ] },
  { mech:'Frag — R brachial + flank', inj:[ {site:'r-arm',type:'hem',sev:'serious',label:'FRAG — R BRACHIAL',rate:9}, {site:'abdomen',type:'hem',sev:'moderate',label:'FRAG — R FLANK',rate:4} ] },
  { mech:'GSW graze — head, TBI', inj:[ {site:'head',type:'tbi',sev:'critical',label:'GSW GRAZE — TBI'}, {site:'r-shoulder',type:'hem',sev:'moderate',label:'GSW — R TRAPEZIUS',rate:5} ] },
];

const SCN_NAMES = ['J. RIVERA','M. CHEN','D. OKAFOR','T. NAKAMURA','A. PETROV','S. JOHNSON','R. GARCIA','K. ADEYEMI','L. SANTOS','P. KOWALSKI','H. AL-RASHID','C. MBEKI','N. LINDGREN','B. THOMPSON','E. VASQUEZ','F. DUBOIS','G. ROSSI','I. TANAKA','O. ERIKSEN','Q. ZHANG','V. NOVAK','W. OYELARAN','Y. KIM','Z. HADDAD','U. FERREIRA'];
const SCN_RANKS = ['SGT','CPL','SPC','SSG','PFC','SFC','1LT'];
const SCN_UNITS = ['2/75 RGR','1/10 SFG','3/509 ABN','1/1 MARDIV','160th SOAR','82nd ABN','TF MED-9'];
const SCN_BLOOD = ['O POS','O NEG','A POS','B POS','AB POS','A NEG'];

function scnBuild(idx) {
  const rnd = mulberry32(idx * 7919 + 13);
  const j = (a, b) => Math.round(a + rnd() * (b - a));
  const tpl = SCN_TEMPLATES[idx % SCN_TEMPLATES.length];

  // Injuries: resolve site coords; append vascular-access point
  const injuries = tpl.inj.map((inj, k) => ({
    id: `${inj.site}-${k}`, site: inj.site, type: inj.type, severity: inj.sev,
    label: inj.label, rate: inj.rate || 0,
    x: SITE_DEFS[inj.site].x, y: SITE_DEFS[inj.site].y, a: SITE_DEFS[inj.site].a,
  }));
  const accessSite = injuries.some(i => i.site === 'l-shoulder') ? 'r-shoulder' : 'l-shoulder';
  injuries.push({ id: 'access', site: accessSite, type: 'access', severity: 'iv', label: 'IO / IV ACCESS',
    x: SITE_DEFS[accessSite].x, y: SITE_DEFS[accessSite].y, a: SITE_DEFS[accessSite].a, rate: 0 });

  const s = [];
  const hems = injuries.filter(i => i.type === 'hem');
  const pneumos = injuries.filter(i => i.type === 'pneumo');
  const hasAirway = injuries.some(i => i.type === 'airway');
  const hasTBI = injuries.some(i => i.type === 'tbi');
  const hasBurn = injuries.some(i => i.type === 'burn');
  const fxs = injuries.filter(i => i.type === 'fx');
  const heavyBleed = hems.reduce((sum, i) => sum + i.rate, 0) >= 10;

  // M — hemorrhage control
  hems.forEach((inj, k) => {
    const limb = /thigh|leg|arm|shoulder/.test(inj.site);
    const junctional = /pelvis|abdomen|neck|head/.test(inj.site);
    s.push({ t: j(14 + k * 12, 32 + k * 16), step: 'M', site: inj.site, effect: 'hemostasis',
      action: limb ? `CAT TQ — ${SITE_DEFS[inj.site].name}, high & tight`
            : junctional ? `Wound pack + XSTAT — ${SITE_DEFS[inj.site].name}` : `Pressure dressing — ${SITE_DEFS[inj.site].name}` });
    if (inj.site === 'pelvis') s.push({ t: j(40, 70), step: 'M', site: 'pelvis', effect: 'binder', action: 'Pelvic binder applied' });
  });
  // A — airway
  if (hasAirway) s.push({ t: j(48, 85), step: 'A', site: 'neck', effect: 'airway', action: 'Surgical cric — 6.0 cuffed' });
  else s.push({ t: j(42, 78), step: 'A', site: 'head', effect: 'airway', action: hasTBI ? 'NPA 28Fr + C-spine hold' : 'NPA 28Fr + recovery position' });
  // R — respiration
  pneumos.forEach((inj, k) => {
    s.push({ t: j(62 + k * 10, 100 + k * 12), step: 'R', site: inj.site, effect: 'seal', action: `Chest seal — ${SITE_DEFS[inj.site].name}` });
    s.push({ t: j(88 + k * 12, 135 + k * 14), step: 'R', site: inj.site, effect: 'needle', action: `Needle-D — ${SITE_DEFS[inj.site].name} 2nd ICS` });
  });
  if (!pneumos.length && hasBurn) s.push({ t: j(70, 110), step: 'R', site: 'torso', effect: 'o2', action: 'O₂ 15L NRB — inhalation watch' });
  // C — circulation
  s.push({ t: j(105, 155), step: 'C', site: accessSite, effect: 'io', action: `IO access — ${SITE_DEFS[accessSite].name} humeral` });
  if (heavyBleed || hasBurn) s.push({ t: j(125, 185), step: 'C', site: accessSite, effect: 'txa', action: 'TXA 2g slow push' });
  if (heavyBleed) s.push({ t: j(145, 225), step: 'C', site: accessSite, effect: 'blood', action: 'Whole blood 1U — LTOWB' });
  if (hasBurn) s.push({ t: j(150, 210), step: 'C', site: accessSite, effect: 'fluids', action: 'LR per Rule of 10s' });
  // H — hypothermia / head
  s.push({ t: j(170, 245), step: 'H', site: 'torso', effect: 'hpmk', action: 'HPMK applied' });
  if (hasTBI) s.push({ t: j(185, 260), step: 'H', site: 'head', effect: 'neuro', action: 'GCS + pupils q5min, head-up 30°' });
  // P — pain
  s.push({ t: j(200, 290), step: 'P', site: accessSite, effect: 'pain', action: hasTBI ? 'Fentanyl 50mcg IV — titrate' : 'Ketamine 50mg IM' });
  // A2 — antibiotics
  s.push({ t: j(230, 330), step: 'A2', site: accessSite, effect: 'abx', action: 'Ertapenem 1g IV/IO' });
  // W — wounds
  s.push({ t: j(260, 370), step: 'W', site: injuries[0].site, effect: 'dress', action: hasBurn ? 'Dry sterile dressings — burns' : 'Dress + document all wounds' });
  // S — splinting
  if (fxs.length) fxs.forEach(inj => s.push({ t: j(290, 420), step: 'S', site: inj.site, effect: 'splint', action: `${/thigh/.test(inj.site) ? 'Traction splint' : 'SAM splint'} — ${SITE_DEFS[inj.site].name}` }));
  else if (hems.some(h => /leg|thigh/.test(h.site))) s.push({ t: j(300, 400), step: 'S', site: hems[0].site, effect: 'splint', action: 'Rigid splint — suspected fx' });

  s.sort((a, b) => a.t - b.t);
  const duration = s[s.length - 1].t + j(50, 90);

  const rank = SCN_RANKS[j(0, SCN_RANKS.length - 1)];
  const name = SCN_NAMES[idx % SCN_NAMES.length];
  return {
    id: idx,
    label: `${String(idx + 1).padStart(2, '0')} · ${tpl.mech}`,
    mech: tpl.mech,
    duration,
    injuries,
    script: s,
    casualty: {
      callsign: `R-${(idx % 9) + 1}`, name: `${rank} ${name}`,
      unit: SCN_UNITS[idx % SCN_UNITS.length], bloodType: SCN_BLOOD[idx % SCN_BLOOD.length],
      allergies: idx % 7 === 3 ? 'PCN' : 'NKDA', mechanism: tpl.mech, weightKg: j(64, 102),
    },
    flags: { pneumo: pneumos.length > 0, airway: hasAirway, tbi: hasTBI, burn: hasBurn, heavyBleed },
  };
}

const SCENARIOS = Array.from({ length: 50 }, (_, i) => scnBuild(i));

Object.assign(window, { SCENARIOS, SITE_DEFS });
