# Stage 5.2 Report — Licensing, footer, and privacy/legal consistency

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage52-licensing-footer`
Previous stage: `docs/stage-5.1.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Owner-confirmed prerequisite

The owner explicitly approved the canonical licensing and partnership destination:

```text
https://gwapspot.com/contact
```

No licensing email address was invented or inferred.

Verified public destinations used in Stage 5.2:

```text
Licensing / contact   https://gwapspot.com/contact
X                     https://x.com/_gwapspot?s=21
Tha GwapSpot          https://gwapspot.com
GNS                   https://gwapspot.fun/name
GwapScore             https://gwapscore.live/
DIMI                  https://dimimusic.xyz/
Marketplace           https://gwapspot.store/
```

## Product scope

Only these validated product files were promoted:

```text
index.html
browse.html
terms.html
ip-policy.html
privacy.html
legal.css
```

Validation-only files remained isolated from the sprint product promotion:

```text
scripts/test-stage-5.2.mjs
.github/workflows/stage-5.2-browser-gate.yml
```

Diagnostic-only workflows also remained isolated on diagnostic branches.

## Implementation

### Expanded public footer

Home, Browse, Terms, IP Policy, and Privacy now expose three verified link groups:

```text
LEGAL
- Terms
- IP Policy
- Privacy
- Licensing & partnerships

GWAP ECOSYSTEM
- Tha GwapSpot
- GNS
- GwapScore
- DIMI
- Marketplace

CONNECT
- X · @_gwapspot
- Contact Tha GwapSpot
```

The licensing footer destination is always:

```text
https://gwapspot.com/contact
```

### Terms

Terms now include:

- a direct `Request commercial licensing` CTA,
- a direct contact path for copyright/infringement reports,
- the expanded verified footer.

### IP Usage Policy

The IP policy now includes:

- a direct licensing/partnership approval CTA,
- a dedicated licensing & partnerships section,
- a direct `Open licensing intake` CTA,
- the expanded verified footer.

### Privacy

Privacy rights and privacy contact requests now use the same exact official contact endpoint:

```text
https://gwapspot.com/contact
```

The page also exposes a direct `Contact Tha GwapSpot` CTA and the expanded verified footer.

### Visual / accessibility behavior

`legal.css` adds:

- canonical Gwap Green licensing CTAs with dark text,
- minimum 44×44 footer targets,
- responsive footer grouping,
- mobile legal layout containment,
- Browse-specific expanded-footer styling while preserving the legacy Browse build contract.

## Validation run 1 — footer target failure

```text
workflow: Stage 5.2 Browser Gate
run: 38055112025
job: 114221857968
commit tested: a849a8d6d1c335ba50168304dfdc965d1abd4fbd
conclusion: FAILURE
```

Build and static contract passed before the browser failure.

The failing visible footer targets on `/terms.html` were:

```text
Terms   40.296875 × 44
GNS     28.546875 × 44
DIMI    30.84375  × 44
```

The Stage 5.2 footer target rule was corrected to enforce both:

```text
min-width: 44px
min-height: 44px
```

Remediation commit:

```text
f6a286c82f4ac0869ff959ad1da1cb815833b172
fix(stage-5.2): enforce 44px footer target width
```

## Validation run 2 — new mobile overflow gate failure

```text
workflow: Stage 5.2 Browser Gate
run: 38055214726
job: 114222160453
commit tested: f6a286c82f4ac0869ff959ad1da1cb815833b172
conclusion: FAILURE
```

The original 44×44 target gate passed. The run advanced to a different gate and found horizontal overflow on `/terms.html` at 375px.

A diagnostic-only branch was used before spending the second attempt for this new gate:

```text
stage52-overflow-diagnostic
```

The diagnostic identified the cause as the one-column mobile CSS grid honoring the min-content width of the horizontally scrollable legal navigation, expanding the legal layout beyond the viewport.

The mobile legal shell was corrected with:

```text
grid-template-columns: minmax(0,1fr)
width: 100%
max-width: 100%
box-sizing: border-box
legal sidebar/document children: min-width: 0; max-width: 100%
legal nav: max-width: 100%
```

Remediation commit:

```text
4173a5ca761aa88f658350f57b52d880fa1e1940
fix(stage-5.2): contain mobile legal grid width
```

## Validation run 3 — browser suite success

```text
workflow: Stage 5.2 Browser Gate
run: 38055516191
job: 114223033608
commit tested: 4173a5ca761aa88f658350f57b52d880fa1e1940
conclusion: SUCCESS
```

Before promotion, a prior-stage compatibility review was intentionally performed.

## Browse regression diagnostic

`scripts/build-browse.mjs` preserves a legacy generator contract that inserts the mobile Character & color filter dialog by matching the literal source footer:

```html
<footer class="site-footer">
```

The initial Stage 5.2 Browse footer used an additional class, so a diagnostic branch was created:

```text
stage52-browse-regression-diagnostic
```

Diagnostic run:

```text
run: 38055644470
job: 114223442723
```

Evidence:

```text
mobile-filter-open:   1
mobile-filter-dialog: 0
static tiles:         152
```

This proved the Stage 5.2 footer markup had silently broken the generated mobile filter dialog while preserving the trigger and tiles.

The correction kept the literal Browse footer class required by the existing generator and moved the expanded visual treatment into `.browse-page .site-footer` CSS selectors.

The Stage 5.2 browser suite was also strengthened to require:

```text
#mobile-filter-open   = 1
#mobile-filter-dialog = 1
[data-sticker-tile]   = 152
```

Final validation commit:

```text
13589f81ffdf5b838b84b902ee0fc8ee376232e9
fix(stage-5.2): preserve generated mobile filter contract
```

## Final browser validation — PASS

```text
workflow: Stage 5.2 Browser Gate
run: 38055829337
job: 114224078110
commit tested: 13589f81ffdf5b838b84b902ee0fc8ee376232e9
conclusion: SUCCESS
```

Final browser evidence:

```json
{
  "stage": "5.2",
  "licensing": "https://gwapspot.com/contact",
  "x": "https://x.com/_gwapspot?s=21",
  "ecosystem": [
    "https://gwapspot.com",
    "https://gwapspot.fun/name",
    "https://gwapscore.live/",
    "https://dimimusic.xyz/",
    "https://gwapspot.store/"
  ],
  "pages": [
    { "path": "/", "targets": 15 },
    { "path": "/browse.html", "targets": 15 },
    { "path": "/terms.html", "targets": 15 },
    { "path": "/ip-policy.html", "targets": 15 },
    { "path": "/privacy.html", "targets": 15 }
  ],
  "termsCtaStyle": {
    "background": "rgb(19, 221, 19)",
    "color": "rgb(7, 16, 7)",
    "width": 181.984375,
    "height": 44
  },
  "browseMobileFilterDialog": 1,
  "jsOffBrowseTiles": 152
}
```

The final suite verified:

- Home, Browse, Terms, IP Policy, and Privacy return 200 in the static browser server.
- Every public footer contains the exact approved licensing, X, and ecosystem destinations.
- No `mailto:` licensing destination was invented.
- All rendered footer links meet the 44×44 minimum.
- All five tested pages fit the 375px viewport without horizontal overflow.
- Browser console errors: 0.
- Licensing CTA uses canonical `#13DD13` with dark `rgb(7,16,7)` text.
- Browse retains the generated mobile Character & color dialog.
- Browse retains all 152 grouped static tiles.
- JS-disabled Browse still exposes all 152 tiles and the licensing contact path.

## Screenshot evidence

```text
artifacts/stage-5.2/terms-desktop.png
a1183ead0d27bee8a02702a893a6fcd88f0fdccc586fca843c8a20c3e4a3abec

artifacts/stage-5.2/ip-policy-desktop.png
63b52f6aeea89ac401035e190a5a59446136a652e0411d5020de8634f5f77a40

artifacts/stage-5.2/browse-mobile-js-off.png
1c726c6cecacad55cfccb115a9739e20a37a901cb27f5a503a53e60be55b0378
```

## Promotion

Only the six exact validated product files were promoted atomically to the sprint:

```text
51ee8724aca1efbd315ff10d4ad85150b6bf1067
feat(stage-5.2): promote validated licensing and footer surfaces
```

No Stage 5.2 test, CI, or diagnostic workflow was included in the product promotion.

## Experimental Vercel verification

Exact promoted sprint deployment:

```text
project: lil-gwapz
project ID: prj_cXCW1emalg3eDXTUatVKjGlQkOE3
deployment: dpl_DwTBbQ9G2hGFSJDr94qRz9CVGqav
URL: https://lil-gwapz-40pufz0hf-bigdaddygwaps-projects.vercel.app
branch: sprint-1-foundations
commit: 51ee8724aca1efbd315ff10d4ad85150b6bf1067
state: READY
target: preview
```

Vercel build evidence:

```text
Cloning github.com/gwapupward-hub/lil-gwapz (Branch: sprint-1-foundations, Commit: 51ee872)
built 152/152
browse groups generated: happy:32, attitude:38, chill:32, hype:26, love:24; tiles: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
Build Completed in /vercel/output [48s]
Deployment completed
```

Protected preview smoke tests returned `200 OK` for:

```text
/
/browse.html
/terms.html
/ip-policy.html
/privacy.html
```

The deployed Browse output contains both:

```text
id="mobile-filter-open"
id="mobile-filter-dialog"
```

and all 152 generated static tiles.

## Experimental-domain isolation

The experimental Vercel project domain inventory contains exactly one project domain:

```text
lil-gwapz.vercel.app
branch: experiment/ui-ux-v2
```

It does **not** contain:

```text
lilgwapz.xyz
www.lilgwapz.xyz
```

## Production safety

Confirmed unchanged:

```text
main
lil-gwapz-production
lilgwapz.xyz
www.lilgwapz.xyz
```

No production merge, production promotion, production-domain assignment, or production Vercel project mutation was performed.

## Stage result

**PASS — EXPERIMENTAL PREVIEW ONLY**

Stages 1.1 through 5.2 are PASS.

Stage 6.1 — accessibility / green-use / 404 / axe / Lighthouse accessibility gate — is cleared to begin on the experimental path only.
