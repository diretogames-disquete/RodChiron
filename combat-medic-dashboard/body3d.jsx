// body3d.jsx — GLB anatomical hologram for the AEGIS variant.
// Renders the uploaded 3D model with a holographic cyan treatment, slowly
// rotating, and projects pulsating injury markers + intervention checks
// from each injury's fractional bbox anchor. Falls back to the SVG BBodyMap
// if THREE or the model fails to load.

const B3D_GLB_PATH = window.B3D_GLB_DATA || 'assets/body-model.glb';

const HOLO_THEMES = {
  CYAN:   { model: 0x7fd4e8, emissive: 0x0a2e3d, wire: 0x6ec6d9, key: 0x8df0ff, css: '#8df0ff' },
  GREEN:  { model: 0x8fe8a8, emissive: 0x0a3d1e, wire: 0x5ed38c, key: 0x6df0a3, css: '#6df0a3' },
  AMBER:  { model: 0xf0c878, emissive: 0x3d2a0a, wire: 0xf2b34a, key: 0xffd27a, css: '#ffd27a' },
  VIOLET: { model: 0xc0a8f0, emissive: 0x260a3d, wire: 0x9a7fd8, key: 0xc8a8ff, css: '#c8a8ff' },
};

(function injectB3DStyles(){
  if (document.getElementById('b3d-styles')) return;
  const st = document.createElement('style');
  st.id = 'b3d-styles';
  st.textContent = `
    @keyframes b3dPulse { 0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:1 } 50%{ transform:translate(-50%,-50%) scale(0.55); opacity:0.45 } }
    @keyframes b3dRing { 0%{ transform:translate(-50%,-50%) scale(0.6); opacity:0.9 } 100%{ transform:translate(-50%,-50%) scale(2.6); opacity:0 } }
    .b3d-marker { position:absolute; width:12px; height:12px; border-radius:50%; pointer-events:none; animation:b3dPulse 1.6s ease-in-out infinite; }
    .b3d-ring { position:absolute; width:18px; height:18px; border-radius:50%; border:1.5px solid; pointer-events:none; animation:b3dRing 2.4s ease-out infinite; }
    .b3d-check { position:absolute; width:16px; height:16px; border-radius:50%; border:1px solid #6df0a3; color:#6df0a3; background:rgba(109,240,163,0.12); font-size:10px; line-height:15px; text-align:center; pointer-events:none; transform:translate(-50%,-50%); }
    .b3d-label { position:absolute; font-family:Inter,sans-serif; font-size:8.5px; font-weight:600; letter-spacing:0.8px; color:#ffb0b0; pointer-events:none; white-space:nowrap; text-shadow:0 0 6px rgba(0,0,0,0.9); transform:translate(-50%,-130%); }
  `;
  document.head.appendChild(st);
})();

function Body3D({ interventions, theme }) {
  const mountRef = React.useRef(null);
  const [failed, setFailed] = React.useState(false);
  const ctxRef = React.useRef({});
  ctxRef.current.themeName = theme || 'CYAN';

  // Scene setup (once)
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !window.THREE || !THREE.GLTFLoader) { setFailed(true); return; }
    const ctx = ctxRef.current;
    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.6);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x88ccdd, 0.7));
    const key = new THREE.DirectionalLight(0x8df0ff, 1.1); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x9a7fd8, 0.6); rim.position.set(-3, 1, -3); scene.add(rim);
    ctx.keyLight = key;

    const group = new THREE.Group();
    scene.add(group);
    ctx.group = group; ctx.camera = camera; ctx.mount = mount;

    new THREE.GLTFLoader().load(B3D_GLB_PATH.startsWith('data:') ? B3D_GLB_PATH : encodeURI(B3D_GLB_PATH), (gltf) => {
      if (disposed) return;
      try {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2.6 / Math.max(size.y, 1e-4);
        model.scale.setScalar(scale);
        const box2 = new THREE.Box3().setFromObject(model);
        const center = box2.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const meshes = [];
        model.traverse(o => { if (o.isMesh) meshes.push(o); });
        const th0 = HOLO_THEMES[ctx.themeName] || HOLO_THEMES.CYAN;
        meshes.forEach(o => {
          o.material = new THREE.MeshStandardMaterial({
            color: th0.model, emissive: th0.emissive, metalness: 0.15, roughness: 0.55,
            transparent: true, opacity: 0.85,
          });
          const wf = new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({ color: th0.wire, wireframe: true, transparent: true, opacity: 0.12 }));
          o.add(wf);
        });
        ctx.meshes = meshes;
        group.add(model);
        ctx.bbox = new THREE.Box3().setFromObject(group);
      } catch (err) {
        console.warn('GLB setup failed:', err);
        setFailed(true);
      }
    }, undefined, (err) => { console.warn('GLB load failed:', err); if (!disposed) setFailed(true); });

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const v = new THREE.Vector3();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      group.rotation.y += 0.0045;
      group.updateMatrixWorld();
      renderer.render(scene, camera);
      if (ctx.bbox && ctx.markerEls) {
        const w = mount.clientWidth, h = mount.clientHeight;
        const min = ctx.bbox.min, size = ctx.bbox.getSize(new THREE.Vector3());
        for (const m of ctx.markerEls) {
          v.set(min.x + m.a[0] * size.x, min.y + m.a[1] * size.y, (min.z + m.a[2] * size.z) * 0.6);
          v.applyMatrix4(group.matrixWorld).project(camera);
          const sx = (v.x * 0.5 + 0.5) * w + (m.dx || 0);
          const sy = (-v.y * 0.5 + 0.5) * h + (m.dy || 0);
          m.el.style.left = sx + 'px';
          m.el.style.top = sy + 'px';
        }
      }
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // Theme swap — retint existing materials, no rebuild
  React.useEffect(() => {
    const ctx = ctxRef.current;
    const th = HOLO_THEMES[theme] || HOLO_THEMES.CYAN;
    (ctx.meshes || []).forEach(o => {
      o.material.color.setHex(th.model);
      o.material.emissive.setHex(th.emissive);
      o.children.forEach(ch => { if (ch.material && ch.material.wireframe) ch.material.color.setHex(th.wire); });
    });
    if (ctx.keyLight) ctx.keyLight.color.setHex(th.key);
  }, [theme, failed]);

  // Marker DOM — rebuilt when injuries/interventions change
  React.useEffect(() => {
    const mount = mountRef.current;
    const ctx = ctxRef.current;
    if (!mount || failed) return;
    // clear old
    (ctx.markerEls || []).forEach(m => m.el.remove());
    const els = [];
    const colorFor = (sev) => sev === 'critical' ? '#ff3a55' : sev === 'iv' ? '#8df0ff' : '#ffb03a';
    INJURIES.forEach(inj => {
      const c = colorFor(inj.severity);
      const dot = document.createElement('div');
      dot.className = 'b3d-marker';
      dot.style.background = c;
      dot.style.boxShadow = `0 0 12px ${c}, 0 0 28px ${c}66`;
      mount.appendChild(dot);
      els.push({ el: dot, a: inj.a });
      const ring = document.createElement('div');
      ring.className = 'b3d-ring';
      ring.style.borderColor = c;
      mount.appendChild(ring);
      els.push({ el: ring, a: inj.a });
      if (inj.severity === 'critical') {
        const lab = document.createElement('div');
        lab.className = 'b3d-label';
        lab.textContent = inj.label;
        mount.appendChild(lab);
        els.push({ el: lab, a: inj.a, dy: -10 });
      }
    });
    interventions.forEach((iv, i) => {
      const site = INJURIES.find(j => j.site === iv.site);
      if (!site) return;
      const chk = document.createElement('div');
      chk.className = 'b3d-check';
      chk.textContent = '✓';
      mount.appendChild(chk);
      els.push({ el: chk, a: site.a, dx: 16, dy: -12 });
    });
    ctx.markerEls = els;
    return () => { els.forEach(m => m.el.remove()); ctx.markerEls = []; };
  }, [interventions.length, failed, CURRENT_SCENARIO && CURRENT_SCENARIO.id]);

  if (failed) return <BBodyMap interventions={interventions}/>;
  return <div ref={mountRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}></div>;
}

window.Body3D = Body3D;
