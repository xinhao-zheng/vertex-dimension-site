/* =============================================================================
   VERTEX DIMENSION — 2D starburst (fallback)
   Canvas-2D mark when WebGL is unavailable. Geometry from brand spec: C₆
   symmetry, dot-only, opacity/size decay. Primary path is hero.js.
   ========================================================================== */
(function () {
  "use strict";
  var VD = window.VD;
  var DEG = VD.DEG;
  var DESIGN_R = 196;

  var PRIMARY_ANGLES = [-90, -30, 30, 90, 150, 210];
  var SECONDARY_ANGLES = [-60, 0, 60, 120, 180, 240];
  var PRIMARY_RINGS = [
    { r: 36, s: 8.0, a: 0.92 },
    { r: 68, s: 6.0, a: 0.78 },
    { r: 106, s: 4.2, a: 0.58 },
    { r: 150, s: 2.8, a: 0.42 },
    { r: 196, s: 1.8, a: 0.28 }
  ];
  var SECONDARY_RINGS = [
    { r: 50, s: 3.4, a: 0.5 },
    { r: 88, s: 2.4, a: 0.36 },
    { r: 132, s: 1.6, a: 0.24 },
    { r: 178, s: 1.0, a: 0.14 }
  ];

  function buildDots() {
    var dots = [{ rad: 0, ang: 0, size: 10.5, alpha: 1, depth: 0 }];
    function arm(angles, rings) {
      for (var i = 0; i < angles.length; i++) {
        var a = angles[i] * DEG;
        for (var j = 0; j < rings.length; j++) {
          dots.push({
            rad: rings[j].r,
            ang: a,
            size: rings[j].s,
            alpha: rings[j].a,
            depth: rings[j].r / DESIGN_R
          });
        }
      }
    }
    arm(PRIMARY_ANGLES, PRIMARY_RINGS);
    arm(SECONDARY_ANGLES, SECONDARY_RINGS);
    return dots;
  }

  VD.starburst2D = function (canvas, config) {
    config = config || {};
    var dots = buildDots();
    var fill = config.fill || 0.9;
    var rotSpeed = config.rotSpeed != null ? config.rotSpeed : 0.05;
    var parallax = config.parallax != null ? config.parallax : 20;
    var bootStart = performance.now();

    function draw(ctx, t, dims) {
      ctx.clearRect(0, 0, dims.w, dims.h);
      var cx = dims.w / 2;
      var cy = dims.h / 2;
      var scale = ((Math.min(dims.w, dims.h) / 2) * fill) / DESIGN_R;
      var reduced = VD.reducedMotion();
      var ct = reduced ? 0 : (performance.now() - bootStart) / 1000;
      var rot = ct * rotSpeed;
      var breathe = 1 + (reduced ? 0 : 0.014 * Math.sin(ct * 0.5));
      var px = VD.pointer.x * parallax;
      var py = VD.pointer.y * parallax;

      var lum = window.matchMedia("(max-width: 1039px)").matches ? 0.5 : 1.3;

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var appearAt = d.depth * 0.45;
        var intro = reduced ? 1 : VD.clamp((ct - appearAt) / 0.9, 0, 1);
        if (intro <= 0) continue;
        var introEase = 1 - Math.pow(1 - intro, 3);
        var ang = d.ang + rot;
        var rad = d.rad * scale * breathe;
        var x = cx + rad * Math.cos(ang) + px * d.depth;
        var y = cy + rad * Math.sin(ang) + py * d.depth;
        var twinkle =
          d.depth > 0.25 && !reduced
            ? 0.82 + 0.18 * Math.sin(ct * 1.1 + d.rad * 0.21 + d.ang)
            : 1;
        var size = d.size * scale * VD.lerp(0.6, 1, introEase);
        ctx.globalAlpha = d.alpha * twinkle * introEase * lum;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.2, size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    VD.createScene(canvas, { draw: draw });
  };
})();
