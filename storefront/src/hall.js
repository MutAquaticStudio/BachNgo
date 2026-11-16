import * as THREE from 'three';
import { IMG, ITEMS } from './data.js';

/** 3D hall: pieces hang on threads, the camera walks down the hall as `progress` goes 0 -> 1. */
export function createHall(canvas, stick) {
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { return null; }
  /* Linear output keeps every scene colour identical to the CSS token it comes from (sRGB output brightened fog and floor into a grey-blue haze). */
  r.outputEncoding = THREE.LinearEncoding;
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1a2a, 6, 24);
  scene.background = new THREE.Color(0x0f1a2a);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(2, 5, 4); scene.add(dl);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), new THREE.MeshBasicMaterial({ color: 0x0b1320 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -1.75, -30); scene.add(floor);

  /* Backdrop: a soft glow at the end of the hall, glued to the camera so it never runs out. */
  const bdTex = new THREE.CanvasTexture(document.createElement('canvas'));
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(110, 70), new THREE.MeshBasicMaterial({ map: bdTex, fog: false, depthWrite: false }));
  backdrop.position.set(0, 2, -40); backdrop.renderOrder = -10; cam.add(backdrop); scene.add(cam);

  /* Cloth walls: two long hanging panels with soft folds, the way a textile studio hangs its work. */
  const curTex = new THREE.CanvasTexture(document.createElement('canvas'));
  curTex.wrapS = THREE.RepeatWrapping; curTex.repeat.set(16, 1);
  const curMat = new THREE.MeshBasicMaterial({ map: curTex, side: THREE.DoubleSide });
  const curtains = [-1, 1].map((sd) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(96, 15), curMat);
    m.rotation.y = sd * Math.PI / 2; m.position.set(sd * 4.8, 5.75, -36); scene.add(m); return m;
  });
  const group = new THREE.Group(); scene.add(group);
  const n = 240, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 10; pos[i * 3 + 1] = (Math.random() - 0.5) * 6; pos[i * 3 + 2] = -Math.random() * 60 + 6; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xf1ede2, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false })); scene.add(dust);
  const hc = document.createElement('canvas'); hc.width = hc.height = 128;
  const hx = hc.getContext('2d'); const hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255,255,255,.9)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.CanvasTexture(hc);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.7 });
  const threadMat = new THREE.LineBasicMaterial({ color: 0xf1ede2, transparent: true, opacity: 0.55 });
  const poolC = document.createElement('canvas'); poolC.width = poolC.height = 128;
  const px = poolC.getContext('2d'); const pg = px.createRadialGradient(64, 64, 0, 64, 64, 64);
  pg.addColorStop(0, 'rgba(255,255,255,1)'); pg.addColorStop(0.55, 'rgba(255,255,255,.35)'); pg.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = pg; px.fillRect(0, 0, 128, 128);
  const poolTex = new THREE.CanvasTexture(poolC);
  const col = (h) => new THREE.Color(h);
  const css = (c) => `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
  function paintBackdrop(b) {
    const bg = col(b.bg), glow = b.dark ? bg.clone().lerp(col(b.accent), 0.16).lerp(col(b.bg2), 0.4) : bg.clone().lerp(col('#ffffff'), 0.55);
    const edge = b.dark ? bg.clone().multiplyScalar(0.72) : col(b.bg2);
    const c = bdTex.image; c.width = 512; c.height = 320; const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 150, 10, 256, 160, 330); g.addColorStop(0, css(glow)); g.addColorStop(0.5, css(bg)); g.addColorStop(1, css(edge));
    x.fillStyle = g; x.fillRect(0, 0, 512, 320); bdTex.needsUpdate = true;
  }
  function paintCurtain(b) {
    const base = col(b.bg2), lo = b.dark ? base.clone().multiplyScalar(0.55) : base.clone().multiplyScalar(0.8), hi = b.dark ? base.clone().lerp(col(b.accent), 0.07).multiplyScalar(1.35) : base.clone().lerp(col('#ffffff'), 0.35);
    const c = curTex.image; c.width = 512; c.height = 256; const x = c.getContext('2d');
    for (let i = 0; i < 512; i++) {
      const a = i / 512 * Math.PI * 2, t = 0.5 + 0.34 * Math.sin(a * 5) + 0.16 * Math.sin(a * 13 + 1.3) + 0.08 * Math.sin(a * 29 + 0.4);
      x.fillStyle = css(lo.clone().lerp(hi, Math.max(0, Math.min(1, t)))); x.fillRect(i, 0, 1, 256);
    }
    x.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < 256; y += 3) x.fillRect(0, y, 512, 1);
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256); curTex.needsUpdate = true;
  }
  const o = { r, scene, cam, group, floor, dust, pieces: [], cz: 4, cx: 0, mx: 0, visible: false, narrow: false, progress: 0 };

  const size = () => { const w = stick.clientWidth, h = stick.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; o.narrow = w / h < 0.9; cam.updateProjectionMatrix(); };
  size(); window.addEventListener('resize', size);
  stick.addEventListener('pointermove', (e) => { const b = stick.getBoundingClientRect(); o.mx = ((e.clientX - b.left) / b.width - 0.5) * 2; });

  o.build = (keys, brand) => {
    o.pieces.forEach((p) => {
      group.remove(p.g);
      p.g.traverse((nd) => { if (nd.geometry) nd.geometry.dispose(); if (nd.material && nd.material !== frameMat && nd.material !== threadMat) { if (nd.material.map && nd.material.map !== halo) nd.material.map.dispose(); nd.material.dispose(); } });
      group.remove(p.pool); p.pool.geometry.dispose(); p.pool.material.dispose();
    });
    o.pieces = [];
    keys.forEach((k, i) => {
      const it = ITEMS[k], im = IMG[it.img];
      const aspect = Math.max(0.5, Math.min(1.8, im.w / im.h));
      let W, H; if (aspect >= 2.6 / 2.2) { W = 2.6; H = W / aspect; } else { H = 2.2; W = H * aspect; }
      const g = new THREE.Group(), side = i % 2 ? 1 : -1;
      g.position.set(side * 1.75, 0.15, -i * 5); g.rotation.y = -side * 0.16;
      g.add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, H + 0.12, 0.06), frameMat));
      const tex = new THREE.Texture(im.el); tex.needsUpdate = true; tex.anisotropy = 4;
      const art = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); art.position.z = 0.04; g.add(art);
      const hm = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: halo, color: new THREE.Color(brand.accent), transparent: true, opacity: brand.dark ? 0.2 : 0, blending: THREE.AdditiveBlending, depthWrite: false })); hm.position.z = -0.2; g.add(hm);
      const pts = new Float32Array([-W / 2 + 0.1, H / 2 + 0.06, 0, -0.25, 9, 0, W / 2 - 0.1, H / 2 + 0.06, 0, 0.25, 9, 0]);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pts, 3)); g.add(new THREE.LineSegments(lg, threadMat));
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.2), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: brand.dark ? THREE.AdditiveBlending : THREE.NormalBlending, color: new THREE.Color(brand.dark ? brand.accent : '#14233a'), opacity: brand.dark ? 0.2 : 0.16 }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(side * 1.75 + side * -0.2, -1.73, -i * 5 + 0.3); group.add(pool);
      group.add(g); o.pieces.push({ g, art, W, H, ph: i * 1.7, halo: hm, pool });
    });
    o.theme(brand);
  };

  o.theme = (b) => {
    const bg = col(b.bg);
    const fogC = b.dark ? bg.clone().multiplyScalar(0.8) : col(b.bg2).lerp(bg, 0.5);
    scene.background = fogC; scene.fog.color = fogC; scene.fog.near = 7; scene.fog.far = 30;
    floor.material.color.copy(b.dark ? bg.clone().multiplyScalar(0.6) : col(b.bg2).multiplyScalar(0.92));
    paintBackdrop(b); paintCurtain(b);
    threadMat.color.set(b.thread); dust.material.color.set(b.thread); dust.material.opacity = b.dark ? 0.5 : 0.28;
    frameMat.color.set(b.dark ? 0x2a2118 : 0x3a3228);
    o.pieces.forEach((p) => { p.halo.material.color.set(b.accent); p.halo.material.opacity = b.dark ? 0.2 : 0; });
  };

  /** Screen rectangle (viewport px) of piece i, used to start the shared-element flight to the detail page. */
  o.rectOf = (i) => {
    const p = o.pieces[i]; if (!p) return null;
    p.g.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    const b = canvas.getBoundingClientRect();
    const xs = [], ys = [];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      const v = new THREE.Vector3(sx * p.W / 2, sy * p.H / 2, 0); p.art.localToWorld(v); v.project(cam);
      xs.push(b.left + (v.x * 0.5 + 0.5) * b.width); ys.push(b.top + (-v.y * 0.5 + 0.5) * b.height);
    });
    const left = Math.min(...xs), top = Math.min(...ys);
    return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
  };

  o.frame = (dt, t) => {
    const cnt = o.pieces.length; if (!cnt) return 0;
    const target = 4 - 5 * (cnt - 1) * o.progress, k = 1 - Math.exp(-dt * 6);
    o.cz += (target - o.cz) * k;
    const idx = Math.max(0, Math.min(cnt - 1, Math.round(o.progress * (cnt - 1))));
    const side = (idx % 2 ? 1 : -1) * 1.75;
    o.cx += (((o.narrow ? side * 0.95 : side * 0.35) + o.mx * 0.25) - o.cx) * k;
    const cy = o.narrow ? -0.55 : 0.15;
    cam.position.set(o.cx, cy, o.cz + (o.narrow ? 1 : 0));
    cam.lookAt(o.narrow ? o.cx : o.cx * 0.6, cy * 0.9, o.cz - 6);
    o.pieces.forEach((p) => { p.g.rotation.z = Math.sin(t * 0.7 + p.ph) * 0.012; p.g.position.y = 0.15 + Math.sin(t * 0.5 + p.ph) * 0.02; });
    dust.rotation.y = Math.sin(t * 0.05) * 0.1; dust.position.y = Math.sin(t * 0.2) * 0.15;
    r.render(scene, cam);
    return idx;
  };
  return o;
}
