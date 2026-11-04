(function () {
  "use strict";

  // Scroll-scrub film: the scroll position drives a CRT signal clip.
  // The clip is fetched as a blob first so seeking works on any static host,
  // even one without HTTP range support. iOS Safari also needs the video to be
  // primed by a real touch before it will paint seeked frames, hence prime().
  var root = document.querySelector(".scroll-scrub");
  if (root && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var layer = root.querySelector(".scroll-scrub__layer");
    var mobile = window.matchMedia("(hover: none) and (pointer: coarse), (max-width: 860px)").matches;
    var clip = mobile ? "assets/world/scene-01-mobile.mp4" : "assets/world/scene-01.mp4";
    var video = document.createElement("video");
    var objectUrl = null;
    var userReady = false;
    var primed = false;

    video.className = "scroll-scrub__video";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.controls = false;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("disablepictureinpicture", "");

    var update = function () {
      var rect = root.getBoundingClientRect();
      var total = Math.max(root.offsetHeight - window.innerHeight, 1);
      var progress = Math.min(Math.max(-rect.top / total, 0), 1);
      root.style.setProperty("--ss-progress", String(progress));
      if (video.readyState >= 1 && video.duration) {
        var target = progress * (video.duration - 0.05);
        if (Math.abs(video.currentTime - target) > 0.04) {
          try {
            video.currentTime = target;
          } catch (error) {
            // keep the last painted frame while the browser catches up
          }
        }
      }
    };

    var prime = function () {
      if (primed || !video.src) return;
      primed = true;
      var played = video.play();
      if (played && typeof played.then === "function") {
        played
          .then(function () {
            try {
              video.pause();
            } catch (error) {}
            update();
          })
          .catch(function () {
            primed = false;
          });
      } else {
        try {
          video.pause();
        } catch (error) {}
        update();
      }
    };

    var attach = function () {
      video.addEventListener("loadedmetadata", update);
      video.addEventListener("loadeddata", function () {
        layer.dataset.videoPainted = "true";
        update();
        if (userReady) prime();
      });
      video.addEventListener("canplay", update);
      video.addEventListener("seeked", function () {
        layer.dataset.videoPainted = "true";
      });
      layer.appendChild(video);
      update();
    };

    fetch(clip)
      .then(function (response) {
        if (!response.ok) throw new Error("clip " + response.status);
        return response.blob();
      })
      .then(function (blob) {
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
        attach();
      })
      .catch(function () {
        // no blob support or network hiccup: fall back to direct source
        video.src = clip;
        attach();
      });

    var onFirstGesture = function () {
      userReady = true;
      prime();
    };
    // not { once: true }: the first touch often lands before the clip is ready,
    // so keep trying on every touch until play() succeeds.
    window.addEventListener("touchstart", onFirstGesture, { passive: true });
    window.addEventListener("touchend", onFirstGesture, { passive: true });
    window.addEventListener("pointerdown", onFirstGesture, { passive: true });

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("touchend", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("pagehide", function () {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });
    update();
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
