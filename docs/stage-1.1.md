# Stage 1.1 Report — Baseline, tokens, host, copy, and nav

Status: **FAIL — STOP CONDITION TRIGGERED**

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10

No production branch or production files were changed.

## Stop condition

Stage 1.1 requires the live accent to already be `#13dd13` and says to stop if it differs.

Actual live CSS:

```css
--green:#18e13a;
```

Required:

```text
#13dd13
```

Result: **FAIL**

Because this is an explicit stop condition, Stage 1.1 was halted before UI, token, canonical, navigation, or copy changes.

## Evidence

### Sticker count

```sh
find assets/stickers -maxdepth 1 -type f -iname '*.png' | wc -l
```

```text
152
```

Result: **PASS**

### Build/deployment inspection

```text
Root HTML:
browse.html
index.html
ip-policy.html
privacy.html
terms.html

package.json: not present
vercel.json: not present
netlify.toml: not present
```

Result: **PASS — static root-HTML deployment identified**

### Accent inspection

Representative color scan:

```text
6 #09080d
2 #18e13a
...
```

Relevant root token:

```css
:root{...--green:#18e13a;...}
```

Result: **FAIL — stop condition**

### Host check

```sh
curl -sI https://lilgwapz.xyz/
```

```text
HTTP/2 200
```

Expected: `301` or `308` to `https://www.lilgwapz.xyz/`.

Result: **FAIL**

## Gate

- **FAIL** — Every page canonical and `og:url` starts with `https://www.lilgwapz.xyz/`. Current pages still use the apex host because changes were not permitted after the stop condition.
- **FAIL** — `curl -sI https://lilgwapz.xyz/` returns 301 or 308 to `www`. Actual result: `HTTP/2 200`.
- **FAIL** — Lighthouse SEO score is at or above baseline on all three pages. Not run after stop condition.
- **FAIL** — `broken-link-checker` reports zero broken internal links. Not run after stop condition.
- **FAIL** — Screenshot diff shows only nav label and Free text changed. No changes made; screenshot baseline task was halted after stop condition.
- **FAIL** — hard-coded `13dd13` check is not meaningful because `tokens.css` was not created; the live accent mismatch stopped the stage first.

## Screenshots

None generated after the stop condition.

## Files changed in this stage

- `docs/baseline.md`
- `docs/stage-1.1.md`

No HTML or CSS files were changed.

## Required owner decision

Confirm whether Stage 1.1 should intentionally replace the current `#18e13a` live accent with the locked brand green `#13dd13`, overriding the stage's original stop condition. The canonical-host redirect also requires deployment/domain configuration beyond the listed HTML/CSS/docs file scope.
