/* Cemen Bakin — portfolio
   Three small jobs: remember the language, remember the theme, and keep the
   reading rail pointing at wherever you actually are. Nothing else.
   The page is fully readable with this file blocked. */

(function () {
  "use strict";

  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* --- language --------------------------------------------------------- */

  var langButtons = Array.prototype.slice.call(document.querySelectorAll("[data-setlang]"));

  function setLang(lang, remember) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    langButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.setlang === lang));
    });
    if (remember) store.set("lang", lang);
  }

  var savedLang = store.get("lang");
  if (savedLang === "en" || savedLang === "nb") {
    setLang(savedLang, false);
  } else if ((navigator.language || "").toLowerCase().indexOf("nb") === 0 ||
             (navigator.language || "").toLowerCase().indexOf("no") === 0 ||
             (navigator.language || "").toLowerCase().indexOf("nn") === 0) {
    setLang("nb", false);
  }

  langButtons.forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.setlang, true); });
  });

  /* --- theme ------------------------------------------------------------
     Default is the system setting: no attribute at all. The button writes an
     explicit choice, which then wins in both directions. */

  var savedTheme = store.get("theme");
  if (savedTheme === "light" || savedTheme === "dark") root.setAttribute("data-theme", savedTheme);

  var themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
    });
  }

  /* --- reading rail -----------------------------------------------------
     The rail marks the section whose heading most recently passed the reading
     line (a third of the way down the viewport). Scroll position, not
     intersection ratio: a tall case and a short one should feel the same. */

  var links = Array.prototype.slice.call(document.querySelectorAll(".rail a[data-rail]"));
  if (!links.length) return;

  var targets = links.map(function (a) {
    return { link: a, el: document.getElementById(a.dataset.rail) };
  }).filter(function (t) { return t.el; });

  var current = null;

  function update() {
    var line = window.scrollY + window.innerHeight * 0.33;
    var active = null;   /* in the masthead, nothing is current yet */

    for (var i = 0; i < targets.length; i++) {
      if (targets[i].el.offsetTop <= line) active = targets[i];
    }
    /* at the very bottom the last section wins, however short it is */
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      active = targets[targets.length - 1];
    }
    if (active === current) return;
    if (current) current.link.removeAttribute("aria-current");
    if (active) active.link.setAttribute("aria-current", "true");
    current = active;
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
