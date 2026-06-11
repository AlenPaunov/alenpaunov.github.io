/* ============================================================
   gallery.js — inside-a-sphere appearances gallery
   Camera sits at the centre; tiles line the sphere's inner wall.
   Drag / scroll rotates with Lenis-style damped easing.
   Click a tile → it flies to the camera and a detail page opens.
   ============================================================ */

import * as THREE from "three";

/* ---------- data ---------- */
const ITEMS = [
  { tag: "PRESS", title: "Какво научихме, докато обучавахме другите?", outlet: "Economy.bg", year: "2026", url: "https://www.economy.bg/business/view/63765/Alen-Paunov-ot-Sirma-Academy-Kakvo-nauchihme-dokato-obuchavahme-drugite", img: "img/gallery/economy.jpg", desc: "Интервю за уроците от обучението на хиляди — и какво означава да преподаваш в ерата на AI." },
  { tag: "PRESS", title: "AI не отнема работни места, той ги пренарежда", outlet: "OFFnews", year: "2025", url: "https://tech.offnews.bg/softuer/alen-paunov-sirma-academy-ai-ne-otnema-rabotni-mesta-toj-gi-prenare-23446.html", img: "img/gallery/offnews.jpg", desc: "Разговор за бъдещето на труда и как AI пренарежда професиите, вместо да ги изтрива." },
  { tag: "LECTURE", title: "AI Tools Introduction — Practical AI", outlet: "Sirma Academy", year: "2025", url: "https://www.youtube.com/watch?v=xwQ-4JJi9PQ", img: "img/gallery/sirma-lecture.jpg", desc: "Откриваща лекция от програмата Practical AI — съвременните AI инструменти през реални казуси." },
  { tag: "PODCAST", title: "Sirma Academy и кариерното развитие", outlet: "Старт БГ Подкаст", year: "2024", url: "https://www.youtube.com/watch?v=-P3bE9-IkzM", img: "img/gallery/start-podcast.jpg", desc: "Епизод за влизането в IT индустрията и ролята на академиите в кариерния път." },
  { tag: "TV", title: "AI все повече прилича на голям балон", outlet: "Bloomberg TV", year: "2025", url: "https://www.bloombergtv.bg/a/16-biznes-start/148122-edin-miliard-dolara-za-izsledovatel-ai-vse-poveche-prilicha-na-golyam-balon", img: "img/gallery/bloomberg-balon.jpg", desc: "Гост в „Бизнес старт“ — за инвестиционната еуфория, агентния модел и какво следва след LLM вълната." },
  { tag: "TV", title: "Sirma Academy стартира практически AI курсове", outlet: "Bloomberg TV", year: "2025", url: "https://www.bloombergtv.bg/a/28-update/142037-sirma-academy-startira-prakticheski-kursove-po-izkustven-intelekt", img: "img/gallery/bloomberg-sirma.jpg", desc: "Представяне на новата програма Practical AI в ефира на Bloomberg TV Bulgaria." },
  { tag: "PODCAST", title: "Вход в IT индустрията през 2025", outlet: "ГИТИ", year: "2025", url: "https://www.youtube.com/watch?v=YCKp4DJq5Vc", img: "img/gallery/giti-podcast.jpg", desc: "„Гласът на IT индустрията“ — за реалистичния път към първата работа в технологиите." },
  { tag: "RADIO", title: "Учителите са пътеводната светлина на всяка нация", outlet: "БНР · Христо Ботев", year: "", url: "https://bnr.bg/hristobotev/post/101410930", img: "img/gallery/bnr.jpg", desc: "Радиоразговор за призванието на учителя и силата на образованието." },
  { tag: "PRESS", title: "Софтуерното инженерство е създателят на бъдещето", outlet: "Investor.bg", year: "", url: "https://www.investor.bg/imenata-na-biznesa/263/a/softuernoto-injenerstvo-e-syzdateliat-na-bydeshteto-na-choveshkata-civilizaciia-312117/", img: "img/gallery/investor.jpg", desc: "„Имената на бизнеса“ — защо софтуерът е двигателят на човешката цивилизация." },
  { tag: "PRESS", title: "Най-важното, за да станеш програмист", outlet: "168 часа", year: "", url: "https://www.168chasa.bg/article/8355133", img: "img/gallery/168chasa.jpg", desc: "Какво наистина има значение по пътя към програмирането — отвъд клишетата." },
  { tag: "TV", title: "Кои са популярните софтуерни технологии?", outlet: "TV Europa", year: "2019", url: "https://www.tvevropa.com/2019/12/koi-sa-populyarnite-softuerni-tehnologii/", img: null, desc: "Телевизионен разговор за технологичните тенденции и пътя към IT професиите." },
  { tag: "TV", title: "Разговори за бъдещето", outlet: "MM TV", year: "", url: "https://mmtvmusic.com/mm-player/most-viewed/shows/razgovori-za-bydeshteto-s-alen-paunov/", img: "img/gallery/mmtv.jpg", desc: "Шоу за бъдещето на образованието, технологиите и хората между тях." },
  { tag: "PRESS", title: "Платформа за обучение изкарва частните уроци на светло", outlet: "Dnes.bg", year: "2021", url: "https://www.dnes.bg/obrazovanie/2021/03/16/platforma-za-obuchenie-izkarva-chastnite-uroci-na-svetlo.483403", img: null, desc: "Историята на TeachMe — платформата, която свързва учащи и преподаватели." },
  { tag: "VIDEO", title: "Програмиране за начинаещи с C#", outlet: "TeachMe · YouTube", year: "2021", url: "https://www.youtube.com/watch?v=O7ow6RirzcY", img: "img/gallery/teachme-csharp.jpg", desc: "Урок на живо от курса по C# за начинаещи — условни конструкции." }
];

const canvas = document.getElementById("galleryCanvas");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(pointer: coarse)").matches;

/* ---------- renderer / scene / camera ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setClearColor(0x07070b, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(isTouch ? 82 : 72, 1, 0.1, 200);
camera.position.set(0, 0, 0.001); // inside the sphere

const sphere = new THREE.Group();
scene.add(sphere);

/* ---------- background stars (seen through the gaps) ---------- */
(function addStars() {
  const N = 500;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const palette = [new THREE.Color(0x8b5cf6), new THREE.Color(0x22d3ee), new THREE.Color(0xd946ef), new THREE.Color(0xffffff)];
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 50);
    pos.set([v.x, v.y, v.z], i * 3);
    const c = palette[Math.floor(Math.random() * palette.length)];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(g, m));
})();

/* ---------- placeholder texture for items without an image ---------- */
function makeTextTexture(item) {
  const c = document.createElement("canvas");
  c.width = 640; c.height = 400;
  const x = c.getContext("2d");
  const grad = x.createLinearGradient(0, 0, 640, 400);
  grad.addColorStop(0, "#15101f");
  grad.addColorStop(1, "#0a1118");
  x.fillStyle = grad;
  x.fillRect(0, 0, 640, 400);
  const border = x.createLinearGradient(0, 0, 640, 400);
  border.addColorStop(0, "#8b5cf6");
  border.addColorStop(1, "#22d3ee");
  x.strokeStyle = border;
  x.lineWidth = 4;
  x.strokeRect(10, 10, 620, 380);
  x.fillStyle = "#22d3ee";
  x.font = "500 22px 'JetBrains Mono', monospace";
  x.fillText(item.tag, 48, 80);
  x.fillStyle = "#eceaf4";
  x.font = "600 40px 'Clash Display', sans-serif";
  wrapText(x, item.outlet, 48, 200, 544, 48);
  x.fillStyle = "#8d8a9e";
  x.font = "400 24px 'Satoshi', sans-serif";
  wrapText(x, item.title, 48, 280, 544, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function wrapText(x, text, px, py, maxW, lh) {
  const words = text.split(" ");
  let line = "", y = py;
  for (const w of words) {
    if (x.measureText(line + w).width > maxW && line) {
      x.fillText(line, px, y);
      line = w + " "; y += lh;
      if (y > py + lh * 2) { x.fillText(line + "…", px, y); return; }
    } else line += w + " ";
  }
  x.fillText(line.trim(), px, y);
}

/* ---------- build tiles on the inner sphere wall ---------- */
const RADIUS = 16;
const ROWS = [
  { phi: -38, cols: 9 },
  { phi: -19, cols: 12 },
  { phi: 0,   cols: 13 },
  { phi: 19,  cols: 12 },
  { phi: 38,  cols: 9 }
];

const tiles = [];
const loadManager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(loadManager);
const textureCache = new Map();

function getTexture(item) {
  const key = item.img || item.title;
  if (textureCache.has(key)) return textureCache.get(key);
  let tex;
  if (item.img) {
    tex = texLoader.load(item.img);
    tex.colorSpace = THREE.SRGBColorSpace;
  } else {
    tex = makeTextTexture(item);
  }
  textureCache.set(key, tex);
  return tex;
}

let tileIndex = 0;
ROWS.forEach((row, rowIdx) => {
  const phi = THREE.MathUtils.degToRad(row.phi);
  const ringR = RADIUS * Math.cos(phi);
  const y = RADIUS * Math.sin(phi);
  const arc = (2 * Math.PI * ringR) / row.cols;
  const w = arc * 0.66;
  const h = Math.min(w * 0.64, 5.2);
  const thetaOffset = (rowIdx % 2) * (Math.PI / row.cols); // brick offset

  for (let c = 0; c < row.cols; c++) {
    const item = ITEMS[tileIndex % ITEMS.length];
    tileIndex++;
    const theta = (c / row.cols) * Math.PI * 2 + thetaOffset;
    const xPos = ringR * Math.sin(theta);
    const zPos = ringR * Math.cos(theta);

    const mat = new THREE.MeshBasicMaterial({
      map: getTexture(item),
      transparent: true,
      opacity: 1,
      side: THREE.FrontSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(xPos, y, zPos);
    mesh.lookAt(0, 0, 0);
    mesh.userData = { item, baseScale: 1, homePos: mesh.position.clone(), homeQuat: mesh.quaternion.clone() };
    sphere.add(mesh);
    tiles.push(mesh);
  }
});

document.getElementById("itemCount").textContent = `${ITEMS.length} ПУБЛИКАЦИИ`;

/* ---------- loader → intro ---------- */
const loaderEl = document.getElementById("loader");
const pctEl = document.getElementById("loaderPct");
const barEl = document.getElementById("loaderBar");
let introDone = false;

loadManager.onProgress = (_url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  pctEl.textContent = pct + "%";
  barEl.style.width = pct + "%";
};
loadManager.onLoad = startIntro;
// If every texture was cached/canvas-generated, onLoad may never fire.
if (ITEMS.every((i) => !i.img)) startIntro();
setTimeout(() => { if (!introDone) startIntro(); }, 6000); // network safety net

function startIntro() {
  if (introDone) return;
  introDone = true;
  gsap.to(loaderEl, { opacity: 0, duration: 0.6, delay: 0.2, onComplete: () => loaderEl.remove() });

  if (reduced) return;
  tiles.forEach((t) => t.scale.setScalar(0.001));
  gsap.to(tiles.map((t) => t.scale), {
    x: 1, y: 1, z: 1,
    duration: 1.1,
    ease: "back.out(1.4)",
    stagger: { each: 0.012, from: "random" }
  });
  gsap.from("#centerTitle", { opacity: 0, y: 30, duration: 1, delay: 0.4, ease: "power3.out" });
}

/* ---------- drag / scroll rotation with damped easing ---------- */
let targetRotY = 0, targetRotX = 0;
let curRotY = 0, curRotX = 0;
let velY = 0, velX = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let downX = 0, downY = 0;
let lastInteraction = performance.now();
let detailOpen = false;

const MAX_PITCH = THREE.MathUtils.degToRad(42);
const clampPitch = (v) => Math.max(-MAX_PITCH, Math.min(MAX_PITCH, v));

canvas.addEventListener("pointerdown", (e) => {
  if (detailOpen) return;
  dragging = true;
  canvas.classList.add("is-dragging");
  lastX = downX = e.clientX;
  lastY = downY = e.clientY;
  velY = velX = 0;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (detailOpen) return;
  lastInteraction = performance.now();
  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const k = 0.0035;
    targetRotY += dx * k;
    targetRotX = clampPitch(targetRotX - dy * k);
    velY = dx * k;
    velX = -dy * k;
    hideHintOnce();
  } else {
    updateHover(e);
  }
});

canvas.addEventListener("pointerup", (e) => {
  canvas.classList.remove("is-dragging");
  if (!dragging) return;
  dragging = false;
  const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (dist < 6 && !detailOpen) tryOpenAt(e);
});
canvas.addEventListener("pointercancel", () => { dragging = false; canvas.classList.remove("is-dragging"); });

window.addEventListener("wheel", (e) => {
  if (detailOpen) return;
  lastInteraction = performance.now();
  targetRotY += e.deltaY * 0.0009;
  targetRotX = clampPitch(targetRotX + e.deltaX * 0.0006);
  hideHintOnce();
}, { passive: true });

let hintHidden = false;
function hideHintOnce() {
  if (hintHidden) return;
  hintHidden = true;
  gsap.to("#centerTitle", { opacity: 0.25, duration: 0.8 });
  gsap.to("#dragHint", { opacity: 0.3, duration: 0.8 });
}

/* ---------- hover ---------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function pickTile(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(tiles, false);
  return hits.length ? hits[0].object : null;
}

function updateHover(e) {
  if (isTouch || detailOpen) return;
  const hit = pickTile(e);
  if (hit === hovered) return;
  if (hovered) gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "power2.out" });
  hovered = hit;
  canvas.classList.toggle("is-hover", !!hit);
  if (hit) gsap.to(hit.scale, { x: 1.09, y: 1.09, z: 1.09, duration: 0.4, ease: "power2.out" });
}

/* ---------- detail page open / close ---------- */
const detailEl = document.getElementById("detail");
const detailBg = detailEl.querySelector(".detail__bg");
const detailInner = detailEl.querySelector(".detail__inner");
let activeTile = null;

function tryOpenAt(e) {
  const hit = pickTile(e);
  if (hit) openDetail(hit);
}

function openDetail(tile) {
  detailOpen = true;
  activeTile = tile;
  const { item } = tile.userData;

  // populate template
  document.getElementById("detailTag").textContent = item.tag;
  document.getElementById("detailTitle").textContent = item.title;
  document.getElementById("detailMeta").textContent = item.outlet + (item.year ? " · " + item.year : "");
  document.getElementById("detailDesc").textContent = item.desc;
  document.getElementById("detailLink").href = item.url;
  const di = document.getElementById("detailImg");
  if (item.img) { di.src = item.img; di.style.display = ""; }
  else { di.src = tile.material.map.image.toDataURL ? tile.material.map.image.toDataURL() : ""; }

  // fly the tile toward the camera while the rest of the sphere dims
  const worldDir = tile.getWorldPosition(new THREE.Vector3()).normalize();
  const flyTarget = sphere.worldToLocal(worldDir.multiplyScalar(5.2));

  const tl = gsap.timeline();
  tiles.forEach((t) => {
    if (t !== tile) tl.to(t.material, { opacity: 0.05, duration: 0.55, ease: "power2.out" }, 0);
  });
  tl.to(tile.position, { x: flyTarget.x, y: flyTarget.y, z: flyTarget.z, duration: 0.8, ease: "power3.inOut" }, 0)
    .to(tile.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.8, ease: "power3.inOut" }, 0)
    .to("#centerTitle", { opacity: 0, duration: 0.4 }, 0)
    .add(() => { detailEl.classList.add("is-open"); }, 0.45)
    .fromTo(detailBg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.45)
    .fromTo(detailInner.children, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.07 }, 0.6);
}

function closeDetail() {
  if (!detailOpen || !activeTile) return;
  const tile = activeTile;
  const { homePos } = tile.userData;
  const tl = gsap.timeline({ onComplete: () => { detailOpen = false; activeTile = null; } });
  tl.to(detailInner.children, { y: 30, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.03 }, 0)
    .to(detailBg, { opacity: 0, duration: 0.4 }, 0.15)
    .add(() => detailEl.classList.remove("is-open"), 0.55)
    .to(tile.position, { x: homePos.x, y: homePos.y, z: homePos.z, duration: 0.7, ease: "power3.inOut" }, 0.2)
    .to(tile.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "power3.inOut" }, 0.2)
    .to("#centerTitle", { opacity: hintHidden ? 0.25 : 1, duration: 0.5 }, 0.6);
  tiles.forEach((t) => {
    if (t !== tile) tl.to(t.material, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.4);
  });
}

document.getElementById("detailClose").addEventListener("click", closeDetail);
detailBg.addEventListener("click", closeDetail);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });

/* ---------- resize ---------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = (isTouch || w < 700) ? 84 : 72;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

/* ---------- render loop ---------- */
const DAMP = 0.075;
function tick() {
  requestAnimationFrame(tick);
  if (document.hidden) return;

  if (!dragging && !detailOpen) {
    // momentum decay
    targetRotY += velY;
    targetRotX = clampPitch(targetRotX + velX);
    velY *= 0.94;
    velX *= 0.94;
    // gentle idle auto-rotation after 3s of stillness
    if (!reduced && performance.now() - lastInteraction > 3000) targetRotY += 0.00045;
  }

  curRotY += (targetRotY - curRotY) * DAMP;
  curRotX += (targetRotX - curRotX) * DAMP;
  sphere.rotation.set(curRotX, curRotY, 0);

  renderer.render(scene, camera);
}
tick();
