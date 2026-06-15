/* =============================================================================
   VERTEX DIMENSION — Core utilities
   Namespace, reduced-motion gate, HiDPI canvas, gated render loop, shared
   pointer. Loaded first; every other script builds on VD. Classic script —
   no modules — so file:// and static hosts both work.
   ========================================================================== */
(function () {
  "use strict";

  /** Global namespace. */
  var VD = (window.VD = window.VD || {});

  /* --- Environment ----------------------------------------------------- */
  var reduceQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  /** Live check — respects the user changing the OS setting mid-session. */
  VD.reducedMotion = function () {
    return !!reduceQuery.matches;
  };

  VD.clamp = function (v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  };

  VD.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  VD.DEG = Math.PI / 180;

  /* --- Shared pointer (normalised to viewport, eased) ------------------ */
  var pointer = (VD.pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false });

  function onMove(clientX, clientY) {
    pointer.tx = (clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (clientY / window.innerHeight) * 2 - 1;
    pointer.active = true;
  }
  window.addEventListener(
    "pointermove",
    function (e) {
      onMove(e.clientX, e.clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "pointerleave",
    function () {
      pointer.tx = 0;
      pointer.ty = 0;
    },
    { passive: true }
  );

  /* --- HiDPI canvas sizing --------------------------------------------- */
  /**
   * Size a canvas to its CSS box at device pixel ratio and reset the
   * transform so all drawing happens in CSS pixels.
   * @returns {{w:number,h:number,dpr:number}}
   */
  VD.fitCanvas = function (canvas, ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, dpr: dpr };
  };

  /* --- Gated render loop ----------------------------------------------- */
  /**
   * Create a render scene bound to a canvas. The loop pauses when the
   * canvas is offscreen or the tab is hidden, and renders a single static
   * frame when the user prefers reduced motion.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts
   * @param {(ctx:CanvasRenderingContext2D, time:number, dims:object)=>void} opts.draw
   * @param {(dims:object)=>void} [opts.onResize]
   */
  VD.createScene = function (canvas, opts) {
    var ctx = canvas.getContext("2d");
    var dims = VD.fitCanvas(canvas, ctx);
    var running = false;
    var inView = true;
    var start = 0;
    var rafId = 0;

    function ease() {
      // Smooth the shared pointer toward its target for buttery parallax.
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
    }

    function frame(now) {
      if (!running) return;
      if (!start) start = now;
      ease();
      opts.draw(ctx, (now - start) / 1000, dims);
      rafId = requestAnimationFrame(frame);
    }

    function play() {
      if (running || VD.reducedMotion() || !inView || document.hidden) return;
      running = true;
      start = 0;
      rafId = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    function renderStatic() {
      ease();
      opts.draw(ctx, 0, dims);
    }

    var resizeTimer;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        dims = VD.fitCanvas(canvas, ctx);
        if (opts.onResize) opts.onResize(dims);
        if (!running) renderStatic();
      }, 120);
    }
    window.addEventListener("resize", handleResize, { passive: true });

    // Only animate while the canvas is actually visible on screen.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) play();
          else pause();
        },
        { threshold: 0.04 }
      ).observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else play();
    });

    reduceQuery.addEventListener &&
      reduceQuery.addEventListener("change", function () {
        if (VD.reducedMotion()) {
          pause();
          renderStatic();
        } else {
          play();
        }
      });

    // First paint: static frame immediately, then start the loop if allowed.
    renderStatic();
    play();

    return { play: play, pause: pause, get dims() { return dims; } };
  };
})();
