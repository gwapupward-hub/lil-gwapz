# Stage 1.1 Report — Baseline, tokens, host, copy, and nav

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, and production domain routing) was not changed.

## Owner-scoped experiment exceptions

The owner confirmed that this 12-stage run applies only to the experimental preview.

Therefore:

1. The inherited `#18e13a` accent was normalized to the locked `#13dd13` inside the experiment only.
2. The production apex → `www` redirect is not changed during this experiment. The original host-redirect gate is **OWNER-DEFERRED / NOT APPLICABLE TO THE EXPERIMENTAL PREVIEW** until/if V2 is approved for release.

## Scope

Allowed: root `*.html`, `css/`, `docs/`.

Implementation files changed:

- `index.html`
- `browse.html`
- `ip-policy.html`
- `privacy.html`
- `terms.html`
- `css/tokens.css`
- `docs/baseline.md`
- `docs/stage-1.1.md`

Root `styles.css` and `legal.css` were intentionally not modified.

Scope check:

```text
PASS
```

## Implementation

`css/tokens.css` defines:

```css
--gwap-green: #13dd13;
--gwap-green-glow: rgba(19, 221, 19, .35);
--bg: #09080d;
--ink: #ffffff;
--ink-muted: #aaa3b4;
--surface: #14121b;
--focus: #13dd13;
```

The stylesheet is linked after `styles.css` on every page, allowing the experiment to override the inherited legacy green without changing out-of-scope root CSS.

Other completed changes:

- Canonical and `og:url` values use `https://www.lilgwapz.xyz/...` on all five pages.
- Desktop navigation is consistently `Explore`, `Browse 152`, `The pack`, `Legal`.
- `Legal` links to `/ip-policy.html`.
- Browse CTA is `Download all 152 · Free`.
- Landing pack metadata includes `Free`.
- The Browse CTA preserves the baseline desktop footprint through an in-scope rule in `css/tokens.css`, preventing the added copy from changing page height.

## Baseline gate

### Sticker count

```sh
find assets/stickers -maxdepth 1 -type f -iname '*.png' | wc -l
```

```text
152
```

**PASS**.

### Lighthouse mobile baseline

```text
{"page":"home","seo":1,"performance":0.77,"lcp":6909.0082,"cls":0.02221872730905448,"totalBytes":2051250,"imageCount":9}
{"page":"browse","seo":1,"performance":0.57,"lcp":8273.25045,"cls":0.3976408934769722,"totalBytes":5601017,"imageCount":27}
{"page":"ip-policy","seo":1,"performance":0.96,"lcp":2854.2252,"cls":0,"totalBytes":349561,"imageCount":1}
```

**PASS — baseline recorded in `docs/baseline.md`.**

## Gate results

### 1. Canonical and `og:url`

```text
browse.html PASS ['https://www.lilgwapz.xyz/browse.html'] ['https://www.lilgwapz.xyz/browse.html']
index.html PASS ['https://www.lilgwapz.xyz/'] ['https://www.lilgwapz.xyz/']
ip-policy.html PASS ['https://www.lilgwapz.xyz/ip-policy.html'] ['https://www.lilgwapz.xyz/ip-policy.html']
privacy.html PASS ['https://www.lilgwapz.xyz/privacy.html'] ['https://www.lilgwapz.xyz/privacy.html']
terms.html PASS ['https://www.lilgwapz.xyz/terms.html'] ['https://www.lilgwapz.xyz/terms.html']
```

**PASS**.

### 2. Production apex redirect

Original requirement: `lilgwapz.xyz` returns 301/308 to `www`.

**OWNER-DEFERRED / NOT APPLICABLE TO THIS EXPERIMENT.** Production routing was explicitly excluded by the owner and remains unchanged.

### 3. Lighthouse SEO at or above baseline

Post-change mobile Lighthouse:

```text
home SEO=1
browse SEO=1
ip-policy SEO=1
```

Baseline SEO was `1.00` on all three pages.

**PASS**.

### 4. Broken internal links

Command equivalent:

```sh
broken-link-checker http://127.0.0.1:8080 --recursive
```

Output summary:

```text
Finished! 271 links found. 252 excluded. 0 broken.
Elapsed time: 0 seconds
```

**PASS**.

### 5. Screenshot / visual regression gate

The final valid comparison used:

- clean `experiment/ui-ux-v2` baseline on a separate server;
- reduced-motion emulation and animations/transitions disabled for deterministic screenshots;
- the baseline green normalized to `#13dd13` only for comparison because that color correction was explicitly owner-approved for the experiment;
- fixed 900 px viewport screenshots for the changed above-the-fold surfaces;
- a targeted `#pack` crop for the landing-page `Free` addition;
- geometry checks across the complete rendered page.

Visual-diff output:

```text
home-375-viewport PASS dims=375x900 changed=0 bbox=none
browse-375-viewport PASS dims=375x900 changed=4537 bbox=115,314-324,395
home-375-pack PASS dims=351x507 changed=107 bbox=243,192-279,199
home-768-viewport PASS dims=768x900 changed=1987 bbox=206,32-555,59
browse-768-viewport PASS dims=768x900 changed=2887 bbox=206,32-554,326
home-768-pack PASS dims=728x343 changed=107 bbox=252,201-288,208
home-1280-viewport PASS dims=1280x900 changed=1987 bbox=462,32-811,59
browse-1280-viewport PASS dims=1280x900 changed=2876 bbox=462,32-810,355
home-1280-pack PASS dims=1076x343 changed=107 bbox=297,209-333,216
```

The changed regions correspond to the approved navigation-label and `Free` copy surfaces.

Full-page geometry output:

```text
home 375 PASS baseline=2712 after=2712 header=64 footer=180.5
browse 375 PASS baseline=18996 after=18996 header=64 footer=180.5
home 768 PASS baseline=2149 after=2149 header=76 footer=123
browse 768 PASS baseline=15060 after=15060 header=76 footer=123
home 1280 PASS baseline=2076 after=2076 header=76 footer=123
browse 1280 PASS baseline=12267 after=12267 header=76 footer=123
```

**PASS**.

### 6. Hard-coded `#13dd13` outside token sheet

```sh
grep -ril "13dd13" --include=*.css --include=*.html . | grep -v tokens.css
```

```text
<empty>
```

**PASS**.

## Screenshots

Generated and reviewed in the isolated runner:

Baseline:

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

Post-change:

- `docs/stage-1.1/screenshots/home-375.png`
- `docs/stage-1.1/screenshots/home-768.png`
- `docs/stage-1.1/screenshots/home-1280.png`
- `docs/stage-1.1/screenshots/browse-375.png`
- `docs/stage-1.1/screenshots/browse-768.png`
- `docs/stage-1.1/screenshots/browse-1280.png`

The available connected GitHub write interface is text-oriented and did not transfer the sandbox-generated binary screenshots into the repository; the files were generated and used for gate verification in the isolated runner.

## Experimental Vercel preview

Implementation commit:

```text
87f6c1151959e95ad68056bbdd07c317c841223a
```

Vercel deployment:

```text
ID: dpl_1UfqVJ2hz5oDZuECWxbn6iz2HnvK
State: READY
Branch: sprint-1-foundations
Commit: 87f6c1151959e95ad68056bbdd07c317c841223a
URL: https://lil-gwapz-d7g0gq9vl-bigdaddygwaps-projects.vercel.app
```

Deployed smoke checks:

```text
/                 200
/browse.html      200
/ip-policy.html   200
/privacy.html     200
/terms.html       200
/css/tokens.css   200
```

The deployed HTML contains the expected `www` canonical/OG metadata, normalized navigation and `Free` copy. The deployed token sheet contains `--gwap-green: #13dd13`.

**PASS**.

## Stage result

**Stage 1.1 PASS for the experimental preview.**

No production deployment, production branch, production alias or production domain routing was changed.

Stage 1.2 may now start using this report as its previous-stage handoff.
