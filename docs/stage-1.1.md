# Stage 1.1 Report — Baseline, tokens, host, copy, and nav

Status: **FAIL — STOPPED BY TWO-ATTEMPT GATE RULE**

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10

Production (`main` and the production Vercel project/domain routing) was not changed.

## Owner-approved experiment exceptions

The owner clarified that this entire 12-stage run applies only to the experimental preview.

Therefore:

1. The inherited `#18e13a` accent may be corrected to the locked `#13dd13` **inside the experiment only**.
2. Production apex → `www` routing is not modified during Stage 1.1. The production redirect requirement is deferred until/if V2 is approved for release.

## Work completed in the isolated stage runner

The following Stage 1.1 implementation was prepared locally on `sprint-1-foundations` but **not committed**, because the stage gate did not complete:

- Created `css/tokens.css` with the required brand tokens.
- Linked `css/tokens.css` on all five HTML pages.
- Migrated the experimental green from `#18e13a` to `#13dd13`/`var(--gwap-green)`.
- Set canonical and `og:url` values on all pages to `https://www.lilgwapz.xyz/...`.
- Normalized desktop navigation to include `Explore`, `Browse 152`, `The pack`, and `Legal`.
- Linked `Legal` to `/ip-policy.html`.
- Changed the Browse CTA to `Download all 152 · Free`.
- Added `Free` to the landing-page pack metadata.

No partial implementation was pushed to GitHub after the gate stopped.

## Baseline evidence

### Sticker count

```text
152
```

Result: **PASS**

### Lighthouse mobile baseline

```text
{"page":"home","seo":1,"performance":0.77,"lcp":6913.9839999999995,"cls":0.02221872730905448,"totalBytes":2051250,"imageCount":9}
{"page":"browse","seo":1,"performance":0.57,"lcp":8286.0981,"cls":0.3976408934769722,"totalBytes":5601017,"imageCount":27}
{"page":"ip-policy","seo":1,"performance":0.95,"lcp":2867.31615,"cls":0,"totalBytes":349561,"imageCount":1}
```

Result: **PASS — baseline captured**

### Baseline screenshots

Captured successfully in the isolated runner:

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

Post-change screenshots were also captured successfully:

- `docs/stage-1.1/screenshots/home-375.png`
- `docs/stage-1.1/screenshots/home-768.png`
- `docs/stage-1.1/screenshots/home-1280.png`
- `docs/stage-1.1/screenshots/browse-375.png`
- `docs/stage-1.1/screenshots/browse-768.png`
- `docs/stage-1.1/screenshots/browse-1280.png`

The GitHub connector available in this run cannot directly transfer the sandbox's binary screenshots into the repository, so the report records their stage-runner paths rather than claiming they were committed.

## Gate evidence completed before stop

### Canonical and `og:url`

Prepared experimental output:

```text
browse.html PASS canonical=['https://www.lilgwapz.xyz/browse.html'] og=['https://www.lilgwapz.xyz/browse.html']
index.html PASS canonical=['https://www.lilgwapz.xyz/'] og=['https://www.lilgwapz.xyz/']
ip-policy.html PASS canonical=['https://www.lilgwapz.xyz/ip-policy.html'] og=['https://www.lilgwapz.xyz/ip-policy.html']
privacy.html PASS canonical=['https://www.lilgwapz.xyz/privacy.html'] og=['https://www.lilgwapz.xyz/privacy.html']
terms.html PASS canonical=['https://www.lilgwapz.xyz/terms.html'] og=['https://www.lilgwapz.xyz/terms.html']
```

Result: **PASS in prepared experiment workspace**

### Internal links

Command equivalent:

```sh
broken-link-checker http://127.0.0.1:8080 --recursive
```

Observed summary:

```text
Finished! 271 links found. 252 excluded. 0 broken.
```

Result: **PASS — zero broken internal links**

### Hard-coded required green

Command:

```sh
grep -ril "13dd13" --include=*.css --include=*.html . | grep -v tokens.css
```

Output:

```text
<empty>
```

Result: **PASS in prepared experiment workspace**

## Gate that stopped the stage

### Screenshot diff

The baseline and post-change screenshots were both captured. The pixel-diff checker itself failed twice:

Attempt 1:

```text
SyntaxError: Unexpected token '}'
```

Attempt 2:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/tmp/lilgwapz-tools/node_modules/sharp/lib/index.js'
```

Standing rule #2 says:

> After two failed attempts on the same check, stop and report.

Result: **FAIL — mandatory stop after second failed screenshot-diff attempt**

No third attempt was made.

## Gates not run after mandatory stop

- **NOT RUN / FAIL** — post-change Lighthouse SEO regression check.
- **DEFERRED BY OWNER SCOPE** — production `lilgwapz.xyz` → `www` redirect; production routing must remain untouched during the experiment.
- **NOT RUN / FAIL** — experimental Vercel preview verification for the prepared Stage 1.1 code, because the implementation was not committed after the stop.

## Stage result

Stage 1.1 is **not PASS**. Stage 1.2 must not start.

The measured baseline is preserved in `docs/baseline.md`, and this report records the exact gate failure. The next run should resume Stage 1.1 from the screenshot-diff gate with a corrected comparison tool, then complete the remaining SEO/preview gates before committing the implementation.
