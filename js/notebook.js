/* ============================================================
   tetradka.js — copy buttons + restrained reveals
   ============================================================ */

document.documentElement.classList.add("js");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initCopyButtons();
  initDrills();
  initLessons();

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
  initDoodleDraw();
});

/* doodles draw themselves in, stroke by stroke, as they scroll into view */
function initDoodleDraw() {
  document.querySelectorAll(".doodle").forEach((doodle) => {
    const paths = [...doodle.querySelectorAll("path.d")].filter(
      (p) => !p.hasAttribute("stroke-dasharray")
    );
    if (!paths.length) return;
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.inOut",
      stagger: 0.08,
      scrollTrigger: { trigger: doodle, start: "top 92%", once: true },
      onComplete() {
        // let CSS hover transitions own the strokes afterwards
        paths.forEach((p) => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; });
      }
    });
  });
}

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

/* lessons: accordion + map jumps; opened lessons get a ✓ in the map */
function initLessons() {
  const lessons = [...document.querySelectorAll(".lesson")];
  if (!lessons.length) return;
  const mapItems = new Map(
    [...document.querySelectorAll("#lessonMap [data-lesson]")].map((btn) => [btn.dataset.lesson, btn.closest("li")])
  );
  const KEY = "tetradka-lessons";

  let read = [];
  try { read = JSON.parse(localStorage.getItem(KEY)) || []; } catch { /* fresh notebook */ }
  read.forEach((id) => mapItems.get(id)?.classList.add("is-read"));

  const markRead = (id) => {
    if (read.includes(id)) return;
    read.push(id);
    mapItems.get(id)?.classList.add("is-read");
    try { localStorage.setItem(KEY, JSON.stringify(read)); } catch { /* private mode */ }
  };

  const toggle = (lesson, open) => {
    const willOpen = open ?? !lesson.classList.contains("is-open");
    // one open lesson at a time keeps the notebook tidy
    lessons.forEach((l) => {
      l.classList.toggle("is-open", l === lesson && willOpen);
      l.querySelector(".lesson__head").setAttribute("aria-expanded", String(l === lesson && willOpen));
    });
    if (willOpen) markRead(lesson.dataset.lessonBody);
  };

  lessons.forEach((lesson) => {
    lesson.querySelector(".lesson__head").addEventListener("click", () => toggle(lesson));
  });

  document.querySelectorAll("#lessonMap [data-lesson]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lesson = document.getElementById("lesson-" + btn.dataset.lesson);
      toggle(lesson, true);
      lesson.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
  });
}

/* practice checklist: ticks persist per browser via localStorage */
function initDrills() {
  const boxes = [...document.querySelectorAll("[data-drill]")];
  if (!boxes.length) return;
  const progressEl = document.getElementById("drillProgress");
  const KEY = "tetradka-drills";

  let done = [];
  try { done = JSON.parse(localStorage.getItem(KEY)) || []; } catch { /* fresh start */ }

  const render = () => {
    const count = boxes.filter((b) => b.checked).length;
    progressEl.textContent = `Изпълнени: ${count} от ${boxes.length}` + (count === boxes.length ? " · отличен 6!" : "");
  };

  boxes.forEach((box) => {
    box.checked = done.includes(box.dataset.drill);
    box.addEventListener("change", () => {
      const ids = boxes.filter((b) => b.checked).map((b) => b.dataset.drill);
      try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode */ }
      render();
    });
  });
  render();
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
    ".lessonmap",
    ".lesson",
    ".notecard",
    ".sticky",
    ".assignment",
    ".drills__level",
    ".drill",
    ".glossary__entry",
    ".book",
    ".verdict",
    ".polaroid",
    ".hand-title",
    ".paper__lead",
    ".cork__lead",
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
