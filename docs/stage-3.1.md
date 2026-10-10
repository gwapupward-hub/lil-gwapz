# Stage 3.1 Report — Reveal and hero motion

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Initial validation branch: `stage31-ci-validation`
Remediation branch: `stage31-reveal-remediation`
Previous stage: `docs/stage-2.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Scope

The validated Stage 3.1 source promoted to the sprint changes only:

```text
css/motion.css
index.html
js/browse-tiles.js
```

CI/test-only remediation files remained on validation branches and were not promoted as Stage 3.1 product source.

## Implementation

Stage 3.1 implements:

- progressive reveal using `IntersectionObserver`,
- no `scroll` event listener and no `onscroll` handler,
- scroll-linked hero drift using CSS `animation-timeline: view()` where supported,
- hero drift range from -12px to +12px,
- 6-second idle float fallback from -6px to +6px where view timelines are unsupported,
- reduced-motion override that disables hero and reveal motion,
- fine-pointer Browse artwork hover/focus scale to 1.06 with Gwap Green glow,
- JS-off-safe content because hidden/reveal classes are applied only by JavaScript,
- no source third-party script URLs.

## Historical mandatory stop

The original Stage 3.1 browser run was correctly stopped after the same reveal gate failed twice.

Run 1:

```text
run: 38040820958
job: 114180539094
commit: a9b05a868d0ae6bc60f571a199752faa3c9cecf7
failure: opacity sampled 100ms into the intentional 450ms transition
actual opacity: 0.261704
expected final opacity: 1
```

Run 2:

```text
run: 38040899320
job: 114180765570
commit: 6060768fb7c0e9718f7c627230ef0c943930a0bc
failure: browser test raced asynchronous IntersectionObserver delivery
is-revealed actual: false
expected: true
```

The standing two-failure rule was honored and Stage 3.1 was reported STOPPED before this remediation pass.

## Fresh reveal-gate remediation

A fresh remediation branch was created from the frozen Stage 3.1 source:

```text
stage31-reveal-remediation
```

The motion implementation was kept unchanged while the browser gate was corrected to explicitly poll for `is-revealed`, then poll for the completed opacity value of `1`.

The remediation confirmed that the reveal implementation itself was sound: the corrected browser run passed both the asynchronous `IntersectionObserver` state and the completed 450ms reveal transition.

Two unrelated test-infrastructure defects were then found and corrected without changing Stage 3.1 motion source:

1. The Stage 3.1 workflow originally called only `build-preview.cjs`, which omitted the Stage 2.1 Browse generation step and produced zero Browse tiles in the test build. The workflow was corrected to preserve the already-approved Stage 2.2 build chain:

```text
node scripts/build-stage-1.2.cjs
node scripts/build-browse.mjs
node scripts/build-preview.cjs
```

2. The third-party-script assertion treated a same-origin absolute URL such as `http://127.0.0.1:4173/js/track.js` as third-party. The assertion was corrected to compare URL origins instead of absolute-vs-relative formatting.

No product motion source was modified by these remediation corrections.

## Final browser validation

Final passing GitHub Actions evidence:

```text
run: 38042037968
job: 114184039574
commit: 3588b2f4b8aa52d0ce0435d092388320c6cfb0e8
conclusion: SUCCESS
```

Build output:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse tiles generated: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Final Playwright evidence:

```json
{
  "heroStickers": 3,
  "scrollTimelineSupported": true,
  "motionState": {
    "animationName": "hero-view-drift",
    "animationTimeline": "view()",
    "translate": "0px -5.21018px",
    "imgAnimation": "none",
    "imgDuration": "0s"
  },
  "reducedState": {
    "animation": "none",
    "translate": "none",
    "imgAnimation": "none"
  },
  "browseTiles": 152,
  "hoverState": {
    "transform": "matrix(1.06, 0, 0, 1.06, 0, 0)",
    "filter": "drop-shadow(rgba(0, 0, 0, 0.36) 0px 13px 14px) drop-shadow(rgba(19, 221, 19, 0.35) 0px 0px 16px)"
  },
  "jsOffBrowseVisible": 152,
  "consoleErrors": 0,
  "screenshots": [
    "mobile-home-390.png",
    "desktop-home-1280.png"
  ]
}
```

Screenshot evidence:

```text
mobile-home-390.png
SHA256 9159a294d9f8225127dfc4f0a7b8a307bcf6321c875673934f1eca8a993ceea5

desktop-home-1280.png
SHA256 be280c4efa11686406845197c6f73f4bd014b3f08cb3ed4e21c8546e7012c4bb
```

Result: **PASS — real Chromium browser gate.**

## Source promotion

Only the three validated product-source blobs were promoted to `sprint-1-foundations`:

```text
css/motion.css
index.html
js/browse-tiles.js
```

Promoted sprint commit:

```text
bce8f41ea66689e79ea08dd7e9590455fc63016b
feat(stage-3.1): promote validated reveal and hero motion
```

The remediation workflow/test changes were not included in the product-source promotion.

## Integrated experimental Vercel preview

The exact promoted sprint commit was automatically built by the experimental Vercel project only:

```text
project: lil-gwapz
project id: prj_cXCW1emalg3eDXTUatVKjGlQkOE3
deployment: dpl_523vgFh3QSzqkuAZmvvs1nApUZZM
url: https://lil-gwapz-eutfbi52c-bigdaddygwaps-projects.vercel.app
state: READY
branch: sprint-1-foundations
commit: bce8f41ea66689e79ea08dd7e9590455fc63016b
```

Deployment smoke checks:

```text
/ = HTTP 200
/browse.html = HTTP 200
/css/motion.css = HTTP 200
/js/browse-tiles.js = HTTP 200
Browse generated tiles = 152
canonical home = https://www.lilgwapz.xyz/
canonical Browse = https://www.lilgwapz.xyz/browse.html
preview x-robots-tag = noindex
```

The preview deployment alias list contains only:

```text
lil-gwapz-git-sprint-1-foundations-bigdaddygwaps-projects.vercel.app
```

No `lilgwapz.xyz`, `www.lilgwapz.xyz`, or other production custom domain is attached to this deployment.

Vercel injects its own preview feedback script into fetched preview HTML. That is platform preview behavior and is not present in the repository source; the source-level browser gate verified zero third-party script URLs.

Result: **PASS — integrated experimental preview.**

## Gate summary

```text
IntersectionObserver reveal: PASS
completed reveal opacity = 1: PASS
hero view-timeline drift ±12px: PASS
idle fallback definition ±6px / 6s: PASS
reduced-motion shutdown: PASS
fine-pointer hover scale = 1.06: PASS
Gwap Green glow (#13DD13 / rgba 19,221,19): PASS
no scroll event listener / onscroll: PASS
Browse 152 preserved: PASS
JS-off Browse 152 visible: PASS
console errors = 0: PASS
source third-party scripts = 0: PASS
mobile screenshot: PASS
desktop screenshot: PASS
integrated experimental Vercel preview: READY / PASS
production aliases attached: 0 / PASS
```

## Stage result

Stage 3.1: **PASS — EXPERIMENTAL PREVIEW ONLY**.

Stage 1.1, Stage 1.2, Stage 2.1, Stage 2.2, and Stage 3.1 are now PASS.

Stage 3.2 may begin on the experimental path only. Production remains untouched.
