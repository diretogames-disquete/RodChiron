// variant-b.jsx — AEGIS Predictive: Speculative near-future holographic HUD.
// Aesthetic: translucent glass, cyan/indigo primary, AI-augmented with
// predictive vitals projections, confidence halos, and "what-if" overlays.

const B_COLORS = {
  bg: '#050a14',
  bgGlow: 'radial-gradient(ellipse at 50% 0%, rgba(110,198,217,0.12), transparent 60%)',
  panel: 'rgba(110, 180, 217, 0.04)',
  panelHi: 'rgba(110, 180, 217, 0.08)',
  border: 'rgba(150, 220, 255, 0.14)',
  borderHi: 'rgba(150, 220, 255, 0.35)',
  ink: '#e4f1fb',
  dim: '#7f98b3',
  mute: '#4a5e7a',
  cyan: '#6ec6d9',
  cyanBright: '#8df0ff',
  indigo: '#9a7fd8',
  amber: '#f2b34a',
  red: '#ff5a6e',
  green: '#6df0a3',
  rose: '#ff9ab6',
};

// ─── Top bezel ──────────────────────────────────────────────────────────
function BTopBezel({ t, phase }) {
  const mm = Math.floor(t / 60).toString().padStart(2, '0');
  const ss = Math.floor(t % 60).toString().padStart(2, '0');
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 18px', borderBottom: `1px solid ${B_COLORS.border}`,
      background: 'linear-gradient(180deg, rgba(110,180,217,0.06), transparent)',
    }}>
      <div style={{ display: 'flex', gap: 22, alignItems: 'center', fontSize: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: B_COLORS.cyanBright, boxShadow: `0 0 8px ${B_COLORS.cyanBright}` }}/>
          <span style={{ color: B_COLORS.cyanBright, fontWeight: 700, letterSpacing: 2.2 }}>AEGIS / MED-OS 4.2</span>
        </div>
        <span style={{ color: B_COLORS.dim, letterSpacing: 1.4 }}>NEURAL LINK · ACTIVE</span>
        <span style={{ color: B_COLORS.green, letterSpacing: 1.4 }}>ROLE 2 UPLINK · 186 ms</span>
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 10 }}>
        <span style={{ color: B_COLORS.amber, fontWeight: 700, letterSpacing: 2 }}>PHASE · {phase}</span>
        <span style={{ color: B_COLORS.ink, letterSpacing: 1.4, fontVariantNumeric: 'tabular-nums' }}>CONTACT T+{mm}:{ss}</span>
      </div>
    </div>
  );
}

// ─── Casualty header with AI-predicted survival probability ─────────────
function BCasualtyHeader({ vitals, t, interventions }) {
  // Naive survival model: baseline 95%, penalized by severity + time,
  // rescued by TQ/blood/seal. Converges on favorable as interventions stack.
  const deficit = Math.max(0, 110 - vitals.sbp) * 0.4 + Math.max(0, 95 - vitals.spo2) * 1.2;
  const rescue = interventions.length * 3;
  const surv = Math.max(32, Math.min(96, 95 - deficit + rescue));

  return (
    <div style={{
      padding: '14px 18px', borderBottom: `1px solid ${B_COLORS.border}`,
      display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 24, alignItems: 'center',
      background: B_COLORS.panel,
    }}>
      <div>
        <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 2.2, marginBottom: 3 }}>CASUALTY / {CASUALTY.callsign}</div>
        <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: 1.2, color: B_COLORS.ink }}>
          {CASUALTY.name}
        </div>
        <div style={{ fontSize: 10, color: B_COLORS.dim, marginTop: 4, letterSpacing: 0.8 }}>
          {CASUALTY.unit}  ·  {CASUALTY.bloodType}  ·  {CASUALTY.weightKg}kg  ·  {CASUALTY.mechanism}
        </div>
      </div>

      {/* Survival prediction ring */}
      <div style={{ width: 86, height: 86, position: 'relative' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(110,198,217,0.15)" strokeWidth="3"/>
          <circle cx="50" cy="50" r="42" fill="none"
            stroke={surv > 75 ? B_COLORS.green : surv > 50 ? B_COLORS.amber : B_COLORS.red}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(surv/100)*264} 264`}
            style={{ filter: `drop-shadow(0 0 4px currentColor)`, transition: 'stroke-dasharray 0.5s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 300, color: B_COLORS.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{Math.round(surv)}<span style={{ fontSize: 11, color: B_COLORS.dim }}>%</span></div>
          <div style={{ fontSize: 7, color: B_COLORS.dim, letterSpacing: 1.8, marginTop: 2 }}>P(SURVIVE)</div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: B_COLORS.dim, letterSpacing: 1.8, marginBottom: 4 }}>AI TRIAGE</div>
        <div style={{
          display: 'inline-block', padding: '5px 14px',
          border: `1px solid ${vitals.sbp < 90 ? B_COLORS.red : B_COLORS.amber}`,
          color: vitals.sbp < 90 ? B_COLORS.red : B_COLORS.amber,
          background: vitals.sbp < 90 ? 'rgba(255,90,110,0.08)' : 'rgba(242,179,74,0.06)',
          fontWeight: 500, letterSpacing: 3, fontSize: 11,
          boxShadow: `0 0 16px ${vitals.sbp < 90 ? 'rgba(255,90,110,0.3)' : 'rgba(242,179,74,0.2)'}`,
        }}>{vitals.sbp < 90 ? 'URGENT-SURGICAL' : 'PRIORITY'}</div>
        <div style={{ fontSize: 9, color: B_COLORS.dim, marginTop: 6, letterSpacing: 1.4 }}>EVAC ETA · 14 min</div>
      </div>
    </div>
  );
}

// ─── Large trend card with projected (dashed) future ────────────────────
function BTrendCard({ label, unit, value, history, keyName, color, range, warn, projected }) {
  if (!history || !history.length) history = [{ [keyName]: value }];
  const allVals = [...history.map(h => h[keyName]), ...(projected || [])];
  const min = Math.min(...allVals) * 0.92;
  const max = Math.max(...allVals) * 1.08;
  const range_ = Math.max(1, max - min);
  const span = (history.length - 1 + (projected?.length || 0)) || 1; // avoid 0/0 on a single-point history
  const hist = history.map((h, i) => ({ x: (i / span) * 100, y: 40 - ((h[keyName] - min) / range_) * 40 }));
  const proj = (projected || []).map((v, i) => ({ x: ((history.length - 1 + i + 1) / span) * 100, y: 40 - ((v - min) / range_) * 40 }));
  const histPath = hist.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const projPath = proj.length ? `M${hist[hist.length-1].x},${hist[hist.length-1].y} ` + proj.map(p => `L${p.x},${p.y}`).join(' ') : '';

  return (
    <div style={{
      padding: '10px 12px',
      background: warn ? 'linear-gradient(180deg, rgba(255,90,110,0.08), rgba(255,90,110,0.02))' : B_COLORS.panel,
      border: `1px solid ${warn ? B_COLORS.red : B_COLORS.border}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: B_COLORS.dim, letterSpacing: 1.8 }}>{label}</span>
        <span style={{ fontSize: 8, color: B_COLORS.mute, letterSpacing: 1 }}>{range}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={{ fontSize: 24, fontWeight: 200, color: warn ? B_COLORS.red : color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: -0.8 }}>{value}</span>
        <span style={{ fontSize: 9, color: B_COLORS.dim }}>{unit}</span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: 36, marginTop: 4, display: 'block' }}>
        <path d={histPath} fill="none" stroke={color} strokeWidth="1.2" opacity="0.95"/>
        {projPath && (
          <path d={projPath} fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.5"/>
        )}
      </svg>
    </div>
  );
}

// ─── Holographic body map — volumetric overlay ──────────────────────────
function BBodyMap({ interventions }) {
  // Wireframe body: we procedurally generate a horizontal "latitude" mesh
  // on top of the body silhouette + vertical "longitude" seams.
  // Scale: viewBox 200x340 for more grid resolution.
  const W = 200, H = 340;
  // Body outline segments — left half, mirrored to right.
  // y values are absolute in the viewBox.
  const profile = [
    // [y, halfWidth] — traced from the silhouette
    [20, 0], [28, 14], [40, 16], [50, 13], // head
    [56, 10], [60, 18], [66, 30], [72, 38], // shoulders
    [82, 36], [96, 34], [110, 32], [124, 32], // torso
    [140, 30], [156, 28], [170, 24], // waist
    [182, 22], [196, 22], // hips
    // split legs
  ];
  // Build outline points (left then right)
  const leftPts = profile.map(([y, w]) => [W/2 - w, y]);
  const rightPts = [...profile].reverse().map(([y, w]) => [W/2 + w, y]);
  // Leg outline (one leg, symmetric)
  const legL = [
    [W/2 - 22, 196],[W/2 - 20, 220],[W/2 - 18, 250],[W/2 - 16, 280],[W/2 - 16, 310],[W/2 - 12, 324],
  ];
  const legLInner = [
    [W/2 - 4, 324],[W/2 - 3, 300],[W/2 - 2, 260],[W/2 - 2, 220],[W/2 - 2, 198],
  ];
  const legR = legL.map(([x,y]) => [W - x, y]);
  const legRInner = legLInner.map(([x,y]) => [W - x, y]);

  const toPath = (pts) => pts.map((p,i) => `${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const bodyOutline = toPath([...leftPts, ...rightPts]) + ' Z';
  const legLPath = toPath([...legL, ...legLInner]) + ' Z';
  const legRPath = toPath([...legR, ...legRInner]) + ' Z';

  // Latitude rings — horizontal curves at regular y intervals
  const rings = [];
  for (let y = 28; y <= 196; y += 9) {
    // interpolate half-width from profile
    let hw = 0;
    for (let i = 0; i < profile.length - 1; i++) {
      const [y0, w0] = profile[i], [y1, w1] = profile[i+1];
      if (y >= y0 && y <= y1) { const k = (y - y0)/(y1 - y0 || 1); hw = w0 + (w1 - w0)*k; break; }
    }
    if (hw > 2) {
      const curveY = y + (hw > 20 ? 2 : 1);
      rings.push(`M${W/2-hw},${y} Q${W/2},${curveY} ${W/2+hw},${y}`);
      rings.push(`M${W/2-hw},${y} Q${W/2},${y-2} ${W/2+hw},${y}`);
    }
  }
  // Leg rings
  for (let y = 198; y <= 320; y += 9) {
    const k = (y - 198) / 122;
    const outer = 22 - k * 10;
    const inner = 4 - k * 2;
    rings.push(`M${W/2-outer},${y} Q${W/2-(outer+inner)/2},${y+1} ${W/2-inner},${y}`);
    rings.push(`M${W/2+inner},${y} Q${W/2+(outer+inner)/2},${y+1} ${W/2+outer},${y}`);
  }

  // Longitude seams — vertical lines along body
  const seams = [
    // center line
    `M${W/2},20 L${W/2},196`,
    // parallels
    `M${W/2-6},24 Q${W/2-8},100 ${W/2-6},196`,
    `M${W/2+6},24 Q${W/2+8},100 ${W/2+6},196`,
    `M${W/2-14},60 Q${W/2-18},120 ${W/2-14},196`,
    `M${W/2+14},60 Q${W/2+18},120 ${W/2+14},196`,
    // legs
    `M${W/2-12},200 L${W/2-14},324`,
    `M${W/2+12},200 L${W/2+14},324`,
    `M${W/2-5},200 L${W/2-7},324`,
    `M${W/2+5},200 L${W/2+7},324`,
  ];

  // Map our INJURIES (x,y 0-100 scale) to this viewbox
  const mapInj = (inj) => ({ ...inj, mx: (inj.x/100)*W, my: (inj.y/100)*340 });

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <radialGradient id="bodyHalo" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(141,240,255,0.22)"/>
          <stop offset="60%" stopColor="rgba(110,198,217,0.06)"/>
          <stop offset="100%" stopColor="rgba(110,198,217,0)"/>
        </radialGradient>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(141,240,255,0.18)"/>
          <stop offset="100%" stopColor="rgba(40,120,180,0.04)"/>
        </linearGradient>
        <radialGradient id="injuryHeat" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffdf70" stopOpacity="0.9"/>
          <stop offset="40%" stopColor="#ff6a3c" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ff2a4a" stopOpacity="0"/>
        </radialGradient>
        <filter id="wfGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="injGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      {/* atmospheric halo */}
      <ellipse cx={W/2} cy={H/2} rx={W*0.55} ry={H*0.5} fill="url(#bodyHalo)"/>

      {/* body fill */}
      <path d={bodyOutline} fill="url(#bodyFill)" opacity="0.9"/>
      <path d={legLPath} fill="url(#bodyFill)" opacity="0.9"/>
      <path d={legRPath} fill="url(#bodyFill)" opacity="0.9"/>

      {/* outline */}
      <g stroke={B_COLORS.cyanBright} strokeWidth="0.7" fill="none" opacity="0.85" filter="url(#wfGlow)">
        <path d={bodyOutline}/>
        <path d={legLPath}/>
        <path d={legRPath}/>
      </g>

      {/* latitude mesh */}
      <g stroke={B_COLORS.cyan} strokeWidth="0.35" fill="none" opacity="0.55">
        {rings.map((d, i) => <path key={`r${i}`} d={d}/>)}
      </g>
      {/* longitude seams */}
      <g stroke={B_COLORS.cyan} strokeWidth="0.35" fill="none" opacity="0.5">
        {seams.map((d, i) => <path key={`s${i}`} d={d}/>)}
      </g>

      {/* injury heat glows */}
      {INJURIES.map(inj => {
        const m = mapInj(inj);
        const color = inj.severity === 'critical' ? '#ff3a55'
                    : inj.severity === 'iv' ? B_COLORS.cyanBright
                    : '#ffb03a';
        return (
          <g key={inj.id}>
            <circle cx={m.mx} cy={m.my} r="22" fill="url(#injuryHeat)" filter="url(#injGlow)" opacity="0.85"/>
            <circle cx={m.mx} cy={m.my} r="10" fill={color} opacity="0.25" filter="url(#injGlow)"/>
            <circle cx={m.mx} cy={m.my} r="3" fill={color}>
              <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"/>
            </circle>
            <circle cx={m.mx} cy={m.my} r="6" fill="none" stroke={color} strokeWidth="0.6" opacity="0.7">
              <animate attributeName="r" from="6" to="18" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.8" to="0" dur="2.4s" repeatCount="indefinite"/>
            </circle>
          </g>
        );
      })}

      {/* holographic projection base */}
      <g opacity="0.85">
        <ellipse cx={W/2} cy={H+16} rx={W*0.35} ry="8" fill="none" stroke={B_COLORS.cyanBright} strokeWidth="0.8" filter="url(#wfGlow)"/>
        <ellipse cx={W/2} cy={H+16} rx={W*0.35} ry="8" fill="rgba(141,240,255,0.08)"/>
        <ellipse cx={W/2} cy={H+19} rx={W*0.32} ry="6" fill="none" stroke={B_COLORS.cyan} strokeWidth="0.4" opacity="0.6"/>
        {/* tick marks on base */}
        {Array.from({length: 24}).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const rx = W*0.35, ry = 8;
          const x1 = W/2 + Math.cos(a) * rx, y1 = H+16 + Math.sin(a) * ry;
          const x2 = W/2 + Math.cos(a) * (rx-2.5), y2 = H+16 + Math.sin(a) * (ry-0.6);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={B_COLORS.cyanBright} strokeWidth="0.3" opacity="0.7"/>;
        })}
      </g>

      {/* Callout labels */}
      {INJURIES.filter(i => i.severity === 'critical').map((inj, idx) => {
        const m = mapInj(inj);
        const onRight = m.mx > W/2;
        const lx = onRight ? W - 8 : 8;
        const ty = m.my;
        const label = inj.label.toUpperCase();
        return (
          <g key={`cal-${idx}`} opacity="0.95">
            <line x1={m.mx} y1={m.my} x2={onRight ? m.mx + 20 : m.mx - 20} y2={m.my} stroke="#ff8a8a" strokeWidth="0.5"/>
            <line x1={onRight ? m.mx + 20 : m.mx - 20} y1={m.my} x2={lx} y2={ty - 4} stroke="#ff8a8a" strokeWidth="0.5"/>
            <circle cx={lx} cy={ty - 4} r="1.1" fill="#ff8a8a"/>
            <text x={lx} y={ty - 8} fontSize="5.2" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.6" fill="#ffb0b0" textAnchor={onRight ? 'end' : 'start'}>
              {label}
            </text>
          </g>
        );
      })}

      {/* intervention markers — small ring near site */}
      {interventions.map((iv, i) => {
        const site = INJURIES.find(j => j.id === iv.site);
        if (!site) return null;
        const m = mapInj(site);
        return (
          <g key={`iv${i}`} transform={`translate(${m.mx + 16},${m.my - 8})`}>
            <circle r="4" fill="rgba(109,240,163,0.12)" stroke={B_COLORS.green} strokeWidth="0.5"/>
            <text y="1.6" textAnchor="middle" fontSize="4.5" fill={B_COLORS.green}>✓</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MARCH PAWS flowline — horizontal priority stream ───────────────────
function BMarchFlow({ t, activeStep, performance, forcedStep }) {
  const steps = MARCH_PAWS;
  const eff = forcedStep || activeStep;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* stream header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 2 }}>MARCH · PAWS PROTOCOL STREAM</div>
        <div style={{ fontSize: 9, color: B_COLORS.cyanBright, letterSpacing: 1.6 }}>AI PRIORITIZED · {eff.replace('2','')}</div>
      </div>

      {/* pill row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4 }}>
        {steps.map(step => {
          const doneT = performance.firsts[step.key];
          const done = doneT != null;
          const active = eff === step.key;
          return (
            <div key={step.key} style={{
              padding: '10px 6px', textAlign: 'center',
              background: active
                ? 'linear-gradient(180deg, rgba(141,240,255,0.18), rgba(141,240,255,0.04))'
                : done ? 'rgba(109,240,163,0.06)' : B_COLORS.panel,
              border: `1px solid ${active ? B_COLORS.cyanBright : done ? 'rgba(109,240,163,0.3)' : B_COLORS.border}`,
              position: 'relative', overflow: 'hidden',
            }}>
              {active && <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 16px rgba(141,240,255,0.25)` }}/>}
              <div style={{ fontSize: 18, fontWeight: 300, color: active ? B_COLORS.cyanBright : done ? B_COLORS.green : B_COLORS.ink, letterSpacing: 1 }}>
                {step.key.replace('2','')}
              </div>
              <div style={{ fontSize: 7, color: B_COLORS.dim, letterSpacing: 1, marginTop: 2 }}>
                {done ? `T+${doneT}s` : active ? 'ACTIVE' : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* detail row for current step */}
      <div style={{ padding: '10px 12px', background: B_COLORS.panel, border: `1px solid ${B_COLORS.border}` }}>
        {steps.filter(s => s.key === eff).map(step => (
          <div key={step.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 400, color: B_COLORS.cyanBright, letterSpacing: 0.5 }}>{step.label.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: B_COLORS.dim, marginLeft: 10 }}>/ {step.plain}</span>
              </div>
              <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 1.2 }}>BENCHMARK ≤{step.benchmark}s</div>
            </div>
            <div style={{ fontSize: 10, color: B_COLORS.ink, lineHeight: 1.5 }}>
              {suggestionFor(step.key, eff)}
            </div>
          </div>
        ))}
      </div>

      {/* remaining steps compact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {steps.filter(s => s.key !== eff).map(step => {
          const doneT = performance.firsts[step.key];
          const done = doneT != null;
          const over = done && doneT > step.benchmark;
          return (
            <div key={step.key} style={{
              display: 'grid', gridTemplateColumns: '16px 1fr 80px 50px', gap: 8, alignItems: 'center',
              padding: '4px 8px', fontSize: 10, color: done ? B_COLORS.ink : B_COLORS.dim,
              borderLeft: `1px solid ${done ? B_COLORS.green : B_COLORS.mute}`,
            }}>
              <span style={{ color: done ? B_COLORS.green : B_COLORS.mute, fontWeight: 600 }}>{step.key.replace('2','')}</span>
              <span>{step.label}</span>
              <span style={{ color: done ? (over ? B_COLORS.red : B_COLORS.green) : B_COLORS.mute, fontVariantNumeric: 'tabular-nums' }}>
                {done ? `${doneT}s / ${step.benchmark}s` : `≤${step.benchmark}s`}
              </span>
              <span style={{ textAlign: 'right', color: B_COLORS.mute, fontSize: 9, letterSpacing: 1 }}>
                {done ? (over ? 'LATE' : 'ON PACE') : 'QUEUED'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function suggestionFor(key, active) {
  const m = {
    M: 'Hemorrhage control prioritized. Confirm distal pulse absent beyond TQ. Consider junctional device for inguinal bleed.',
    A: 'Airway at risk — jaw-thrust + NPA. If compromised, escalate to surgical cricothyroidotomy within 60s.',
    R: 'Unequal breath sounds right — tension pneumothorax likely. Needle decompression 5th ICS MAL or 2nd MCL.',
    C: 'Class III shock present. Establish IO if IV fails twice. TXA within 3 hr window. Whole blood ≥ crystalloid.',
    H: 'Passive warming now. HPMK or Blizzard wrap. Limit crystalloid to avoid coagulopathy triad.',
    P: 'Ketamine 50–100mg IM or OTFC 800mcg. Avoid opioids if SBP <100 without resuscitation onboard.',
    A2: 'Ertapenem 1g IV/IO for penetrating wounds. Document allergy check.',
    W: 'Dress non-arterial wounds after MARCH complete. Photograph for AAR and Role 2 prep.',
    S: 'SAM splint or traction for femur. Re-check neurovascular q10min.',
  };
  return m[active] || m[key];
}

// ─── Predictive performance panel ───────────────────────────────────────
function BPerfPanel({ performance, vitals, showPerf, t }) {
  if (!showPerf) return null;
  return (
    <div style={{
      background: B_COLORS.panel, border: `1px solid ${B_COLORS.border}`,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 2 }}>PERFORMANCE TELEMETRY</div>
        <div style={{ fontSize: 9, color: B_COLORS.cyanBright, letterSpacing: 1.6 }}>vs JTS COHORT (n=4,218)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <PerfStat label="ADHERENCE" value={`${performance.adherence}`} unit="%" color={performance.adherence > 80 ? B_COLORS.green : B_COLORS.amber} delta={percentile(performance.adherence)} />
        <PerfStat label="ORDER" value={`${performance.orderScore}`} unit="%" color={B_COLORS.green} delta={percentile(performance.orderScore)}/>
        <PerfStat label="TQ TIME" value={performance.firsts.M ?? '—'} unit="s" color={performance.firsts.M && performance.firsts.M <= 60 ? B_COLORS.green : B_COLORS.amber} delta="median 42s"/>
        <PerfStat label="TRAJECTORY" value={vitals.sbp > 95 ? 'IMPROVING' : vitals.sbp > 85 ? 'STABLE' : 'DETERIORATING'} unit="" small color={vitals.sbp > 95 ? B_COLORS.green : vitals.sbp > 85 ? B_COLORS.amber : B_COLORS.red} delta="3-min SBP slope"/>
      </div>
      {/* per-step bar */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {performance.scored.map(s => {
          const ratio = Math.min(1.5, s.t / s.bench);
          return (
            <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 90px', gap: 10, alignItems: 'center', fontSize: 9 }}>
              <span style={{ color: B_COLORS.dim, fontWeight: 600, letterSpacing: 1 }}>{s.key.replace('2','')}</span>
              <div style={{ position: 'relative', height: 5, background: 'rgba(110,198,217,0.08)' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, ratio * 66.7)}%`, background: s.t <= s.bench ? `linear-gradient(90deg, ${B_COLORS.green}, ${B_COLORS.cyanBright})` : `linear-gradient(90deg, ${B_COLORS.amber}, ${B_COLORS.red})`, boxShadow: `0 0 6px ${s.t <= s.bench ? B_COLORS.green : B_COLORS.amber}` }}/>
                <div style={{ position: 'absolute', left: '66.7%', top: -2, width: 1, height: 9, background: B_COLORS.amber, opacity: 0.6 }}/>
              </div>
              <span style={{ color: B_COLORS.dim, fontVariantNumeric: 'tabular-nums', textAlign: 'right', letterSpacing: 0.5 }}>
                {s.t}s  ·  {s.t <= s.bench ? `-${s.bench - s.t}s` : `+${s.t - s.bench}s`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function percentile(n) {
  if (n >= 90) return 'top 10%';
  if (n >= 75) return 'top 25%';
  if (n >= 50) return 'median';
  return 'below median';
}

function PerfStat({ label, value, unit, color, delta, small }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: B_COLORS.dim, letterSpacing: 1.8 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 26, fontWeight: 200, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, letterSpacing: -0.4, textShadow: `0 0 12px ${color}33` }}>
        {value}<span style={{ fontSize: 10, color: B_COLORS.dim, marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 8, color: B_COLORS.mute, letterSpacing: 1, marginTop: 2 }}>{delta}</div>
    </div>
  );
}

// ─── Intervention feed ──────────────────────────────────────────────────
function BInterventionFeed({ interventions, t }) {
  const recent = interventions.slice().reverse().slice(0, 5);
  return (
    <div style={{ background: B_COLORS.panel, border: `1px solid ${B_COLORS.border}`, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 2, marginBottom: 8 }}>INTERVENTION LEDGER</div>
      {recent.map((iv, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '42px 18px 1fr', gap: 8, alignItems: 'baseline', fontSize: 10, padding: '3px 0', borderBottom: i < recent.length-1 ? '1px solid rgba(110,198,217,0.06)' : 'none' }}>
          <span style={{ color: B_COLORS.cyan, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>T+{iv.t}s</span>
          <span style={{ color: B_COLORS.amber, fontWeight: 600, letterSpacing: 1 }}>{iv.step.replace('2','')}</span>
          <span style={{ color: B_COLORS.ink }}>{iv.action}</span>
        </div>
      ))}
      {!recent.length && <div style={{ fontSize: 10, color: B_COLORS.mute }}>awaiting first action…</div>}
    </div>
  );
}

// ─── Main compose ───────────────────────────────────────────────────────
function VariantB({ t, phase, forcedStep, showPerf, holo }) {
  const vitals = vitalsAt(t);
  const history = vitalsHistory(t, 2);
  const interventions = interventionsUpTo(t);
  const performance = performanceAt(t);
  const activeStep = forcedStep || activeStepAt(t);

  // 30s projected vitals for AI trendcards
  const proj = {
    hr: [], sbp: [], spo2: [],
  };
  for (let dt = 2; dt <= 30; dt += 2) {
    const v = vitalsAt(t + dt);
    proj.hr.push(v.hr); proj.sbp.push(v.sbp); proj.spo2.push(v.spo2);
  }

  // Alert
  let alert = null;
  if (vitals.spo2 < 90) alert = { color: B_COLORS.red, text: 'PREDICTED TENSION PNEUMOTHORAX · Needle-D indicated within 45s', icon: '◆' };
  else if (vitals.sbp < 85) alert = { color: B_COLORS.red, text: 'CLASS III SHOCK · AI RECOMMENDS TXA + 1U LTOWB', icon: '◆' };
  else if (vitals.si > 1.1) alert = { color: B_COLORS.amber, text: 'SHOCK INDEX RISING · prepare resuscitation pack', icon: '◇' };

  return (
    <div style={{
      width: 960, height: 640, position: 'relative',
      background: B_COLORS.bg,
      backgroundImage: B_COLORS.bgGlow,
      color: B_COLORS.ink,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      fontSize: 12, display: 'flex', flexDirection: 'column',
      border: `1px solid ${B_COLORS.borderHi}`,
      boxShadow: `0 0 0 1px rgba(110,198,217,0.1), 0 0 60px rgba(110,198,217,0.08) inset`,
      overflow: 'hidden',
    }}>
      {/* scan lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(110,198,217,0.3) 2px, rgba(110,198,217,0.3) 3px)' }}/>

      <BTopBezel t={t} phase={phase}/>
      <BCasualtyHeader vitals={vitals} t={t} interventions={interventions}/>

      {alert && (
        <div style={{ padding: '8px 18px', background: `linear-gradient(90deg, ${alert.color}22, transparent)`, borderBottom: `1px solid ${alert.color}66`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: 1.4, color: alert.color }}>
          <span style={{ fontSize: 14 }}>{alert.icon}</span>
          <span style={{ fontWeight: 600 }}>{alert.text}</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 12, padding: 12, minHeight: 0 }}>
        {/* LEFT — body hologram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div style={{ fontSize: 9, color: B_COLORS.dim, letterSpacing: 2 }}>ANATOMICAL OVERLAY</div>
          <div style={{ flex: 1, minHeight: 0, border: `1px solid ${B_COLORS.border}`, background: 'radial-gradient(ellipse at 50% 40%, rgba(110,198,217,0.05), transparent 70%)' }}>
            <Body3D interventions={interventions} theme={holo}/>
          </div>
          <div style={{ fontSize: 9, color: B_COLORS.dim, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, letterSpacing: 0.5 }}>
            <span><span style={{ color: B_COLORS.red }}>●</span> Active hemorrhage</span>
            <span><span style={{ color: B_COLORS.amber }}>●</span> Airway / resp</span>
            <span><span style={{ color: B_COLORS.cyanBright }}>●</span> Vascular access</span>
            <span><span style={{ color: B_COLORS.green }}>✓</span> Intervention applied</span>
          </div>
        </div>

        {/* CENTER — vitals + MARCH flow + performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <BTrendCard label="HR" unit="bpm" value={vitals.hr} history={history} keyName="hr" projected={proj.hr} color={B_COLORS.cyanBright} range="60–100" warn={vitals.hr > 130}/>
            <BTrendCard label="SBP" unit="mmHg" value={vitals.sbp} history={history} keyName="sbp" projected={proj.sbp} color={B_COLORS.rose} range=">100" warn={vitals.sbp < 90}/>
            <BTrendCard label="SpO₂" unit="%" value={vitals.spo2} history={history} keyName="spo2" projected={proj.spo2} color={B_COLORS.indigo} range="≥95" warn={vitals.spo2 < 92}/>
            <BTrendCard label="EtCO₂" unit="mmHg" value={vitals.etco2} history={history} keyName="etco2" color={B_COLORS.green} range="35–45"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
            <MiniStat label="RR" value={vitals.rr} unit="/min"/>
            <MiniStat label="TEMP" value={vitals.temp} unit="°C" warn={vitals.temp < 36}/>
            <MiniStat label="GCS" value={vitals.gcs} unit="/15"/>
            <MiniStat label="EBL" value={vitals.ebl} unit="mL" warn={vitals.ebl > 1000}/>
          </div>

          <BMarchFlow t={t} activeStep={activeStep} performance={performance} forcedStep={forcedStep}/>

          <BPerfPanel performance={performance} vitals={vitals} showPerf={showPerf} t={t}/>
        </div>

        {/* RIGHT — intervention feed + next action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <BNextAction vitals={vitals} activeStep={activeStep} performance={performance}/>
          <BInterventionFeed interventions={interventions} t={t}/>
          <BEvacPanel t={t} vitals={vitals}/>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit, warn }) {
  return (
    <div style={{ padding: '6px 10px', border: `1px solid ${warn ? B_COLORS.red : B_COLORS.border}`, background: B_COLORS.panel }}>
      <div style={{ fontSize: 8, color: B_COLORS.dim, letterSpacing: 1.6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 300, color: warn ? B_COLORS.red : B_COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>
        {value}<span style={{ fontSize: 9, color: B_COLORS.dim, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

function BNextAction({ vitals, activeStep, performance }) {
  const step = MARCH_PAWS.find(s => s.key === activeStep) || MARCH_PAWS[0];
  const done = performance.firsts[activeStep];
  return (
    <div style={{
      padding: '12px 14px',
      background: 'linear-gradient(180deg, rgba(141,240,255,0.08), rgba(141,240,255,0.02))',
      border: `1px solid ${B_COLORS.cyanBright}`,
      boxShadow: `0 0 16px rgba(141,240,255,0.15), inset 0 0 20px rgba(141,240,255,0.05)`,
    }}>
      <div style={{ fontSize: 9, color: B_COLORS.cyanBright, letterSpacing: 2.4, marginBottom: 4 }}>▸ NEXT ACTION</div>
      <div style={{ fontSize: 14, fontWeight: 400, color: B_COLORS.ink, letterSpacing: 0.4, lineHeight: 1.3 }}>
        {step.plain}
      </div>
      <div style={{ fontSize: 10, color: B_COLORS.dim, marginTop: 6, lineHeight: 1.5 }}>
        {suggestionFor(activeStep)}
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: B_COLORS.dim, letterSpacing: 1.2 }}>
        <span>TARGET · ≤{step.benchmark}s</span>
        <span style={{ color: done ? B_COLORS.green : B_COLORS.amber }}>{done ? `DONE @ ${done}s` : 'IN PROGRESS'}</span>
      </div>
    </div>
  );
}

function BEvacPanel({ t, vitals }) {
  return (
    <div style={{ background: B_COLORS.panel, border: `1px solid ${B_COLORS.border}`, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: B_COLORS.dim, letterSpacing: 2, marginBottom: 8 }}>9-LINE EVAC · AUTO-POPULATED</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 9 }}>
        <div><span style={{ color: B_COLORS.mute }}>LZ&nbsp;</span><span style={{ color: B_COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>34.528°N 69.165°E</span></div>
        <div><span style={{ color: B_COLORS.mute }}>FREQ&nbsp;</span><span style={{ color: B_COLORS.ink }}>38.75 MHz</span></div>
        <div><span style={{ color: B_COLORS.mute }}>PRECEDENCE&nbsp;</span><span style={{ color: B_COLORS.red, fontWeight: 600 }}>URGENT-SURG</span></div>
        <div><span style={{ color: B_COLORS.mute }}>SPECIAL&nbsp;</span><span style={{ color: B_COLORS.ink }}>WHOLE BLOOD</span></div>
        <div><span style={{ color: B_COLORS.mute }}>PAX&nbsp;</span><span style={{ color: B_COLORS.ink }}>1L + 0A</span></div>
        <div><span style={{ color: B_COLORS.mute }}>MARK&nbsp;</span><span style={{ color: B_COLORS.ink }}>IR STROBE</span></div>
        <div><span style={{ color: B_COLORS.mute }}>NATIONALITY&nbsp;</span><span style={{ color: B_COLORS.ink }}>US MIL</span></div>
        <div><span style={{ color: B_COLORS.mute }}>NBC&nbsp;</span><span style={{ color: B_COLORS.ink }}>NONE</span></div>
      </div>
      <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(141,240,255,0.06)', border: `1px solid rgba(141,240,255,0.2)`, fontSize: 9, color: B_COLORS.cyanBright, letterSpacing: 1 }}>
        ▸ TRANSMITTED TO ROLE 2 · DUSTOFF 6 INBOUND
      </div>
    </div>
  );
}

window.VariantB = VariantB;
