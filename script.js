(function () {
  "use strict";

  // Hero: a monochrome oscilloscope. Scroll changes amplitude and frequency,
  // the trace keeps drifting so the signal never freezes at the ends.
  var canvas = document.querySelector(".scope-field");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var root = canvas.closest(".scroll-scrub");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var target = 0;
    var current = 0;
    var time = 0;
    var last = 0;
    var rafId = 0;
    var running = false;
    var visible = true;
    var bgGrad = null;
    var halo = null;

    var clamp = function (value, min, max) {
      return Math.min(max, Math.max(min, value));
    };

    var buildGradients = function () {
      var cy = height * 0.45;
      bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0b0b0a");
      bgGrad.addColorStop(0.55, "#10100f");
      bgGrad.addColorStop(1, "#070707");
      halo = ctx.createRadialGradient(width * 0.5, cy, 0, width * 0.5, cy, height * 0.62);
      halo.addColorStop(0, "rgba(236,232,223,0.08)");
      halo.addColorStop(0.5, "rgba(236,232,223,0.02)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
    };

    var trace = function (phase, freq, amp, cy, strength) {
      ctx.beginPath();
      for (var x = 0; x <= width; x += 2) {
        var t = x / width;
        var y =
          cy +
          Math.sin(t * Math.PI * 2 * freq + phase) * amp +
          Math.sin(t * Math.PI * 2 * freq * 2.73 - phase * 0.8) * amp * 0.28 +
          Math.sin(t * Math.PI * 2 * freq * 0.51 + phase * 1.7) * amp * 0.18;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = "rgba(242,239,230," + strength + ")";
      ctx.stroke();
    };

    var draw = function () {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      // graph paper
      var step = 56;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(236,232,223,0.035)";
      ctx.beginPath();
      for (var x = 0; x <= width; x += step) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (var y = 0; y <= height; y += step) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      var cy = height * 0.45;
      ctx.strokeStyle = "rgba(236,232,223,0.12)";
      ctx.beginPath();
      ctx.moveTo(0, cy + 0.5);
      ctx.lineTo(width, cy + 0.5);
      ctx.stroke();

      // rolling sweep
      var sweep = ((time * 0.06) % 1) * width;
      var sweepGrad = ctx.createLinearGradient(sweep - 90, 0, sweep, 0);
      sweepGrad.addColorStop(0, "rgba(236,232,223,0)");
      sweepGrad.addColorStop(1, "rgba(236,232,223,0.05)");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(Math.max(0, sweep - 90), 0, Math.min(90, sweep), height);

      var amp = height * (0.03 + 0.085 * current);
      var freq = 1.7 + current * 3.6;
      var phase = time * 0.9;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // phosphor trail
      ctx.lineWidth = 6;
      trace(phase - 0.22, freq, amp, cy, 0.045);
      ctx.lineWidth = 3;
      trace(phase - 0.1, freq, amp, cy, 0.08);

      // glow + core
      ctx.save();
      ctx.shadowColor = "rgba(236,232,223,0.55)";
      ctx.shadowBlur = 16;
      ctx.lineWidth = 1.6;
      trace(phase, freq, amp, cy, 0.55);
      ctx.restore();

      ctx.lineWidth = 1;
      trace(phase, freq, amp, cy, 0.95);

      // second channel, quieter
      ctx.lineWidth = 1;
      trace(phase * 0.7 + 1.2, freq * 0.62 + 0.8, amp * 0.45, height * 0.64, 0.18);
    };

    var resize = function () {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGradients();
      draw();
    };

    var loop = function (now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      time += dt;
      current += (target - current) * 0.09;
      if (root) root.style.setProperty("--ss-progress", String(current));
      draw();

      if (visible) {
        rafId = window.requestAnimationFrame(loop);
      } else {
        running = false;
        last = 0;
      }
    };

    var readScroll = function () {
      if (!root) return;
      var rect = root.getBoundingClientRect();
      var total = Math.max(root.offsetHeight - window.innerHeight, 1);
      target = clamp(-rect.top / total, 0, 1);
      visible = rect.bottom > 0 && rect.top < window.innerHeight;

      if (reduce) {
        current = target;
        if (root) root.style.setProperty("--ss-progress", String(current));
        draw();
        return;
      }
      if (!running) {
        running = true;
        last = performance.now();
        rafId = window.requestAnimationFrame(loop);
      }
    };

    resize();
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("touchmove", readScroll, { passive: true });
    window.addEventListener("touchend", readScroll, { passive: true });
    window.addEventListener("resize", function () {
      resize();
      readScroll();
    });
    window.addEventListener("pagehide", function () {
      if (rafId) window.cancelAnimationFrame(rafId);
    });
  }

  // copy the wallet key
  var copy = document.querySelector(".wallet-key");
  if (copy) {
    copy.addEventListener("click", function () {
      var value = document.querySelector(".foot__wallet-value");
      if (!value) return;
      var text = value.textContent.trim();
      var done = function () {
        var old = copy.textContent;
        copy.textContent = "copied";
        window.setTimeout(function () {
          copy.textContent = old;
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        done();
      }
    });
  }
})();
