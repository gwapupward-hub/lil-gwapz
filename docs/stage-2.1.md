# Stage 2.1 Report — Browse tile grid and filters

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Branch: `sprint-1-foundations`
Validation branch: `stage21-ci-validation`
Previous stage: `docs/stage-1.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Approved scope

The owner amended Stage 2.1 to permit creation of the originally missing prerequisite files:

```text
css/browse-tiles.css
js/browse-tiles.js
```

Final Stage 2.1 repository implementation scope:

```text
browse.html (generated deterministically at build time)
css/browse-tiles.css
js/browse-tiles.js
js/browse-filters.js
scripts/build-browse.mjs
docs/
```

A temporary GitHub Actions workflow and Playwright test script were used only on `stage21-ci-validation` to obtain a Chromium-capable validation runner. Those validation-only files are not promoted to `sprint-1-foundations`.

## Implemented Browse architecture

- 152 static-first sticker tiles.
- One tile links to each canonical sticker page.
- First 8 thumbnails load eagerly; remaining 144 load lazily.
- Tile images use 256×256 WebP derivatives with explicit width/height.
- No full-size PNG is referenced by Browse tile markup.
- All 152 tile links remain present and visible with JavaScript disabled.
- Mood, character, color, and search filters.
- OR logic within a filter group; AND logic across filter groups.
- URL synchronization for `q`, `mood`, `sex`, and `color` while preserving existing search state.
- Legacy `sassy` / `swagger` mood URLs normalize to internal `attitude`.
- `attitude` is displayed as Swagger for male stickers, Sassy for female stickers, and Attitude in mixed contexts.
- `/` focuses search.
- Mobile horizontal mood controls plus a Character & color dialog.
- Minimum 44px mobile filter targets.
- Existing full-pack ZIP download behavior retained outside the static tile renderer.

## Deterministic/static gates

Final generated Browse SHA-256, reproduced in GitHub Actions and again in a fresh experimental Vercel sandbox:

```text
309b11a1b2088c3cff09b46f764340ecdf0c3ff8eea28dfdd722c502b5a2e96c  browse.html
```

Final structure:

```text
tiles                 152
eager thumbnails        8
lazy thumbnails       144
full-PNG tile refs       0
static legal notices     1
```

Result: **PASS**.

## CLS remediation

The original real-browser gate measured the same initial CLS twice:

```text
0.016288049603788244
```

A new owner-authorized CLS remediation pass was opened. Removing speculative tile containment did not change the value, disproving the initial tile-reservation hypothesis.

Diagnostic-only Chromium runs then isolated the shift:

```text
#browse-grid y: 594px -> 644px
shift: +50px
```

The filter controls were stable. The Browse intro grew by the same 50px. Root cause was the existing `legal.js` inserting `.download-license-note` into `.browse-actions` after first paint.

The fix does **not** modify `legal.js`. `scripts/build-browse.mjs` now emits the exact existing approved legal notice statically in Browse markup. `legal.js` detects that the notice already exists and therefore performs no late insertion.

Result after fix:

```text
initial CLS:          0
post-interaction CLS: 0
```

Result: **PASS**.

## Final Playwright gate

Validation commit:

```text
fbb876f7fda8fca1b8552f73869f3cfc2347bc28
```

GitHub Actions:

```text
run: 38038563033
job: 114174061307
```

Final Playwright evidence:

```json
{
  "tileCount": 152,
  "eager": 8,
  "lazy": 144,
  "fullPngRequests": 0,
  "initialCls": 0,
  "postInteractionCls": 0,
  "expectedMood": 58,
  "expectedAnd": 10,
  "screenshots": [
    "mobile-390.png",
    "tablet-768.png",
    "desktop-1280.png"
  ],
  "jsOffVisible": 152
}
```

The test also passed keyboard search, filter count logic, URL synchronization, search preservation, mobile dialog interaction, tap-target checks, console-error checks, and zero full-PNG Browse requests.

Result: **PASS**.

## Screenshot evidence

```text
mobile-390.png
760cb929c6a20aa7ef2e0761f859039afc1588f608cb2755c31cba2aab1df4d4

tablet-768.png
99022eebd10a4b45c80dd4564f2a21f8e85e132a6c353703ea3acc64e3da3211

desktop-1280.png
52b4af184fc8b9ae32df0b73340299ae0109940f2210ce4cecadd4572b6f61f6
```

Result: **PASS**.

## Experimental Vercel integration

The experimental Vercel project only (`prj_cXCW1emalg3eDXTUatVKjGlQkOE3`, project `lil-gwapz`) is configured to build Stage 2.1 with:

```text
node scripts/build-stage-1.2.cjs && node scripts/build-browse.mjs && node scripts/build-preview.cjs
```

Its existing install command continues to install `sharp@0.35.5 --no-save`.

Integrated Stage 2.1 source commit:

```text
cf4257df092e07fb620378152e9f7a3a5ad2037e
```

Verified experimental preview deployment:

```text
deployment: dpl_AoAqBWeEViiq2W4j8JApbpFask6x
url: https://lil-gwapz-itfvbhjpr-bigdaddygwaps-projects.vercel.app
state: READY
branch: sprint-1-foundations
commit: cf4257df092e07fb620378152e9f7a3a5ad2037e
```

Build-log evidence:

```text
complete { stickers: 152, urls: 157 }
browse tiles generated: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
Deployment completed
```

Deployed `/browse.html` smoke checks:

```text
HTTP 200
canonical = https://www.lilgwapz.xyz/browse.html
og:url   = https://www.lilgwapz.xyz/browse.html
css/browse-tiles.css = 200
js/browse-filters.js = 200
js/browse-tiles.js = 200
static .download-license-note present
152 generated sticker tiles present
first 8 tiles eager; remaining tiles lazy
Attitude display verified: male Swagger / female Sassy
legacy app.js Browse renderer absent
preview x-robots-tag = noindex
```

Deployment alias check:

```text
lil-gwapz-git-sprint-1-foundations-bigdaddygwaps-projects.vercel.app
```

No production custom domain or production alias is attached to this deployment.

This experimental project remains separate from `lil-gwapz-production`. No production project, production domain, production alias, or `main` branch was modified.

Result: **PASS**.

## Stage result

Stage 2.1: **PASS**.

All required Stage 2.1 static, deterministic, browser, CLS, JS-off, network, and integrated-preview gates are satisfied. Stage 2.2 may now begin on the experimental path only.
