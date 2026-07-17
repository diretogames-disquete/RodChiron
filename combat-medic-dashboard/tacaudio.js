// tacaudio.js — procedural tactical ambience (WebAudio, no assets).
// Drone pad + heartbeat (rate follows casualty HR) + sonar ping + alert blips.
(function () {
  const T = { ctx: null, on: false, hr: 90, nodes: [], timers: [] };

  function env(c, g, t0, a, peak, d) {
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  T.start = function () {
    if (T.on) return;
    const c = T.ctx || (T.ctx = new (window.AudioContext || window.webkitAudioContext)());
    c.resume();
    T.on = true;
    const m = T.master = c.createGain();
    m.gain.value = 0.4;
    m.connect(c.destination);

    // drone pad — two detuned saws through a slow-breathing lowpass
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 55; o2.detune.value = 8;
    const o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.value = 110;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 7;
    const dg = c.createGain(); dg.gain.value = 0.05;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.06;
    const lg = c.createGain(); lg.gain.value = 110;
    lfo.connect(lg); lg.connect(lp.frequency);
    const o3g = c.createGain(); o3g.gain.value = 0.012;
    o1.connect(lp); o2.connect(lp); lp.connect(dg); dg.connect(m);
    o3.connect(o3g); o3g.connect(m);
    o1.start(); o2.start(); o3.start(); lfo.start();
    T.nodes = [o1, o2, o3, lfo];

    // heartbeat — interval follows T.hr
    const beat = () => {
      if (!T.on) return;
      T.thump();
      T.timers.push(setTimeout(beat, 60000 / Math.max(50, Math.min(170, T.hr))));
    };
    beat();
    // sonar ping every ~5s
    const ping = () => {
      if (!T.on) return;
      T.ping();
      T.timers.push(setTimeout(ping, 5200));
    };
    T.timers.push(setTimeout(ping, 1600));
  };

  T.thump = function () {
    const c = T.ctx; if (!c || !T.on) return;
    const t0 = c.currentTime;
    const mk = (f0, f1, del, peak) => {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, t0 + del);
      o.frequency.exponentialRampToValueAtTime(f1, t0 + del + 0.1);
      const g = c.createGain(); env(c, g, t0 + del, 0.008, peak, 0.13);
      o.connect(g); g.connect(T.master);
      o.start(t0 + del); o.stop(t0 + del + 0.2);
    };
    mk(72, 44, 0, 0.16);       // lub
    mk(64, 40, 0.16, 0.10);    // dub
  };

  T.ping = function () {
    const c = T.ctx; if (!c || !T.on) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 1180;
    const g = c.createGain(); env(c, g, t0, 0.01, 0.035, 1.1);
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.2 - 0.6; o.connect(g); g.connect(pan); pan.connect(T.master); }
    else { o.connect(g); g.connect(T.master); }
    o.start(t0); o.stop(t0 + 1.2);
  };

  T.alert = function () {
    const c = T.ctx; if (!c || !T.on) return;
    const t0 = c.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 960;
      const g = c.createGain(); env(c, g, t0 + i * 0.14, 0.005, 0.05, 0.09);
      o.connect(g); g.connect(T.master);
      o.start(t0 + i * 0.14); o.stop(t0 + i * 0.14 + 0.12);
    }
  };

  T.stop = function () {
    T.on = false;
    T.timers.forEach(clearTimeout);
    T.timers = [];
    T.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
    T.nodes = [];
    if (T.master) { T.master.disconnect(); T.master = null; }
  };

  window.TacAudio = T;
})();
