/* ==========================================================================
   DEMOKIRA — light vanilla JS (old-web edition)
   auto theme by device time · scroll reveal
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
  /* TEMPORARILY DISABLED: light theme only. Re-enable when theme switching is back.
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
  */

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
      // applyTimeTheme(); // TEMPORARILY DISABLED: light theme only
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

  /* ---------- video backdrop: single seamless loop (two layers, crossfade) ---------- */
  // Silent Hill vibe: ethereal white mist drifting slowly in the dark
  var BACKDROP_SRC = "https://assets.mixkit.co/videos/51947/51947-360.mp4";
  var LOOP_LEAD = 0.9; // seconds before the end to start the crossfade swap
  var PLAYBACK_RATE = 1; // playback speed; 0.5 = half speed slow motion

  var bgLayers = document.querySelectorAll(".video-bg video");
  if (bgLayers.length === 2 && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    var videoLayers = [bgLayers[0], bgLayers[1]];
    var activeLayer = 0;
    var swapping = false;

    function isReady(v) {
      return !!v.readyState && v.readyState >= 2;
    }

    // apply the slow-motion rate to whichever layer is about to play
    function applyRate(v) {
      v.playbackRate = PLAYBACK_RATE;
    }

    // fade the standby layer in, pause + rewind the finished one, keep alternating
    function swap() {
      if (swapping) return;
      var nextV = videoLayers[1 - activeLayer];
      if (!isReady(nextV)) {
        setTimeout(swap, 200);
        return;
      }
      swapping = true;
      var oldV = videoLayers[activeLayer];
      applyRate(nextV);
      nextV.currentTime = 0;
      nextV.play().catch(function () {});
      nextV.classList.add("is-active");
      oldV.classList.remove("is-active");
      activeLayer = 1 - activeLayer;
      oldV.pause();
      oldV.currentTime = 0;
      setTimeout(function () { swapping = false; }, 400);
    }

    function onTick() {
      var cur = videoLayers[activeLayer];
      var dur = cur.duration;
      if (dur && isFinite(dur) && dur > LOOP_LEAD && cur.currentTime >= dur - LOOP_LEAD) {
        swap();
      }
    }

    videoLayers.forEach(function (v) {
      v.addEventListener("timeupdate", onTick);
      v.addEventListener("ended", swap);
    });

    // standby layer: same source, seeked to the start so the first swap is instant
    videoLayers[1].setAttribute("src", BACKDROP_SRC);
    videoLayers[1].addEventListener("loadeddata", function () {
      applyRate(videoLayers[1]);
      videoLayers[1].currentTime = 0;
    });
    videoLayers[1].load();

    // start playback once; canplay re-fires after seeks so make it one-shot
    videoLayers[0].addEventListener(
      "canplay",
      function () {
        applyRate(videoLayers[0]);
        videoLayers[0].classList.add("is-active");
        videoLayers[0].play().catch(function () {});
      },
      { once: true }
    );
    videoLayers[0].setAttribute("src", BACKDROP_SRC);
    videoLayers[0].load();
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
