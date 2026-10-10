# Stage 2.2 Report — Sticker dialog, download, and touch behavior

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage22-ci-validation`
Previous stage: `docs/stage-2.1.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Scope

Stage 2.2 was implemented within the approved repository scope. The final validation diff against the Stage 2.1 head changed only:

```text
browse.html
css/dialog.css
js/sticker-dialog.js
docs/stage-2.2.md
```

No Stage 2.1 generator changes, production configuration changes, or third-party scripts were introduced.

## Implementation

- Full 512×512 PNG sticker viewer using a native `<dialog>`.
- Name, reaction ID, character, mood, and colorway metadata.
- Same-origin PNG download with exact filename `gwap-<slug>.png`.
- Previous / next navigation through the currently visible filtered DOM order.
- ArrowLeft / ArrowRight keyboard navigation.
- Escape closes the dialog and restores focus to the originating tile link.
- Desktop-only hover/focus download control and Preview label.
- Desktop tile download tracks `download_single`.
- Dialog open tracks `sticker_open`; dialog download tracks `download_single`.
- Touch tap opens the dialog.
- 350ms touch long-press shows a Preview label without opening the dialog; label clears after 1.5s.
- Tile-started scroll movement over 10px cancels the long-press timer and suppresses the subsequent click so scrolling does not open the dialog.
- `touch-action: pan-y` preserves vertical scrolling.
- Reduced-motion mode disables Stage 2.2 label/download transitions.

## Build integration

Stage 2.2 hooks are stored in the source `browse.html` outside the Stage 2.1-owned generated HEAD/SCRIPTS markers. This is required because `scripts/build-browse.mjs` deterministically regenerates its own marker contents.

The complete experimental build chain was rerun:

```text
node scripts/build-stage-1.2.cjs
node scripts/build-browse.mjs
node scripts/build-preview.cjs
```

Canonical source-generated Stage 2.2 Browse fingerprint:

```text
048110571addaa626064cb6d7d9bc15041e785611acf136578e13fef9c42abc4  browse.html
048110571addaa626064cb6d7d9bc15041e785611acf136578e13fef9c42abc4  dist/browse.html
```

Generated output preserved:

```text
152 Browse tiles
1 Stage 2.2 sticker dialog
1 css/dialog.css reference
1 js/sticker-dialog.js reference
1 static legal notice
0 legacy app.js Browse renderer references
```

Result: **PASS**.

## Same-origin PNG gate

All 152 canonical `data/stickers.json` records were checked and every `full` path resolves against the current site origin. The Stage 2.2 runtime also performs the same-origin validation before enabling a full-PNG download.

Representative full PNG:

```text
/stickers/LG-R01-001-M-GRN-v01-TELEGRAM-512.png
```

The browser gate loaded it successfully at natural dimensions 512×512.

Result: **PASS**.

## Browser runner preparation

The isolated Vercel sandbox initially lacked Chromium Linux runtime libraries and Fontconfig. The ephemeral test runner was repaired with operating-system packages only; no repository dependency or source scope was changed.

After repair, minimal real navigation passed:

```text
HTTP_NAV_PASS 200 tiles 152
```

These runner-only packages are not part of the repository or deployed application.

## Real-browser gate

Playwright `1.64.0` with Chromium executed the full Stage 2.2 suite against the canonical source-generated build. The suite was run again after reconstructing the durable source template; both executions passed.

Final evidence:

```json
{
  "desktop": {
    "firstSlug": "big-smile-male",
    "hoverDownload": "gwap-big-smile-male.png",
    "visibleCount": 16,
    "arrow": [
      "big-smile-male",
      "big-smile-female"
    ],
    "axeSeriousCritical": 0,
    "consoleErrors": 0
  },
  "touch": {
    "tapFullPng": "/stickers/LG-R01-001-M-GRN-v01-TELEGRAM-512.png",
    "longPressMs": 375,
    "labelDurationVerified": true,
    "scrollProtected": true,
    "fullPngRequests": 1,
    "consoleErrors": 0
  }
}
```

Additional assertions passed:

```text
desktop hover download visible
Playwright download event filename = gwap-big-smile-male.png
filtered Happy + Male visible set = 16
ArrowRight follows next visible filtered tile
ArrowLeft returns to previous visible filtered tile
dialog download origin = current test origin
dialog download filename = gwap-<slug>.png
axe on open dialog = 0 serious / critical violations
Escape closes dialog
focus restored to originating tile link
mobile tap opens dialog
full PNG loaded at 512×512
375ms long-press does not open dialog
long-press label clears after 1.5s
40px simulated tile-started scroll does not open dialog
0 desktop console errors
0 touch console errors
```

Result: **PASS**.

## Validation deployment

Validated implementation commit:

```text
6a726f8e1c5b415413e8c0ef551209302a15d6d1
```

Experimental Vercel deployment:

```text
deployment: dpl_GSpY8szV5uTEbG2dVsxSB79HVQSY
url: https://lil-gwapz-7z9kardo2-bigdaddygwaps-projects.vercel.app
state: READY
branch: stage22-ci-validation
target: preview
```

Build log confirmed the expected sequence:

```text
Stage 1.2: 152/152 generated
Stage 2.1 Browse: 152 tiles; 8 eager; 144 lazy
preview package: 152 stickers, 152 thumbs, 152 sticker pages, 153 OG images
deployment completed
```

Deployment smoke checks:

```text
/browse.html = HTTP 200
/css/dialog.css = HTTP 200
/js/sticker-dialog.js = HTTP 200
/stickers/LG-R01-001-M-GRN-v01-TELEGRAM-512.png = HTTP 200
canonical = https://www.lilgwapz.xyz/browse.html
preview x-robots-tag = noindex
Stage 2.2 dialog markup present
152 Stage 2.1 tiles present
static legal notice present
```

Deployment aliases:

```text
lil-gwapz-git-stage22-ci-validation-bigdaddygwaps-projects.vercel.app
```

No production custom domain or production alias is attached to the validation deployment.

Result: **PASS**.

## Integrated sprint preview

The exact validated Stage 2.2 source was promoted to `sprint-1-foundations` in commit:

```text
602b9969b2d44ae7af6d3da8975db8ce66cebf14
```

Verified experimental sprint deployment:

```text
deployment: dpl_FUSVeX1v8jSLh6jDxfRKtLhNSfso
url: https://lil-gwapz-hq5frkkni-bigdaddygwaps-projects.vercel.app
state: READY
branch: sprint-1-foundations
target: preview
commit: 602b9969b2d44ae7af6d3da8975db8ce66cebf14
```

Integrated deployment build/smoke evidence:

```text
Stage 1.2 generated 152/152
Stage 2.1 Browse generated 152 tiles; 8 eager; 144 lazy
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
/browse.html = HTTP 200
/css/dialog.css = HTTP 200
/js/sticker-dialog.js = HTTP 200
/stickers/LG-R01-001-M-GRN-v01-TELEGRAM-512.png = HTTP 200
same-origin full PNG route verified
Stage 2.2 dialog markup present
152 Browse tiles present
canonical = https://www.lilgwapz.xyz/browse.html
preview x-robots-tag = noindex
```

The deployment alias list contains only:

```text
lil-gwapz-git-sprint-1-foundations-bigdaddygwaps-projects.vercel.app
```

No `lilgwapz.xyz`, `www.lilgwapz.xyz`, or other production custom domain is attached to the integrated sprint deployment.

Result: **PASS**.

## Stage result

Stage 2.2: **PASS**.

All required dialog, filtered navigation, desktop hover/download, touch tap, long-press, scroll protection, same-origin download, keyboard/focus, accessibility, console, build, validation-preview, and integrated-sprint-preview gates are satisfied. Stage 3.1 may begin on the experimental path only.
