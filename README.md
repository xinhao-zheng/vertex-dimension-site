# vertex-dimension-site

The public corporate site for **Vertex Dimension** — a pure-static, zero-build
roadshow page: one origin, three projections (Intelligence, Capital, Trust),
rendered in the brand's mathematical language (dot radiance, decay, no hue).
Vertex Dimension 对外官网——纯静态、零构建的路演单页：一个原点、三次投影（智能、
资本、信任），以品牌的数学语言呈现（点阵辐射、衰减、零色彩）。

Live · 线上：<https://vertex-dimension.com>

---

## Claim | 主张

The site does not list services; it states one kernel — *make the world
computable* — and unfolds it as a causal chain, not a portfolio.
本站不罗列业务，只陈述一个内核——*把世界，化为可计算的*——并以因果链展开，而非
业务组合。

| Order | Dimension | Role in the chain |
|:-----:|-----------|-------------------|
| I | Intelligence | method — what can be computed |
| II | Capital | application — what computation is worth |
| III | Trust | coordination — whose agreement makes the price hold |

智能给出方法，资本为方法定价，信任使定价在多方之间成立——次序不可对调。

---

## Layout | 目录

```
vertex-dimension-site/
├── README.md
├── LICENSE
├── package.json
├── wrangler.toml              # Cloudflare Pages · optional deploy
├── _headers                   # cache & security headers
├── index.html                 # single page · EN source + data-zh
└── assets/
    ├── css/
    │   ├── tokens.css         # design tokens — sole source of truth
    │   ├── base.css
    │   ├── layout.css
    │   ├── components.css
    │   ├── sections.css
    │   └── motion.css
    ├── js/
    │   ├── util.js            # namespace, HiDPI canvas, gated loop
    │   ├── field.js           # background phase-space dust
    │   ├── logo.js            # 2D starburst fallback
    │   ├── hero.js            # WebGL radial burst (primary)
    │   ├── i18n.js            # EN / ZH toggle
    │   └── app.js             # nav, reveal, boot
    └── brand/                 # mark, lockup, favicon, og-dark.png
```

| Path | Role |
|------|------|
| `index.html` | Content & structure · English in markup, Chinese in `data-zh` |
| `assets/css/tokens.css` | Tokens · color, type, spacing, motion |
| `assets/js/hero.js` | Primary visual · WebGL point burst; falls back to `logo.js` |
| `wrangler.toml` | Deploy · Cloudflare Pages (optional) |

---

## Run locally | 本地运行

No build step. Open `index.html` directly (`file://`) or serve the directory.
无构建步骤。可直接打开 `index.html`（`file://`），或启动本地服务器。

```bash
npm run dev
# → http://localhost:5173
```

Equivalent · 等价：`python -m http.server 5173` · `npx serve . -l 5173`

---

## Deploy | 部署

Static files only — any static host works. This repository ships Cloudflare Pages
config; the production domain is already on Cloudflare.
纯静态文件，任意静态主机均可。本仓库附带 Cloudflare Pages 配置；生产域名已托管于
Cloudflare。

```bash
npx wrangler login    # once · 首次授权
npm run deploy
```

Then bind `vertex-dimension.com` under the Pages project → Custom domains.
随后在 Pages 项目内绑定自定义域名 `vertex-dimension.com`。

---

## Edit | 修改

- **Copy · 文案** — edit `index.html`. English in element text; Chinese in
  `data-zh`. Default language is English.
- **Hero · 主视觉** — tune `assets/js/hero.js`: arm count, per-arm density,
  `LUM_DESKTOP` / `LUM_MOBILE` (shader intensity; mobile must not use CSS opacity
  to dim — that composites grey).
- **Tokens · 视觉令牌** — edit `assets/css/tokens.css` only; changes propagate
  globally.

---

## Design law | 设计约束

Pure black and white; hierarchy by opacity, not hue. Inter + JetBrains Mono.
Hero is a GPU point-burst — additive glow, power-curve decay, no lines. Six
sections share one navigation spine: Mission → Architecture → Dimensions → Edge
→ Method → Horizon.
纯黑白；层级靠透明度，不靠色相。Inter + JetBrains Mono。主视觉为 GPU 点阵爆发——
加色发光、幂律衰减、零线条。六个分区共用一条导航脊柱。

---

## Encoding | 编码

UTF-8, no BOM. · UTF-8，无 BOM。

---

## License | 许可

Source code under this repository is MIT (see `LICENSE`). Brand assets and site
copy remain property of Vertex Dimension.
本仓库源代码采用 MIT（见 `LICENSE`）；品牌资产与站点文案归 Vertex Dimension 所有。

---

*From one point, all dimensions unfold. — 从一个原点，展开所有维度。*
