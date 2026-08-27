/* ============================================================
   hero-machine.js
   1. hero — liquid metal poured over the portrait; the machine
      version of the same shot shows inside the liquid.
   2. about portrait — the v1 android wireframe, on hover.
   3. hero dots — a 2D fallback if the three.js module never runs.
   Open the page with ?tune to get alignment controls.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  function load(img) {
    return new Promise(function (res, rej) {
      if (img.complete && img.naturalWidth) return res(img);
      img.onload = function () { res(img); };
      img.onerror = rej;
    });
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function nowMs() { return performance.now(); }

  /* ============================================================
     1 — LIQUID REVEAL
     ============================================================ */
  function liquid() {
    var fig = document.getElementById("term");
    var wrap = document.getElementById("termWrap");
    var view = document.getElementById("termCanvas");
    var photo = document.getElementById("termPhoto");
    var mark = document.getElementById("droidTrigger");
    if (!fig || !wrap || !view || !photo) return;

    var vx = view.getContext("2d");
    var inkC = document.createElement("canvas"), ik = inkC.getContext("2d");   // where paint lands
    var flowC = document.createElement("canvas"), fk = flowC.getContext("2d"); // ink, one step later
    var gooC = document.createElement("canvas"), gk = gooC.getContext("2d");   // sharpened metaball
    var rimC = document.createElement("canvas"), rk = rimC.getContext("2d");   // its edge
    var machC = document.createElement("canvas"), ck = machC.getContext("2d"); // the machine picture

    var W = 0, H = 0, S = 1, GW = 0, GH = 0;
    var ready = false, running = false, lastInk = 0;
    var buf = [], radius = 0, autoRAF = null, autoOn = false;

    // alignment, adjustable at runtime with ?tune
    var T = { s: 1, x: 0, y: 0 };
    try {
      var saved = JSON.parse(localStorage.getItem("apTermAlign") || "null");
      if (saved && typeof saved.s === "number") T = saved;
    } catch (e) { /* private mode */ }

    var img = new Image(); img.src = photo.currentSrc || photo.src;
    var mach = new Image(); mach.src = "img/portrait-terminator.jpg";

    Promise.all([load(img), load(mach)]).then(function () {
      resize();
      ready = true;
      if (/[?&]tune/.test(location.search)) tuner();
      if (!reduce) setTimeout(function () {
        if (!lastInk) { root.classList.add("has-booted"); sweep(1); }
      }, 2200);
    })["catch"](function () { /* the plain portrait is a fine fallback */ });

    function resize() {
      var r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
      if (nw === W && nh === H) return;

      var keep = null;
      if (W && H) {
        keep = document.createElement("canvas");
        keep.width = W; keep.height = H;
        keep.getContext("2d").drawImage(inkC, 0, 0);
      }
      W = nw; H = nh; S = W / 933;
      GW = Math.max(2, W >> 1); GH = Math.max(2, H >> 1);
      [view, inkC, flowC, machC].forEach(function (c) { c.width = W; c.height = H; });
      [gooC, rimC].forEach(function (c) { c.width = GW; c.height = GH; });
      if (keep) ik.drawImage(keep, 0, 0, W, H);
      buildMachine();
      render();
    }
    if (window.ResizeObserver) new ResizeObserver(function () { if (ready) resize(); }).observe(wrap);

    /* the machine picture is pre-aligned to the portrait, so it draws 1:1 */
    function buildMachine() {
      ck.setTransform(1, 0, 0, 1, 0, 0);
      ck.clearRect(0, 0, W, H);
      var dw = W * T.s, dh = H * T.s;
      ck.filter = "contrast(1.08) saturate(1.1) brightness(1.06)";
      ck.drawImage(mach, (W - dw) / 2 + T.x * S, (H - dh) / 2 + T.y * S, dw, dh);
      ck.filter = "none";
      ck.globalCompositeOperation = "destination-in";
      ck.drawImage(img, 0, 0, W, H);
      ck.globalCompositeOperation = "source-over";
    }

    /* ---------- pouring the liquid ---------- */
    function blob(x, y, r, a) {
      var g = ik.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255," + a + ")");
      g.addColorStop(0.5, "rgba(255,255,255," + (a * 0.8) + ")");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ik.fillStyle = g;
      ik.beginPath(); ik.arc(x, y, r, 0, 6.2832); ik.fill();
    }
    function dab(x, y, r) {
      blob(x, y, r, 0.30);
      for (var i = 0; i < 2; i++) {
        var an = Math.random() * 6.2832, off = r * rnd(0.15, 0.5);
        blob(x + Math.cos(an) * off, y + Math.sin(an) * off, r * rnd(0.35, 0.7), 0.16);
      }
      lastInk = nowMs();
      root.classList.add("is-boot");
      start();
    }
    function push(x, y, base) {
      buf.push({ x: x, y: y, t: nowMs() });
      if (buf.length > 3) buf.shift();
      if (buf.length < 3) return;
      var a = buf[0], b = buf[1], c = buf[2];
      var dt = Math.max(8, c.t - a.t);
      var sp = Math.hypot(c.x - a.x, c.y - a.y) / dt;
      var target = base * (1.25 - Math.min(sp / 2.6, 0.6));
      radius = radius ? radius + (target - radius) * 0.2 : target;

      var m0x = (a.x + b.x) / 2, m0y = (a.y + b.y) / 2;
      var m1x = (b.x + c.x) / 2, m1y = (b.y + c.y) / 2;
      var len = Math.hypot(b.x - m0x, b.y - m0y) + Math.hypot(m1x - b.x, m1y - b.y);
      var n = Math.max(2, Math.ceil(len / Math.max(1.6, radius * 0.2)));
      for (var i = 1; i <= n; i++) {
        var t = i / n, u = 1 - t;
        dab(u * u * m0x + 2 * u * t * b.x + t * t * m1x,
            u * u * m0y + 2 * u * t * b.y + t * t * m1y,
            radius * rnd(0.92, 1.06));
      }
    }

    /* ---------- one frame of flow ---------- */
    var tSec = 0;
    function flow(dt) {
      // the puddle creeps: blurred, nudged downhill, slightly spread
      var drift = 0.55 * S, spread = 1.004;
      fk.setTransform(1, 0, 0, 1, 0, 0);
      fk.clearRect(0, 0, W, H);
      fk.filter = "blur(" + (1.15 * S).toFixed(2) + "px)";
      fk.drawImage(inkC, -(spread - 1) * W / 2, drift - (spread - 1) * H / 2, W * spread, H * spread);
      fk.filter = "none";

      var age = nowMs() - lastInk;
      var fade = age < 1100 ? 0.004 : (age < 2600 ? 0.012 : 0.024);
      fk.globalCompositeOperation = "destination-out";
      fk.fillStyle = "rgba(0,0,0," + fade + ")";
      fk.fillRect(0, 0, W, H);
      fk.globalCompositeOperation = "source-over";

      ik.setTransform(1, 0, 0, 1, 0, 0);
      ik.clearRect(0, 0, W, H);
      ik.drawImage(flowC, 0, 0);
    }

    /* ---------- compose ---------- */
    function render() {
      // metaball: blur the ink, then stack it so the falloff turns into a crisp skin
      gk.setTransform(1, 0, 0, 1, 0, 0);
      gk.clearRect(0, 0, GW, GH);
      gk.filter = "blur(" + (4.6 * S).toFixed(2) + "px)";
      gk.drawImage(inkC, 0, 0, GW, GH);
      gk.filter = "none";
      if (stackC.width !== GW || stackC.height !== GH) { stackC.width = GW; stackC.height = GH; }
      sk.setTransform(1, 0, 0, 1, 0, 0);
      sk.clearRect(0, 0, GW, GH);
      sk.drawImage(gooC, 0, 0);
      gk.globalCompositeOperation = "lighter";
      gk.drawImage(stackC, 0, 0);
      gk.drawImage(stackC, 0, 0);
      gk.drawImage(stackC, 0, 0);
      gk.globalCompositeOperation = "source-over";

      // the liquid edge: a - a*a peaks exactly on the meniscus
      rk.setTransform(1, 0, 0, 1, 0, 0);
      rk.clearRect(0, 0, GW, GH);
      rk.drawImage(gooC, 0, 0);
      rk.globalCompositeOperation = "destination-out";
      rk.drawImage(gooC, 0, 0);
      // tint the meniscus: chrome above, hot metal below
      rk.globalCompositeOperation = "source-in";
      var mg = rk.createLinearGradient(0, 0, 0, GH);
      mg.addColorStop(0, "#cfe6ff");
      mg.addColorStop(0.45, "#9fd0ff");
      mg.addColorStop(0.7, "#ff7a3a");
      mg.addColorStop(1, "#ff3a10");
      rk.fillStyle = mg;
      rk.fillRect(0, 0, GW, GH);
      // and keep it inside him, like everything else
      rk.globalCompositeOperation = "destination-in";
      rk.drawImage(img, 0, 0, GW, GH);
      rk.globalCompositeOperation = "source-over";

      // the machine, seen through the liquid — it wobbles a little
      var wob = Math.sin(tSec * 1.7) * 1.6 * S, wob2 = Math.cos(tSec * 1.3) * 1.6 * S;
      vx.setTransform(1, 0, 0, 1, 0, 0);
      vx.clearRect(0, 0, W, H);
      vx.drawImage(machC, wob - W * 0.006, wob2 - H * 0.006, W * 1.012, H * 1.012);
      vx.globalCompositeOperation = "destination-in";
      vx.drawImage(gooC, 0, 0, W, H);
      vx.globalCompositeOperation = "source-over";

      // meniscus: a hot rim plus a chrome highlight offset upward
      vx.globalCompositeOperation = "lighter";
      vx.globalAlpha = 0.85;
      vx.drawImage(rimC, 0, 0, W, H);
      vx.globalAlpha = 0.35;
      vx.drawImage(rimC, 0, -2.4 * S, W, H);
      vx.globalAlpha = 1;
      vx.globalCompositeOperation = "source-over";
    }

    var stackC = document.createElement("canvas"), sk = stackC.getContext("2d");

    /* ---------- loop ---------- */
    function start() { if (!running) { running = true; requestAnimationFrame(tick); } }
    function tick() {
      tSec += 0.016;
      flow();
      render();
      if (nowMs() - lastInk > 5600 && !autoOn) {
        ik.clearRect(0, 0, W, H);
        render();
        running = false;
        root.classList.remove("is-boot");
        return;
      }
      requestAnimationFrame(tick);
    }

    /* ---------- input ---------- */
    function local(e) {
      var r = wrap.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    wrap.addEventListener("pointermove", function (e) {
      if (!ready) return;
      var p = local(e); push(p.x, p.y, 62 * S);
    });
    wrap.addEventListener("pointerenter", function () { buf = []; radius = 0; });
    wrap.addEventListener("pointerleave", function () { buf = []; radius = 0; });
    wrap.addEventListener("pointerdown", function (e) {
      if (!ready) return;
      buf = []; var p = local(e);
      push(p.x, p.y, 70 * S); push(p.x, p.y, 70 * S); push(p.x, p.y, 70 * S);
    });

    /* the header mark pours it from the top of the head */
    function sweep(passes) {
      if (!ready || autoRAF) return;
      autoOn = true;
      var pass = 0, t = 0;
      buf = []; radius = 0;
      (function step() {
        t += 0.0085;
        if (t >= 1) {
          t = 0; pass++; buf = []; radius = 0;
          if (!autoOn || (passes && pass >= passes)) { stopSweep(); return; }
        }
        var x = (0.46 + 0.33 * Math.sin(t * Math.PI * 3.2)) * W;
        var y = (0.14 + t * 0.50 + 0.03 * Math.sin(t * Math.PI * 8)) * H;
        push(x, y, 78 * S);
        autoRAF = requestAnimationFrame(step);
      })();
    }
    function stopSweep() {
      autoOn = false;
      if (autoRAF) { cancelAnimationFrame(autoRAF); autoRAF = null; }
    }

    if (mark) {
      mark.addEventListener("mouseenter", function () { if (!coarse) sweep(0); });
      mark.addEventListener("mouseleave", function () { if (!coarse) stopSweep(); });
      mark.addEventListener("focus", function () { sweep(0); });
      mark.addEventListener("blur", stopSweep);
      mark.addEventListener("click", function (e) {
        e.preventDefault();
        if (autoOn) stopSweep(); else sweep(2);
      });
    }
    fig.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); sweep(2); }
    });

    if (coarse) {
      var hint = fig.querySelector(".term__hint");
      if (hint) {
        hint.setAttribute("data-i18n", "term.hintTap");
        hint.textContent = (typeof I18N !== "undefined" && typeof currentLang !== "undefined" &&
          I18N[currentLang] && I18N[currentLang]["term.hintTap"]) || "drag across me ✦";
      }
    }

    /* ---------- ?tune : nudge the machine picture by hand ---------- */
    function tuner() {
      var box = document.createElement("div");
      box.className = "tuner mono";
      box.innerHTML =
        '<b>terminator align</b>' +
        row("s", "scale", 0.7, 1.4, 0.002, T.s) +
        row("x", "offset x", -160, 160, 1, T.x) +
        row("y", "offset y", -160, 160, 1, T.y) +
        '<div class="tuner__out"></div>' +
        '<div class="tuner__btns"><button data-a="reset">reset</button>' +
        '<button data-a="copy">copy</button></div>';
      document.body.appendChild(box);
      var out = box.querySelector(".tuner__out");
      function sync() {
        out.textContent = "s " + T.s.toFixed(3) + "  x " + T.x + "  y " + T.y;
        try { localStorage.setItem("apTermAlign", JSON.stringify(T)); } catch (e) {}
        buildMachine(); render();
      }
      box.addEventListener("input", function (e) {
        var k = e.target.dataset.k; if (!k) return;
        T[k] = parseFloat(e.target.value);
        box.querySelector('[data-v="' + k + '"]').textContent = T[k];
        sync();
      });
      box.addEventListener("click", function (e) {
        var a = e.target.dataset.a;
        if (a === "reset") {
          T = { s: 1, x: 0, y: 0 };
          box.querySelectorAll("input").forEach(function (i) {
            i.value = T[i.dataset.k];
            box.querySelector('[data-v="' + i.dataset.k + '"]').textContent = T[i.dataset.k];
          });
          sync();
        }
        if (a === "copy") {
          var txt = "var T = { s: " + T.s + ", x: " + T.x + ", y: " + T.y + " };";
          if (navigator.clipboard) navigator.clipboard.writeText(txt);
          out.textContent = "copied — paste into hero-machine.js";
        }
      });
      sync();
      function row(k, label, min, max, step, val) {
        return '<label>' + label + ' <span data-v="' + k + '">' + val + '</span>' +
          '<input type="range" data-k="' + k + '" min="' + min + '" max="' + max +
          '" step="' + step + '" value="' + val + '"></label>';
      }
    }
  }

  /* ============================================================
     2 — the v1 android rig, on the about portrait
     ============================================================ */
  function aboutRig() {
    var fig = document.getElementById("aboutPortrait");
    if (!fig) return;
    var on = false, off = null;
    function set(v) {
      on = v;
      fig.classList.toggle("is-rig", v);
    }
    fig.addEventListener("mouseenter", function () { if (!coarse) set(true); });
    fig.addEventListener("mouseleave", function () { if (!coarse) set(false); });
    fig.addEventListener("focus", function () { set(true); });
    fig.addEventListener("blur", function () { set(false); });
    fig.addEventListener("click", function () {
      set(!on);
      clearTimeout(off);
      if (on && coarse) off = setTimeout(function () { set(false); }, 3200);
    });
  }

  /* ============================================================
     3 — hero dots
     scene.js is an ES module behind an import map: over file://, or
     with the CDN blocked, it never runs. This paints the same field
     in 2D so the hero never loses its dots. It stands down the moment
     the real scene claims the canvas.
     ============================================================ */
  function dotsFallback() {
    var host = document.getElementById("heroCanvas");
    var hero = document.getElementById("hero");
    if (!host || !hero || reduce) return;

    var taken = function () { return host.dataset.taken === "1" || host.width > 300; };
    var tries = 0;
    var probe = setInterval(function () {
      if (taken()) { clearInterval(probe); return; }
      if (++tries >= 8) { clearInterval(probe); build(); }
    }, 350);

    function build() {
      var isMobile = window.matchMedia("(max-width: 768px)").matches;
      var COUNT = isMobile ? 110 : 240;
      var SPARKS = isMobile ? 24 : 60;
      var BOUNDS = 24;
      var LINK = isMobile ? 5.5 : 4.8, LINK2 = LINK * LINK;
      var DOT = isMobile ? 0.30 : 0.26;
      var SPK = isMobile ? 0.60 : 0.52;
      var CAM = 26, FOV = Math.tan((60 * Math.PI / 180) / 2);

      var c = document.createElement("canvas");
      c.className = "hero__canvas hero__canvas--fallback";
      c.setAttribute("aria-hidden", "true");
      hero.insertBefore(c, hero.firstChild);
      var x = c.getContext("2d");

      // the same palette scene.js uses
      var PAL = [[139,92,246],[34,211,238],[217,70,239],[103,232,249],[167,139,250]];
      var SPARK_PAL = [[232,121,249],[103,232,249],[196,181,253],[255,255,255]];
      function mix() {
        var a = PAL[(Math.random() * PAL.length) | 0], b = PAL[(Math.random() * PAL.length) | 0], t = Math.random();
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }

      var P = [], SP = [];
      for (var i = 0; i < COUNT; i++) {
        P.push({
          x: (Math.random() - 0.5) * BOUNDS * 2,
          y: (Math.random() - 0.5) * BOUNDS,
          z: (Math.random() - 0.5) * BOUNDS * 0.6,
          vx: (Math.random() - 0.5) * 0.014,
          vy: (Math.random() - 0.5) * 0.014,
          vz: (Math.random() - 0.5) * 0.007,
          c: mix()
        });
      }
      for (i = 0; i < SPARKS; i++) {
        var sc = SPARK_PAL[(Math.random() * SPARK_PAL.length) | 0];
        SP.push({
          x: (Math.random() - 0.5) * BOUNDS * 2,
          y: (Math.random() - 0.5) * BOUNDS,
          z: (Math.random() - 0.5) * BOUNDS * 0.6,
          c: sc
        });
      }

      var W = 0, H = 0, focal = 1, dpr = Math.min(window.devicePixelRatio || 1, 2);
      function fit() {
        var r = hero.getBoundingClientRect();
        W = r.width; H = r.height;
        c.width = W * dpr; c.height = H * dpr;
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        focal = (H / 2) / FOV;
      }
      fit();
      window.addEventListener("resize", fit);

      var tRX = 0, tRY = 0, rx = 0, ry = 0, rz = 0;
      if (!isMobile) {
        window.addEventListener("mousemove", function (e) {
          tRY = (e.clientX / window.innerWidth - 0.5) * 0.35;
          tRX = (e.clientY / window.innerHeight - 0.5) * 0.25;
        }, { passive: true });
      }

      var visible = true;
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(c);
      }

      var sinX = 0, cosX = 1, sinY = 0, cosY = 1, sinZ = 0, cosZ = 1;
      function proj(p, out) {
        var X = p.x * cosZ - p.y * sinZ, Y = p.x * sinZ + p.y * cosZ, Z = p.z;
        var X2 = X * cosY + Z * sinY, Z2 = -X * sinY + Z * cosY;
        var Y2 = Y * cosX - Z2 * sinX, Z3 = Y * sinX + Z2 * cosX;
        var d = CAM - Z3;
        if (d < 1) return false;
        var s = focal / d;
        out.X = W / 2 + X2 * s;
        out.Y = H / 2 - Y2 * s;
        out.s = s;
        return true;
      }

      var a = { X: 0, Y: 0, s: 0 }, bpt = { X: 0, Y: 0, s: 0 };
      var scr = [];
      for (i = 0; i < COUNT; i++) scr.push({ X: 0, Y: 0, s: 0, ok: false });

      (function loop() {
        requestAnimationFrame(loop);
        if (document.hidden || !visible) return;

        ry += (tRY - ry) * 0.04;
        rx += (tRX - rx) * 0.04;
        rz += 0.0004;
        sinX = Math.sin(rx); cosX = Math.cos(rx);
        sinY = Math.sin(ry); cosY = Math.cos(ry);
        sinZ = Math.sin(rz); cosZ = Math.cos(rz);

        for (var i = 0; i < COUNT; i++) {
          var p = P[i];
          p.x += p.vx; p.y += p.vy; p.z += p.vz;
          if (Math.abs(p.x) > BOUNDS) p.vx *= -1;
          if (Math.abs(p.y) > BOUNDS * 0.55) p.vy *= -1;
          if (Math.abs(p.z) > BOUNDS * 0.35) p.vz *= -1;
          scr[i].ok = proj(p, scr[i]);
        }

        x.clearRect(0, 0, W, H);
        x.globalCompositeOperation = "lighter";

        // links — colour fades with distance, exactly like the shader path
        x.lineWidth = 1;
        for (i = 0; i < COUNT; i++) {
          if (!scr[i].ok) continue;
          var pi = P[i], si = scr[i];
          for (var j = i + 1; j < COUNT; j++) {
            var pj = P[j];
            var dx = pi.x - pj.x, dy = pi.y - pj.y, dz = pi.z - pj.z;
            var d2 = dx * dx + dy * dy + dz * dz;
            if (d2 >= LINK2 || !scr[j].ok) continue;
            var fade = (1 - d2 / LINK2) * 0.45;
            var ci = pi.c, cj = pj.c;
            var gr = x.createLinearGradient(si.X, si.Y, scr[j].X, scr[j].Y);
            gr.addColorStop(0, "rgba(" + (ci[0] | 0) + "," + (ci[1] | 0) + "," + (ci[2] | 0) + "," + fade.toFixed(3) + ")");
            gr.addColorStop(1, "rgba(" + (cj[0] | 0) + "," + (cj[1] | 0) + "," + (cj[2] | 0) + "," + fade.toFixed(3) + ")");
            x.strokeStyle = gr;
            x.beginPath(); x.moveTo(si.X, si.Y); x.lineTo(scr[j].X, scr[j].Y); x.stroke();
          }
        }

        // dots
        for (i = 0; i < COUNT; i++) {
          if (!scr[i].ok) continue;
          sprite(scr[i].X, scr[i].Y, DOT * scr[i].s * 0.5, P[i].c, 0.95);
        }

        // sparks, with the same slow pulse
        var pulse = 0.65 + Math.sin(performance.now() * 0.0016) * 0.25;
        for (i = 0; i < SPARKS; i++) {
          if (!proj(SP[i], a)) continue;
          sprite(a.X, a.Y, SPK * a.s * 0.5, SP[i].c, pulse);
        }

        x.globalCompositeOperation = "source-over";
      })();

      function sprite(X, Y, r, col, alpha) {
        if (r < 0.4 || X < -40 || X > W + 40 || Y < -40 || Y > H + 40) return;
        var g = x.createRadialGradient(X, Y, 0, X, Y, r);
        var rgb = (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0);
        g.addColorStop(0, "rgba(" + rgb + "," + alpha + ")");
        g.addColorStop(0.4, "rgba(" + rgb + "," + (alpha * 0.8) + ")");
        g.addColorStop(1, "rgba(" + rgb + ",0)");
        x.fillStyle = g;
        x.beginPath(); x.arc(X, Y, r, 0, 6.2832); x.fill();
      }

      // if the real scene turns up late, stand down
      var watch = setInterval(function () {
        if (host.dataset.taken === "1" || host.width > 300) {
          c.remove();
          clearInterval(watch);
        }
      }, 500);
      setTimeout(function () { clearInterval(watch); }, 12000);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    liquid();
    aboutRig();
    dotsFallback();
  });
})();
