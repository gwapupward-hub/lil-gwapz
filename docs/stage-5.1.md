# Stage 5.1 Report — Sharing + conversion

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage51-sharing-conversion`
Previous stage: `docs/stage-4.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Product scope

Validated product files promoted to the sprint:

```text
browse.html
css/dialog.css
js/share.js
js/sticker-dialog.js
```

Validation-only files remained on the validation branch:

```text
scripts/test-stage-5.1.mjs
.github/workflows/stage-5.1-browser-gate.yml
```

No production routing, production Vercel project settings, custom production-domain configuration, sticker source assets, grouped Browse generator, or analytics provider configuration changed.

## Implementation

The sticker viewer now exposes three conversion actions:

```text
Download PNG
Share
Copy link
```

Canonical sharing is hard-locked to:

```text
https://www.lilgwapz.xyz/s/<slug>.html
```

`js/share.js` never derives the public share URL from the current preview hostname. The runtime uses the canonical base `https://www.lilgwapz.xyz`, so protected Vercel preview URLs cannot leak into copied or shared links.

The share path is progressive:

1. When supported, fetch the same-origin transparent PNG and use the Web Share API with a `File` named `gwap-<slug>.png`.
2. When file sharing is unavailable but native sharing exists, share the exact canonical sticker URL.
3. When native sharing is unavailable or fails without an explicit user cancellation, copy the canonical sticker URL.
4. `AbortError` is treated as user cancellation and records `share_cancel` without forcing a clipboard fallback.

The exact user-facing usage statement is:

```text
Free for personal use. Commercial use needs written permission.
```

It is shown in the viewer and passed as the native share text.

Analytics remain on the existing local stub only:

```text
copy_link
share
share_cancel
download_single
```

No third-party analytics or tracking provider was added.

## Deterministic PNG download remediation

Stage 5.1 also preserves the Stage 2.2 filename contract:

```text
gwap-<slug>.png
```

The browser initially honored the server asset filename instead of the anchor `download` value. The final implementation now:

1. fetches the same-origin PNG,
2. converts the response to a Blob,
3. creates a temporary object URL,
4. triggers a download with `download="gwap-<slug>.png"`,
5. revokes the object URL,
6. records `download_single`.

The same deterministic path is used for both viewer downloads and desktop tile downloads.

## Validation run 1 — FAIL, no promotion

```text
workflow: Stage 5.1 Browser Gate
run: 38050358243
job: 114208080246
commit tested: 702ea8424de649dea4172f681656031cd425fd55
conclusion: FAILURE
```

Passed before the failure:

```text
exact checkout                  PASS
deterministic dependencies      PASS
Chromium/system dependencies    PASS
experimental preview build      PASS
Stage 5.1 static contract       PASS
static server                   PASS
```

The only failing browser assertion was the required download filename:

```text
expected: gwap-big-smile-male.png
actual:   LG-R01-001-M-GRN-v01-TELEGRAM-512.png
```

No product files were promoted after Run 1.

## Remediation

Validation branch remediation commit:

```text
090298e8574077a96609be3d5027901b79ad76f1
fix(stage-5.1): enforce deterministic PNG download filenames
```

The remediation changed only `js/sticker-dialog.js` and implemented the Blob/object-URL download path described above.

## Validation run 2 — PASS

```text
workflow: Stage 5.1 Browser Gate
run: 38050534823
job: 114208578949
commit tested: 090298e8574077a96609be3d5027901b79ad76f1
conclusion: SUCCESS
```

All required steps passed:

```text
exact checkout                  PASS
deterministic dependencies      PASS
Chromium/system dependencies    PASS
experimental preview build      PASS
Stage 5.1 static contract       PASS
static server                   PASS
Playwright browser gates        PASS
screenshot evidence             PASS
```

Build evidence:

```text
complete { stickers: 152, urls: 157 }
browse groups generated: happy:32, attitude:38, chill:32, hype:26, love:24; tiles: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Source/build identity:

```text
704cf0e3e57d2d895f1b97b70c5ec9fa46c7eb3e79a38ec53d051c30b15ff6c8  js/share.js
704cf0e3e57d2d895f1b97b70c5ec9fa46c7eb3e79a38ec53d051c30b15ff6c8  dist/js/share.js

e73b977a10d87d4cc5528b71c194efe0eee2bfcf3e2a3f3f3a120ff704018d4c  js/sticker-dialog.js
e73b977a10d87d4cc5528b71c194efe0eee2bfcf3e2a3f3f3a120ff704018d4c  dist/js/sticker-dialog.js

4285280113199060ac78111e6765b8055c4c08d09c7f0a2d2b64be6346f6fc8f  css/dialog.css
4285280113199060ac78111e6765b8055c4c08d09c7f0a2d2b64be6346f6fc8f  dist/css/dialog.css
```

Browser result:

```json
{
  "canonical": "https://www.lilgwapz.xyz/s/big-smile-male.html",
  "usage": "Free for personal use. Commercial use needs written permission.",
  "fileShare": "PASS",
  "urlFallback": "PASS",
  "noShareCopyFallback": "PASS",
  "shareCancel": "PASS",
  "downloadFilename": "gwap-big-smile-male.png",
  "mobileOverflow": "PASS"
}
```

The browser suite also verified:

- Copy Link returns the exact canonical URL.
- Share and Copy Link controls are at least 44px.
- Native file share contains a PNG named `gwap-big-smile-male.png`.
- Native file share uses MIME type `image/png`.
- Native URL fallback uses the exact canonical sticker URL.
- No-share fallback copies the exact canonical sticker URL.
- `share_cancel` is recorded for explicit user cancellation.
- `copy_link`, `share`, and `download_single` telemetry fire on their intended paths.
- 375×812 viewport has no horizontal overflow.
- Browser console errors: 0 for all tested share modes.

Screenshot evidence:

```text
artifacts/stage-5.1/mobile-share-dialog.png
caaff79af9fb23d37a1b717c2e5ace117620dd97da52a74092c4878b4d5fbfe4

artifacts/stage-5.1/desktop-share-dialog.png
b49875a6645bb2be44a497cfff84339ad0c036ddd15da19d979b2cd9d9fff4ff
```

## Promotion

Only the four validated product files were promoted to the sprint.

```text
4275cab6e301d1ab5baf007ed6aa2d34637c65aa
feat(stage-5.1): promote validated sharing and conversion
```

Validation workflow/test files were not promoted.

## Experimental Vercel verification

Exact promoted sprint deployment:

```text
deployment: dpl_4mQ4sjh4EnShLzPBr1BSd3zuPsQy
branch: sprint-1-foundations
commit: 4275cab6e301d1ab5baf007ed6aa2d34637c65aa
state: READY
project: prj_cXCW1emalg3eDXTUatVKjGlQkOE3
url: https://lil-gwapz-27nf8xkm7-bigdaddygwaps-projects.vercel.app
```

Vercel build evidence:

```text
Cloning github.com/gwapupward-hub/lil-gwapz (Branch: sprint-1-foundations, Commit: 4275cab)
browse groups generated: happy:32, attitude:38, chill:32, hype:26, love:24; tiles: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
Build Completed in /vercel/output [44s]
```

Protected preview smoke tests:

```text
/browse.html   200 OK
/js/share.js   200 OK
```

The deployed Browse HTML contains `js/share.js`, `js/sticker-dialog.js`, the Share control, the Copy Link control, the exact usage statement, and the existing 152 grouped static sticker tiles.

The deployed `js/share.js` confirms:

```text
canonicalBase = https://www.lilgwapz.xyz
usage = Free for personal use. Commercial use needs written permission.
```

No `vercel.app` hostname is present in the canonical sharing runtime.

## Production isolation

The experimental Vercel project domain inventory contains exactly one domain:

```text
lil-gwapz.vercel.app
branch: experiment/ui-ux-v2
```

No `lilgwapz.xyz` or `www.lilgwapz.xyz` domain is attached to the experimental project.

Production remains frozen.

## Stage 5.2 prerequisite gate

Stage 5.2 must **not** begin until the owner supplies or explicitly confirms all required external destinations:

```text
1. licensing email address OR licensing form URL
2. X account URL
3. ecosystem links to expose in the footer/legal surfaces
```

These values must not be invented or inferred. Until they are supplied/confirmed, Stage 5.2 is BLOCKED by prerequisite rather than failed.
