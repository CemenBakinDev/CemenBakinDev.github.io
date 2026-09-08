/* Cemen Bakin — the ridge fields.

   The page opens on seven ridges and closes on them. Seven because Bergen is
   the city between the seven mountains; the shape is generated, not a picture
   of anywhere in particular.

   Everything here is decoration, so it is built to be skippable: the canvases
   are aria-hidden, every page reads fine with this file blocked, and if the
   visitor asks for reduced motion each field draws one still frame and stops. */

(function () {
  "use strict";

  var canvases = document.querySelectorAll(".ridge");
  if (!canvases.length) return;

  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  var LAYERS = 7;
  var TABLE = 2048;
  var tabVisible = !document.hidden;

  /* --- the profiles, shared by every field --------------------------------
     Each ridge is a sum of sines at integer harmonics over a unit domain, so
     the profile is *exactly* periodic: scrolling it is only an offset, and it
     can run for hours without drifting.

     This replaced a hashed value noise. Be careful about why: the reported
     glitch was never traced to the noise. I guessed the unbounded domain
     (`x + elapsed_milliseconds`) was losing double precision, measured it, and
     found the old profile just as stable after a simulated hour — worst
     frame-to-frame step 0.0006 either way. I also measured the polyline and
     found it deviates 0.09px from the true curve, invisible. Both guesses were
     wrong. The periodic form is kept because it is cheaper and cannot drift;
     the work against stutter is below, where nothing per frame allocates or
     reads style and the loop runs at half rate. */

  function rnd(seed) {
    var x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);             /* only ever called with small seeds */
  }

  var profiles = (function () {
    var out = [];
    for (var l = 0; l < LAYERS; l++) {
      var harmonics = 5 + (l % 3);
      var amp = [], phase = [], total = 0;
      for (var k = 1; k <= harmonics; k++) {
        var a = Math.pow(k, -1.45);
        amp.push(a);
        phase.push(rnd(l * 7.13 + k * 2.7) * Math.PI * 2);
        total += a;
      }
      var t = new Float32Array(TABLE);
      for (var i = 0; i < TABLE; i++) {
        var u = i / TABLE, v = 0;
        for (var h = 0; h < harmonics; h++) {
          v += amp[h] * Math.sin(2 * Math.PI * (h + 1) * u + phase[h]);
        }
        t[i] = v / total * 0.5 + 0.5;
      }
      out.push(t);
    }
    return out;
  })();

  function at(table, u) {
    var x = (u - Math.floor(u)) * TABLE;
    var i = Math.floor(x), f = x - i;
    var a = table[i % TABLE], b = table[(i + 1) % TABLE];
    return a + (b - a) * f;
  }

  /* Which theme is on is decided by measuring the ground's brightness, not by
     matching a hex string: comparing against a literal "#0a0a0b" broke
     silently the moment the token was edited. Read once, never per frame —
     that read forced a style recalculation sixty times a second. */

  var cachedPalette = null;

  function palette() {
    if (cachedPalette) return cachedPalette;
    var bg = getComputedStyle(document.body).backgroundColor;
    var m = (bg || "").match(/[\d.]+/g);
    var dark = !m || (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 < 0.5;
    cachedPalette = dark
      ? { back: [26, 26, 30], front: [8, 8, 10], haze: [255, 255, 255] }
      : { back: [196, 198, 204], front: [246, 246, 248], haze: [255, 255, 255] };
    return cachedPalette;
  }

  function mix(a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + ","
                  + Math.round(a[1] + (b[1] - a[1]) * t) + ","
                  + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  }

  /* --- one field ----------------------------------------------------------
     The page opens on ridges and closes on them, so this runs more than once.
     Everything that depends on size — the backing store, the gradients —
     belongs to the individual canvas, and a field animates only while it is on
     screen, so the two on a page never both run. */

  function Field(canvas, flip) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    var W = 0, H = 0, dpr = 1;
    var gradients = null;
    var running = false, raf = 0, onScreen = false, tick = 0;

    function buildGradients(p) {
      gradients = [];
      for (var l = 0; l < LAYERS; l++) {
        var depth = l / (LAYERS - 1);
        var base = H * (0.42 + depth * 0.52), height = H * (0.10 + depth * 0.22);
        var g = ctx.createLinearGradient(0, base - height * 1.5, 0, base + height * 0.2);
        g.addColorStop(0, "rgba(" + p.haze.join(",") + ",0)");
        g.addColorStop(1, "rgba(" + p.haze.join(",") + ",0.06)");
        gradients.push(g);
      }
    }

    function draw(t) {
      var p = palette();
      if (!gradients) buildGradients(p);
      ctx.clearRect(0, 0, W, H);

      /* The closing field is the opening one turned over, so the page ends on
         a horizon instead of repeating its own first frame. */
      ctx.save();
      if (flip) { ctx.translate(0, H); ctx.scale(1, -1); }

      var step = 4;                       /* 0.02px off the true curve */

      for (var l = 0; l < LAYERS; l++) {
        var depth  = l / (LAYERS - 1);
        var table  = profiles[l];
        var base   = H * (0.42 + depth * 0.52);
        var height = H * (0.10 + depth * 0.22);
        var cycles = 1.15 + depth * 0.85;
        var shift  = t * 0.0000055 * (1 + depth * 3.4) + (flip ? 0.37 : 0);

        var breathe = 0.5 + 0.5 * Math.sin(t * 0.00011 + l * 1.7);
        ctx.globalAlpha = (0.030 + depth * 0.045) * (0.65 + breathe * 0.35) / 0.06;
        ctx.fillStyle = gradients[l];
        ctx.fillRect(0, base - height * 1.5, W, height * 1.7);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo(0, H);
        for (var x = 0; x <= W; x += step) {
          ctx.lineTo(x, base - at(table, (x / W) * cycles + shift) * height);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = mix(p.back, p.front, depth);
        ctx.fill();
      }
      ctx.restore();
    }

    /* Drifting haze does not need 60fps, and skipping every other frame halves
       the fill work — the largest saving available on a canvas this size. */
    function frame(t) {
      if ((tick++ & 1) === 0) draw(t);
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || still.matches || !onScreen || !tabVisible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function resize() {
      /* Soft gradients and a smooth silhouette: 1.5x is indistinguishable from
         2x here and covers 44% fewer pixels per fill. */
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gradients = null;                   /* they are sized to H */
      draw(performance.now());
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        onScreen = e[0].isIntersecting;
        if (onScreen) start(); else stop();
      }, { threshold: 0 }).observe(canvas);
    } else {
      onScreen = true;
    }

    return {
      resize: resize,
      start: start,
      stop: stop,
      repaint: function () { gradients = null; draw(performance.now()); }
    };
  }

  var fields = [];
  Array.prototype.forEach.call(canvases, function (c, i) {
    var f = Field(c, i > 0);
    if (f) fields.push(f);
  });

  function each(fn) { fields.forEach(fn); }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { each(function (f) { f.resize(); }); }, 120);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    tabVisible = !document.hidden;
    each(function (f) { if (tabVisible) f.start(); else f.stop(); });
  });

  function themeChanged() {
    cachedPalette = null;
    each(function (f) { f.repaint(); });
  }
  new MutationObserver(themeChanged)
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChanged);

  still.addEventListener("change", function () {
    each(function (f) { if (still.matches) f.stop(); else f.start(); });
  });

  each(function (f) { f.resize(); f.start(); });
})();
