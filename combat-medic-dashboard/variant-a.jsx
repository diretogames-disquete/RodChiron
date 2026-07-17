// variant-a.jsx — TACMED-19: Grounded near-term rugged tactical HUD.
// Aesthetic: dark tactical navy base, mono type, amber/red/green semantics.
// Feels like real mil-issue equipment: dense, utilitarian, no flourishes.

const A_COLORS = {
  bg: '#0b0f12',
  panel: '#111820',
  panelHi: '#17222d',
  border: 'rgba(140,170,200,0.12)',
  borderHi: 'rgba(140,170,200,0.22)',
  ink: '#d7e3ee',
  dim: '#6a7c8e',
  mute: '#47555f',
  amber: '#f2b34a',
  red: '#e84a4a',
  green: '#5ed38c',
  cyan: '#6ec6d9',
  violet: '#9a7fd8',
};

function AStatusBar({ t, phase }) {
  const elapsedM = Math.floor(t / 60).toString().padStart(2, '0');
  const elapsedS = Math.floor(t % 60).toString().padStart(2, '0');
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 14px', borderBottom: `1px solid ${A_COLORS.border}`,
      background: A_COLORS.panelHi, fontSize: 11,
    }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <span style={{ color: A_COLORS.red, fontWeight: 700, letterSpacing: 1.5 }}>●&nbsp;LIVE</span>
        <span style={{ color: A_COLORS.dim }}>TACMED-19</span>
        <span style={{ color: A_COLORS.dim }}>NET: MESH-3</span>
        <span style={{ color: A_COLORS.green }}>GPS LOCK</span>
      </div>
      <div style={{ display: 'flex', gap: 18 }}>
        <span style={{ color: A_COLORS.amber, fontWeight: 700 }}>{phase}</span>
        <span style={{ color: A_COLORS.ink }}>CONTACT +{elapsedM}:{elapsedS}</span>
        <span style={{ color: A_COLORS.dim }}>BAT 78%</span>
      </div>
    </div>
  );
}

function ACasualtyHeader({ vitals }) {
  const severity = vitals.sbp < 90 ? 'URGENT' : vitals.sbp < 100 ? 'PRIORITY' : 'ROUTINE';
  const sevColor = severity === 'URGENT' ? A_COLORS.red : severity === 'PRIORITY' ? A_COLORS.amber : A_COLORS.green;
  return (
    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${A_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: 10, color: A_COLORS.dim, letterSpacing: 1.2, marginBottom: 2 }}>CASUALTY / CALLSIGN {CASUALTY.callsign}</div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.4 }}>{CASUALTY.name}</div>
        <div style={{ fontSize: 10, color: A_COLORS.dim, marginTop: 2 }}>
          {CASUALTY.unit} · {CASUALTY.bloodType} · {CASUALTY.weightKg}kg · {CASUALTY.allergies}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          display: 'inline-block', padding: '3px 10px',
          background: sevColor, color: '#0b0f12', fontWeight: 800,
          letterSpacing: 1.5, fontSize: 11,
        }}>{severity}</div>
        <div style={{ fontSize: 9, color: A_COLORS.dim, marginTop: 4, letterSpacing: 1 }}>NATO 9-LINE READY</div>
      </div>
    </div>
  );
}

// ─── Vitals tile — number + unit + trend sparkline ──────────────────────
function AVital({ label, value, unit, color, range, history, keyName, warn }) {
  return (
    <div style={{
      padding: '8px 10px', background: A_COLORS.panel,
      border: `1px solid ${warn ? A_COLORS.red : A_COLORS.border}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {warn && <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: '100%', background: A_COLORS.red }} />}
      <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2, marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
        <div style={{ fontSize: String(value).length > 5 ? 15 : 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 9, color: A_COLORS.dim }}>{unit}</div>
      </div>
      {range && <div style={{ fontSize: 8, color: A_COLORS.mute, marginTop: 2 }}>Ref {range}</div>}
      {history && <ASparkline history={history} keyName={keyName} color={color} />}
    </div>
  );
}

function ASparkline({ history, keyName, color }) {
  if (!history || history.length < 2) return null;
  const vals = history.map(h => h[keyName]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = Math.max(1, max - min);
  const w = 100, h = 16;
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 4 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1" opacity="0.9" />
    </svg>
  );
}

function AVitalsGrid({ vitals, history }) {
  const hrWarn = vitals.hr > 130;
  const bpWarn = vitals.sbp < 90;
  const spo2Warn = vitals.spo2 < 92;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      <AVital label="HR" value={vitals.hr} unit="bpm" range="60-100" color={hrWarn ? A_COLORS.red : A_COLORS.green} history={history} keyName="hr" warn={hrWarn}/>
      <AVital label="BP" value={`${vitals.sbp}/${Math.round(vitals.dbp)}`} unit="mmHg" range="110/70" color={bpWarn ? A_COLORS.red : A_COLORS.green} history={history} keyName="sbp" warn={bpWarn}/>
      <AVital label="SPO₂" value={vitals.spo2} unit="%" range="≥95" color={spo2Warn ? A_COLORS.red : A_COLORS.green} history={history} keyName="spo2" warn={spo2Warn}/>
      <AVital label="RR" value={vitals.rr} unit="/min" range="12-20" color={A_COLORS.ink} history={history} keyName="rr"/>
      <AVital label="EtCO₂" value={vitals.etco2} unit="mmHg" range="35-45" color={A_COLORS.cyan} history={history} keyName="etco2"/>
      <AVital label="TEMP" value={vitals.temp} unit="°C" range="36.5-37.5" color={A_COLORS.amber} history={history} keyName="temp"/>
      <AVital label="GCS" value={vitals.gcs} unit="/15" range="15" color={A_COLORS.ink}/>
      <AVital label="SHOCK IDX" value={vitals.si} unit="" range="<0.9" color={vitals.si > 1 ? A_COLORS.red : A_COLORS.green} history={history} keyName="si"/>
    </div>
  );
}

// ─── Body map — schematic anatomical SVG with injury + intervention markers ──
function ABodyMap({ interventions, activeStep }) {
  return (
    <svg viewBox="0 0 100 170" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* grid */}
      <defs>
        <pattern id="agrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(110,198,217,0.08)" strokeWidth="0.3"/>
        </pattern>
      </defs>
      <rect width="100" height="170" fill="url(#agrid)"/>
      {/* body silhouette — stylized, schematic */}
      <g fill="none" stroke="#3e5161" strokeWidth="0.8">
        {/* head */}
        <circle cx="50" cy="14" r="8"/>
        {/* neck */}
        <line x1="50" y1="22" x2="50" y2="27"/>
        {/* torso */}
        <path d="M35 28 L65 28 L68 70 L62 90 L38 90 L32 70 Z"/>
        {/* arms */}
        <path d="M35 28 L22 36 L18 66 L20 82"/>
        <path d="M65 28 L78 36 L82 66 L80 82"/>
        {/* legs */}
        <path d="M42 90 L38 130 L36 160"/>
        <path d="M58 90 L62 130 L64 160"/>
        <line x1="32" y1="160" x2="40" y2="160"/>
        <line x1="60" y1="160" x2="68" y2="160"/>
      </g>
      {/* injuries */}
      {INJURIES.map(inj => {
        const color = inj.severity === 'critical' ? A_COLORS.red
                    : inj.severity === 'iv' ? A_COLORS.cyan
                    : A_COLORS.amber;
        return (
          <g key={inj.id}>
            <circle cx={inj.x} cy={inj.y * 170/100} r="3.6" fill={color} opacity="0.25"/>
            <circle cx={inj.x} cy={inj.y * 170/100} r="1.6" fill={color}/>
            <circle cx={inj.x} cy={inj.y * 170/100} r="2.4" fill="none" stroke={color} strokeWidth="0.4">
              <animate attributeName="r" from="2" to="6" dur="1.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite"/>
            </circle>
          </g>
        );
      })}
      {/* intervention markers — check icons by applied site */}
      {interventions.map((iv, i) => {
        const site = INJURIES.find(j => j.id === iv.site);
        if (!site) return null;
        return (
          <g key={i} transform={`translate(${site.x + 5},${site.y * 170/100 - 3})`}>
            <rect x="0" y="0" width="6" height="3.5" fill={A_COLORS.green} opacity="0.2"/>
            <text x="3" y="2.8" fontSize="2.5" fill={A_COLORS.green} textAnchor="middle" fontFamily="JetBrains Mono">✓</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MARCH PAWS priority tree ───────────────────────────────────────────
function AMarchTree({ t, activeStep, performance, forcedStep }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {MARCH_PAWS.map(step => {
        const doneT = performance.firsts[step.key];
        const done = doneT != null;
        const active = (forcedStep || activeStep) === step.key;
        const over = done && doneT > step.benchmark;
        return (
          <div key={step.key} style={{
            display: 'grid', gridTemplateColumns: '22px 14px 1fr 58px 44px', gap: 8, alignItems: 'center',
            padding: '5px 8px',
            background: active ? 'rgba(242,179,74,0.08)' : done ? 'rgba(94,211,140,0.04)' : 'transparent',
            border: `1px solid ${active ? A_COLORS.amber : done ? 'rgba(94,211,140,0.2)' : A_COLORS.border}`,
            fontSize: 11,
          }}>
            <div style={{
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? A_COLORS.green : active ? A_COLORS.amber : 'transparent',
              border: `1px solid ${done ? A_COLORS.green : active ? A_COLORS.amber : A_COLORS.mute}`,
              color: done || active ? '#0b0f12' : A_COLORS.dim,
              fontWeight: 800, fontSize: 11,
            }}>{step.key.replace('2','')}</div>
            <div style={{ color: done ? A_COLORS.green : active ? A_COLORS.amber : A_COLORS.mute, fontSize: 10 }}>
              {done ? '✓' : active ? '▸' : '○'}
            </div>
            <div>
              <div style={{ color: A_COLORS.ink, fontWeight: 600, fontSize: 11 }}>{step.label}</div>
              <div style={{ color: A_COLORS.dim, fontSize: 9 }}>{step.plain}</div>
            </div>
            <div style={{ fontSize: 10, color: done ? (over ? A_COLORS.red : A_COLORS.green) : A_COLORS.mute, fontVariantNumeric: 'tabular-nums' }}>
              {done ? `${doneT}s` : `≤${step.benchmark}s`}
            </div>
            <div style={{ fontSize: 9, color: A_COLORS.dim, textAlign: 'right' }}>
              {done ? (over ? `+${doneT - step.benchmark}s` : 'ON PACE') : active ? 'NOW' : 'QUEUED'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Parallel timeline bar ──────────────────────────────────────────────
function ATimeline({ t, interventions }) {
  const duration = Math.max(t, 60);
  return (
    <div style={{ background: A_COLORS.panel, border: `1px solid ${A_COLORS.border}`, padding: '8px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2 }}>INTERVENTION TIMELINE</span>
        <span style={{ fontSize: 9, color: A_COLORS.dim, fontVariantNumeric: 'tabular-nums' }}>
          T+0 ——— T+{Math.floor(duration)}s
        </span>
      </div>
      {MARCH_PAWS.filter(s => ['M','A','R','C','H','P'].includes(s.key)).map(step => {
        const ivs = interventions.filter(i => i.step === step.key);
        return (
          <div key={step.key} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: A_COLORS.dim, fontWeight: 700 }}>{step.key.replace('2','')}</span>
            <div style={{ position: 'relative', height: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${A_COLORS.border}` }}>
              {/* benchmark marker */}
              <div style={{ position: 'absolute', left: `${(step.benchmark / duration) * 100}%`, top: 0, width: 1, height: '100%', background: A_COLORS.amber, opacity: 0.5 }}/>
              {/* current time */}
              <div style={{ position: 'absolute', left: `${(t / duration) * 100}%`, top: 0, width: 1, height: '100%', background: A_COLORS.red }}/>
              {/* interventions */}
              {ivs.map((iv, i) => (
                <div key={i} title={iv.action} style={{
                  position: 'absolute', left: `${(iv.t / duration) * 100}%`, top: 2, width: 3, height: 8,
                  background: A_COLORS.green, transform: 'translateX(-50%)',
                }}/>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Performance metrics panel ──────────────────────────────────────────
function APerformance({ performance, t, showOverlay }) {
  if (!showOverlay) return null;
  return (
    <div style={{ background: A_COLORS.panel, border: `1px solid ${A_COLORS.border}`, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.3, marginBottom: 8 }}>PERFORMANCE — vs TCCC BENCHMARK</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: A_COLORS.dim }}>ADHERENCE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: performance.adherence >= 80 ? A_COLORS.green : A_COLORS.amber, fontVariantNumeric: 'tabular-nums' }}>
            {performance.adherence}<span style={{ fontSize: 12, color: A_COLORS.dim }}>%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: A_COLORS.dim }}>ORDER</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: A_COLORS.green, fontVariantNumeric: 'tabular-nums' }}>
            {performance.orderScore}<span style={{ fontSize: 12, color: A_COLORS.dim }}>%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: A_COLORS.dim }}>INTERVENTIONS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: A_COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>
            {performance.interventions}
          </div>
        </div>
      </div>
      {/* Per-step bars */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {performance.scored.map(s => (
          <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 40px', gap: 8, alignItems: 'center', fontSize: 9 }}>
            <span style={{ color: A_COLORS.dim, fontWeight: 700 }}>{s.key.replace('2','')}</span>
            <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, (s.t/s.bench)*100)}%`, background: s.t <= s.bench ? A_COLORS.green : A_COLORS.red, opacity: 0.6 }}/>
              <div style={{ position: 'absolute', left: '100%', top: -2, width: 1, height: 8, background: A_COLORS.amber }}/>
            </div>
            <span style={{ color: A_COLORS.dim, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{s.t}s/{s.bench}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Intervention log ───────────────────────────────────────────────────
function AInterventionLog({ interventions }) {
  const recent = interventions.slice().reverse().slice(0, 4);
  return (
    <div style={{ background: A_COLORS.panel, border: `1px solid ${A_COLORS.border}`, padding: '8px 10px' }}>
      <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2, marginBottom: 6 }}>INTERVENTION LOG</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {recent.map((iv, i) => {
          const step = MARCH_PAWS.find(s => s.key === iv.step);
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 16px 1fr', gap: 6, fontSize: 10, alignItems: 'baseline' }}>
              <span style={{ color: A_COLORS.dim, fontVariantNumeric: 'tabular-nums' }}>T+{iv.t}s</span>
              <span style={{ color: A_COLORS.amber, fontWeight: 700 }}>{iv.step.replace('2','')}</span>
              <span style={{ color: A_COLORS.ink }}>{iv.action}</span>
            </div>
          );
        })}
        {recent.length === 0 && <div style={{ fontSize: 10, color: A_COLORS.mute }}>— awaiting first intervention —</div>}
      </div>
    </div>
  );
}

function AAlert({ t, vitals }) {
  let alert = null;
  if (vitals.spo2 < 90) alert = { color: A_COLORS.red, text: 'TENSION PNEUMOTHORAX SUSPECTED — NEEDLE-D INDICATED' };
  else if (vitals.sbp < 85) alert = { color: A_COLORS.red, text: 'CLASS III SHOCK — INITIATE TXA + WHOLE BLOOD' };
  else if (vitals.si > 1.1) alert = { color: A_COLORS.amber, text: 'SHOCK INDEX ELEVATED — PREPARE FLUID RESUSCITATION' };
  if (!alert) return null;
  return (
    <div style={{
      padding: '6px 10px', background: alert.color, color: '#0b0f12',
      fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>▲</span>
      <span>{alert.text}</span>
    </div>
  );
}

// ─── Main Variant A compose ──────────────────────────────────────────────
function VariantA({ t, phase, forcedStep, showPerf, holo }) {
  const vitals = vitalsAt(t);
  const history = vitalsHistory(t, 2);
  const interventions = interventionsUpTo(t);
  const performance = performanceAt(t);
  const activeStep = forcedStep || activeStepAt(t);

  return (
    <div style={{
      width: 960, height: 640, background: A_COLORS.bg,
      color: A_COLORS.ink, fontFamily: '"JetBrains Mono", "SF Mono", Menlo, monospace',
      fontSize: 12, display: 'flex', flexDirection: 'column',
      border: `1px solid ${A_COLORS.borderHi}`,
      boxShadow: 'inset 0 0 80px rgba(110,198,217,0.03)',
      position: 'relative',
    }}>
      <AStatusBar t={t} phase={phase}/>
      <ACasualtyHeader vitals={vitals}/>
      <AAlert t={t} vitals={vitals}/>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', gap: 0, flex: 1, overflow: 'hidden' }}>
        {/* LEFT: body map */}
        <div style={{ borderRight: `1px solid ${A_COLORS.border}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2 }}>INJURY MAP · INTERVENTIONS</div>
          <div style={{ flex: 1, minHeight: 0, background: A_COLORS.panel, border: `1px solid ${A_COLORS.border}` }}>
            <Body3D interventions={interventions} theme={holo}/>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 9, color: A_COLORS.dim, flexWrap: 'wrap' }}>
            <span><span style={{ color: A_COLORS.red }}>●</span> CRITICAL</span>
            <span><span style={{ color: A_COLORS.amber }}>●</span> AIRWAY</span>
            <span><span style={{ color: A_COLORS.cyan }}>●</span> ACCESS</span>
            <span><span style={{ color: A_COLORS.green }}>✓</span> TREATED</span>
          </div>
        </div>

        {/* CENTER: vitals + timeline + log */}
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <AVitalsGrid vitals={vitals} history={history}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: A_COLORS.panel, border: `1px solid ${A_COLORS.border}`, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2, marginBottom: 6 }}>HEMODYNAMICS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
                <div><span style={{ color: A_COLORS.dim }}>EBL&nbsp;</span><span style={{ color: vitals.ebl > 1000 ? A_COLORS.red : A_COLORS.ink, fontWeight: 700 }}>{vitals.ebl}&nbsp;mL</span></div>
                <div><span style={{ color: A_COLORS.dim }}>PI&nbsp;</span><span style={{ color: A_COLORS.ink, fontWeight: 700 }}>{vitals.pi}%</span></div>
                <div><span style={{ color: A_COLORS.dim }}>MAP&nbsp;</span><span style={{ color: A_COLORS.ink, fontWeight: 700 }}>{Math.round((vitals.sbp + 2*vitals.dbp)/3)}</span></div>
                <div><span style={{ color: A_COLORS.dim }}>PP&nbsp;</span><span style={{ color: A_COLORS.ink, fontWeight: 700 }}>{Math.round(vitals.sbp - vitals.dbp)}</span></div>
              </div>
            </div>
            <AInterventionLog interventions={interventions}/>
          </div>
          <ATimeline t={t} interventions={interventions}/>
          <APerformance performance={performance} t={t} showOverlay={showPerf}/>
        </div>

        {/* RIGHT: MARCH PAWS priority tree */}
        <div style={{ borderLeft: `1px solid ${A_COLORS.border}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 9, color: A_COLORS.dim, letterSpacing: 1.2 }}>MARCH-PAWS PROTOCOL</div>
            <div style={{ fontSize: 9, color: A_COLORS.amber }}>ACTIVE: {activeStep.replace('2','')}</div>
          </div>
          <AMarchTree t={t} activeStep={activeStep} performance={performance} forcedStep={forcedStep}/>
          <div style={{ marginTop: 'auto', fontSize: 9, color: A_COLORS.mute, lineHeight: 1.4, paddingTop: 8, borderTop: `1px solid ${A_COLORS.border}` }}>
            Benchmarks per JTS CPG — patient-contact baseline. Deviation logged for AAR.
          </div>
        </div>
      </div>
    </div>
  );
}

window.VariantA = VariantA;
