# Stage 3.2 Report — Press feedback, CTA hierarchy, and small-screen spacing

Status: **STOPPED — REQUIRED 44×44 TARGET GATE FAILED TWICE**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage32-ci-validation`
Previous stage: `docs/stage-3.1.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Isolation

Stage 3.2 remained isolated on `stage32-ci-validation`, created directly from the passing Stage 3.1 sprint head:

```text
2e2bb24a4729726f6436ffdd6eaa9cb7036787e2
```

The Stage 3.2 product candidate changed only:

```text
css/motion.css
```

Validation-only files on the temporary branch:

```text
scripts/test-stage-3.2.mjs
.github/workflows/stage-3.2-browser-gate.yml
```

No Stage 3.2 product source was promoted to `sprint-1-foundations`.

## Intended implementation

The isolated Stage 3.2 candidate implements:

- press feedback using `transform: scale(.94)`,
- Gwap Green press glow via `var(--gwap-green-glow)`,
- primary hero CTA first in DOM, solid canonical `#13DD13`, dark text, minimum 48px height,
- secondary hero CTA as a translucent ghost control, minimum 48px height,
- responsive hero heading clamp,
- single-column mobile CTA stack,
- 44px minimum interactive targets,
- 320 / 375 / 414px overlap and horizontal-overflow checks,
- reduced-motion override that removes press scaling/glow,
- preserved Stage 3.1 motion behavior and Browse 152-sticker generation.

## Browser validation environment

GitHub Actions runner:

```text
Ubuntu 24.04
sharp 0.35.5
playwright 1.64.0
serve 14.2.5
Chromium 156.0.8078.4
```

Each run used the approved deterministic build chain:

```text
node scripts/build-stage-1.2.cjs
node scripts/build-browse.mjs
node scripts/build-preview.cjs
```

Repeated build output:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse tiles generated: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Result: **PASS — build and browser environment.**

## Run 1 — 320px overflow failure

GitHub Actions:

```text
run: 38044019429
job: 114189789337
commit: 57cf5519d47c51755f946b3026030ae2496a187e
```

Failure:

```text
AssertionError: no horizontal page overflow at 320px
```

The test stopped before screenshots or later Stage 3.2 assertions.

Result: **FAIL — 320px horizontal overflow.**

## Overflow correction

The scoped CSS was tightened for <=360px:

- reduced header gap/padding,
- reduced narrow-screen header CTA padding/font size,
- stacked section headings vertically,
- retained the responsive hero heading clamp.

Correction commit:

```text
9d2b7cf65c70c2b1666bd2f6c454486a79b094d1
fix(stage-3.2): remove 320px spacing overflow
```

## Run 2 — overflow fixed, target gate exposed

GitHub Actions:

```text
run: 38044183573
job: 114190268427
commit: 9d2b7cf65c70c2b1666bd2f6c454486a79b094d1
```

The run passed the previously failing 320px overflow assertion and advanced through the geometry checks before failing the 44×44 target gate.

The following checks therefore passed at 320px before the failure:

```text
primary CTA is first in DOM: PASS
secondary CTA is second in DOM: PASS
primary canonical green / dark text: PASS
primary CTA >=48px: PASS
secondary remains ghost/translucent: PASS
secondary CTA >=48px: PASS
primary touch-action manipulation: PASS
horizontal page overflow: PASS
heading inside viewport: PASS
hero copy / hero art overlap: PASS
hero CTA overlap: PASS
header logo / CTA overlap: PASS
```

Target failure:

```text
Terms     width 29.453125px  height 11px  display inline
IP Policy width 39.5px       height 11px  display inline
```

Assertion:

```text
all visible home links/buttons are at least 44x44 at 320px
```

Result: **FAIL — 44×44 target gate.**

## Target correction

A source-level specific footer rule was added inside the same scoped CSS candidate:

```css
.site-footer .footer-links a {
  display: inline-flex !important;
  min-width: 44px !important;
  min-height: 44px !important;
  align-items: center;
  justify-content: center;
}
```

Correction commit:

```text
0c54db0ef5c732ee365a15bb19ab170e4d9e63e5
fix(stage-3.2): enforce footer touch targets
```

No other product file was changed.

## Run 3 — same target gate failed again

GitHub Actions:

```text
run: 38044313335
job: 114190639674
commit: 0c54db0ef5c732ee365a15bb19ab170e4d9e63e5
```

The exact same target measurements remained in Chromium:

```text
Terms     width 29.453125px  height 11px  display inline
IP Policy width 39.5px       height 11px  display inline
```

Failure:

```text
AssertionError: all visible home links/buttons are at least 44x44 at 320px
```

The source override did not change the computed footer-link presentation in the built browser output. The reason is not yet established by evidence in this stage run.

Result: **FAIL — same 44×44 target gate.**

## Mandatory two-failure stop

Standing stage rule:

> Complete tasks then gates; fix/re-run. After two failures on the same check, stop/report.

The required 44×44 target gate failed in Run 2 and Run 3.

Therefore:

```text
STOP — mandatory two-failure rule triggered.
```

No third target fix or rerun is permitted in this Stage 3.2 run.

## Gates not claimed

Because the browser suite aborts at the 320px target check, Stage 3.2 does **not** claim final PASS for:

- complete 320 / 375 / 414 responsive suite,
- `.94` press-state browser verification,
- press-state Gwap Green glow verification,
- all-home 44×44 targets,
- Browse critical-control 44×44 targets,
- Browse 375px horizontal-overflow browser gate,
- reduced-motion press-state verification,
- screenshot evidence.

The implementation candidate contains these behaviors, but static source intent is not substituted for the required browser evidence.

## Screenshot evidence

No Stage 3.2 screenshots are claimed. Every browser run aborted before the screenshot step inside the test script.

## Repository / deployment safety

- Stage 3.2 product candidate remains isolated on `stage32-ci-validation`.
- `sprint-1-foundations` retains the fully passing Stage 3.1 product source plus this report only.
- Stage 4.1 was not started.
- No Stage 3.2 source promotion was performed.
- No production deployment or production alias operation was performed.
- `main` was not changed.
- `lil-gwapz-production` was not changed.
- `lilgwapz.xyz` and `www.lilgwapz.xyz` were not changed.

## Recommended next correction

Start a **fresh Stage 3.2 touch-target remediation pass** from the isolated candidate, but freeze product CSS initially.

Before another target assertion is attempted, diagnose the built browser output itself:

1. inspect the generated `dist/css/motion.css` and confirm the footer target rule is physically present,
2. inspect the computed style / matched CSS rule origin for the `Terms` and `IP Policy` anchors,
3. determine whether the deterministic preview build is omitting/overwriting the Stage 3.2 rule or whether another cascade/runtime path is winning,
4. modify product source only after that evidence identifies the actual cause,
5. restart the target gate as a fresh remediation pass rather than consuming a prohibited third attempt in this run.

## Stage result

Stage 3.2 remains **STOPPED**.

Stage 1.1, Stage 1.2, Stage 2.1, Stage 2.2, and Stage 3.1 remain PASS. Production remains untouched.
