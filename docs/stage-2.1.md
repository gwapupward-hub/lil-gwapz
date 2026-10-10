# Stage 2.1 Report — Browse tile grid and filters

Status: **STOPPED — REQUIRED CLS GATE FAILED TWICE**

Branch: `sprint-1-foundations`
Validation branch: `stage21-ci-validation`
Previous stage report: `docs/stage-1.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Owner-approved scope amendments

The owner explicitly approved amending Stage 2.1 so these previously missing prerequisite files may be created as Stage 2.1 deliverables:

```text
css/browse-tiles.css
js/browse-tiles.js
```

The working Stage 2.1 implementation scope is therefore:

```text
browse.html
css/browse-tiles.css
js/browse-tiles.js
js/browse-filters.js
scripts/build-browse.mjs
docs/
```

After the original Vercel sandbox could not launch Chromium because Linux browser libraries were unavailable, the owner authorized continuing with the recommended validation approach. A temporary test-only GitHub Actions runner was therefore used on an isolated validation branch so unverified Browse code would not land on `sprint-1-foundations`.

Result: **PASS — prerequisite and test-runner scope blockers were resolved without touching production.**

## Validation isolation

A temporary branch was created from the stopped Stage 2.1 sprint head:

```text
stage21-ci-validation
base: 6c2ac419bfe4c7fc47184dfac53319fb2a51dd12
```

Initial validation implementation commit:

```text
ded416af9a4496a094ef6e84dd790055f0df8100
```

Test-harness follow-up commit:

```text
e1da282e9eb73c245a2f32177b8ce3dc7b2b2c13
```

No Stage 2.1 source implementation was merged or promoted to `sprint-1-foundations` after the mandatory gate failure.

## Isolated Stage 2.1 implementation

The validation branch contains a static-first Browse architecture with:

- 152 generated sticker tiles,
- one tile per canonical sticker page,
- first 8 images eager and remaining 144 lazy,
- fixed 256x256 thumbnail dimensions,
- WebP-only Browse tile images,
- no full-size PNG references in Browse tile markup,
- mood, character, and color filter state,
- OR logic within each filter group,
- AND logic across filter groups,
- URL synchronization for `q`, `mood`, `sex`, and `color`,
- search-state preservation,
- legacy `sassy` / `swagger` URL normalization to internal `attitude`,
- gender-aware Attitude label (`Swagger` male / `Sassy` female / `Attitude` combined),
- `/` keyboard shortcut for search,
- mobile horizontal mood controls,
- mobile character/color filter dialog,
- 44px minimum filter targets,
- JS-off-compatible sticker links,
- existing full-pack ZIP download behavior retained outside the static grid renderer.

The preview build was also extended on the validation branch to run Stage 1.2 derivative generation first, then deterministic Stage 2.1 Browse generation, and only then create `dist/`.

## Static / deterministic gates

Static sandbox evidence:

```text
tile_count 152
eager 8
lazy 144
full_png_refs_in_tiles 0
thumb_refs 152
links 152
dimensions 152
```

The generator was made idempotent. The GitHub Actions deterministic build gate reran `scripts/build-browse.mjs` and produced the same SHA-256 before and after regeneration:

```text
7ffbeb8c239f3684876c78391e6db3de68f2102a403427975b705d358c994141  browse.html
```

Result: **PASS — static structure and deterministic generation.**

## GitHub Actions browser environment

A test-only workflow on `stage21-ci-validation` used Ubuntu 24.04 and pinned test dependencies:

```text
sharp 0.35.5
playwright 1.64.0
serve 14.2.5
```

Chromium was installed with its Linux dependencies using Playwright's supported `--with-deps` installation path.

This resolved the previous sandbox blocker. The CI logs confirmed required system libraries including `libnspr4` were available, Chromium installed successfully, the Stage 1.2 + Stage 2.1 preview build succeeded, deterministic Browse generation succeeded, and the local static server started successfully.

Result: **PASS — browser runner environment blocker resolved.**

## Browser run 1

GitHub Actions run:

```text
run: 38037435352
job: 114170711401
commit: ded416af9a4496a094ef6e84dd790055f0df8100
```

Successful steps before the application gate:

```text
Checkout exact validation commit                      PASS
Install deterministic test dependencies              PASS
Install Chromium and system dependencies             PASS
Build Stage 1.2 + Stage 2.1 preview output           PASS
Verify deterministic Browse generation              PASS
Start static server                                  PASS
```

The Playwright script advanced through the interactive Browse checks before reaching its CLS assertion. This run therefore exercised the tile-count, eager/lazy loading, no-initial-full-PNG, keyboard search, URL synchronization, filter logic, search preservation, mobile filter interaction, tap-target, console, and no-full-PNG-after-filter code paths before the final CLS check.

It then failed:

```text
AssertionError [ERR_ASSERTION]: CLS expected 0, got 0.016288049603788244
```

Result: **FAIL — CLS gate.**

Because that first script accumulated CLS through the interaction sequence, the test harness was narrowed so the zero-CLS requirement would be measured immediately after initial `networkidle`, before intentional filtering or UI state changes. The threshold was not loosened.

## Browser run 2 — isolated initial CLS

GitHub Actions run:

```text
run: 38037553091
job: 114171053904
commit: e1da282e9eb73c245a2f32177b8ce3dc7b2b2c13
```

Again, environment and build steps passed:

```text
Checkout exact validation commit                      PASS
Install deterministic test dependencies              PASS
Install Chromium and system dependencies             PASS
Build Stage 1.2 + Stage 2.1 preview output           PASS
Verify deterministic Browse generation              PASS
Start static server                                  PASS
```

The second Playwright run verified before the CLS assertion:

```text
initial sticker tiles: 152
initial visible tiles: 152
eager images: 8
lazy images: 144
initial full-PNG requests: 0
```

It then failed the isolated page-load CLS gate with the same measured value:

```text
AssertionError [ERR_ASSERTION]: Initial CLS expected 0, got 0.016288049603788244
```

Result: **FAIL — initial CLS gate.**

The identical initial value confirms the blocker is no longer the browser environment or the interaction timing of the first test. Stage 2.1 currently has a measurable initial layout shift in Chromium.

## Mandatory two-failure stop

Standing Section 0 rule #2 requires:

> Complete tasks then gates; fix/re-run; after two failures same check, stop/report.

The required CLS check failed twice:

```text
Run 1: 0.016288049603788244
Run 2: 0.016288049603788244
Required: 0
```

Therefore Stage 2.1 must stop here. No third CLS attempt is permitted under the current stage run.

Result: **STOP — mandatory two-failure rule triggered.**

## Gates not claimed

Because both Playwright scripts aborted at the CLS assertion before the screenshot section, Stage 2.1 does **not** claim:

- CLS = 0,
- completed screenshot evidence,
- full Stage 2.1 browser-suite PASS.

The second run also stops before the later keyboard/filter assertions; those interaction paths were exercised by run 1 before its later CLS assertion, but the stage as a whole remains failed because CLS is mandatory.

## Likely remediation target — not yet proven

Static inspection suggests one likely source worth investigating in a future owner-authorized remediation pass:

```css
.browse-tile {
  content-visibility: auto;
  contain-intrinsic-size: 280px;
}
```

If the intrinsic placeholder size differs from the final rendered tile size, Chromium can record layout shift as deferred content becomes realized. Other layout elements may also contribute.

This is **not claimed as the proven root cause** because the stage stopped after the second required-gate failure and no third diagnostic browser run is permitted in this run.

A future remediation pass should narrowly investigate and fix layout reservation before rerunning the CLS gate.

## Repository / preview safety

- Stage 2.1 validation code remains isolated on `stage21-ci-validation`.
- It was not merged or promoted into `sprint-1-foundations`.
- The experimental preview remains on the last fully passing Stage 1.2 implementation path.
- `main` was not changed.
- `lil-gwapz-production` was not changed.
- `lilgwapz.xyz` was not changed.
- `www.lilgwapz.xyz` was not changed.
- Stage 2.2 was not started.

## Required next correction

Stage 2.1 may resume only after explicit owner authorization for a new, narrowly scoped CLS-remediation pass.

Recommended first remediation target: remove or replace the Browse tile `content-visibility` / intrinsic-size reservation with geometry that guarantees the final card dimensions are reserved before paint, then rerun the full Stage 2.1 browser gate from a new validation commit.

No remediation has been applied automatically after the two-failure stop.

## Stage result

Stage 2.1 is **STOPPED — FAIL on mandatory CLS = 0 gate**.

Stage 1.1 and Stage 1.2 remain PASS. Production remains untouched. Stage 2.2 has not started.
