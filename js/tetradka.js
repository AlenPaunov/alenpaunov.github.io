/* ============================================================
   tetradka.js — copy buttons + restrained reveals
   ============================================================ */

document.documentElement.classList.add("js");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initCopyButtons();

  if (reduced || typeof gsap === "undefined") {
    document.querySelectorAll(".t-reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  initHeroChalk();
  initReveals();
});

/* copy prompt to clipboard; the notecard's <pre> holds the text */
function initCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pre = btn.closest(".notecard").querySelector(".notecard__prompt");
      try {
        await navigator.clipboard.writeText(pre.textContent.trim());
        const original = btn.textContent;
        btn.textContent = "преписано ✓";
        btn.classList.add("is-copied");
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("is-copied");
        }, 1800);
      } catch {
        // clipboard API blocked: select the text and try the legacy path
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try {
          if (document.execCommand("copy")) {
            btn.textContent = "преписано ✓";
            setTimeout(() => { btn.textContent = "препиши ✎"; }, 1800);
          }
        } catch { /* text stays selected for manual copy */ }
      }
    });
  });
}

/* hero: the underline draws itself like a chalk stroke,
   pinned items settle in - tells the "writing on the board" story once */
function initHeroChalk() {
  const path = document.querySelector(".hero-board__underline path");
  if (path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    gsap.to(path.style, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.7 });
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".hero-board__welcome", { opacity: 0, y: 14, duration: 0.6 }, 0.1)
    .from(".hero-board__title", { opacity: 0, y: 22, duration: 0.7 }, 0.3)
    .from(".hero-board__sub", { opacity: 0, y: 18, duration: 0.6 }, 0.8)
    .from(".hero-board__cta", { opacity: 0, y: 14, duration: 0.5 }, 1.0)
    .from(".pinned", { opacity: 0, y: -16, rotation: "-=4", duration: 0.6, stagger: 0.15 }, 0.9)
    .from(".chalk-doodle", { opacity: 0, duration: 0.8, stagger: 0.2 }, 1.3);

  // background tabs throttle rAF and can freeze the intro mid-way;
  // make sure the hero is fully visible once the tab gets real frames
  setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, 4500);
}

/* content blocks surface as the page scrolls, once, gently */
function initReveals() {
  const groups = [
    ".startlist__item",
    ".notecard",
    ".book",
    ".verdict",
    ".polaroid",
    ".hand-title",
    ".paper__lead",
    ".homework-board__title",
    ".homework-board__cta"
  ];
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 26,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
  });
}
