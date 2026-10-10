# Stage 1.2 Report — Image pipeline, sticker pages, and analytics stub

Status: **STOPPED — MOOD INPUT RESOLVED; REPOSITORY SCOPE CONFLICT FOUND**

Branch: `sprint-1-foundations`
Previous stage report: `docs/stage-1.1.md` — PASS
Date: 2026-10-10

Production was not changed.

## Mood input — RESOLVED

The owner supplied the locked asset manifest and Telegram import metadata, then authorized continuing with the revised five-family taxonomy:

- `happy` → Happy
- `attitude` → Attitude when both characters are shown
  - male display label: **Swagger**
  - female display label: **Sassy**
- `chill` → Chill
- `hype` → Hype
- `love` → Love

`data/mood-map.csv` now contains one canonical entry for each of the 76 reactions. Both male and female sticker variants inherit the reaction's internal mood family.

Mood-map counts:

```text
happy:    16 reactions
attitude: 19 reactions
chill:    16 reactions
hype:     13 reactions
love:     12 reactions
TOTAL:    76 reactions
```

The mapping is derived from the locked reaction name, emoji and keywords in the supplied manifest. It does not alter any source image, revision, checksum or Telegram derivative.

The earlier `data/stickers-missing.csv` remains as historical evidence of the original Stage 1.2 stop condition; its missing mood field is now resolved by `data/mood-map.csv`.

## New scope conflict — MANDATORY STOP

Standing Section 0 rule #1 says:

> Change only stage Scope files; if another file must change, stop/report.

Stage 1.2 scope is limited to:

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

However, the current application architecture still renders Browse through the root `app.js` and root `stickers.json` files, both outside Stage 1.2 scope.

Current `app.js` behavior includes:

```js
const moodNames = ['All moods','Happy','Sassy','Chill','Hype','Much love'];
```

It also derives moods heuristically at runtime instead of reading the canonical map:

```js
const category = (s) => {
  const haystack = `${s.name} ${s.keywords.join(' ')}`.toLowerCase();
  for (const key of ['love','sassy','chill','hype','happy'])
    if (moodTerms[key].some(term => haystack.includes(term))) return key;
  return 'happy';
};
```

And Browse currently loads full 512×512 PNGs from the root asset directory:

```js
const filenamePath = (s) => asset(`assets/stickers/${encodeURIComponent(s.filename)}`);
...
stickers = await (await fetch(asset('stickers.json'))).json();
```

Therefore two required Stage 1.2 outcomes cannot be made effective without changing out-of-scope root files:

1. **The new `attitude` taxonomy cannot replace the old all-gender `sassy` runtime filter** without changing `app.js` or replacing the runtime architecture.
2. **The Browse transfer-size gate cannot achieve the required >=50% reduction** merely by generating `thumbs/`; the existing Browse renderer will continue requesting full PNGs until the runtime data/render path is changed.

Changing `app.js`, root `stickers.json`, or `browse.html` would violate the declared Stage 1.2 scope.

Result: **STOP — scope conflict found before image-generation work.**

## Completed in this resume

- Supplied `MANIFEST.csv` reviewed as the locked asset ledger.
- Supplied Telegram import metadata reviewed.
- 76 unique reactions verified against 152 locked male/female variants.
- Canonical five-family mood architecture established.
- `data/mood-map.csv` committed.
- `attitude` gender display rule encoded as `Swagger` / `Sassy`.
- Existing root runtime inspected and scope conflict confirmed.

## Tasks intentionally not performed after the scope stop

- `data/stickers.json` was not generated yet.
- No 256×256 WebP thumbnails were generated.
- No `/s/<slug>.html` pages were generated.
- No 1200×630 OG JPGs were generated.
- `js/track.js` was not created.
- `sitemap.xml` and `robots.txt` were not changed.
- Root `app.js`, root `stickers.json`, and `browse.html` were **not changed**.
- No Stage 1.2 transfer-size gate was run because the current renderer cannot consume the generated thumbnails within declared scope.
- Stage 2.1 was not started.

## Required stage-plan correction

The clean correction is to expand Stage 1.2 scope to include:

```text
app.js
stickers.json
```

This allows Stage 1.2 to:

1. replace heuristic mood classification with the canonical `data/mood-map.csv` data,
2. expose `attitude` internally while rendering Swagger/Sassy by gender,
3. switch Browse image requests from full PNGs to generated 256×256 WebP thumbnails,
4. retain full same-origin PNGs for dialog/download use,
5. run the required Browse transfer-reduction gate honestly.

`browse.html` does not need to be added if the existing DOM contract remains sufficient.

No scope expansion has been performed automatically.

## Stage result

Stage 1.2 remains **STOPPED**, but the original missing-mood blocker is resolved.

The only current blocker is the Stage 1.2 file-scope mismatch between the written plan and the existing repository architecture.

Production remains untouched.
