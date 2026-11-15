/* 3D study of Staša's black straw hat with the bow (wide, wave-edged brim),
   on a white long-necked stand, in front of the red curtain.
   Built from geometry in code: no model file to download. */
import * as THREE from "../vendor/three.module.min.js";

const host = document.getElementById("hat3d");
if (host) init(host);

function init(host) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: true, powerPreference: "high-performance" });
  } catch (e) { host.classList.add("no-webgl"); return; }
  renderer.setPixelRatio(Math.min(touch ? 1.3 : 1.75, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.7, 6.4);
  camera.lookAt(0, -0.32, 0);

  // --- light: warm key, soft fill, red bounce from the curtain behind
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x3a1010, 0.55));
  const key = new THREE.DirectionalLight(0xfff1e2, 2.6); key.position.set(-2.4, 3.2, 3.2); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(2.5, 0.5, 2.5); scene.add(fill);
  const under = new THREE.DirectionalLight(0xffe9e0, 0.9); under.position.set(0, -2.5, 2.5); scene.add(under);
  const rim = new THREE.DirectionalLight(0xff3b30, 2.4); rim.position.set(0.5, 1.4, -3); scene.add(rim);

  // --- straw braid texture: fine concentric lines (bump) + slight tonal variation (colour)
  function strawTexture() {
    const c = document.createElement("canvas"); c.width = 64; c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#808080"; g.fillRect(0, 0, 64, 512);
    for (let y = 0; y < 512; y += 6) {
      const v = 150 + Math.random() * 60;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 64, 3.2);
      g.fillStyle = "rgb(40,40,40)"; g.fillRect(0, y + 4, 64, 0.8);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const bump = strawTexture();
  const brimBump = bump.clone(); brimBump.needsUpdate = true; brimBump.repeat.set(1, 6);
  const crownBump = bump.clone(); crownBump.needsUpdate = true; crownBump.repeat.set(1, 3);

  const straw = (map) => new THREE.MeshPhysicalMaterial({
    color: 0x121111, roughness: 0.48, metalness: 0.05,
    sheen: 0.7, sheenColor: new THREE.Color(0x6a6a6a), sheenRoughness: 0.5,
    clearcoat: 0.15, clearcoatRoughness: 0.6,
    bumpMap: map, bumpScale: 1.4, side: THREE.DoubleSide
  });

  const hat = new THREE.Group();

  // --- brim: an annulus whose outer part rolls into big soft waves
  const R0 = 0.37, R1 = 1.12, SEG = 220, RINGS = 34;
  const wave = (t, a) =>
    0.15 * Math.pow(t, 1.6) * Math.sin(3 * a + 0.7) +
    0.09 * Math.pow(t, 1.8) * Math.sin(2 * a + 2.4) +
    0.05 * Math.pow(t, 2.2) * Math.sin(5 * a + 1.9) +
    0.13 * t * Math.cos(a - 0.4) -           // one side lifts
    0.05 * t * t;
  const radius = (t, a) => (R0 + (R1 - R0) * t) * (1 + 0.07 * t * Math.sin(3 * a + 2.2) + 0.03 * t * Math.sin(5 * a));
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= RINGS; j++) {
    const t = j / RINGS;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2, r = radius(t, a);
      pos.push(Math.cos(a) * r, wave(t, a), Math.sin(a) * r);
      uv.push(i / SEG, t);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) {
    const a = j * (SEG + 1) + i, b = a + SEG + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const brimGeo = new THREE.BufferGeometry();
  brimGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  brimGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  brimGeo.setIndex(idx); brimGeo.computeVertexNormals();
  hat.add(new THREE.Mesh(brimGeo, straw(brimBump)));

  // bound edge of the brim
  const edgePts = [];
  for (let i = 0; i < SEG; i++) { const a = (i / SEG) * Math.PI * 2, r = radius(1, a); edgePts.push(new THREE.Vector3(Math.cos(a) * r, wave(1, a), Math.sin(a) * r)); }
  const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePts, true), 400, 0.011, 6, true),
    new THREE.MeshStandardMaterial({ color: 0x0c0b0b, roughness: 0.35 }));
  hat.add(edge);

  // --- crown: lathe profile, soft dome
  const prof = [[0.37, 0.0], [0.375, 0.1], [0.37, 0.2], [0.34, 0.28], [0.27, 0.34], [0.16, 0.375], [0.0, 0.385]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  const crown = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), straw(crownBump));
  hat.add(crown);

  // --- bow: folded straw ribbon loops on the crown
  function ribbonLoop(points, width) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), true);
    const N = 120, P = [], I = [], UV = [];
    const up = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = curve.getPointAt(u % 1), tan = curve.getTangentAt(u % 1);
      const side = new THREE.Vector3().crossVectors(tan, up).normalize().cross(tan).normalize().multiplyScalar(width / 2);
      P.push(p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z);
      UV.push(0, u * 4, 1, u * 4);
      if (i < N) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
    g.setIndex(I); g.computeVertexNormals();
    return g;
  }
  const bowMat = straw(crownBump);
  const bow = new THREE.Group();
  const loopL = [[0, 0, 0], [-0.1, 0.07, 0.02], [-0.24, 0.1, 0.03], [-0.3, 0.02, 0.02], [-0.22, -0.06, 0.01], [-0.08, -0.03, 0]];
  bow.add(new THREE.Mesh(ribbonLoop(loopL, 0.12), bowMat));
  bow.add(new THREE.Mesh(ribbonLoop(loopL.map(p => [-p[0] * 0.85, p[1] * 1.1, p[2]]), 0.12), bowMat));
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), bowMat); knot.scale.set(1, 1.15, 0.7); bow.add(knot);
  // place the bow on the front-right of the crown, following its curve
  const bowAngle = -0.75;
  bow.position.set(Math.cos(bowAngle) * 0.33, 0.27, Math.sin(-bowAngle) * 0.33);
  bow.lookAt(bow.position.clone().multiplyScalar(2).setY(0.45));
  bow.scale.setScalar(1.45);
  hat.add(bow);

  // --- white stand: head + long neck + block
  const white = new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.92 });
  const stand = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), white); head.scale.set(1.02, 1.14, 1.08); head.position.set(0, -0.2, 0.02);
  const neckProf = [[0.0, -1.62], [0.17, -1.62], [0.15, -1.3], [0.12, -0.9], [0.115, -0.5], [0.14, -0.45], [0.0, -0.44]].map(p => new THREE.Vector2(p[0], p[1]));
  const neck = new THREE.Mesh(new THREE.LatheGeometry(neckProf, 48), white); neck.rotation.x = 0.06;
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.75), white); block.position.y = -1.73;
  stand.add(head, neck, block);

  // hat sits low and tilted on the head
  hat.position.set(0.02, -0.1, 0);
  hat.rotation.set(-0.1, 0, 0.14);

  const model = new THREE.Group();
  model.add(stand, hat);
  model.position.y = 0.45;
  scene.add(model);

  // --- size, interaction, render only when visible
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.8 ? 8.6 : 6.4;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(host);

  /* controls: drag sideways to turn (mouse and touch), drag up/down with a mouse to tilt,
     double-click / double-tap to reset. On phones vertical drags still scroll the page. */
  let yaw = -0.5, pitch = 0, tPitch = 0, vel = 0, dragging = false, lastX = 0, lastY = 0, visible = false, raf = 0, lastT = 0, idleUntil = 0;
  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  const wake = () => { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); } };
  el.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; vel = 0;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    host.classList.add("is-dragging", "was-touched"); wake();
  });
  el.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    yaw += dx * 0.012; vel = dx * 0.012;
    if (e.pointerType === "mouse") tPitch = Math.max(-0.35, Math.min(0.45, tPitch + dy * 0.006));
    idleUntil = performance.now() + 2600; wake();
  });
  const end = () => { if (!dragging) return; dragging = false; host.classList.remove("is-dragging"); idleUntil = performance.now() + 2600; host.dataset.yaw = yaw.toFixed(2); };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end); el.addEventListener("lostpointercapture", end);
  el.addEventListener("dblclick", () => { tPitch = 0; vel = 0; yaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2 - 0.5; wake(); });
  // keyboard: arrow keys turn the hat
  host.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { yaw -= 0.25; e.preventDefault(); }
    if (e.key === "ArrowRight") { yaw += 0.25; e.preventDefault(); }
    if (!visible || reduce) draw();
  });

  function draw() {
    model.rotation.y = yaw;
    model.rotation.x = pitch;
    renderer.render(scene, camera);
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    if (!dragging) {
      yaw += vel; vel *= 0.93;                                       // glide after a flick
      if (!reduce && t > idleUntil) yaw += dt * 0.3;                 // turn on its own when left alone
    }
    pitch += (tPitch - pitch) * 0.12;
    draw();
    raf = visible || dragging || Math.abs(vel) > 0.0005 ? requestAnimationFrame(loop) : 0;
  }
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) wake();
  }, { rootMargin: "200px" }).observe(host);
  draw();
  host.classList.add("is-ready");
}
