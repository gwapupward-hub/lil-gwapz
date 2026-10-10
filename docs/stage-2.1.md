# Stage 2.1 Report — Browse tile grid and filters

Status: **STOPPED — PLAYWRIGHT RUNNER DEPENDENCY BLOCKER**

Branch: `sprint-1-foundations`
Previous stage report: `docs/stage-1.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Owner-approved scope amendment

The owner explicitly approved amending Stage 2.1 so these previously missing prerequisite files may be created as Stage 2.1 deliverables:

```text
css/browse-tiles.css
js/browse-tiles.js
```

The Stage 2.1 working scope is therefore:

```text
browse.html
css/browse-tiles.css
js/browse-tiles.js
js/browse-filters.js
scripts/build-browse.mjs
docs/
```

Result: **PASS — original prerequisite-file blocker resolved by owner amendment.**

## Isolated implementation work completed

A fresh experimental sandbox was created from branch head `485dcd68f678647159a8186f0d16355f42fcaf8f` under experimental Vercel project `lil-gwapz` only.

Stage 1.2 assets were reproduced first from the locked source metadata. Evidence:

```text
built 25/152
built 50/152
built 75/152
built 100/152
built 125/152
built 150/152
built 152/152
complete { stickers: 152, urls: 157 }
```

The Stage 2.1 implementation was then developed in the isolated sandbox with:

- static-first sticker tiles,
- one tile per canonical sticker page,
- first 8 images eager and remaining 144 lazy,
- fixed 256x256 thumbnail dimensions,
- WebP thumbnail-only tile markup,
- mood, gender, and color filter state,
- AND logic across filter groups and OR logic within each group,
- URL synchronization while preserving search state,
- legacy `sassy` / `swagger` URL normalization to internal `attitude`,
- gender-aware Attitude label (`Swagger` male / `Sassy` female / `Attitude` combined),
- `/` keyboard shortcut for search,
- mobile horizontal mood controls and a character/color filter dialog,
- 44px minimum filter targets,
- JS-off-compatible sticker links in generated HTML.

No Stage 2.1 source integration was committed after the mandatory browser gate failed. The existing experimental preview therefore remains on the last fully passing Stage 1.2 implementation.

## Deterministic/static gates

Repeated generation produced the same Browse hash three times:

```text
c9c4e9b2a08bb5ec49c4f3829262e57633c31c08  browse.html
c9c4e9b2a08bb5ec49c4f3829262e57633c31c08  browse.html
c9c4e9b2a08bb5ec49c4f3829262e57633c31c08  browse.html
```

Generated markup checks:

```text
tile_count 152
eager 8
lazy 144
full_png_refs_in_tiles 0
thumb_refs 152
links 152
dimensions 152
```

Result: **PASS — deterministic and static structure checks.**

## Required Playwright gate — BLOCKED

Stage 2.1 requires Playwright verification for:

- rendered tile counts,
- filter counts,
- URL synchronization,
- keyboard behavior,
- no full PNG requests on Browse,
- CLS,
- screenshots.

Playwright 1.64.0 and Chromium were installed in the isolated sandbox. The first runner invocation did not reach Chromium because the test module was placed outside the repository and could not resolve the locally installed package. The test was corrected and rerun from the repository root.

Chromium then failed before page creation because the sandbox runtime does not contain the required browser system library:

```text
chrome-headless-shell: error while loading shared libraries:
libnspr4.so: cannot open shared object file: No such file or directory
```

A repeat confirmed the same missing-library failure. Per the standing stage rule, after two failures of the same required check the stage must stop and report rather than claim PASS.

Result: **FAIL / ENVIRONMENT BLOCKER — no Playwright PASS is claimed.**

## Gates not claimed

Because Chromium could not launch, the following required Stage 2.1 gates remain unverified:

- interactive filter counts in a real browser,
- URL synchronization in a real browser,
- `/` keyboard focus behavior in a real browser,
- browser network confirmation of zero initial full-PNG requests,
- CLS = 0 measurement,
- Stage 2.1 screenshots.

Static evidence supports the intended implementation, but it is not substituted for the mandatory Playwright gate.

## Repository / preview safety

- No Stage 2.1 Browse integration was committed after the browser gate blocker.
- The experimental preview remains on the last fully passing Stage 1.2 code path.
- `main` was not changed.
- `lil-gwapz-production` was not changed.
- `lilgwapz.xyz` and `www.lilgwapz.xyz` were not changed.
- Stage 2.2 was not started.

## Required next correction

Stage 2.1 needs a Playwright-capable runner with Chromium's required Linux libraries before its implementation can be accepted and committed to the experimental preview. A compatible CI/browser runner may be used, but adding or changing CI configuration must be explicitly included in scope before doing so.

## Stage result

Stage 2.1 remains **STOPPED**.

The original prerequisite issue is resolved. The only current blocker is the mandatory real-browser test environment. Stage 1.1 and Stage 1.2 remain PASS, and production remains untouched.
