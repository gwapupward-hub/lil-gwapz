# Stage 3.2 Report — Press feedback, CTA hierarchy, and small-screen spacing

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Initial validation branch: `stage32-ci-validation`
Fresh remediation branch: `stage32-target-remediation`
Diagnostic branch: `stage32-target-diagnostic`
Previous stage: `docs/stage-3.1.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Scope

The validated Stage 3.2 product promotion changes only:

```text
css/motion.css
```

Validation-only workflow/test changes remained on temporary validation/remediation branches and were not promoted as Stage 3.2 product source.

## Final implementation

Stage 3.2 adds:

- immediate press feedback using `transform: scale(.94)`,
- Gwap Green press glow using `var(--gwap-green-glow)`,
- no transform transition while a control is actively pressed so tactile feedback reaches `.94` immediately,
- primary hero CTA first in DOM, solid canonical `#13DD13`, dark text, and 48px minimum height,
- secondary hero CTA as a translucent ghost control with 48px minimum height,
- `touch-action: manipulation`,
- 44px minimum rendered targets for required interactive controls,
- 44px treatment for the runtime-injected personal-use `Terms` / `IP Policy` links,
- responsive heading clamp,
- single-column mobile CTA stack,
- <=360px header/section-heading spacing corrections,
- reduced-motion override that disables press scale and press glow.

Stage 3.1 reveal/hero-motion behavior remains intact.

## Historical mandatory stop

The original Stage 3.2 validation run was correctly stopped after the 44×44 target gate failed twice.

Historical runs:

```text
Run 1
run: 38044019429
job: 114189789337
commit: 57cf5519d47c51755f946b3026030ae2496a187e
failure: 320px horizontal overflow

Run 2
run: 38044183573
job: 114190268427
commit: 9d2b7cf65c70c2b1666bd2f6c454486a79b094d1
overflow: PASS
new failure: Terms / IP Policy measured below 44×44

Run 3
run: 38044313335
job: 114190639674
commit: 0c54db0ef5c732ee365a15bb19ab170e4d9e63e5
same target gate failed again
```

The standing two-failure rule was honored. No third target attempt occurred in that run.

Historical STOP report commit:

```text
b0912e7def9e43cc5251034bd8af23b96e21cc71
docs(stage-3.2): record mandatory target-gate stop
```

## Fresh remediation — diagnostic first

A fresh Stage 3.2 remediation was started without treating it as a prohibited third attempt from the closed historical run.

The product CSS was frozen initially and a diagnostic-only Chromium workflow was used to inspect the built output and matched footer styles.

Diagnostic branch:

```text
stage32-target-diagnostic
```

Diagnostic commit:

```text
7b4780f28b6bdd2d5d8d0e5332a46453d9cb9837
```

Diagnostic GitHub Actions:

```text
run: 38045452150
job: 114193941036
conclusion: SUCCESS
```

The diagnostic proved:

- source `css/motion.css` and `dist/css/motion.css` were byte-identical,
- the footer target rule was physically present in the built CSS,
- footer `Terms`, `IP Policy`, and `Privacy` anchors computed to at least 44px targets,
- therefore the historical failing `Terms` / `IP Policy` elements were not the footer anchors.

The actual root cause was then identified in `legal.js`: it injects a separate `.download-license-note` under the hero containing its own `Terms` and `IP Policy` anchors. Those runtime-injected anchors matched the historical measurements and were the real failing targets.

`legal.js` itself was not modified; the already-scoped Stage 3.2 CSS was extended to style the injected notice links.

## Fresh target remediation

The injected license-note anchors were included in the 44px target rule.

Product correction commit on the remediation branch:

```text
d344f1cee69c024fe3f4c24be6fea6ff8f5aa11f
fix(stage-3.2): size injected license links for touch
```

That cleared the 44×44 home target gate and exposed the next independent gate: press-state timing.

## Press-state remediation

The source requested `.94` scale, but Chromium measured an intermediate transform after 40ms because the base `.button` transform transition was still interpolating.

The active press rule was corrected to use `transition:none` while pressed so the tactile state is immediate.

Product correction commit:

```text
b7a281ff3d33842b757a5c41909db7f0a7c56df7
fix(stage-3.2): make press feedback immediate
```

This cleared the exact `.94` press gate and Gwap Green glow gate.

## Browse gate test correction

The next failure was test-only: the Browse assertion counted controls inside a closed mobile filter dialog because their own computed `display` was not `none`, even though the rendered boxes were 0×0 due to the hidden ancestor.

The gate was corrected to measure only rendered controls:

```text
display != none
visibility != hidden
width > 0
height > 0
```

Test-only correction commit:

```text
809cca947d25c898e42b8f59bb43d3f2cd87a96c
test(stage-3.2): ignore non-rendered dialog controls
```

No product CSS changed in this commit.

## Final browser validation

Final passing GitHub Actions evidence:

```text
run: 38045934809
job: 114195355567
commit tested: 809cca947d25c898e42b8f59bb43d3f2cd87a96c
conclusion: SUCCESS
```

Runner / test stack:

```text
Ubuntu 24.04
sharp 0.35.5
playwright 1.64.0
serve 14.2.5
Chromium 156.0.8078.4
```

Deterministic build output:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse tiles generated: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Source/build CSS identity:

```text
2c6a8407bdb2894c780296bfc18b5fdcf2bac0eabfa423d30390a84230e14b9a  css/motion.css
2c6a8407bdb2894c780296bfc18b5fdcf2bac0eabfa423d30390a84230e14b9a  dist/css/motion.css
```

### 320px

```text
viewport: 320
scrollWidth: 320
primary CTA: 284.8125 × 48
primary background: rgb(19, 221, 19)
primary text: rgb(7, 16, 7)
primary touch-action: manipulation
secondary CTA: 284.8125 × 48
secondary background: rgba(20, 18, 27, 0.58)
hero heading: inside viewport
hero copy bottom: 553.375
hero art top: 557.375
first CTA bottom: 371.375
second CTA top: 381.375
header mark right: 112
header CTA left: 184.90625
rendered targets checked: 26
press transform: matrix(0.94, 0, 0, 0.94, 0, 0)
press glow: drop-shadow(rgba(19, 221, 19, 0.35) 0px 0px 14px)
```

Result: **PASS**.

### 375px

```text
viewport: 375
scrollWidth: 375
primary CTA: 333.75 × 48
secondary CTA: 333.75 × 48
hero copy bottom: 579.5
hero art top: 583.5
header mark right: 116
header CTA left: 223.078125
rendered targets checked: 26
press transform: matrix(0.94, 0, 0, 0.94, 0, 0)
press glow: Gwap Green drop-shadow
```

Result: **PASS**.

### 414px

```text
viewport: 414
scrollWidth: 414
primary CTA: 370 × 48
secondary CTA: 370 × 48
hero copy bottom: 548.0625
hero art top: 552.0625
header mark right: 116
header CTA left: 262.078125
rendered targets checked: 26
press transform: matrix(0.94, 0, 0, 0.94, 0, 0)
press glow: Gwap Green drop-shadow
```

Result: **PASS**.

### Browse regression / accessibility targets

```text
Browse tiles: 152
rendered critical Browse controls: 10
critical target minimum: >=44×44
375px horizontal overflow: none
```

Result: **PASS**.

### Reduced motion

```text
pressed transform: none
pressed filter: none
```

Result: **PASS**.

### Console

The home browser checks at 320 / 375 / 414 completed with zero console errors.

Result: **PASS**.

## Screenshot evidence

```text
home-320.png
SHA256 916c0e631eb603604bde035d9ca020475f9e3e5fa7c50fd5b9a22201a96c1069

home-375.png
SHA256 a26788935717f51b35cbc2e9efcfa96b1a58ab0fded8502db9717286ca75c43c

home-414.png
SHA256 40acddbf5dfe6471911898ad1ea8ec7647e41eddf2aba422ff3a580d578b67e0

browse-375.png
SHA256 440d5850ca73e372b6db47d9e672e90849039e07755cb710020ec5377e6c67e1
```

## Source promotion

Only the exact validated product CSS blob was promoted to `sprint-1-foundations`.

Validated blob:

```text
ad32e688cf80e7edade7b8025cefc1b811cd13ac
```

Sprint promotion commit:

```text
838fb6520b5bd933d79c37f9b35bbb90a26d6436
feat(stage-3.2): promote validated press and spacing polish
```

No validation workflow or test-only file was promoted as product source.

## Experimental deployment verification

Experimental Vercel project only:

```text
project: lil-gwapz
project ID: prj_cXCW1emalg3eDXTUatVKjGlQkOE3
deployment: dpl_4GKJZQYEkH5bEb11fefEFDd1SK3w
URL: https://lil-gwapz-jteiqzrby-bigdaddygwaps-projects.vercel.app
source branch: sprint-1-foundations
source commit: 838fb6520b5bd933d79c37f9b35bbb90a26d6436
state: READY
target: preview
```

Deployment alias:

```text
lil-gwapz-git-sprint-1-foundations-bigdaddygwaps-projects.vercel.app
```

The experimental project domain inventory contains only:

```text
lil-gwapz.vercel.app → experiment/ui-ux-v2
```

It does not contain `lilgwapz.xyz` or `www.lilgwapz.xyz`.

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

Stage 1.1, Stage 1.2, Stage 2.1, Stage 2.2, Stage 3.1, and Stage 3.2 are PASS.

Stage 4.1 is cleared to begin after this PASS report is committed.
