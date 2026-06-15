/* =============================================================================
   VERTEX DIMENSION — Ambient field
   Sparse phase-space dust behind all content. White on black at low opacity
   so copy stays legible — atmosphere, not ornament.
   ========================================================================== */
(function () {
  "use strict";
  var VD = window.VD;
  var canvas = document.getElementById("field-canvas");
  if (!canvas) return;

  var points = [];

  function build(dims) {
    points.length = 0;
    // Density tied to area, capped for performance on large displays.
    var count = Math.min(170, Math.round((dims.w * dims.h) / 14000));
    for (var i = 0; i < count; i++) {
      var depth = Math.random(); // 0 = far, 1 = near (drives size + parallax)
      points.push({
        x: Math.random() * dims.w,
        y: Math.random() * dims.h,
        z: depth,
        size: VD.lerp(0.4, 1.5, depth),
        alpha: VD.lerp(0.04, 0.18, depth * depth),
        vx: (Math.random() - 0.5) * 0.05,
        vy: -0.04 - Math.random() * 0.06, // gentle upward drift
        tw: Math.random() * Math.PI * 2 // twinkle phase
      });
    }
  }

  function draw(ctx, t, dims) {
    ctx.clearRect(0, 0, dims.w, dims.h);
    var px = VD.pointer.x * 16;
    var py = VD.pointer.y * 16;

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      // Slow drift, integrated per frame (~constant regardless of fps drift).
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -4) p.y = dims.h + 4;
      if (p.x < -4) p.x = dims.w + 4;
      else if (p.x > dims.w + 4) p.x = -4;

      var twinkle = 0.78 + 0.22 * Math.sin(t * 0.7 + p.tw);
      var x = p.x + px * p.z;
      var y = p.y + py * p.z;

      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  var dims0 = { w: canvas.clientWidth, h: canvas.clientHeight };
  build(dims0);
  VD.createScene(canvas, { draw: draw, onResize: build });

  // Fade the field in once it has something to show.
  requestAnimationFrame(function () {
    canvas.classList.add("is-ready");
  });
})();
