/* ==========================================================================
   DEMOKIRA — light vanilla JS (old-web edition)
   auto theme by device time · visitor counter · scroll reveal
   calendar + clock · back-to-top
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- storage (guarded: throws in private mode / file://) ---------- */
  function storeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  /* ---------- theme: manual override lasts one day, otherwise by device time ---------- */
  var DARK_FROM = 20;
  var DARK_TO = 7;

  function timeTheme() {
    var h = new Date().getHours();
    return (h >= DARK_FROM || h < DARK_TO) ? "dark" : "light";
  }

  function manualOverrideIsActive() {
    var day = storeGet("dk-theme-day");
    return storeGet("dk-theme") !== null && day === new Date().toDateString();
  }

  function applyTimeTheme() {
    if (manualOverrideIsActive()) return;
    root.setAttribute("data-theme", timeTheme());
  }

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    var fadeEl = document.getElementById("theme-fade");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function switchTheme() {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      storeSet("dk-theme", next);
      storeSet("dk-theme-day", new Date().toDateString());
    }

    themeBtn.addEventListener("click", function () {
      if (!fadeEl || reduceMotion) {
        switchTheme();
        return;
      }
      fadeEl.style.opacity = "1";
      setTimeout(function () {
        switchTheme();
        fadeEl.style.opacity = "0";
      }, 180);
    });
  }

  /* ---------- visitor counter (playful, local) ---------- */
  var counterEl = document.getElementById("visitor-count");
  if (counterEl) {
    var n = parseInt(storeGet("dk-visits") || "41", 10);
    if (!isFinite(n)) n = 41;
    n += 1;
    storeSet("dk-visits", String(n));
    counterEl.textContent = "#" + String(n).padStart(5, "0");
  }

  /* ---------- current year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- sky/sea backdrop: drifting clouds + water shimmer on canvas ---------- */
  var fxEl = document.querySelector(".fx-bg");
  if (fxEl) {
    var fxCanvas = document.createElement("canvas");
    fxEl.appendChild(fxCanvas);
    var fctx = fxCanvas.getContext("2d");

    var reduceMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    var clouds = [];
    var puddles = [];
    var LOBES = 4;
    var VW = 0, VH = 0;
    var lastT = null;
    var theme = { r: 235, g: 235, b: 235, maxA: 0.14, cr: 255, cg: 255, cb: 255, cMax: 0.14 };

    /* cache theme colors once; refresh only when the theme attribute changes */
    function readTheme() {
      var style = getComputedStyle(document.documentElement);
      var parts = style.getPropertyValue("--puddle").trim().split(",");
      theme.r = parseInt(parts[0], 10) || 200;
      theme.g = parseInt(parts[1], 10) || 200;
      theme.b = parseInt(parts[2], 10) || 210;
      theme.maxA = parseFloat(style.getPropertyValue("--puddle-max")) || 0.35;
      var cparts = style.getPropertyValue("--cloud").trim().split(",");
      theme.cr = parseInt(cparts[0], 10) || 224;
      theme.cg = parseInt(cparts[1], 10) || 230;
      theme.cb = parseInt(cparts[2], 10) || 255;
      theme.cMax = parseFloat(style.getPropertyValue("--cloud-max")) || 0.4;
    }
    readTheme();
    if (window.MutationObserver) {
      new MutationObserver(readTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
      });
    }

    function makePuddle(minY) {
      var top = minY || 0;
      return {
        x: Math.random() * VW,
        y: top + Math.random() * (VH - top),
        minY: top,
        r: 70 + Math.random() * 90,   /* water shimmer: medium, cohesive */
        phase: Math.random() * Math.PI * 2,
        speed: 0.04 + Math.random() * 0.08,
        baseA: 0.6 + Math.random() * 0.4,
        lAmp: 20 + Math.random() * 30, /* pearl lightness swing */
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20
      };
    }

    function makeCloud() {
      return {
        x: Math.random() * (VW + 500) - 250,
        y: 20 + Math.random() * (VH * 0.36),
        r: 120 + Math.random() * 140, /* large, soft cloud puff */
        phase: Math.random() * Math.PI * 2,
        speed: 0.03 + Math.random() * 0.06,
        baseA: 0.25 + Math.random() * 0.3,
        vx: 5 + Math.random() * 9,
        drift: Math.random() * Math.PI * 2
      };
    }

    function fxSize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      VW = w;
      VH = h;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.25); /* cap fill cost */
      fxCanvas.width = Math.floor(w * dpr);
      fxCanvas.height = Math.floor(h * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCanvas.style.width = w + "px";
      fxCanvas.style.height = h + "px";
      clouds = [];
      for (var i = 0; i < 9; i++) clouds.push(makeCloud());
      puddles = [];
      var count = Math.round(4 + (w * h) / 220000);
      for (i = 0; i < count; i++) puddles.push(makePuddle(VH * 0.46));
    }

    fxSize();
    window.addEventListener("resize", fxSize);

    function drawPuddle(p, t, R0, G0, B0, maxA) {
      var wob = t * p.speed + p.phase;
      var R = p.r * (1 + 0.1 * Math.sin(wob * 0.9) + 0.05 * Math.sin(wob * 2.3 + 1.7));
      var cx = p.x + Math.sin(wob * 0.5 + 1.1) * 16;
      var cy = p.y + Math.cos(wob * 0.45 + 2.3) * 14;
      var shim = Math.sin(wob * 1.7 + 0.7);
      var a = maxA * p.baseA * (0.8 + 0.2 * Math.sin(wob * 1.3));
      var l = R0 + p.lAmp * shim;
      var g = G0 + p.lAmp * shim;
      var b = B0 + p.lAmp * shim;
      l = l < 0 ? 0 : l > 255 ? 255 : l;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;

      /* depth backlight: soft halo behind the puddle */
      var haloR = R * 2.1;
      var halo = fctx.createRadialGradient(cx, cy, R * 0.35, cx, cy, haloR);
      halo.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + (a * 0.5).toFixed(3) + ")");
      halo.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
      fctx.fillStyle = halo;
      fctx.beginPath();
      fctx.arc(cx, cy, haloR, 0, Math.PI * 2);
      fctx.fill();

      /* solid, cohesive body (keeps a strong core so it reads as one piece) */
      var body = fctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R);
      body.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + a.toFixed(3) + ")");
      body.addColorStop(0.5, "rgba(" + l + "," + g + "," + b + "," + (a * 0.8).toFixed(3) + ")");
      body.addColorStop(0.82, "rgba(" + l + "," + g + "," + b + "," + (a * 0.28).toFixed(3) + ")");
      body.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
      fctx.fillStyle = body;
      fctx.beginPath();
      fctx.arc(cx, cy, R, 0, Math.PI * 2);
      fctx.fill();

      /* subtle organic lobes, kept tight to the body so the puddle stays whole */
      for (var k = 0; k < LOBES; k++) {
        var ang = k * (Math.PI * 2 / LOBES) + wob * 0.5;
        var lx = cx + Math.cos(ang) * R * 0.4 * Math.sin(wob * 0.8 + k * 1.9);
        var ly = cy + Math.sin(ang) * R * 0.4 * Math.cos(wob * 0.7 + k * 2.2);
        var lr = R * (0.28 + 0.16 * Math.sin(wob + k * 2.0));
        var lob = fctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        lob.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + (a * 0.28).toFixed(3) + ")");
        lob.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
        fctx.fillStyle = lob;
        fctx.beginPath();
        fctx.arc(lx, ly, lr, 0, Math.PI * 2);
        fctx.fill();
      }

      /* glossy core highlight */
      var hx = cx + R * 0.22;
      var hy = cy - R * 0.22;
      var hl = l + 45 > 255 ? 255 : l + 45;
      var hg = g + 45 > 255 ? 255 : g + 45;
      var hb = b + 45 > 255 ? 255 : b + 45;
      var core = fctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.4);
      core.addColorStop(0, "rgba(" + hl + "," + hg + "," + hb + "," + (a * 0.6).toFixed(3) + ")");
      core.addColorStop(1, "rgba(" + hl + "," + hg + "," + hb + ",0)");
      fctx.fillStyle = core;
      fctx.beginPath();
      fctx.arc(hx, hy, R * 0.4, 0, Math.PI * 2);
      fctx.fill();
    }

    function drawCloud(c, t, R0, G0, B0, maxA) {
      var wob = t * c.speed + c.phase;
      var R = c.r * (1 + 0.08 * Math.sin(wob) + 0.04 * Math.sin(wob * 2.1 + 1.3));
      var cx = c.x + Math.sin(wob * 0.4 + c.drift) * 40;
      var cy = c.y + Math.cos(wob * 0.35 + c.drift * 1.7) * 14;
      var a = maxA * c.baseA * (0.85 + 0.15 * Math.sin(wob * 0.8 + 2.1));
      var l = R0 + 12 * Math.sin(wob * 1.3);
      var g = G0 + 12 * Math.sin(wob * 1.3);
      var b = B0 + 12 * Math.sin(wob * 1.3);
      l = l < 0 ? 0 : l > 255 ? 255 : l;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;

      /* outer haze (reads as a soft, diffuse cloud) */
      var halo = fctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.1);
      halo.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + (a * 0.5).toFixed(3) + ")");
      halo.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
      fctx.fillStyle = halo;
      fctx.beginPath();
      fctx.arc(cx, cy, R * 2.1, 0, Math.PI * 2);
      fctx.fill();

      /* soft body */
      var body = fctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.15);
      body.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + a.toFixed(3) + ")");
      body.addColorStop(0.65, "rgba(" + l + "," + g + "," + b + "," + (a * 0.65).toFixed(3) + ")");
      body.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
      fctx.fillStyle = body;
      fctx.beginPath();
      fctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      fctx.fill();
    }

    function fxFrame(t) {
      var dt = (lastT === null) ? 0 : (t - lastT);
      lastT = t;
      fctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fctx.globalCompositeOperation = "lighter";

      for (var i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        c.x += c.vx * dt;
        if (c.x > VW + c.r * 1.5) c.x = -c.r * 1.5;
        if (c.x < -c.r * 1.5) c.x = VW + c.r * 1.5;
        drawCloud(c, t, theme.cr, theme.cg, theme.cb, theme.cMax);
      }

      for (i = 0; i < puddles.length; i++) {
        var p = puddles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < p.r) { p.x = p.r; p.vx = -p.vx; }
        if (p.x > VW - p.r) { p.x = VW - p.r; p.vx = -p.vx; }
        if (p.y < p.minY + p.r) { p.y = p.minY + p.r; p.vy = Math.abs(p.vy); }
        if (p.y > VH - p.r) { p.y = VH - p.r; p.vy = -p.vy; }
        drawPuddle(p, t, theme.r, theme.g, theme.b, theme.maxA);
      }

      fctx.globalCompositeOperation = "source-over";
    }

    var FRAME_MS = 1000 / 20; /* cap the redraw at ~20fps to cut CPU/GPU cost */
    var lastFrame = 0;

    function fxLoop(t) {
      if (reduceMotion) {
        if (!t) fxFrame(2.5);
        requestAnimationFrame(function (t2) { fxFrame(2.5); });
        return;
      }
      if (t - lastFrame >= FRAME_MS) {
        lastFrame = t;
        fxFrame(t / 1000);
      }
      requestAnimationFrame(fxLoop);
    }

    fxLoop(0);   /* draws the first frame right away, then animates */
  }

  /* ---------- clock / theme / calendar: one tick ---------- */
  var clockEl = document.getElementById("clock");
  var calMonth = document.getElementById("cal-month");
  var calDays = document.getElementById("cal-days");

  var monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  var lastMinute = "";
  var lastDate = "";

  function renderCalendar(y, m, today) {
    if (!calMonth || !calDays) return;
    calMonth.textContent = monthNames[m] + " " + y;

    var first = new Date(y, m, 1);
    var lead = (first.getDay() + 6) % 7; // Monday = 0
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var total = lead + daysInMonth;
    var rows = Math.ceil(total / 7);

    var html = "";
    for (var r = 0; r < rows; r++) {
      html += "<tr>";
      for (var c = 0; c < 7; c++) {
        var idx = r * 7 + c;
        var day, cls = "";
        if (idx < lead) {
          day = prevDays - lead + idx + 1;
          cls = "other";
        } else if (idx >= lead + daysInMonth) {
          day = idx - lead - daysInMonth + 1;
          cls = "other";
        } else {
          day = idx - lead + 1;
          if (day === today) cls = "today";
        }
        html += '<td class="' + cls + '">' + day + "</td>";
      }
      html += "</tr>";
    }
    calDays.innerHTML = html;
  }

  function tick() {
    var d = new Date();

    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");

    if (clockEl) {
      clockEl.textContent =
        hh + ":" + mm + ":" + String(d.getSeconds()).padStart(2, "0");
    }

    var minStr = hh + ":" + mm; // HH:MM
    if (minStr !== lastMinute) {
      lastMinute = minStr;
      applyTimeTheme();
    }

    var dateStr = d.toDateString();
    if (dateStr !== lastDate) {
      lastDate = dateStr;
      renderCalendar(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  tick();
  setInterval(tick, 1000);

  // resync immediately when tab refocuses (background tabs throttle timers)
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });

  /* ---------- back to top ---------- */
  var toTop = document.getElementById("to-top");
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  if (toTop) {
    var shown = false;
    function onScroll() {
      var visible = (window.pageYOffset || document.documentElement.scrollTop) > 300;
      if (visible !== shown) {
        shown = visible;
        toTop.classList.toggle("show", visible);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: (mq && mq.matches) ? "auto" : "smooth"
      });
    });
  }

  /* ---------- copy wallet address ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy-target], [data-copy-value]");
    if (!btn) return;
    var text = btn.getAttribute("data-copy-value");
    if (!text) {
      var el = document.getElementById(btn.getAttribute("data-copy-target"));
      text = el ? (el.textContent || "").trim() : "";
    }
    if (!text) return;
    var done = function () {
      var old = btn.textContent;
      btn.textContent = "copied!";
      setTimeout(function () { btn.textContent = old; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch (err) {
        done();
      }
    }
  });

})();
