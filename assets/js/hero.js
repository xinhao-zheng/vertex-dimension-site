/* =============================================================================
   VERTEX DIMENSION — Hero (WebGL)
   GPU radial point-burst: one vertex, decaying arms, outward particle current.
   Depth by perspective and opacity only — white on black, no lines. Additive
   blend; per-device lum in shader (never CSS opacity on canvas — that greys).
   Falls back to logo.js when WebGL is unavailable.
   ========================================================================== */
(function () {
  "use strict";
  var VD = window.VD;

  var VERT = [
    "precision highp float;",
    "attribute vec3 a_dir;",
    "attribute float a_radius;",
    "attribute float a_size;",
    "attribute float a_alpha;",
    "attribute float a_seed;",
    "attribute float a_kind;", // 0 structure, 1 particle, 2 vertex
    "uniform float u_time;",
    "uniform mat3 u_rot;",
    "uniform float u_R;",
    "uniform float u_camDist;",
    "uniform float u_focal;",
    "uniform vec2 u_res;",
    "uniform float u_dpr;",
    "uniform float u_lum;",
    "varying float v_alpha;",
    "void main() {",
    "  float r; float size = a_size; float alpha = a_alpha;",
    "  if (a_kind > 1.5) {",
    // Core: origin pulse — the vertex breathes, not a dead dot.
    "    r = 0.0;",
    "    float pulse = sin(u_time * 1.2 + a_seed * 6.2831);",
    "    size = a_size * (1.0 + 0.06 * pulse);",
    "    alpha = a_alpha * (0.92 + 0.08 * pulse);",
    "  } else if (a_kind > 0.5) {",
    // Emanation: phase-offset streams; smooth in/out hides birth and death.
    "    float speed = 0.04 + a_seed * 0.15;",
    "    float prog = fract(a_seed * 7.0 + u_time * speed);",
    "    r = prog * (0.55 + 0.45 * prog);",
    "    float fin = smoothstep(0.0, 0.09, prog);",
    "    float fout = 1.0 - smoothstep(0.66, 1.0, prog);",
    "    alpha = a_alpha * fin * fout;",
    "    size = mix(a_size * 1.65, a_size * 0.4, prog);",
    "  } else {",
    // Structure: standing rays; faint radial breath only.
    "    r = a_radius * (1.0 + 0.015 * sin(u_time * 0.5 + a_seed * 6.2831));",
    "  }",
    "  vec3 pos = a_dir * (r * u_R);",
    "  vec3 rp = u_rot * pos;",
    "  float z = rp.z + u_camDist;",
    "  if (z < 1.0) z = 1.0;",
    "  float persp = u_focal / z;",
    "  vec2 screen = rp.xy * persp;",
    "  gl_Position = vec4(screen / (0.5 * u_res), 0.0, 1.0);",
    "  gl_PointSize = clamp(size * persp * u_dpr, 0.0, 220.0);",
    "  float df = clamp((u_camDist + u_R - z) / (2.0 * u_R), 0.0, 1.0);",
    // Per-device lum via uniform — white stays white; CSS opacity greys.
    "  v_alpha = alpha * (0.5 + 0.5 * df) * u_lum;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "varying float v_alpha;",
    "void main() {",
    "  vec2 c = gl_PointCoord - vec2(0.5);",
    "  float d = length(c);",
    "  if (d > 0.5) discard;",
    // Soft point; additive overlap fuses into glow — density is light.
    "  float fall = smoothstep(0.5, 0.0, d);",
    "  float glow = fall * fall;",
    "  gl_FragColor = vec4(1.0, 1.0, 1.0, v_alpha * glow);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error("shader: " + gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  function program(gl) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error("link: " + gl.getProgramInfoLog(p));
    }
    return p;
  }

  /** Evenly distributed unit vector (deterministic Fibonacci sphere). */
  function fibDir(i, n) {
    var ga = Math.PI * (3 - Math.sqrt(5));
    var y = 1 - (i / Math.max(1, n - 1)) * 2;
    var rad = Math.sqrt(Math.max(0, 1 - y * y));
    var th = ga * i;
    return [Math.cos(th) * rad, y, Math.sin(th) * rad];
  }

  function jitterDir(dir, amt) {
    var x = dir[0] + (Math.random() - 0.5) * amt;
    var y = dir[1] + (Math.random() - 0.5) * amt;
    var z = dir[2] + (Math.random() - 0.5) * amt;
    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    return [x / len, y / len, z / len];
  }

  /** Uniformly distributed random unit vector on the sphere. */
  function randDir() {
    var u = Math.random() * 2 - 1;
    var t = Math.random() * Math.PI * 2;
    var s = Math.sqrt(1 - u * u);
    return [s * Math.cos(t), u, s * Math.sin(t)];
  }

  /** Interleaved buffer: dir.xyz, radius, size, alpha, seed, kind.
      Structure = radial spokes; emanation rides the same rays — coherent, not noise. */
  function buildGeometry() {
    var data = [];
    function push(dir, radius, size, alpha, seed, kind) {
      data.push(dir[0], dir[1], dir[2], radius, size, alpha, seed, kind);
    }

    // Core: nucleus + five glow shells — additive fusion at origin.
    push([0, 1, 0], 0, 17.0, 1.0, 0.0, 2);
    var CORE = [
      { s: 30, a: 0.4 },
      { s: 46, a: 0.24 },
      { s: 66, a: 0.14 },
      { s: 92, a: 0.075 },
      { s: 120, a: 0.038 }
    ];
    for (var c = 0; c < CORE.length; c++) {
      push([0, 1, 0], 0, CORE[c].s, CORE[c].a, c * 0.21, 2);
    }

    // Structure: power-curve decay per arm — sharp ray, not ball.
    var N_ARMS = 48;
    var PER_ARM = 24;
    var arms = [];
    for (var i = 0; i < N_ARMS; i++) {
      var dir = fibDir(i, N_ARMS);
      arms.push(dir);
      for (var j = 0; j < PER_ARM; j++) {
        var t = j / (PER_ARM - 1);
        var radius = Math.pow(t, 0.9);
        var size = 8.0 * Math.pow(1 - t, 1.5) + 0.5;
        var alpha = 1.0 * Math.pow(1 - t, 1.12) + 0.05;
        push(dir, radius, size, alpha, i / N_ARMS, 0);
      }
    }

    // Emanation: dense streams on shared rays — outward current.
    var N_PARTICLES = 2600;
    for (var k = 0; k < N_PARTICLES; k++) {
      var base = arms[(Math.random() * arms.length) | 0];
      push(jitterDir(base, 0.045), 1.0, 3.3, 0.85, Math.random(), 1);
    }

    // Halo: two shells past ray tips — dissolving boundary.
    var N_NEAR = 320;
    for (var h = 0; h < N_NEAR; h++) {
      push(randDir(), 1.02 + Math.random() * 0.16, 1.4, 0.14, Math.random(), 0);
    }
    var N_FAR = 240;
    for (var f = 0; f < N_FAR; f++) {
      push(randDir(), 1.22 + Math.random() * 0.5, 1.0, 0.07, Math.random(), 0);
    }

    return { array: new Float32Array(data), count: data.length / 8 };
  }

  /** Column-major 3x3 rotation = Rx(ax) * Ry(ay). */
  function rotMatrix(ax, ay) {
    var cx = Math.cos(ax),
      sx = Math.sin(ax),
      cy = Math.cos(ay),
      sy = Math.sin(ay);
    // row-major M, then upload as column-major (transpose).
    return [
      cy, sx * sy, -cx * sy,
      0, cx, sx,
      sy, -sx * cy, cx * cy
    ];
  }

  function fallback(canvas) {
    VD.heroMode = "2d";
    var fresh = canvas.cloneNode(false);
    if (canvas.parentNode) canvas.parentNode.replaceChild(fresh, canvas);
    VD.starburst2D(fresh, { fill: 0.92, rotSpeed: 0.05, parallax: 22 });
  }

  function runGL(canvas, gl) {
    var prog = program(gl);
    gl.useProgram(prog);

    var geo = buildGeometry();
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, geo.array, gl.STATIC_DRAW);

    var STRIDE = 32;
    function attr(name, size, offset) {
      var loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE, offset);
    }
    attr("a_dir", 3, 0);
    attr("a_radius", 1, 12);
    attr("a_size", 1, 16);
    attr("a_alpha", 1, 20);
    attr("a_seed", 1, 24);
    attr("a_kind", 1, 28);

    var U = {
      time: gl.getUniformLocation(prog, "u_time"),
      rot: gl.getUniformLocation(prog, "u_rot"),
      R: gl.getUniformLocation(prog, "u_R"),
      camDist: gl.getUniformLocation(prog, "u_camDist"),
      focal: gl.getUniformLocation(prog, "u_focal"),
      res: gl.getUniformLocation(prog, "u_res"),
      dpr: gl.getUniformLocation(prog, "u_dpr"),
      lum: gl.getUniformLocation(prog, "u_lum")
    };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // Additive: overlap accumulates toward white; no bloom pass.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    var dims = { w: 0, h: 0, dpr: 1, R: 1, lum: 1 };
    // Per-device lum in shader — never dim the canvas via CSS opacity.
    var LUM_DESKTOP = 1.3;
    var LUM_MOBILE = 0.5;
    var mqMobile = window.matchMedia("(max-width: 1039px)");
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      dims.w = w;
      dims.h = h;
      dims.dpr = dpr;
      dims.R = Math.min(w, h) * 0.58;
      dims.lum = mqMobile.matches ? LUM_MOBILE : LUM_DESKTOP;
    }
    resize();

    // Re-measure whenever the canvas box changes — not only on window resize.
    // Without this, an early init (before layout paints) can lock a tiny R.
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        resize();
        if (!running) render(0);
      }).observe(canvas);
    }
    if (mqMobile.addEventListener) {
      mqMobile.addEventListener("change", function () {
        resize();
        if (!running) render(0);
      });
    } else if (mqMobile.addListener) {
      mqMobile.addListener(function () {
        resize();
        if (!running) render(0);
      });
    }

    var ex = 0,
      ey = 0;
    function render(t) {
      ex += (VD.pointer.tx - ex) * 0.05;
      ey += (VD.pointer.ty - ey) * 0.05;
      // Slow, deliberate 3D precession; a fixed 3/4 tilt reveals depth.
      var ay = t * 0.1 + ex * 0.5;
      var ax = 0.5 + 0.14 * Math.sin(t * 0.06) + ey * 0.35;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.time, t);
      gl.uniformMatrix3fv(U.rot, false, rotMatrix(ax, ay));
      gl.uniform1f(U.R, dims.R);
      gl.uniform1f(U.camDist, dims.R * 1.65);
      gl.uniform1f(U.focal, dims.R * 1.85);
      gl.uniform2f(U.res, dims.w, dims.h);
      gl.uniform1f(U.dpr, dims.dpr);
      gl.uniform1f(U.lum, dims.lum);
      gl.drawArrays(gl.POINTS, 0, geo.count);
    }

    /* Gated loop: pause offscreen / hidden, single static frame if reduced. */
    var running = false,
      inView = true,
      raf = 0,
      start = 0;
    function frame(now) {
      if (!running) return;
      if (!start) start = now;
      render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (running || VD.reducedMotion() || !inView || document.hidden) return;
      running = true;
      start = 0;
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }
    var rt;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
          resize();
          if (!running) render(0);
        }, 120);
      },
      { passive: true }
    );
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (e) {
          inView = e[0].isIntersecting;
          if (inView) play();
          else pause();
        },
        { threshold: 0.02 }
      ).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else play();
    });

    render(0); // static first frame
    play();
  }

  VD.initHero = function () {
    var canvas = document.getElementById("logo-canvas");
    if (!canvas) return;
    var gl = null;
    var opts = {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      depth: false,
      powerPreference: "high-performance"
    };
    try {
      gl =
        canvas.getContext("webgl", opts) ||
        canvas.getContext("experimental-webgl", opts);
    } catch (e) {
      gl = null;
    }
    if (!gl) {
      fallback(canvas);
      return;
    }
    try {
      runGL(canvas, gl);
      VD.heroMode = "webgl";
    } catch (e) {
      VD.heroError = e && e.message ? e.message : String(e);
      if (window.console) console.error("[hero] WebGL failed, using 2D:", VD.heroError);
      fallback(canvas);
    }
  };
})();
