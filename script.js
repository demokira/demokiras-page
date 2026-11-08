(function () {
  "use strict";

  // Random film grain over the whole site: every frame is re-randomized,
  // so light areas never show a repeating tile sliding around.
  var grain = document.querySelector(".grain-field");
  if (grain && grain.getContext) {
    var gctx = grain.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gw = 0;
    var gh = 0;
    var gdpr = 1;
    var field = document.createElement("canvas");
    var fctx = field.getContext("2d");
    var image = null;
    var glast = 0;
    var graf = 0;

    var gresize = function () {
      var rect = grain.getBoundingClientRect();
      gw = Math.max(1, rect.width);
      gh = Math.max(1, rect.height);
      gdpr = Math.min(window.devicePixelRatio || 1, 2);
      grain.width = Math.round(gw * gdpr);
      grain.height = Math.round(gh * gdpr);
      gctx.setTransform(gdpr, 0, 0, gdpr, 0, 0);
      field.width = Math.max(160, Math.round(gw / 2));
      field.height = Math.max(120, Math.round(gh / 2));
      image = null;
    };

    var gdraw = function (now) {
      if (!gw || !gh) {
        gresize();
      }
      if (now - glast < 70) {
        graf = window.requestAnimationFrame(gdraw);
        return;
      }
      glast = now;

      var w = field.width;
      var h = field.height;
      if (!image) {
        image = fctx.createImageData(w, h);
      }
      var data = image.data;
      for (var i = 0; i < data.length; i += 4) {
        var value = (Math.random() * 255) | 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
      fctx.putImageData(image, 0, 0);
      gctx.clearRect(0, 0, gw, gh);
      gctx.imageSmoothingEnabled = true;
      gctx.drawImage(field, 0, 0, gw, gh);

      if (!reduce) {
        graf = window.requestAnimationFrame(gdraw);
      }
    };

    gresize();
    gdraw(performance.now());
    window.addEventListener("resize", function () {
      gresize();
      gdraw(performance.now());
    });
    window.addEventListener("pagehide", function () {
      if (graf) window.cancelAnimationFrame(graf);
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
