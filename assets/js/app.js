/* =============================================================================
   VERTEX DIMENSION — Application
   Page orchestration: navigation, scroll progress, section spy, reveal,
   counters, telemetry, boot. Behavior only — appearance lives in CSS.
   ========================================================================== */
(function () {
  "use strict";
  var VD = window.VD;

  /* --- Navigation: scrolled state + mobile menu ------------------------ */
  function initNav() {
    var nav = document.querySelector(".nav");
    var burger = document.querySelector(".nav__burger");
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger) {
      burger.addEventListener("click", function () {
        nav.classList.toggle("is-open");
        var open = nav.classList.contains("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
    }
    nav.querySelectorAll(".nav__link").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- Scroll progress hairline ---------------------------------------- */
  function initProgress() {
    var bar = document.querySelector(".progress");
    if (!bar) return;
    var tick = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? VD.clamp(window.scrollY / max, 0, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
  }

  /* --- Active section highlighting in the nav -------------------------- */
  function initSpy() {
    var links = {};
    document.querySelectorAll(".nav__link[href^='#']").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var sections = document.querySelectorAll("section[id]");
    if (!("IntersectionObserver" in window) || !sections.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.id;
          Object.keys(links).forEach(function (k) {
            links[k].classList.toggle("is-active", k === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  /* --- Reveal choreography --------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal], .reveal");
    items.forEach(function (el) {
      el.classList.add("reveal");
    });

    // Apply stagger indices to children of [data-stagger] groups.
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      Array.prototype.slice
        .call(group.children)
        .forEach(function (child, i) {
          child.classList.add("reveal");
          child.style.setProperty("--i", i);
        });
    });

    if (VD.reducedMotion() || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  }

  /* --- Animated counters ----------------------------------------------- */
  function formatNumber(value, decimals) {
    var fixed = value.toFixed(decimals);
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function runCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var dur = 1500;
    if (VD.reducedMotion()) {
      el.textContent = formatNumber(target, decimals);
      return;
    }
    var startT = null;
    function step(ts) {
      if (startT === null) startT = ts;
      var p = VD.clamp((ts - startT) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      el.textContent = formatNumber(target * eased, decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(target, decimals);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCount);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            runCount(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (c) {
      io.observe(c);
    });
  }

  /* --- Hero telemetry readout ------------------------------------------ */
  function initTelemetry() {
    var clockEl = document.querySelector("[data-clock]");
    if (!clockEl) return;
    var pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };
    var tick = function () {
      var d = new Date();
      clockEl.textContent =
        pad(d.getUTCHours()) +
        ":" +
        pad(d.getUTCMinutes()) +
        ":" +
        pad(d.getUTCSeconds()) +
        " UTC";
    };
    tick();
    setInterval(tick, 1000);
  }

  /* --- Boot ------------------------------------------------------------- */
  function boot() {
    if (VD.i18n) VD.i18n.init();
    initNav();
    initProgress();
    initSpy();
    initReveal();
    initCounters();
    initTelemetry();
    if (VD.initHero) VD.initHero();

    // Trigger the hero entrance on the next frame so transitions fire.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("is-loaded");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
