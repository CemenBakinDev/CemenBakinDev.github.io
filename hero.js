/* Cemen Bakin — the opening field.

   Seven ridges and the haze between them, drawn rather than photographed.
   Seven because Bergen is the city between the seven mountains; the shape is
   value noise, not a picture of anywhere in particular.

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
  var W = 0, H = 0, dpr = 1;
  var running = false, raf = 0;
  var onScreen = true, tabVisible = true;

  /* --- value noise -------------------------------------------------------
     A seeded 1-D noise, smoothed and stacked into a few octaves. Seeded so
     the skyline is the same on every visit — it is a mark, not a lottery. */

  function rnd(seed) {
    var x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function noise(x, seed) {
    var i = Math.floor(x), f = x - i;
    var u = f * f * (3 - 2 * f);                 /* smoothstep */
    return rnd(i + seed) * (1 - u) + rnd(i + 1 + seed) * u;
  }

  function fbm(x, seed) {
    var v = 0, amp = 0.5, freq = 1;
    for (var o = 0; o < 4; o++) {
      v += noise(x * freq, seed) * amp;
      amp *= 0.5; freq *= 2;
    }
    return v;
  }

  /* --- palette -----------------------------------------------------------
     Read from the stylesheet rather than hard-coded, so the ridges follow the
     theme switch instead of keeping their own private colours.

     Which theme is on is decided by measuring the ground's brightness, not by
     matching a hex string: comparing against a literal "#0a0a0b" broke
     silently the moment the token was edited, and the ridges fell back to the
     light palette on a dark page with nothing to show for it. */

  function isDark() {
    var bg = getComputedStyle(document.body).backgroundColor;
    var m = (bg || "").match(/[\d.]+/g);
    if (!m) return true;
    return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 < 0.5;
  }

  function palette() {
    return isDark()
      ? { back: [26, 26, 30], front: [8, 8, 10], haze: [255, 255, 255] }
      : { back: [196, 198, 204], front: [246, 246, 248], haze: [255, 255, 255] };
  }

  function mix(a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + ","
                  + Math.round(a[1] + (b[1] - a[1]) * t) + ","
                  + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  }

  /* --- drawing ----------------------------------------------------------- */

  function draw(t) {
    var p = palette();
    ctx.clearRect(0, 0, W, H);

    for (var l = 0; l < LAYERS; l++) {
      var depth = l / (LAYERS - 1);          /* 0 = furthest, 1 = nearest */

      /* Nearer ridges sit lower, are taller and drift faster — the only
         parallax on the page. */
      var base   = H * (0.42 + depth * 0.52);
      var height = H * (0.10 + depth * 0.22);
      var speed  = 0.0000075 * (1 + depth * 3.2);
      var shift  = t * speed;
      var step   = Math.max(6, W / 190);

      /* the haze that settles on top of each ridge */
      var hazeTop = base - height * 1.5;
      var g = ctx.createLinearGradient(0, hazeTop, 0, base + height * 0.2);
      var breathe = 0.5 + 0.5 * Math.sin(t * 0.00013 + l);
      var a = (0.030 + depth * 0.045) * (0.65 + breathe * 0.35);
      g.addColorStop(0, "rgba(" + p.haze.join(",") + ",0)");
      g.addColorStop(1, "rgba(" + p.haze.join(",") + "," + a.toFixed(4) + ")");
      ctx.fillStyle = g;
      ctx.fillRect(0, hazeTop, W, base + height * 0.2 - hazeTop);

      /* the ridge itself */
      ctx.beginPath();
      ctx.moveTo(-step, H);
      for (var x = -step; x <= W + step; x += step) {
        var n = fbm(x / (W * 0.42) + shift, l * 37.3);
        ctx.lineTo(x, base - n * height);
      }
      ctx.lineTo(W + step, H);
      ctx.closePath();
      ctx.fillStyle = mix(p.back, p.front, depth);
      ctx.fill();
    }
  }

  /* --- loop --------------------------------------------------------------
     One rAF, paused whenever the hero is off screen or the tab is hidden, so
     a portfolio left open in a background tab costs nothing. */

  function frame(t) {
    draw(t);
    if (running) raf = requestAnimationFrame(frame);
  }

  /* Both conditions have to hold. Starting on whichever event fired last let
     a tab switch restart the loop over a canvas that was scrolled out of
     view, which is exactly what the pausing exists to avoid. */
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
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  /* Redraw on a theme change: the palette is read from the stylesheet, so the
     ridges have to be told the tokens moved. */
  new MutationObserver(function () { draw(performance.now()); })
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function () { draw(performance.now()); });

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

  resize();
  if (!still.matches) start();
})();
