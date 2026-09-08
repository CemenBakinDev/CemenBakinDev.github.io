/* Cemen Bakin — the opening field.

   Seven ridges and the haze between them, drawn rather than photographed.
   Seven because Bergen is the city between the seven mountains; the shape is
   generated, not a picture of anywhere in particular.

   Everything here is decoration, so it is built to be skippable: the canvas is
   aria-hidden, the page reads fine with this file blocked, and if the visitor
   asks for reduced motion it draws one still frame and stops. */

(function () {
  "use strict";

  var canvas = document.querySelector(".ridge");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  var LAYERS = 7;
  var TABLE = 2048;          /* samples per ridge profile */
  var W = 0, H = 0, dpr = 1;
  var running = false, raf = 0;
  var onScreen = true, tabVisible = true;

  /* --- the profiles -------------------------------------------------------
     Each ridge is a sum of sines at integer harmonics over a unit domain, so
     the profile is *exactly* periodic: scrolling it is only an offset, and it
     can run for hours without the shape drifting or breaking up.

     This replaced a hashed value noise. Be careful about why: the reported
     glitch was *not* traced to the noise. I guessed the unbounded domain
     (`x + elapsed_milliseconds`) was losing double precision, measured it, and
     found the old profile just as stable after a simulated hour — worst
     frame-to-frame step 0.0006 either way. I also measured the polyline
     faceting and found it deviates 0.09px from the true curve, invisible.
     Both guesses were wrong.

     The profile is periodic anyway because it is cheaper and cannot drift, and
     the real work against stutter is below: nothing per-frame allocates or
     reads style, and the loop runs at half rate. If the glitch returns, that
     is where to look — not here. */

  var profiles = [];

  function rnd(seed) {
    var x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);            /* only ever called with small seeds */
  }

  function buildProfiles() {
    profiles = [];
    for (var l = 0; l < LAYERS; l++) {
      var harmonics = 5 + (l % 3);       /* nearer ridges get a little busier */
      var amp = [], phase = [], total = 0;

      for (var k = 1; k <= harmonics; k++) {
        var a = Math.pow(k, -1.45);      /* falls off the way terrain does */
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
        t[i] = v / total * 0.5 + 0.5;    /* 0..1 */
      }
      profiles.push(t);
    }
  }

  /* Read the table at a fractional position, wrapping. Linear interpolation is
     enough at 2048 samples — the curve is already band-limited. */
  function at(table, u) {
    var x = (u - Math.floor(u)) * TABLE;
    var i = Math.floor(x), f = x - i;
    var a = table[i % TABLE], b = table[(i + 1) % TABLE];
    return a + (b - a) * f;
  }

  /* --- palette -----------------------------------------------------------
     Cached. Reading it through getComputedStyle on every frame forced a style
     recalculation sixty times a second, which is its own source of stutter.
     The theme observers below invalidate it.

     Which theme is on is decided by measuring the ground's brightness, not by
     matching a hex string: comparing against a literal "#0a0a0b" broke
     silently the moment the token was edited. */

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

  var gradients = null;

  function repaint() {
    cachedPalette = null;
    gradients = null;
    draw(performance.now());
  }

  function mix(a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + ","
                  + Math.round(a[1] + (b[1] - a[1]) * t) + ","
                  + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  }

  /* --- drawing ----------------------------------------------------------- */

  function buildGradients(p) {
    gradients = [];
    for (var l = 0; l < LAYERS; l++) {
      var depth = l / (LAYERS - 1);
      var base = H * (0.42 + depth * 0.52), height = H * (0.10 + depth * 0.22);
      var top = base - height * 1.5;
      var g = ctx.createLinearGradient(0, top, 0, base + height * 0.2);
      g.addColorStop(0, "rgba(" + p.haze.join(",") + ",0)");
      g.addColorStop(1, "rgba(" + p.haze.join(",") + ",0.06)");
      gradients.push(g);
    }
  }

  function draw(t) {
    var p = palette();
    if (!gradients) buildGradients(p);
    ctx.clearRect(0, 0, W, H);

    /* 4px measures 0.02px off the true curve — half the segments of 2px for
       no visible difference. */
    var step = 4;

    for (var l = 0; l < LAYERS; l++) {
      var depth = l / (LAYERS - 1);      /* 0 = furthest, 1 = nearest */
      var table = profiles[l];

      /* Nearer ridges sit lower, stand taller and drift faster — the only
         parallax on the page. */
      var base   = H * (0.42 + depth * 0.52);
      var height = H * (0.10 + depth * 0.22);
      var cycles = 1.15 + depth * 0.85;  /* how much of the profile spans W */
      var shift  = t * 0.0000055 * (1 + depth * 3.4);

      /* The haze settling on each ridge. Its gradient is built once per size
         and theme rather than seven times a frame; the breathing is carried by
         globalAlpha instead, which costs nothing. */
      var hazeTop = base - height * 1.5;
      var breathe = 0.5 + 0.5 * Math.sin(t * 0.00011 + l * 1.7);
      ctx.globalAlpha = (0.030 + depth * 0.045) * (0.65 + breathe * 0.35) / 0.06;
      ctx.fillStyle = gradients[l];
      ctx.fillRect(0, hazeTop, W, base + height * 0.2 - hazeTop);
      ctx.globalAlpha = 1;

      /* the ridge itself */
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
  }

  /* --- loop --------------------------------------------------------------
     One rAF, paused whenever the hero is off screen or the tab is hidden, so
     a portfolio left open in a background tab costs nothing. */

  /* Drifting haze does not need 60fps, and skipping every other frame halves
     the fill work — the largest saving available on a canvas this size. */
  var tick = 0;

  function frame(t) {
    if ((tick++ & 1) === 0) draw(t);
    if (running) raf = requestAnimationFrame(frame);
  }

  /* Both conditions have to hold. Starting on whichever event fired last let
     a tab switch restart the loop over a canvas that was scrolled out of view,
     which is exactly what the pausing exists to avoid. */
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
    gradients = null;                    /* they are sized to H */
    draw(performance.now());
  }

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    tabVisible = !document.hidden;
    if (tabVisible) start(); else stop();
  });

  new MutationObserver(repaint)
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  still.addEventListener("change", function () {
    if (still.matches) { stop(); draw(performance.now()); } else { start(); }
  });

  buildProfiles();
  resize();
  if (!still.matches) start();
})();
