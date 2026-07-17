// tweaks.jsx — Floating Tweaks panel with host protocol.

const PHASES = ['CUF', 'TFC', 'TACEVAC'];
const SEVERITIES = ['STABLE', 'SERIOUS', 'CRITICAL'];
const STEP_OPTIONS = ['AUTO', ...MARCH_PAWS.map(s => s.key)];
const SCHEMES = ['NIGHT', 'DAY'];

function TweaksPanel({ tweaks, setTweaks, visible }) {
  if (!visible) return null;
  const set = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 100,
      width: 260, padding: 14,
      background: 'rgba(12,18,28,0.96)', color: '#e4f1fb',
      border: '1px solid rgba(150,220,255,0.3)',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 11, backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#8df0ff', fontWeight: 700 }}>TWEAKS</div>
        <div style={{ fontSize: 9, color: '#7f98b3' }}>live</div>
      </div>

      <TweakRow label="TCCC PHASE">
        <Pills opts={PHASES} value={tweaks.phase} onChange={v => set('phase', v)}/>
      </TweakRow>
      <TweakRow label="CASUALTY SEVERITY">
        <Pills opts={SEVERITIES} value={tweaks.severity} onChange={v => set('severity', v)}/>
      </TweakRow>
      <TweakRow label="ACTIVE MARCH STEP">
        <Pills opts={STEP_OPTIONS} value={tweaks.forcedStep} onChange={v => set('forcedStep', v)} tiny/>
      </TweakRow>
      <TweakRow label="COLOR SCHEME">
        <Pills opts={SCHEMES} value={tweaks.scheme} onChange={v => set('scheme', v)}/>
      </TweakRow>
      <TweakRow label="PERFORMANCE OVERLAY">
        <Pills opts={['SHOW', 'HIDE']} value={tweaks.showPerf ? 'SHOW' : 'HIDE'} onChange={v => set('showPerf', v === 'SHOW')}/>
      </TweakRow>
      <TweakRow label="SIMULATION">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => set('playing', !tweaks.playing)} style={pillBtn(true)}>{tweaks.playing ? '⏸ PAUSE' : '▶ PLAY'}</button>
          <button onClick={() => { set('simT', 0); set('playing', true); }} style={pillBtn()}>↺</button>
          <span style={{ fontSize: 10, color: '#8df0ff', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
            T+{Math.floor(tweaks.simT).toString().padStart(3,'0')}s
          </span>
        </div>
        <input type="range" min="0" max={SIM_DURATION} step="1" value={tweaks.simT} onChange={e => { set('simT', +e.target.value); set('playing', false); }} style={{ width: '100%', marginTop: 6, accentColor: '#8df0ff' }}/>
      </TweakRow>
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: '#7f98b3', letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function Pills({ opts, value, onChange, tiny }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {opts.map(o => (
        <button key={o} onClick={() => onChange(o)} style={pillBtn(value === o, tiny)}>{o}</button>
      ))}
    </div>
  );
}

function pillBtn(active, tiny) {
  return {
    padding: tiny ? '3px 6px' : '4px 9px',
    fontSize: tiny ? 9 : 10,
    letterSpacing: 1,
    background: active ? 'rgba(141,240,255,0.2)' : 'rgba(110,198,217,0.04)',
    border: `1px solid ${active ? '#8df0ff' : 'rgba(150,220,255,0.15)'}`,
    color: active ? '#8df0ff' : '#b5c7db',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: active ? 600 : 400,
  };
}

window.TweaksPanel = TweaksPanel;
