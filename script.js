(function () {
  "use strict";

  // Hero: animated white noise behind the ASCII boy. No scroll animation.
  var canvas = document.querySelector(".noise-field");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var field = document.createElement("canvas");
    var fieldCtx = field.getContext("2d");
    var image = null;
    var last = 0;
    var rafId = 0;

    var resize = function () {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field.width = Math.max(80, Math.round(width / 3));
      field.height = Math.max(60, Math.round(height / 3));
      image = null;
    };

    var paint = function () {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(field, 0, 0, width, height);
    };

    var noise = function (now) {
      if (!width || !height) {
        resize();
      }
      if (now - last < 60) {
        rafId = window.requestAnimationFrame(noise);
        return;
      }
      last = now;

      var rect = canvas.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        rafId = window.requestAnimationFrame(noise);
        return;
      }

      var w = field.width;
      var h = field.height;
      if (!image) {
        image = fieldCtx.createImageData(w, h);
      }
      var data = image.data;
      for (var i = 0; i < data.length; i += 4) {
        var value = (Math.random() * 255) | 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
      fieldCtx.putImageData(image, 0, 0);
      paint();

      if (!reduce) {
        rafId = window.requestAnimationFrame(noise);
      }
    };

    resize();
    noise(performance.now());
    window.addEventListener("resize", function () {
      resize();
      noise(performance.now());
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
