/* ============================================================
   newsletter.js — AI Insider editions
   Add a new object at the top of EDITIONS when an issue goes out.
   `slug` is the part of the LinkedIn article URL after /pulse/.
   ============================================================ */
const NEWSLETTER_URL =
  "https://www.linkedin.com/newsletters/ai-insider-ai-на-практика-7462070081922068480/";

const EDITIONS = [
  { no: "09", title: "AI речник на човешки",
    date: { bg: "август 2026", en: "August 2026" },
    slug: "ai-речник-на-човешки-alen-paunov--rcndf" },

  { no: "08", title: "6 умения, които AI уби",
    date: { bg: "август 2026", en: "August 2026" },
    slug: "6-умения-които-ai-уби-alen-paunov--qax2f" },

  { no: "07", title: "AI убива образователната система!",
    date: { bg: "август 2026", en: "August 2026" },
    slug: "ai-убива-образователната-система-alen-paunov--z5exf" },

  { no: "06", title: "Мускулът, който спря да тренира",
    date: { bg: "август 2026", en: "August 2026" },
    slug: "мускулът-който-спря-да-тренира-alen-paunov--4srxf" },

  { no: "05", title: "EU AI Act: голямата дата дойде. И половината се отложи.",
    date: { bg: "август 2026", en: "August 2026" },
    slug: "eu-ai-act-голямата-дата-дойде-и-половината-се-отложи-alen-paunov--tvdpf" },

  { no: "04", title: "AI Дънинг-Крюгер: Никога не сме знаели толкова малко с такава увереност",
    date: { bg: "юли 2026", en: "July 2026" },
    slug: "ai-дънинг-крюгер-никога-не-сме-знаели-толкова-малко-с-alen-paunov--rtp6f" },

  { no: "03", title: "Fable 5, първият политически репресиран модел — вече на свобода",
    date: { bg: "юни 2026", en: "June 2026" },
    slug: "ai-insider-03-fable-5-първият-политически-модел-вече-alen-paunov--1g3yf" },

  { no: "02", title: "Защо Claude преби ChatGPT по код",
    date: { bg: "юни 2026", en: "June 2026" },
    slug: "ai-insider-02-защо-claude-преби-chatgpt-по-код-alen-paunov--gi6qf" },

  { no: "01", title: "Как аз лично използвам AI",
    date: { bg: "май 2026", en: "May 2026" },
    slug: "ai-insider-01-как-аз-лично-използвам-alen-paunov-y2chf" },

  { no: "00", title: "AI Insider — първи брой",
    date: { bg: "май 2026", en: "May 2026" },
    slug: "ai-insider-0-alen-paunov-1qfef" }
];

(function () {
  "use strict";

  function lang() {
    return (typeof currentLang !== "undefined" && currentLang === "en") ? "en" : "bg";
  }

  function render() {
    var list = document.getElementById("nlList");
    if (!list) return;
    var L = lang();

    list.innerHTML = EDITIONS.map(function (e) {
      var href = "https://www.linkedin.com/pulse/" + encodeURI(e.slug) + "/";
      return '<li class="nl__row">' +
        '<a href="' + href + '" target="_blank" rel="noopener">' +
          '<span class="nl__no mono">#' + e.no + '</span>' +
          '<span class="nl__ttl">' + e.title + '</span>' +
          '<span class="nl__date mono">' + (e.date[L] || e.date.bg) + '</span>' +
          '<span class="nl__arrow" aria-hidden="true">↗</span>' +
        '</a></li>';
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.querySelectorAll(".nl-link").forEach(function (a) { a.href = NEWSLETTER_URL; });
  });
  document.addEventListener("langchange", render);
})();
