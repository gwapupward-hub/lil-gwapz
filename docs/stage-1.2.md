# Stage 1.2 Report — Image pipeline, sticker pages, and analytics stub

Status: **PASS — EXPERIMENTAL PREVIEW ONLY**

Branch: `sprint-1-foundations`
Previous stage report: `docs/stage-1.1.md` — PASS
Date: 2026-10-10

Production (`main`, `lil-gwapz-production`, `lilgwapz.xyz`, and `www.lilgwapz.xyz`) was not changed.

## Approved scope amendment

The original Stage 1.2 scope was:

```text
stickers/
thumbs/
s/
og/
data/
js/track.js
scripts/
sitemap.xml
robots.txt
docs/
```

The owner explicitly approved adding:

```text
app.js
stickers.json
```

This amendment was required because the existing Browse runtime lived in root `app.js` and consumed root `stickers.json`.

Implementation note: root `app.js` was changed. Root `stickers.json` was intentionally left unchanged and remains the immutable 152-record source metadata input to the deterministic generator.

Result: **PASS — implementation stayed within amended scope.**

## Canonical mood architecture

The supplied locked asset manifest and Telegram import metadata were used as the authoritative asset source. The approved five-family taxonomy is:

- `happy` → Happy
- `attitude` → Attitude when both characters are shown
  - male display label: **Swagger**
  - female display label: **Sassy**
- `chill` → Chill
- `hype` → Hype
- `love` → Love

`data/mood-map.csv` contains one canonical entry for each of the 76 reactions. Both male and female variants inherit the reaction family.

```text
happy:    16 reactions
attitude: 19 reactions
chill:    16 reactions
hype:     13 reactions
love:     12 reactions
TOTAL:    76 reactions
```

The earlier `data/stickers-missing.csv` is retained as historical evidence of the original missing-mood stop condition; that blocker is now resolved.

Result: **PASS**.

## Runtime correction

Root `app.js` now:

- fetches canonical `data/stickers.json`,
- uses explicit mood metadata instead of heuristic classification,
- uses internal `attitude` with gender-aware display labels,
- normalizes legacy `?mood=sassy` and `?mood=swagger` URLs to `attitude`,
- renders Browse and home preview cards with generated 256×256 WebP thumbnails,
- retains full same-origin PNGs for dialog and download surfaces,
- emits the allowed analytics events through the no-provider stub.

The old `moodTerms` / runtime guessing classifier is gone.

Result: **PASS**.

## Deterministic derivative pipeline

Generated derivatives are reproducible from the locked originals instead of being committed as hundreds of generated binaries.

Stored source pipeline:

```text
scripts/build-stage-1.2.cjs
scripts/build-preview.cjs
```

The experimental Vercel project runs:

```text
install: npm install sharp@0.35.5 --no-save
build:   node scripts/build-preview.cjs
output:  dist
```

The generator reads the immutable root `stickers.json` plus `data/mood-map.csv`, then produces the deployment artifacts.

Local reproducibility evidence:

```text
built 25/152
built 50/152
built 75/152
built 100/152
built 125/152
built 150/152
built 152/152
complete { stickers: 152, urls: 157 }
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
PASS root stickers.json unchanged
```

The `og: 153` deployment count includes 152 sticker-specific OG images plus the existing general Lil Gwapz share image.

Result: **PASS**.

## Artifact count and metadata gates

```text
stickers 152
thumbs 152
pages 152
og 152

rows 152 unique_slugs 152 moods attitude,chill,happy,hype,love
slug PASS
name PASS
mood PASS
gender PASS
colorway PASS
thumb PASS
full PASS
missing_artifacts 0
```

Result: **PASS**.

## Image dimension and alpha gates

```text
png_512_alpha_bad 0
thumb_256_webp_alpha_bad 0
og_1200x630_jpeg_bad 0
```

Therefore:

- all 152 full PNGs are 512×512 with alpha,
- all 152 thumbnails are 256×256 transparent WebP,
- all 152 sticker OG assets are 1200×630 JPEG.

Source PNGs were not modified.

Result: **PASS**.

## Browse transfer-size gate

Stage 1.1 Browse baseline:

```text
5,601,017 bytes
```

A conservative upper-bound Stage 1.2 calculation intentionally counted **all 152 thumbnails**, plus Browse HTML/JS/JSON/CSS and the logo. A real lazy-loaded viewport requests fewer thumbnails, so this is stricter than the normal initial browser payload.

```text
all_152_thumb_bytes=2118008
browse_base_bytes=123923
logo_bytes=330149
conservative_total_bytes=2572080
baseline_bytes 5601017
conservative_reduction_pct 54.08
passes_50pct True
```

Required reduction: >=50%.
Observed conservative reduction: **54.08%**.

Result: **PASS**.

### Browser-runner note

Playwright 1.64.0 was installed in the isolated Vercel sandbox, but its bundled Chromium could not launch because the sandbox image lacked required NSS/X11/GBM/audio system libraries and did not provide a package manager for installing them. An attempt to provision a Playwright-ready custom sandbox image was also unsupported by the available sandbox API.

No browser PASS is claimed from that unavailable runner. Stage 1.2's transfer requirement was instead satisfied with the stricter all-152-thumbnail byte upper bound above, and deployed HTTP smoke tests were run against the actual Vercel Preview.

## Same-origin PNG gate

Canonical generated metadata uses paths such as:

```text
/stickers/LG-R01-020-M-PUR-v01-TELEGRAM-512.png
```

Local validation:

```text
same_origin_png_bad 0
```

Deployed sticker pages also render relative same-origin download paths.

Result: **PASS**.

## Sticker page / OG HTTP gate

Ten distributed sticker records and their OG assets were checked locally. Every checked route returned HTTP 200:

```text
s/big-smile-male.html 200
og/big-smile-male.jpg 200
s/big-hug-female.html 200
og/big-hug-female.jpg 200
s/thank-you-male.html 200
og/thank-you-male.jpg 200
s/fake-shock-female.html 200
og/fake-shock-female.jpg 200
s/shades-on-male.html 200
og/shades-on-male.jpg 200
s/wait-what-female.html 200
og/wait-what-female.jpg 200
s/real-tears-male.html 200
og/real-tears-male.jpg 200
s/i-m-done-female.html 200
og/i-m-done-female.jpg 200
s/victory-male.html 200
og/victory-male.jpg 200
s/good-night-female.html 200
og/good-night-female.jpg 200
```

Result: **PASS**.

## Sitemap / robots gate

```text
urls 157 sticker_urls 152 unique 157
robots User-agent: * | Allow: / | Sitemap: https://www.lilgwapz.xyz/sitemap.xml
```

Result: **PASS**.

## Analytics stub gate

`js/track.js` permits exactly:

```text
sticker_open
filter_change
download_single
download_pack
copy_link
share
share_cancel
```

and forwards only to:

```js
window.gwapAnalytics?.(event, payload)
```

Source inspection found no `fetch`, `XMLHttpRequest`, `sendBeacon`, tracking image, or provider URL in the stub.

Result: **PASS — no analytics network provider is configured.**

## Experimental Vercel Preview gate

Validated code commit:

```text
d55321848f57c8247b00cc8c117fff83977f06ff
```

Deployment:

```text
dpl_GcmRrY3e1Sfeibzfw2aNL1DHE5jh
https://lil-gwapz-9buc4wdnv-bigdaddygwaps-projects.vercel.app
```

Vercel build evidence:

```text
Cloning github.com/gwapupward-hub/lil-gwapz (Branch: sprint-1-foundations, Commit: d553218)
Running "install" command: `npm install sharp@0.35.5 --no-save`...
added 6 packages in 2s
built 25/152
built 50/152
built 75/152
built 100/152
built 125/152
built 150/152
built 152/152
complete { stickers: 152, urls: 157 }
dist ready { stickers: 152, thumbs: 152, pages: 152, og: 153 }
Build Completed in /vercel/output [25s]
Deployment completed
```

Deployment state: **READY**.

Result: **PASS**.

## Deployed smoke verification

The protected experimental Preview was fetched through Vercel's temporary authenticated preview access.

Confirmed:

- `/browse.html` → 200
- `/data/stickers.json` → 200
- `/s/say-less-male.html` → 200
  - canonical: `https://www.lilgwapz.xyz/s/say-less-male.html`
  - mood display: **Swagger**
  - same-origin male PNG download
- `/s/say-less-female.html` → 200
  - canonical: `https://www.lilgwapz.xyz/s/say-less-female.html`
  - mood display: **Sassy**
  - same-origin female PNG download

The deployed canonical data also preserves source revision differences; for example, `Exhausted` remains male v01 and female v02.

Preview responses contain Vercel's own Preview Comments / feedback script injection. That script is platform preview chrome, not repository application source and is not present in the Stage 1.2 analytics stub.

Result: **PASS**.

## Gate summary

| Gate | Result |
|---|---|
| 152 canonical metadata rows / unique slugs | PASS |
| 152 full PNGs, 512×512 + alpha | PASS |
| 152 WebP thumbs, 256×256 + alpha | PASS |
| 152 sticker pages | PASS |
| 152 sticker OG JPGs, 1200×630 | PASS |
| Browse transfer >=50% below baseline | PASS — 54.08% conservative reduction |
| Ten distributed sticker + OG HTTP checks | PASS |
| Sitemap has exactly 152 sticker URLs | PASS |
| Same-origin full PNG downloads | PASS |
| Analytics stub has no network provider | PASS |
| Gender-aware Attitude / Swagger / Sassy | PASS |
| Experimental Vercel build from exact commit | PASS — READY |
| Production isolation | PASS |

## Stage result

Stage 1.2 is **PASS**.

Sprint 1 Foundations now has Stage 1.1 and Stage 1.2 passing on the experimental path. No production promotion, production-domain reassignment, or `main` merge was performed.

Stage 2.1 may begin only after this report is committed.