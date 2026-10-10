# Stage 6.1 Report — Accessibility, canonical green, and 404

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Sprint branch: `sprint-1-foundations`
Validation branch: `stage61-a11y-404`
Previous stage: `docs/stage-5.2.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Stage objective

Stage 6.1 hardens the experimental Lil Gwapz UI for accessibility and error recovery while preserving every prior-stage product contract.

Required gates:

- no serious or critical axe violations;
- Lighthouse accessibility score of at least 95;
- keyboard-visible focus and 44×44 critical interactive targets;
- reduced-motion support;
- JavaScript-off Browse and 404 usability;
- no horizontal overflow at the audited mobile viewport;
- canonical Gwap Green enforcement;
- Gwap Green text only on the exact `#09080D` background;
- dark text on canonical green fills;
- a branded, usable custom 404 that preserves HTTP 404 for missing URLs;
- preserve the 152-sticker Browse contract and generated mobile filter dialog.

## Baseline diagnostic

Baseline branch: `stage61-a11y-baseline`

Baseline run:

```text
Run: 38057494943
Job: 114228853231
```

Pinned/tested audit stack:

```text
@axe-core/playwright 4.13.0
lighthouse            13.5.0
playwright             1.64.0
serve                  14.2.5
sharp                  0.35.5
```

Baseline deterministic build:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse groups generated: happy:32, attitude:38, chill:32, hype:26, love:24; tiles: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Baseline axe result: zero serious/critical violations on Home, Browse, Terms, IP Policy, Privacy, and a generated sticker page.

Baseline Lighthouse accessibility:

```text
Home   100
Browse 100
Terms  100
```

The baseline identified semantic Gwap Green issues that axe alone would not reject. Canonical project rules are stricter than WCAG: green text is allowed only on exact `#09080D`, while canonical green fills must use dark text.

Measured Stage 6.1 corrections included:

- Home hero emphasis and decorative green glyphs on gradients;
- selected mobile-navigation green text on a tinted surface;
- license-dialog green text on dialog surfaces;
- IP-policy rule-card green numbers on card surfaces;
- legacy green paint normalization through the canonical token layer.

## Validated product scope

Only these three product files were promoted:

```text
404.html
css/tokens.css
scripts/build-preview.cjs
```

Validation-only workflows, scripts, and diagnostic branches were not promoted.

## Product implementation

### Custom 404

`404.html` is a no-JavaScript branded recovery surface with:

- `Page Not Found — Lil Gwapz` title;
- `noindex,follow` robots directive;
- clear `Page not found.` H1;
- Home and Browse recovery actions;
- 44×44 minimum interactive targets;
- mobile-first layout;
- canonical green use on the exact dark background;
- no runtime dependency on JavaScript.

The preview build now requires `dist/404.html`; the build fails if it is missing.

### Canonical green and accessibility token enforcement

`css/tokens.css` keeps canonical Gwap Green at:

```text
#13DD13
```

Stage 6.1 additionally enforces:

- shared 44×44 sizing for primary navigation/footer/legal targets;
- white text where prior green text appeared on non-canonical surfaces;
- dark text on canonical green buttons/fills;
- canonical green/tint/glow values on Stage 6.1 surfaces;
- legal/dialog accents that preserve the stricter green-text background rule.

### Generated sticker-page stylesheet path

Axe exposed a generated-page resource resolution edge case. Root `styles.css` imports `legal.css` relatively. During axe's stylesheet analysis on a generated `/s/...` page, that import was resolved as `/s/legal.css`.

The preview build now copies root `legal.css` to:

```text
dist/s/legal.css
```

and fails the build if the file is missing.

No product runtime JavaScript was changed and the console/resource gate was not weakened.

## Validation history

### Run 1 — FAIL

```text
Run:    38058098911
Job:    114230588834
Commit: a9d911bb40ef5c7e44242b3e7b26dd8a47f125de
Result: FAILURE
```

Build/static gates passed. The generated sticker detail page failed the no-console-error gate:

```text
/s/big-smile-male.html has no console errors
Failed to load resource: the server responded with a status of 404 (Not Found)
```

This was the first counted failure of that required gate.

### Diagnostic — exact root cause

Diagnostic branch: `stage61-console-diagnostic`

Axe-enabled trace:

```text
Run: 38058756391
Job: 114232517251
Result: SUCCESS
```

The trace proved the failed resource was:

```text
http://127.0.0.1:4173/s/legal.css
HTTP 404
Resource type: XHR
```

The error appeared after axe analysis began. This established the resource-path cause before spending the final allowed validation attempt.

### Run 2 — PASS

This was the second and final allowed attempt for the same generated-page console/resource gate.

```text
Run:    38058910566
Job:    114232962791
Commit: fd92744c093aa2656a7726767a58f98db0bb375b
Result: SUCCESS
```

Deterministic build:

```text
built 152/152
complete { stickers: 152, urls: 157 }
browse groups generated: happy:32, attitude:38, chill:32, hype:26, love:24; tiles: 152; eager: 8; lazy: 144
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
```

Playwright/axe result:

```text
STAGE61_BROWSER_PASS
```

Audited surfaces:

```text
/
/browse.html
/terms.html
/ip-policy.html
/privacy.html
/s/big-smile-male.html
/404.html
```

Required browser gates passed:

- zero serious/critical axe violations;
- zero console errors;
- zero failed resources;
- no 375px horizontal overflow;
- canonical green semantic rules;
- no rendered legacy green paint;
- critical targets at least 44×44;
- keyboard Tab focus reached interactive content with a visible 3px solid canonical-green outline;
- reduced-motion hero animations disabled;
- Browse retained all 152 static tiles and exactly one generated mobile filter dialog;
- JavaScript-off Browse retained 152 visible tiles;
- JavaScript-off 404 retained recovery content;
- unknown local route preserved HTTP 404 and rendered the custom Lil Gwapz 404.

Lighthouse accessibility:

```text
home      100
browse    100
terms     100
ip        100
privacy   100
sticker   100
notfound  100
```

All seven audited surfaces exceeded the required accessibility score of 95.

## Screenshot evidence

```text
mobile Browse 375
257d224c7138973b9927282369c13aa68579c99d4bcb70b431608239be28c22d

mobile 404 375
922dca4c426caa12edf42b4c1079d6b4318cc05b3ba2ecf7e92e67eaae026a7d

desktop 404 1280
d87241336b7ff577a21a22c040e39370584dbe3b06ca148cca9d4982a30fe820

mobile Home 375
48c2979511db8abdacf80ab561d87c7bfc0f0114419f515a02645646ac987043
```

## Product promotion

Validated product source was promoted atomically to `sprint-1-foundations`:

```text
Commit: e9384878f33853f324829170790dad45b81b0430
Message: feat(stage-6.1): promote validated accessibility and 404 surfaces
```

Promoted blobs:

```text
404.html                  f53f1c34271caa1a8a8f20f9f04e0f20ed56db3d
css/tokens.css            78f06cddb68b14a236b1f116dd2d9c344c118c31
scripts/build-preview.cjs ee041208d105517f23540c1ef0b7a10e62b86c61
```

## Experimental Vercel deployment smoke

Project:

```text
lil-gwapz
prj_cXCW1emalg3eDXTUatVKjGlQkOE3
```

Exact promoted deployment:

```text
Deployment: dpl_92rUi4ydhsii35ukkAL3BXQ1VYaY
Commit:     e9384878f33853f324829170790dad45b81b0430
State:      READY
URL:        https://lil-gwapz-9xgbqw1xv-bigdaddygwaps-projects.vercel.app
```

Vercel build evidence:

```text
built 152/152
complete { stickers: 152, urls: 157 }
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
Deployment completed
```

Deployment smoke results:

```text
/                                      200
/browse.html                           200
/404.html                              200
/definitely-not-a-lil-gwapz-page      404 + custom Lil Gwapz Page Not Found content
/s/big-smile-male.html                 200
/s/legal.css                           200
```

The genuinely missing URL preserves HTTP 404 and is served using the branded `404.html` recovery page.

## Domain isolation

The experimental Vercel project domain inventory contains only:

```text
lil-gwapz.vercel.app
```

It is bound to `experiment/ui-ux-v2`. No production domain is attached to the experimental project.

Production remains frozen:

```text
main
lil-gwapz-production
lilgwapz.xyz
www.lilgwapz.xyz
```

## Stage decision

**PASS.**

Stage 6.1 is complete on the experimental path. Stage 6.2 is cleared for full QA, staged rollout planning, and rollback validation.

Stage 6.2 must not promote or route the redesign to production without explicit owner authorization.
