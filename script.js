(function () {
  "use strict";

  // Hero: a procedural 3D wireframe grid receding into darkness.
  // The scroll drives the camera forward; at the ends the grid keeps a slow
  // idle drift so the motion never freezes.
  var canvas = document.querySelector(".grid-field");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var root = canvas.closest(".scroll-scrub");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var target = 0;
    var current = 0;
    var idle = 0;
    var idleAmp = 0;
    var time = 0;
    var last = 0;
    var rafId = 0;
    var running = false;
    var visible = true;
    var bgGrad = null;
    var glow = null;

    var clamp = function (value, min, max) {
      return Math.min(max, Math.max(min, value));
    };

    var buildGradients = function () {
      var horizon = height * 0.54;
      bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0b0b0a");
      bgGrad.addColorStop(0.5, "#111110");
      bgGrad.addColorStop(1, "#070707");
      glow = ctx.createRadialGradient(width * 0.5, horizon, 0, width * 0.5, horizon, height * 0.62);
      glow.addColorStop(0, "rgba(236,232,223,0.13)");
      glow.addColorStop(0.45, "rgba(236,232,223,0.04)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
    };

    var shape = function (z) {
      var bendX = Math.sin(z * 0.11) * 0.75 + Math.sin(z * 0.04 + 1.3) * 0.35;
      var bendY = Math.cos(z * 0.08) * 0.2;
      var halfW = 2.7;
      var halfH = 1.45;
      var points = [];
      var i;
      for (i = 0; i <= 6; i += 1) {
        points.push([-halfW + (i * halfW * 2) / 6 + bendX, halfH + bendY]);
      }
      for (i = 1; i <= 4; i += 1) {
        points.push([halfW + bendX, halfH - (i * halfH * 2) / 4 + bendY]);
      }
      for (i = 1; i <= 6; i += 1) {
        points.push([halfW - (i * halfW * 2) / 6 + bendX, -halfH + bendY]);
      }
      for (i = 1; i <= 4; i += 1) {
        points.push([-halfW + bendX, -halfH + (i * halfH * 2) / 4 + bendY]);
      }
      return points;
    };

    var project = function (x, y, z) {
      var focal = height * 0.95;
      var scale = focal / z;
      return [width * 0.52 + x * scale, height * 0.5 - y * scale];
    };

    var draw = function () {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      var camera = current * 30 + idle;
      var near = 0.55;
      var far = 30;
      var spacing = 0.55;
      var offset = ((camera % spacing) + spacing) % spacing;
      var z;
      var i;
      var p;

      // longitudinal rails
      for (i = 0; i < 20; i += 1) {
        ctx.beginPath();
        for (z = near; z <= far; z += 0.55) {
          p = shape(z)[i];
          var q = project(p[0], p[1], z);
          if (z === near) {
            ctx.moveTo(q[0], q[1]);
          } else {
            ctx.lineTo(q[0], q[1]);
          }
        }
        ctx.strokeStyle = "rgba(236,232,223,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // rings coming toward the camera
      for (i = 0; i < 54; i += 1) {
        z = near + i * spacing - offset;
        if (z < near) continue;
        var fade = 1 - (z - near) / (far - near);
        if (fade < 0) fade = 0;
        var points = shape(z);
        ctx.beginPath();
        for (var k = 0; k < points.length; k += 1) {
          var r = project(points[k][0], points[k][1], z);
          if (k === 0) {
            ctx.moveTo(r[0], r[1]);
          } else {
            ctx.lineTo(r[0], r[1]);
          }
        }
        ctx.closePath();
        var weight = 0.035 + 0.22 * fade;
        if (i % 6 === 0) weight += 0.1;
        ctx.strokeStyle = "rgba(236,232,223," + weight.toFixed(3) + ")";
        ctx.lineWidth = i % 6 === 0 ? 1.2 : 1;
        ctx.stroke();
      }
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
      current += (target - current) * 0.08;

      var atEdge = visible && (target <= 0.001 || target >= 0.999);
      idleAmp += ((atEdge ? 1 : 0) - idleAmp) * 0.04;
      time += dt;
      idle = Math.sin(time * 0.7) * 0.9 * idleAmp;

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
        idleAmp = 0;
        idle = 0;
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
