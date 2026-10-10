# Stage 6.2 Report — Full QA, staged rollout readiness, and rollback plan

Status: **PASS — EXPERIMENTAL RELEASE CANDIDATE ONLY**

Date: 2026-10-10
Sprint branch: `sprint-1-foundations`
Validation branch: `stage62-full-qa`
Previous stage: `docs/stage-6.1.md` — PASS

**No production promotion, alias change, domain change, rolling release, or rollback action was performed.**

Production remains frozen on the pre-redesign release until the owner explicitly approves a production release.

## Validated product scope

Stage 6.2 promoted exactly one product file:

```text
css/tokens.css
```

Validated product promotion commit:

```text
a8981f12c315201fc0cddcd40390e72530e36d17
fix(stage-6.2): close release QA touch targets
```

Validation-only files remained isolated from the sprint product promotion:

```text
scripts/test-stage-6.2.mjs
scripts/test-stage-6.2-v2.mjs
scripts/test-stage-6.2-v3.mjs
.github/workflows/stage-6.2-full-qa.yml
```

## Product changes

The full release QA matrix found two remaining hit-area gaps under the project’s stricter 44×44 interaction rule:

1. the Browse search input was visually contained by a 48px search shell but the input element itself was only about 22px high;
2. inline legal-document links were visually readable but their element hit areas were only about 15–38px high.

The validated remediation in `css/tokens.css` is:

```css
.search-box input {
  min-height: 44px;
  height: 100%;
}

.legal-page .legal-document section a:not(.legal-action-link) {
  display: inline-flex;
  align-items: center;
  min-width: 44px;
  min-height: 44px;
  max-width: 100%;
}
```

No other product source was required for Stage 6.2.

## QA run history

### Run 1 — full QA found remaining hit-area gaps

```text
workflow: Stage 6.2 Full QA Gate
run: 38062658916
job: 114243903875
validation commit: 8a651ecb082b30ca6afc50401003d091c503e72f
conclusion: FAILURE
```

The deterministic build passed first:

```text
stickers: 152
thumbs: 152
generated sticker pages: 152
OG images: 153
Browse groups: happy 32 / attitude 38 / chill 32 / hype 26 / love 24
Browse tiles: 152
eager images: 8
lazy images: 144
```

The release matrix then identified the two real product issues listed above.

A separate test-harness issue was also found: the first color-filter selector matched a hidden desktop duplicate when the harness was running at a mobile viewport. That selector issue was validation-only and did not represent a product failure.

### Run 2 — 44×44 remediation proved successful

Product remediation commit on the validation branch:

```text
90797e19c768a589216e7e515ce33721b034074a
fix(stage-6.2): close full-QA touch targets
```

Run:

```text
workflow: Stage 6.2 Full QA Gate
run: 38062980474
job: 114244839624
conclusion: FAILURE later in validation harness
```

The important result is that the previously failing target-size gate passed at **every required viewport**:

```text
320 px
375 px
414 px
768 px
1280 px
```

For Home, Browse, Terms, and 404 at all five widths:

```text
HTTP status: 200
horizontal overflow: 0
visible targets under 44px: 0
console/page errors: 0
failed same-origin resources: 0
```

The run later timed out while waiting for the sticker dialog’s reaction ID to change after `ArrowRight`.

That timeout was diagnosed as a **false negative in the QA harness**. The source manifest proves the first two visible items are:

```text
Big Smile — male   — LG-R01-001
Big Smile — female — LG-R01-001
```

The reaction ID is intentionally shared by the male/female variants, so it is not a unique navigation key.

No product change was made for this diagnosis.

### Final validation — PASS

The validation-only assertion was corrected to track the unique sticker download filename and image URL rather than the shared reaction ID.

Final run:

```text
workflow: Stage 6.2 Full QA Gate
run: 38063314020
job: 114245803181
validation head: f755a76f878e9a3f1db7b55fbcd6ed1b1497c576
product source under test: same Stage 6.2 remediation as 90797e19c768a589216e7e515ce33721b034074a
conclusion: SUCCESS
```

## Final browser QA — PASS

### Deterministic collection/build integrity

```text
full PNGs: 152
WebP thumbs: 152
generated sticker pages: 152
OG images: 153
custom 404: present
/s/legal.css compatibility dependency: present
Browse static tiles: 152
mood groups: 5
eager/lazy: 8 / 144
mobile filter dialogs: exactly 1
```

Canonical Browse group counts remained:

```text
Happy:    32
Attitude: 38
Chill:    32
Hype:     26
Love:     24
```

### Responsive matrix

Home, Browse, Terms, and 404 were checked at:

```text
320 × 896/760
375 × 896/812
414 × 896
768 × 900
1280 × 900
```

Across the entire matrix:

```text
horizontal overflow: 0
visible targets below 44×44: 0
console/page errors: 0
failed same-origin resources: 0
```

### Accessibility and source-script gate

The following routes passed with **0 serious/critical axe violations**, no page/console errors, no failed same-origin resources, and no third-party source scripts:

```text
/
/browse.html
/terms.html
/ip-policy.html
/privacy.html
/s/big-smile-male.html
/404.html
```

Keyboard focus remained visible with a 3px solid canonical Gwap Green outline.

Reduced-motion mode disabled hero motion and reveal transitions as required.

### Browse interaction regression suite

PASS results:

```text
initial visible stickers: 152
Happy filter: 32
Green colorway filter: 40
Attitude + male: 19, contextual label = Swagger
Attitude + female: 19, contextual label = Sassy
mobile Character & color dialog: opens
```

Sticker viewer PASS:

```text
opens correctly
full PNG is same-origin
download filename: gwap-<slug>.png
usage copy: Free for personal use. Commercial use needs written permission.
ArrowRight changes Big Smile male -> Big Smile female
copy link uses canonical https://www.lilgwapz.xyz/s/<slug>.html
viewer closes cleanly
```

Final ArrowRight evidence:

```text
before:
  reaction id: LG-R01-001
  download: gwap-big-smile-male.png

after ArrowRight:
  reaction id: LG-R01-001
  download: gwap-big-smile-female.png
  image: /stickers/LG-R01-001-F-GRN-v01-TELEGRAM-512.png
  variant: Female · Happy · green
```

This confirms that the shared reaction ID is expected while the underlying visible sticker does advance correctly.

### Routing / link integrity

PASS:

```text
unknown route returns HTTP 404
unknown route renders branded custom 404
/s/legal.css returns HTTP 200
internal link crawl: 164 URLs checked
broken internal links: 0
```

### JavaScript-disabled behavior

PASS:

```text
Home: primary content and 5 mood links remain visible
Browse: all 152 static sticker tiles remain visible
404: heading and recovery actions remain usable
```

## Lighthouse release QA — PASS

Final run scores:

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Home | 76 | 100 | 100 | 100 |
| Browse | 82 | 100 | 100 | 100 |
| Terms | — | 100 | — | — |
| IP Policy | — | 100 | — | — |
| Privacy | — | 100 | — | — |
| Generated sticker page | — | 100 | — | — |
| 404 | — | 100 | — | — |

Release thresholds were therefore satisfied.

## Screenshot evidence

Final Stage 6.2 screenshot hashes:

```text
404-1280.png
  d87241336b7ff577a21a22c040e39370584dbe3b06ca148cca9d4982a30fe820

404-375.png
  62f5b791785168d0dfef7048f323ae51a69519fc71eb0b8a2aa1ceccda95c3cc

browse-1280.png
  eb75793a9159dc1a391550f06b15aef0d8e5a0e4a8daa06e97f684c816281157

browse-375.png
  b687994d41d32f84775177cc727e73f417a8ec1e96f6e6b959a53949226c9662

home-1280.png
  b0d1cca40cfc8e72c8df01ac1a220231ad2a2b7d9d319af7ea5ba1993c70f0ad

home-375.png
  5123648d916f497cd26e5e1e8ac4ebdf378264ca27ca8b22d12430dbcdd7d938
```

## Staged rollout status

Stage 6.2 validates the redesign as an **experimental release candidate**.

The approved architecture remains:

```text
EXPERIMENT
experiment/ui-ux-v2
→ experimental Vercel project lil-gwapz
→ preview only

PRODUCTION
main
→ lil-gwapz-production
→ lilgwapz.xyz / www.lilgwapz.xyz
→ frozen until explicit owner release approval
```

No automatic merge or deployment promotion is authorized by this PASS.

If the owner later explicitly approves production release, the release procedure must use the exact approved release commit, verify the production deployment reaches READY, smoke the apex and `www` aliases, and immediately abort/rollback if the post-release smoke fails.

## Read-only rollback checkpoint

The current production rollback checkpoint was verified without mutating production:

```text
production branch: main
production git SHA: 18ecef339170142d5fb0c29dd22a2c270a9f4039
Vercel project: lil-gwapz-production
Vercel project id: prj_NuIQlwig65fFPICFhQQ185Q6dDYq
production deployment: dpl_B9jfAaRcAq6L81UFSAQDydaZbEK5
state: READY
Vercel rollback candidate: true
```

Verified production aliases remain:

```text
lilgwapz.xyz
www.lilgwapz.xyz
```

The `www` surface continues to redirect to the apex as previously configured.

### Rollback rule for a future authorized release

If an explicitly authorized production release later fails its smoke gate:

1. stop further rollout activity;
2. restore the last known-good production deployment/commit represented by the checkpoint above;
3. verify `lilgwapz.xyz` and `www.lilgwapz.xyz` resolve to the restored release;
4. re-run core Home/Browse/download smoke checks;
5. record the rollback evidence before attempting another release.

This rollback plan is documented only. **No rollback was executed in Stage 6.2.**

## Final Stage 6.2 result

**PASS — RELEASE-READY IN THE EXPERIMENTAL PIPELINE.**

All 12 redesign stages are now technically cleared through QA.

Production is still unchanged and the redesign is **not live on the production domains**. Moving the release candidate to production requires a separate, explicit owner authorization.
