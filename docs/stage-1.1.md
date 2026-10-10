# Stage 1.1 Report — Baseline, tokens, host, copy, and nav

Status: **FAIL — STOPPED BY TWO-ATTEMPT SCREENSHOT GATE RULE**

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10
Previous report path: `docs/stage-1.1.md`

Production (`main`, the production Vercel project, and production domain routing) was not changed.

## Experimental-only owner scope

The owner confirmed that this entire 12-stage run applies only to the experimental preview.

Therefore:

1. The inherited `#18e13a` accent may be normalized to `#13dd13` inside the experiment only.
2. Production apex → `www` routing is deferred until/if the experimental version is approved for release.
3. Stage 1.1 implementation remains isolated from production.

## Scope enforcement

Stage 1.1 permits only `*.html`, `css/`, and `docs/`.

The fresh resume run intentionally did **not** modify root `styles.css` or root `legal.css`.

Prepared working-tree status:

```text
 M browse.html
 M index.html
 M ip-policy.html
 M privacy.html
 M terms.html
?? css/
?? docs/baseline/
```

Disallowed changed-path check returned no paths.

Result: **PASS — scope clean**.

## Prepared Stage 1.1 implementation

Prepared locally in the isolated runner but **not committed**, because the gate did not pass:

- `css/tokens.css` created with:
  - `--gwap-green: #13dd13`
  - `--gwap-green-glow: rgba(19, 221, 19, .35)`
  - `--bg: #09080d`
  - `--ink: #ffffff`
  - `--ink-muted: #aaa3b4`
  - `--surface: #14121b`
  - `--focus: #13dd13`
- The token sheet is linked after `styles.css` on all five HTML pages so the experiment can override legacy variables without editing out-of-scope root CSS.
- Canonical and `og:url` values prepared as `https://www.lilgwapz.xyz/...` on every page.
- Desktop nav normalized to `Explore`, `Browse 152`, `The pack`, `Legal`.
- `Legal` links to `/ip-policy.html`.
- Browse CTA prepared as `Download all 152 · Free`.
- Landing pack metadata prepared with `Free`.

Computed browser evidence for the prepared experiment:

```text
COMPUTED_ACCENT {"green":"rgb(19, 221, 19)","rootGreen":"#13dd13"}
```

Result: **PASS — experiment resolves the brand accent to #13DD13**.

## Baseline evidence

### Sticker count

```text
152
```

Result: **PASS**.

### Lighthouse mobile baseline — fresh run

```text
{"page":"home","seo":1,"performance":0.77,"lcp":6909.0082,"cls":0.02221872730905448,"totalBytes":2051250,"imageCount":9}
{"page":"browse","seo":1,"performance":0.57,"lcp":8273.25045,"cls":0.3976408934769722,"totalBytes":5601017,"imageCount":27}
{"page":"ip-policy","seo":1,"performance":0.96,"lcp":2854.2252,"cls":0,"totalBytes":349561,"imageCount":1}
```

Result: **PASS — baseline captured**.

### Baseline screenshots

Captured successfully:

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

Post-change screenshots were also captured at the same six page/viewport combinations under `docs/stage-1.1/screenshots/` in the isolated runner.

## Canonical / OG check

Prepared output:

```text
browse.html -> https://www.lilgwapz.xyz/browse.html
index.html -> https://www.lilgwapz.xyz/
ip-policy.html -> https://www.lilgwapz.xyz/ip-policy.html
privacy.html -> https://www.lilgwapz.xyz/privacy.html
terms.html -> https://www.lilgwapz.xyz/terms.html
```

Each page had exactly one canonical and one `og:url` with the required `https://www.lilgwapz.xyz/` prefix.

Result: **PASS in prepared experiment workspace**.

## Hard-coded required green gate

```sh
grep -ril "13dd13" --include=*.css --include=*.html . | grep -v tokens.css
```

Output:

```text
<empty>
```

Result: **PASS in prepared experiment workspace**.

## Screenshot-diff gate — attempt 1

The corrected diff runner executed successfully. Results:

```text
home-375 PASS changed=27158/1017000 pct=2.670 bbox=18,14-356,1927
browse-375 PASS changed=27884/7123500 pct=0.391 bbox=10,14-356,18671
home-768 PASS changed=34147/1650432 pct=2.069 bbox=42,18-729,1608
browse-768 FAIL dimensions 768x15060 -> 768x15074
home-1280 PASS changed=38267/2657280 pct=1.440 bbox=111,18-1215,1536
browse-1280 FAIL dimensions 1280x12267 -> 1280x12280
```

Diagnosis showed the required `· Free` copy wrapped the Browse button from 48 px to 63 px tall at 768 and 1280, accounting for the page-height increase.

Result: **FAIL**.

## Screenshot-diff gate — attempt 2

The Browse button was changed in-scope to keep the required copy on one line, then the screenshots and diff were regenerated.

```text
home-375 PASS changed=27158/1017000 pct=2.670 bbox=18,14-356,1927
browse-375 PASS changed=27884/7123500 pct=0.391 bbox=10,14-356,18671
home-768 PASS changed=34147/1650432 pct=2.069 bbox=42,18-729,1608
browse-768 FAIL dimensions 768x15060 -> 768x15043
home-1280 PASS changed=38267/2657280 pct=1.440 bbox=111,18-1215,1536
browse-1280 PASS changed=26967/15701760 pct=0.172 bbox=60,18-1215,12005
```

Geometry evidence:

```text
768 baseline { height: 15060, button: { w: 105.546875, h: 48 } }
768 after    { height: 15043, button: { w: 191.390625, h: 48 } }
1280 baseline { height: 12267, button: { w: 105.546875, h: 48 } }
1280 after    { height: 12267, button: { w: 191.390625, h: 48 } }
```

At 1280, page geometry is restored. At 768, the page remains 17 px shorter than baseline, so the visual gate still does not pass.

Result: **FAIL — second attempt**.

## Mandatory stop

Standing rule #2 requires stopping after two failed attempts on the same check.

Therefore:

- **NOT RUN** — post-change Lighthouse SEO regression gate.
- **NOT RUN** — fresh broken-link gate after the second visual attempt.
- **DEFERRED BY OWNER SCOPE** — production `lilgwapz.xyz` → `www` redirect.
- **NOT RUN** — experimental Vercel Preview deployment for Stage 1.1 implementation.
- **NOT COMMITTED** — prepared Stage 1.1 HTML/token implementation.
- **NOT STARTED** — Stage 1.2.

## Stage result

Stage 1.1 remains **FAIL / STOPPED**.

Only documentation evidence was committed to `sprint-1-foundations`. The next execution must start from this report and address the remaining 768 px Browse visual-height mismatch without exceeding the declared Stage 1.1 scope, then run the remaining gates before the implementation may be committed.