/* ============================================================
   scene.js — Three.js neural-network particle field (hero bg)
   Violet → cyan palette, mouse parallax, mobile-aware.
   ============================================================ */

import * as THREE from "three";

const canvas = document.getElementById("heroCanvas");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduced) {
  try {
    init();
  } catch (err) {
    // WebGL unavailable — the CSS gradient glow stays as the fallback.
    canvas.style.display = "none";
    console.warn("Hero 3D scene disabled:", err.message);
  }
}

function init() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const COUNT = isMobile ? 110 : 240;
  const SPARK_COUNT = isMobile ? 24 : 60;
  const BOUNDS = 24;
  const LINK_DIST = isMobile ? 5.5 : 4.8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 26;

  const group = new THREE.Group();
  scene.add(group);

  // soft round sprite so points render as glowing dots, not squares
  const dotTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.8)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  // --- particles: violet → cyan → magenta palette ---
  const PALETTE = [
    new THREE.Color(0x8b5cf6), // violet
    new THREE.Color(0x22d3ee), // cyan
    new THREE.Color(0xd946ef), // magenta
    new THREE.Color(0x67e8f9), // bright cyan
    new THREE.Color(0xa78bfa)  // light violet
  ];
  const pickColor = () => {
    const a = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const b = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return a.clone().lerp(b, Math.random());
  };

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const velocities = [];

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOUNDS * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS;
    positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS * 0.6;

    const c = pickColor();
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.014,
      (Math.random() - 0.5) * 0.014,
      (Math.random() - 0.5) * 0.007
    ));
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pMat = new THREE.PointsMaterial({
    size: isMobile ? 0.3 : 0.26,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  group.add(new THREE.Points(pGeo, pMat));

  // --- bright sparks: bigger, brighter accent points with slow pulse ---
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkCol = new Float32Array(SPARK_COUNT * 3);
  const SPARK_PALETTE = [
    new THREE.Color(0xe879f9), // bright magenta
    new THREE.Color(0x67e8f9), // bright cyan
    new THREE.Color(0xc4b5fd), // bright violet
    new THREE.Color(0xffffff)
  ];
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * BOUNDS * 2;
    sparkPos[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS * 0.6;
    const c = SPARK_PALETTE[Math.floor(Math.random() * SPARK_PALETTE.length)];
    sparkCol[i * 3] = c.r;
    sparkCol[i * 3 + 1] = c.g;
    sparkCol[i * 3 + 2] = c.b;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  sGeo.setAttribute("color", new THREE.BufferAttribute(sparkCol, 3));
  const sMat = new THREE.PointsMaterial({
    size: isMobile ? 0.6 : 0.52,
    map: dotTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  group.add(new THREE.Points(sGeo, sMat));

  // --- connection lines (preallocated worst-case buffer) ---
  const maxLinks = (COUNT * (COUNT - 1)) / 2;
  const linePos = new Float32Array(maxLinks * 6);
  const lineCol = new Float32Array(maxLinks * 6);
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));

  const lMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  group.add(new THREE.LineSegments(lGeo, lMat));

  // --- mouse parallax ---
  let targetRX = 0, targetRY = 0;
  if (!isMobile) {
    window.addEventListener("mousemove", (e) => {
      targetRY = (e.clientX / window.innerWidth - 0.5) * 0.35;
      targetRX = (e.clientY / window.innerHeight - 0.5) * 0.25;
    }, { passive: true });
  }

  // --- resize ---
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // --- visibility: pause when tab hidden or hero scrolled away ---
  let heroVisible = true;
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; })
    .observe(canvas);

  // --- animation loop ---
  const linkDistSq = LINK_DIST * LINK_DIST;

  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden || !heroVisible) return;

    const pos = pGeo.attributes.position.array;

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      if (Math.abs(pos[i * 3]) > BOUNDS) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > BOUNDS * 0.55) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > BOUNDS * 0.35) velocities[i].z *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    // rebuild links
    let li = 0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq < linkDistSq) {
          const fade = 1 - dSq / linkDistSq;
          for (let k = 0; k < 2; k++) {
            const src = k === 0 ? i : j;
            linePos[li * 6 + k * 3] = pos[src * 3];
            linePos[li * 6 + k * 3 + 1] = pos[src * 3 + 1];
            linePos[li * 6 + k * 3 + 2] = pos[src * 3 + 2];
            lineCol[li * 6 + k * 3] = colors[src * 3] * fade;
            lineCol[li * 6 + k * 3 + 1] = colors[src * 3 + 1] * fade;
            lineCol[li * 6 + k * 3 + 2] = colors[src * 3 + 2] * fade;
          }
          li++;
        }
      }
    }
    lGeo.setDrawRange(0, li * 2);
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;

    // spark pulse
    sMat.opacity = 0.65 + Math.sin(performance.now() * 0.0016) * 0.25;

    // gentle drift + mouse parallax
    group.rotation.y += (targetRY - group.rotation.y) * 0.04;
    group.rotation.x += (targetRX - group.rotation.x) * 0.04;
    group.rotation.z += 0.0004;

    renderer.render(scene, camera);
  }
  tick();
}
