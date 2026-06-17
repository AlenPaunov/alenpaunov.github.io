/* ============================================================
   main.js — GSAP animations, cursor, counters, menu, rotator
   ============================================================ */

document.documentElement.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initMenu();
  initCursor();
  initCardGlow();

  const revealAll = () => {
    document.documentElement.classList.add("no-gsap");
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".stat__num").forEach((el) => {
      el.textContent = formatCount(+el.dataset.count) + (el.dataset.suffix || "");
    });
  };

  // If animation libs aren't ready (or motion is reduced), show everything immediately.
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (prefersReducedMotion || !gsapReady) {
    revealAll();
    return;
  }

  try {
    gsap.registerPlugin(ScrollTrigger);
    initHeroIntro();
    initReveals();
    initCounters();
    initRotator();
    initMagnetic();
    initMarquee();
    initTilt();
    initAppearPreview();
  } catch (err) {
    // Something failed mid-setup — never leave the hero/content hidden.
    revealAll();
  }
});

/* ---------- nav scrolled state ---------- */
function initNav() {
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- mobile menu ---------- */
function initMenu() {
  const burger = document.getElementById("burger");
  const overlay = document.getElementById("menuOverlay");

  const close = () => {
    burger.classList.remove("is-open");
    overlay.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  burger.addEventListener("click", () => {
    const open = !overlay.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    overlay.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  overlay.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* ---------- custom cursor ---------- */
function initCursor() {
  if (!isFinePointer || prefersReducedMotion) return;
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let rx = -100, ry = -100; // ring position (lerped)
  let mx = -100, my = -100;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.opacity = "1";
    ring.style.opacity = "1";
    dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll("a, button, .card").forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });
}

/* ---------- expertise card mouse glow ---------- */
function initCardGlow() {
  if (!isFinePointer) return;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- hero intro timeline ---------- */
function initHeroIntro() {
  // NOTE: the hero title words animate via pure CSS (@keyframes heroWordUp) so they can
  // never get stuck hidden if GSAP misbehaves. GSAP only handles the rest of the hero.
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.fromTo(".hero__kicker", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.15)
    .fromTo(".hero__sub", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.55)
    .fromTo(".hero__cta .btn", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 }, 0.75)
    .fromTo(".hero__scroll", { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.0)
    .fromTo(".nav", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.4);
}

/* ---------- scroll reveals ---------- */
function initReveals() {
  document.querySelectorAll(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });
}

/* ---------- animated counters ---------- */
function formatCount(n) {
  const locale = (typeof currentLang !== "undefined" && currentLang === "bg") ? "bg-BG" : "en-US";
  return n >= 1000 ? n.toLocaleString(locale) : String(n);
}

function initCounters() {
  document.querySelectorAll(".stat__num").forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate() {
        el.textContent = formatCount(Math.round(obj.val)) + suffix;
      }
    });
  });
}

/* ---------- rotating hero word ---------- */
function initRotator() {
  const el = document.getElementById("rotatorWord");
  let words = I18N[currentLang].rotator;
  let i = 0;

  document.addEventListener("langchange", (e) => {
    words = I18N[e.detail.lang].rotator;
    i = 0;
    el.textContent = words[0];
  });

  el.textContent = words[0];

  setInterval(() => {
    gsap.to(el, {
      y: -14,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete() {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        gsap.fromTo(el, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
      }
    });
  }, 2600);
}

/* ---------- magnetic elements ---------- */
function makeMagnetic(el, strength, maxShift = 60) {
  const clamp = (v) => Math.max(-maxShift, Math.min(maxShift, v));
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(el, { x: clamp(x * strength), y: clamp(y * strength), duration: 0.4, ease: "power3.out" });
  });
  el.addEventListener("mouseleave", () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  });
}

function initMagnetic() {
  if (!isFinePointer) return;
  document.querySelectorAll(".magnetic").forEach((el) => makeMagnetic(el, 0.25));
  // section titles drift gently toward the cursor
  document.querySelectorAll(".section__title, .contact__title, .hero__kicker, .section__label")
    .forEach((el) => makeMagnetic(el, 0.08, 16));
}

/* ---------- seamless marquee (GSAP-driven, speeds up with scroll) ---------- */
function initMarquee() {
  const track = document.getElementById("marqueeTrack");
  if (!track) return;

  const baseSpeed = 0.6; // px per frame at 60fps
  let scrollBoost = 0;
  let lastScrollY = window.scrollY;
  let offset = 0;
  const quarter = () => track.scrollWidth / 4; // 4 identical items

  window.addEventListener("scroll", () => {
    scrollBoost += Math.min(Math.abs(window.scrollY - lastScrollY) * 0.05, 6);
    lastScrollY = window.scrollY;
  }, { passive: true });

  gsap.ticker.add(() => {
    scrollBoost *= 0.92;
    offset -= baseSpeed + scrollBoost;
    const q = quarter();
    if (q > 0 && -offset >= q) offset += q;
    track.style.transform = `translateX(${offset}px)`;
  });
}

/* ---------- 3D tilt on expertise cards ---------- */
function initTilt() {
  if (!isFinePointer) return;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: px * 7,
        rotateX: -py * 7,
        y: -4,
        transformPerspective: 800,
        duration: 0.5,
        ease: "power2.out"
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });
    });
  });
}

/* ---------- appearances: floating image preview ---------- */
function initAppearPreview() {
  if (!isFinePointer) return;
  const preview = document.getElementById("appearPreview");
  if (!preview) return;

  let mx = 0, my = 0, px = 0, py = 0;
  let active = false;

  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  gsap.ticker.add(() => {
    if (!active) return;
    px += (mx - px) * 0.18;
    py += (my - py) * 0.18;
    preview.style.left = `${px + 28}px`;
    preview.style.top = `${py - 90}px`;
  });

  document.querySelectorAll(".appear__row a").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const img = row.dataset.img;
      if (!img) return;
      preview.src = img;
      px = mx; py = my;
      active = true;
      preview.classList.add("is-visible");
    });
    row.addEventListener("mouseleave", () => {
      active = false;
      preview.classList.remove("is-visible");
    });
  });
}
