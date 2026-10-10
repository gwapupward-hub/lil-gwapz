# Stage 3.1 Report — Reveal and hero motion

Status: **STOPPED — REQUIRED REVEAL GATE FAILED TWICE**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage31-ci-validation`
Previous stage: `docs/stage-2.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Isolation

Stage 3.1 work was kept on the temporary validation branch. The validation branch was confirmed to be based directly on the current passing sprint head with no divergence before Stage 3.1 work.

The Stage 3.1 source implementation on the validation branch includes:

```text
css/motion.css
index.html
js/browse-tiles.js
```

Dedicated validation files were added only on the validation branch:

```text
scripts/test-stage-3.1.mjs
.github/workflows/stage-3.1-browser-gate.yml
```

No Stage 3.1 source implementation was promoted to `sprint-1-foundations`.

## Intended implementation

The isolated Stage 3.1 motion layer implements:

- progressive reveal using `IntersectionObserver`,
- no `scroll` event listener and no `onscroll` handler,
- scroll-linked hero drift using CSS `animation-timeline: view()` where supported,
- hero travel from -12px to +12px,
- 6-second idle float fallback from -6px to +6px where view timelines are unsupported,
- reduced-motion override that disables hero and reveal animation,
- fine-pointer Browse artwork hover/focus scale to 1.06 with Gwap Green glow,
- JS-off-safe content because motion classes are applied only by JavaScript.

## Browser gate runner

GitHub Actions uses Ubuntu with pinned test dependencies:

```text
sharp 0.35.5
playwright 1.64.0
serve 14.2.5
```

Chromium and Linux system dependencies installed successfully. The experimental preview build completed successfully on both browser-gate runs:

```text
Stage 1.2: 152/152 generated
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Result: **PASS — CI/browser environment and build.**

## Browser run 1

GitHub Actions run:

```text
run: 38040820958
job: 114180539094
commit: a9b05a868d0ae6bc60f571a199752faa3c9cecf7
```

The test reached the home reveal check. `IntersectionObserver` had already applied `is-revealed`, but the assertion sampled the element only 100ms into the intentional 450ms reveal transition:

```text
AssertionError: revealed content visible
actual opacity: 0.261704
expected opacity: 1
```

This was identified as a test timing defect, not a reason to weaken the final expected opacity. The test was corrected to wait for the transition to reach its required final state of opacity `1`.

Result: **FAIL — reveal gate timing.**

## Browser run 2

GitHub Actions run:

```text
run: 38040899320
job: 114180765570
commit: 6060768fb7c0e9718f7c627230ef0c943930a0bc
```

Only the test timing changed; the Stage 3.1 source implementation remained unchanged.

The build again passed, but the same reveal gate failed one assertion earlier after `scrollIntoViewIfNeeded()`:

```text
AssertionError: IntersectionObserver reveals visible content
actual: false
expected: true
```

The observed behavior indicates the browser test is still racing the asynchronous IntersectionObserver delivery. However, this is the second failure of the same required reveal gate.

Result: **FAIL — reveal gate.**

## Mandatory two-failure stop

Standing stage rule:

> Complete tasks then gates; fix/re-run. After two failures on the same check, stop/report.

The Stage 3.1 reveal gate failed twice. Therefore no third attempt is permitted in this stage run.

Result: **STOP — mandatory two-failure rule triggered.**

## Gates not claimed

Because the suite aborts at the reveal gate, Stage 3.1 does not claim final PASS for:

- completed IntersectionObserver reveal verification,
- hover/glow verification,
- reduced-motion verification,
- JS-off Browse visibility verification,
- screenshot evidence,
- no-third-party-script browser verification,
- full Stage 3.1 integrated preview verification.

Static inspection supports the intended behavior, but it is not substituted for the mandatory browser gate.

## Repository / deployment safety

- Stage 3.1 source remains isolated on `stage31-ci-validation`.
- `sprint-1-foundations` retains the last fully passing Stage 2.2 source plus this report only.
- Stage 3.2 was not started.
- No Stage 3.1 Vercel promotion was performed.
- `main` was not changed.
- `lil-gwapz-production` was not changed.
- `lilgwapz.xyz` and `www.lilgwapz.xyz` were not changed.

## Recommended next correction

Start a new narrowly scoped Stage 3.1 reveal-gate remediation pass. Keep the source implementation frozen first and make the browser test wait explicitly for the asynchronous `IntersectionObserver` state transition (for example, poll for `is-revealed`) before testing the 450ms visual transition. Only modify source if that diagnostic proves the implementation itself is faulty.

## Stage result

Stage 3.1 remains **STOPPED**.

Stage 1.1, Stage 1.2, Stage 2.1, and Stage 2.2 remain PASS. Production remains untouched.
