/* Cemen Bakin — portfolio
   Four small jobs: remember the language, remember the theme, keep the bar
   pointing at wherever you actually are, and drive the two buttons on the
   websites track. Nothing else.
   The page is fully readable with this file blocked — the track is a real
   scroll container, so it still scrolls without the buttons. */

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


  /* --- the project tracks ------------------------------------------------
     Each section holds a row of small cards and a stack of full write-ups.
     Without this file the write-ups are all simply open and the row is an
     ordinary scrollable strip — so the enhancement is collapsing them, not
     revealing them, and nothing is unreachable if the script never runs. */

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  Array.prototype.forEach.call(document.querySelectorAll(".track"), function (track) {
    var sec     = track.closest("section");
    if (!sec) return;
    var cards   = Array.prototype.slice.call(sec.querySelectorAll(".pcard"));
    var count   = sec.querySelector("[data-count]");
    var total   = sec.querySelector("[data-total]");
    var btns    = Array.prototype.slice.call(sec.querySelectorAll("[data-track]"));
    if (!cards.length) return;

    sec.setAttribute("data-enhanced", "");

    /* -- the row -- */

    /* The counter measures screenfuls, not cards. Counting cards claimed
       "1 / 5" on a row that showed all five at once and had nothing to
       scroll to — the number has to describe what moves, not what exists. */

    function pages() {
      return Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth));
    }

    /* Measured against the distance that actually scrolls, not against whole
       screenfuls: the last page is usually a partial one, and dividing by
       clientWidth left the counter reading 1 while sitting at the far end. */
    function page() {
      var n = pages();
      var max = track.scrollWidth - track.clientWidth;
      if (n <= 1 || max <= 0) return 1;
      return 1 + Math.round((track.scrollLeft / max) * (n - 1));
    }

    function sync() {
      var n = pages();
      /* A row with one screenful has nothing to drive, so it shows no controls. */
      sec.classList.toggle("no-scroll", n <= 1);

      if (total) total.textContent = String(n);
      if (count) count.textContent = String(page());

      /* aria-disabled rather than disabled: a keyboard user paging to the end
         would otherwise have the focused button disabled underneath them, and
         the browser hands focus back to <body>. The click handler no-ops
         instead, so the button stays focusable and Tab order survives. */
      var atStart = track.scrollLeft <= 4;
      var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      btns.forEach(function (b) {
        b.setAttribute("aria-disabled",
          String(b.dataset.track === "prev" ? atStart : atEnd));
      });
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("aria-disabled") === "true") return;
        var dir = b.dataset.track === "next" ? 1 : -1;
        track.scrollBy({ left: dir * track.clientWidth,
                         behavior: reduced.matches ? "auto" : "smooth" });
      });
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });
    window.addEventListener("resize", sync, { passive: true });

    /* -- opening a project -- */

    function close(card) {
      var panel = document.getElementById(card.dataset.detail);
      card.setAttribute("aria-expanded", "false");
      card.classList.remove("is-open");
      if (panel) panel.classList.remove("is-open");
    }

    function open(card, focusPanel) {
      cards.forEach(function (c) { if (c !== card) close(c); });
      var panel = document.getElementById(card.dataset.detail);
      if (!panel) return;
      card.setAttribute("aria-expanded", "true");
      card.classList.add("is-open");
      panel.classList.add("is-open");
      if (focusPanel) {
        panel.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "nearest" });
      }
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        if (card.getAttribute("aria-expanded") === "true") { close(card); return; }
        open(card, true);
        history.replaceState(null, "", "#" + card.dataset.detail);
      });
    });

    Array.prototype.forEach.call(sec.querySelectorAll("[data-close]"), function (b) {
      b.addEventListener("click", function () {
        var panel = b.closest(".detail");
        var card = cards.filter(function (c) { return c.dataset.detail === panel.id; })[0];
        if (!card) return;
        close(card);
        card.focus();
        card.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth",
                              block: "nearest", inline: "nearest" });
      });
    });

    sec.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openCard = cards.filter(function (c) {
        return c.getAttribute("aria-expanded") === "true";
      })[0];
      if (openCard) { close(openCard); openCard.focus(); }
    });

    /* A link straight to a project opens it. */
    var hash = (location.hash || "").slice(1);
    var deep = cards.filter(function (c) { return c.dataset.detail === hash; })[0];
    if (deep) open(deep, false);

    sync();
  });

  /* --- the three languages -----------------------------------------------
     Each sentence opens the same introduction written in that language. The
     introductions are open in the markup, so with this file blocked all three
     are simply readable; the enhancement is the closing. */

  var tongues = document.getElementById("tongues");
  if (tongues) {
    var lines = Array.prototype.slice.call(tongues.querySelectorAll(".tongue"));
    if (lines.length) {
      tongues.setAttribute("data-enhanced", "");

      var shutBio = function (btn) {
        var b = document.getElementById(btn.getAttribute("aria-controls"));
        btn.setAttribute("aria-expanded", "false");
        if (b) b.classList.remove("is-open");
      };

      lines.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var wasOpen = btn.getAttribute("aria-expanded") === "true";
          lines.forEach(shutBio);
          if (wasOpen) return;
          var b = document.getElementById(btn.getAttribute("aria-controls"));
          if (!b) return;
          btn.setAttribute("aria-expanded", "true");
          /* restart the stagger even if the same panel is reopened */
          b.classList.remove("is-open");
          void b.offsetWidth;
          b.classList.add("is-open");
        });
      });

      tongues.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var open = lines.filter(function (b) {
          return b.getAttribute("aria-expanded") === "true";
        })[0];
        if (open) { shutBio(open); open.focus(); }
      });
    }
  }

  /* --- the bar ----------------------------------------------------------
     Two states to keep in step with the scroll: the hairline, which appears
     once the masthead is behind you, and the section mark.

     The mark follows the section whose heading most recently passed the
     reading line (a third of the way down the viewport). Scroll position,
     not intersection ratio: a tall case and a short one should feel the
     same. "Also built" has no mark of its own — it is more work, so it
     stays under Work, which is where its heading sits in the order. */

  var bar = document.getElementById("topbar");

  var links = Array.prototype.slice.call(document.querySelectorAll(".secnav a[data-spy]"));
  var targets = links.map(function (a) {
    return { link: a, el: document.getElementById(a.dataset.spy) };
  }).filter(function (t) { return t.el; });

  var current = null;
  var scrolled = null;

  function offsetTop(el) {
    var y = 0;
    for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  function update() {
    if (bar) {
      var isScrolled = window.scrollY > 8;
      if (isScrolled !== scrolled) {
        bar.classList.toggle("is-scrolled", isScrolled);
        scrolled = isScrolled;
      }
    }

    if (!targets.length) return;

    var line = window.scrollY + window.innerHeight * 0.33;
    var active = null;   /* in the masthead, nothing is current yet */

    for (var i = 0; i < targets.length; i++) {
      if (offsetTop(targets[i].el) <= line) active = targets[i];
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
