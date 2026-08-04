/* ==========================================================================
   DEMOKIRA — light vanilla JS (old-web edition)
   auto theme by device time · visitor counter · scroll reveal
   calendar + clock · back-to-top · collab form
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

  /* ---------- collaboration form ---------- */
  var form = document.getElementById("collab-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var sending = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (sending) return;

      // Placeholder guard: remind the owner to plug in a real endpoint.
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        status.classList.add("error");
        status.textContent =
          "form endpoint not configured yet — write to me via the sns links";
        return;
      }

      status.classList.remove("error");
      status.textContent = "sending…";
      sending = true;

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent = "request sent — I'll get back to you soon ✦";
          } else {
            throw new Error("bad response");
          }
        })
        .catch(function () {
          status.classList.add("error");
          status.textContent =
            "couldn't send — try again or use the sns links";
        })
        .finally(function () {
          sending = false;
        });
    });
  }
})();
