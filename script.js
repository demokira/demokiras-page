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
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      storeSet("dk-theme", next);
      storeSet("dk-theme-day", new Date().toDateString());
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

  /* ---------- puddle backdrop: shimmering liquid blobs on canvas ---------- */
  var fxEl = document.querySelector(".fx-bg");
  if (fxEl) {
    var fxCanvas = document.createElement("canvas");
    fxEl.appendChild(fxCanvas);
    var fctx = fxCanvas.getContext("2d");

    var reduceMotion = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    var puddles = [];
    var rays = [];
    var sparkles = [];
    var floorRefs = [];
    var LOBES = 5;
    var VW = 0, VH = 0;
    var lastT = null;

    function makePuddle() {
      return {
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: 45 + Math.random() * 115,   /* base radius px */
        phase: Math.random() * Math.PI * 2,
        speed: 0.05 + Math.random() * 0.1,
        baseA: 0.55 + Math.random() * 0.45,
        lAmp: 25 + Math.random() * 40, /* pearl lightness swing */
        vx: (Math.random() - 0.5) * 46,
        vy: (Math.random() - 0.5) * 46
      };
    }

    function makeRay() {
      return {
        a: -0.30 + Math.random() * 0.6,   /* angle offset from the base shaft */
        swing: 0.02 + Math.random() * 0.04,
        ph: Math.random() * Math.PI * 2,
        hw: 0.045 + Math.random() * 0.075, /* half-width in radians */
        len: 1.05 + Math.random() * 0.55,
        baseA: 0.05 + Math.random() * 0.06
      };
    }

    function makeSparkle() {
      return {
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: 1.5 + Math.random() * 2.5,
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.9,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14
      };
    }

    function makeFloorRef() {
      return {
        x: Math.random() * VW,
        y: VH * (0.6 + Math.random() * 0.38),
        w: 90 + Math.random() * 230,
        ph: Math.random() * Math.PI * 2,
        sp: 0.15 + Math.random() * 0.25,
        baseA: 0.045 + Math.random() * 0.05
      };
    }

    function fxSize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      VW = w;
      VH = h;
      var dpr = window.devicePixelRatio || 1;
      fxCanvas.width = Math.floor(w * dpr);
      fxCanvas.height = Math.floor(h * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCanvas.style.width = w + "px";
      fxCanvas.style.height = h + "px";
      puddles = [];
      var count = Math.round(16 + (w * h) / 60000);
      for (var i = 0; i < count; i++) puddles.push(makePuddle());

      rays = [];
      for (var j = 0; j < 5; j++) rays.push(makeRay());
      sparkles = [];
      for (var k = 0; k < 9; k++) sparkles.push(makeSparkle());
      floorRefs = [];
      for (var m = 0; m < 3; m++) floorRefs.push(makeFloorRef());
    }

    fxSize();
    window.addEventListener("resize", fxSize);

    function drawPuddle(p, t, R0, G0, B0, maxA) {
      var wob = t * p.speed + p.phase;
      var R = p.r * (1 + 0.14 * Math.sin(wob * 0.9) + 0.06 * Math.sin(wob * 2.3 + 1.7));
      var cx = p.x + Math.sin(wob * 0.5 + 1.1) * 14;
      var cy = p.y + Math.cos(wob * 0.45 + 2.3) * 12;
      var shim = Math.sin(wob * 1.7 + 0.7);
      var a = maxA * p.baseA * (0.75 + 0.25 * Math.sin(wob * 1.3));
      var l = R0 + p.lAmp * shim;
      var g = G0 + p.lAmp * shim;
      var b = B0 + p.lAmp * shim * 1.3;
      l = l < 0 ? 0 : l > 255 ? 255 : l;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;

      /* main body */
      var body = fctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + a.toFixed(3) + ")");
      body.addColorStop(0.7, "rgba(" + l + "," + g + "," + b + "," + (a * 0.35).toFixed(3) + ")");
      body.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
      fctx.fillStyle = body;
      fctx.beginPath();
      fctx.arc(cx, cy, R, 0, Math.PI * 2);
      fctx.fill();

      /* wandering lobes give the organic liquid shape */
      for (var k = 0; k < LOBES; k++) {
        var ang = k * (Math.PI * 2 / LOBES) + wob * 0.7;
        var lx = cx + Math.cos(ang) * R * 0.7 * Math.sin(wob * 0.8 + k * 1.9);
        var ly = cy + Math.sin(ang) * R * 0.7 * Math.cos(wob * 0.7 + k * 2.2);
        var lr = R * (0.7 + 0.3 * Math.sin(wob + k * 2.0));
        var lob = fctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        lob.addColorStop(0, "rgba(" + l + "," + g + "," + b + "," + (a * 0.5).toFixed(3) + ")");
        lob.addColorStop(1, "rgba(" + l + "," + g + "," + b + ",0)");
        fctx.fillStyle = lob;
        fctx.beginPath();
        fctx.arc(lx, ly, lr, 0, Math.PI * 2);
        fctx.fill();
      }

      /* glossy core highlight */
      var hx = cx + R * 0.25;
      var hy = cy - R * 0.25;
      var hl = l + 40 > 255 ? 255 : l + 40;
      var hg = g + 40 > 255 ? 255 : g + 40;
      var hb = b + 40 > 255 ? 255 : b + 40;
      var core = fctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.5);
      core.addColorStop(0, "rgba(" + hl + "," + hg + "," + hb + "," + (a * 0.6).toFixed(3) + ")");
      core.addColorStop(1, "rgba(" + hl + "," + hg + "," + hb + ",0)");
      fctx.fillStyle = core;
      fctx.beginPath();
      fctx.arc(hx, hy, R * 0.5, 0, Math.PI * 2);
      fctx.fill();
    }

    /* light rays + specular reflections, drawn behind the puddles */
    function drawLightFx(t, dt, R0, G0, B0) {
      var cR = Math.round(R0 + (255 - R0) * 0.6);
      var cG = Math.round(G0 + (255 - G0) * 0.6);
      var cB = Math.round(B0 + (255 - B0) * 0.6);
      var srcX = VW * 0.16;
      var srcY = VH * 0.02;
      var maxDim = Math.sqrt(VW * VW + VH * VH);

      /* soft glow around the light source */
      var glowR = 320;
      var glow = fctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, glowR);
      glow.addColorStop(0, "rgba(" + cR + "," + cG + "," + cB + ",0.16)");
      glow.addColorStop(0.5, "rgba(" + cR + "," + cG + "," + cB + ",0.05)");
      glow.addColorStop(1, "rgba(" + cR + "," + cG + "," + cB + ",0)");
      fctx.fillStyle = glow;
      fctx.beginPath();
      fctx.arc(srcX, srcY, glowR, 0, Math.PI * 2);
      fctx.fill();

      /* god rays: soft wedges sweeping down-right from the source */
      for (var i = 0; i < rays.length; i++) {
        var ray = rays[i];
        var ang = 0.55 + ray.a + ray.swing * Math.sin(t * ray.swing * 0.5 + ray.ph);
        var hw = ray.hw;
        var D = maxDim * ray.len;
        var t1x = srcX + Math.cos(ang - hw) * D;
        var t1y = srcY + Math.sin(ang - hw) * D;
        var t2x = srcX + Math.cos(ang + hw) * D;
        var t2y = srcY + Math.sin(ang + hw) * D;
        var a = ray.baseA * (0.7 + 0.3 * Math.sin(t * 0.4 + ray.ph * 3));
        if (a <= 0.002) continue;
        var grd = fctx.createLinearGradient(t1x, t1y, t2x, t2y);
        grd.addColorStop(0, "rgba(" + cR + "," + cG + "," + cB + ",0)");
        grd.addColorStop(0.5, "rgba(" + cR + "," + cG + "," + cB + "," + a.toFixed(3) + ")");
        grd.addColorStop(1, "rgba(" + cR + "," + cG + "," + cB + ",0)");
        fctx.fillStyle = grd;
        fctx.beginPath();
        fctx.moveTo(srcX, srcY);
        fctx.lineTo(t1x, t1y);
        fctx.lineTo(t2x, t2y);
        fctx.closePath();
        fctx.fill();
      }

      /* specular sparkles: tiny twinkling glints with a cross flare */
      for (var j = 0; j < sparkles.length; j++) {
        var s = sparkles[j];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < 0) { s.x = 0; s.vx = -s.vx; }
        if (s.x > VW) { s.x = VW; s.vx = -s.vx; }
        if (s.y < 0) { s.y = 0; s.vy = -s.vy; }
        if (s.y > VH) { s.y = VH; s.vy = -s.vy; }
        var sa = 0.16 * (0.35 + 0.65 * Math.abs(Math.sin(t * s.sp + s.ph)));
        var sr = s.r;
        var flare = fctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sr * 5);
        flare.addColorStop(0, "rgba(" + cR + "," + cG + "," + cB + "," + (sa * 0.5).toFixed(3) + ")");
        flare.addColorStop(1, "rgba(" + cR + "," + cG + "," + cB + ",0)");
        fctx.fillStyle = flare;
        fctx.beginPath();
        fctx.arc(s.x, s.y, sr * 5, 0, Math.PI * 2);
        fctx.fill();
        fctx.fillStyle = "rgba(" + cR + "," + cG + "," + cB + "," + (sa * 0.8).toFixed(3) + ")";
        fctx.fillRect(s.x - sr * 9, s.y - 0.5, sr * 18, 1);
        fctx.fillRect(s.x - 0.5, s.y - sr * 9, 1, sr * 18);
        fctx.fillRect(s.x - sr, s.y - sr, sr * 2, sr * 2);
      }

      /* floor reflections: faint horizontal smears near the bottom */
      for (var k = 0; k < floorRefs.length; k++) {
        var fr = floorRefs[k];
        var fa = fr.baseA * (0.6 + 0.4 * Math.sin(t * fr.sp + fr.ph));
        if (fa <= 0.003) continue;
        fctx.save();
        fctx.translate(fr.x, fr.y);
        fctx.scale(1, 0.14);
        var fg = fctx.createRadialGradient(0, 0, 0, 0, 0, fr.w);
        fg.addColorStop(0, "rgba(" + cR + "," + cG + "," + cB + "," + fa.toFixed(3) + ")");
        fg.addColorStop(1, "rgba(" + cR + "," + cG + "," + cB + ",0)");
        fctx.fillStyle = fg;
        fctx.beginPath();
        fctx.arc(0, 0, fr.w, 0, Math.PI * 2);
        fctx.fill();
        fctx.restore();
      }
    }

    function fxFrame(t) {
      var dt = (lastT === null) ? 0 : (t - lastT);
      lastT = t;
      var style = getComputedStyle(document.documentElement);
      var parts = style.getPropertyValue("--puddle").trim().split(",");
      var maxA = parseFloat(style.getPropertyValue("--puddle-max")) || 0.15;
      fctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fctx.globalCompositeOperation = "lighter";
      var pr = parseInt(parts[0], 10);
      var pg = parseInt(parts[1], 10);
      var pb = parseInt(parts[2], 10);
      drawLightFx(t, dt, pr, pg, pb);
      for (var i = 0; i < puddles.length; i++) {
        var p = puddles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < p.r) { p.x = p.r; p.vx = -p.vx; }
        if (p.x > VW - p.r) { p.x = VW - p.r; p.vx = -p.vx; }
        if (p.y < p.r) { p.y = p.r; p.vy = -p.vy; }
        if (p.y > VH - p.r) { p.y = VH - p.r; p.vy = -p.vy; }
        drawPuddle(p, t, pr, pg, pb, maxA);
      }
      fctx.globalCompositeOperation = "source-over";
    }

    function fxLoop() {
      fxFrame(reduceMotion ? 2.5 : (performance.now() / 1000));
      if (reduceMotion) {
        /* one extra pass (no loop) so the static frame is committed to the compositor */
        requestAnimationFrame(function () { fxFrame(2.5); });
      } else {
        requestAnimationFrame(fxLoop);
      }
    }

    fxLoop();   /* draws the first frame right away, then animates */
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
