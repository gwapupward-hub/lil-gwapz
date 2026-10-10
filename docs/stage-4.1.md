# Stage 4.1 Report — Mood showcase

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage41-mood-showcase`
Previous stage: `docs/stage-3.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Scope

Validated product files:

```text
index.html
css/mood-showcase.css
```

Validation-only files:

```text
scripts/test-stage-4.1.mjs
.github/workflows/stage-4.1-browser-gate.yml
```

This stage did not modify root `styles.css`, `app.js`, Browse runtime files, Vercel project settings, production routing, or production domains.

## Implementation

Stage 4.1 replaces the flat five-card mood row with a responsive mood showcase while preserving native navigation and JavaScript-off content.

Canonical home taxonomy:

```text
Happy     — Good energy only
Attitude  — Say it with a look
             Sassy · Swagger variants
Chill     — Easy does it
Hype      — Turn it all the way up
Much love — Send the good stuff
```

Canonical Browse routes:

```text
browse.html?mood=happy
browse.html?mood=attitude
browse.html?mood=chill
browse.html?mood=hype
browse.html?mood=love
```

The mixed/ungendered home experience uses `Attitude`. `Sassy` and `Swagger` remain contextual female/male labels inside the canonical Attitude family.

### Mobile

- native horizontal scrolling,
- `scroll-snap-type: x mandatory`,
- cards fixed at `70vw`,
- no scroll hijacking,
- internal overflow only,
- page-level horizontal overflow remains zero.

### Desktop

- left introduction column is `position: sticky`,
- sticky top offset is exactly `96px`,
- five cards are stacked vertically on the right,
- each card steps progressively farther right,
- no page-level horizontal overflow.

### Gwap Green rule

The Chill family uses canonical Gwap Green `#13DD13` as a filled badge, with dark glyph text `#071007` on the green fill. Green remains decorative for the Chill glow/line rather than green text on the lighter card surface.

## Scope isolation

Comparison against the Stage 3.2 PASS base:

```text
base: 45fecc4da10ee988d038be071f88ec8b37a076c0
validation head: 6658f94d2f68b37466b40bcc4088449a67cecba3
ahead: 5
behind: 0
```

Changed files before product promotion:

```text
.github/workflows/stage-4.1-browser-gate.yml
css/mood-showcase.css
index.html
scripts/test-stage-4.1.mjs
```

Result: **PASS — stage scope remained isolated.**

## Chromium validation

GitHub Actions:

```text
run: 38047192357
job: 114198987127
commit tested: 6658f94d2f68b37466b40bcc4088449a67cecba3
conclusion: SUCCESS
```

Runner/test stack:

```text
Ubuntu 24.04.5 LTS
Playwright 1.64.0
Chromium 156.0.8078.4
sharp 0.35.5
serve 14.2.5
```

Deterministic build:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse tiles generated: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Stage 4.1 CSS source/build identity:

```text
3f043ec16a594618a0250d76c479dfeead8d41154f25ee3d5e25fdcbd5f1eba8  css/mood-showcase.css
3f043ec16a594618a0250d76c479dfeead8d41154f25ee3d5e25fdcbd5f1eba8  dist/css/mood-showcase.css
```

Built HTML verification:

```text
<link rel="stylesheet" href="css/mood-showcase.css">
browse.html?mood=attitude
Attitude
Sassy · Swagger
```

## Mobile browser evidence

### 320px

```text
track display: flex
overflow-x: auto
scroll-snap-type: x mandatory
track client width: 320
track scroll width: 1216
card widths: 224px × 5 = 70vw
document scroll width: 320
Chill badge: rgb(19, 221, 19)
Chill glyph: rgb(7, 16, 7)
Chill badge size: 48 × 48
```

Result: **PASS**.

### 375px

```text
track display: flex
overflow-x: auto
scroll-snap-type: x mandatory
track client width: 375
track scroll width: 1414
card widths: 262.5px × 5 = 70vw
document scroll width: 375
Chill badge: rgb(19, 221, 19)
Chill glyph: rgb(7, 16, 7)
Chill badge size: 48 × 48
```

Result: **PASS**.

### 414px

```text
track display: flex
overflow-x: auto
scroll-snap-type: x mandatory
track client width: 414
track scroll width: 1555
card widths: 289.796875px × 5 ≈ 70vw
document scroll width: 414
Chill badge: rgb(19, 221, 19)
Chill glyph: rgb(7, 16, 7)
Chill badge size: 48 × 48
```

Result: **PASS**.

## Desktop browser evidence — 1280px

```text
intro position: sticky
intro top: 96px
track display: grid
document scroll width: 1280
viewport: 1280
measured sticky top after scroll: 96px
```

Progressive card left positions:

```text
510.453125
537.125
563.8125
590.5
617.1875
```

Result: **PASS — cards step progressively right and sticky behavior is real in Chromium.**

## JavaScript-off gate

At 375px with JavaScript disabled:

```text
cards: 5
visible: true
routes:
  browse.html?mood=happy
  browse.html?mood=attitude
  browse.html?mood=chill
  browse.html?mood=hype
  browse.html?mood=love
```

Result: **PASS**.

## Console gate

320px, 375px, 414px, and 1280px browser checks completed with zero console errors.

Result: **PASS**.

## Screenshot evidence

```text
mood-mobile-375.png
SHA256 75e18e9ea0a35b0e8003ac58550446983d191ab39cb67c0b9af311492cb0ad79

mood-desktop-1280.png
SHA256 f275777b44c51a6f556ca1327d8ab9d2f308505319fdcb5b4b6a403179042634
```

## Product promotion

Validated CSS blob:

```text
2136cbf56fad133f79ef71a1ab774c468ce6c237
```

Validated homepage blob:

```text
9bdae3e597ff810b84191a0f7417858479a1418d
```

Sprint promotion commits:

```text
b483ee9edae1c3070c41e0d57d87f3d9907637a9
feat(stage-4.1): promote validated mood showcase styles

cfddf9a56fc7d2889a3f34eb77523a7eb9950576
feat(stage-4.1): promote validated mood showcase
```

Validation-only workflow/test files were not promoted to the sprint product source.

## Experimental Vercel verification

Experimental project only:

```text
project: lil-gwapz
project ID: prj_cXCW1emalg3eDXTUatVKjGlQkOE3
deployment: dpl_5mvhp9Me4fmJ516fgo3xKqugqSkR
URL: https://lil-gwapz-ayxymipj5-bigdaddygwaps-projects.vercel.app
source branch: sprint-1-foundations
source commit: cfddf9a56fc7d2889a3f34eb77523a7eb9950576
state: READY
target: preview
```

Build output:

```text
built 152/152
complete { stickers: 152, urls: 157 }
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

## Production safety

Confirmed unchanged:

```text
main
lil-gwapz-production
lilgwapz.xyz
www.lilgwapz.xyz
```

No production promotion, production alias assignment, production-domain update, or `main` merge was performed.

## Stage result

**PASS — EXPERIMENTAL PREVIEW ONLY**

Stages 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, and 4.1 are PASS.

Stage 4.2 is cleared to begin after this PASS report is committed.
