# Stage 1.1 Baseline

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10

## Build and deployment findings

- Site type: static root-HTML site.
- Root pages: `index.html`, `browse.html`, `ip-policy.html`, `privacy.html`, `terms.html`.
- `package.json`: not present.
- `vercel.json`: not present.
- `netlify.toml`: not present.
- Deployment model: repository-backed static Vercel project.
- Production remains out of scope for this experiment.

## Tooling

Installed outside the repository in the isolated Vercel runner:

```text
lighthouse 13.5.0
playwright 1.64.0
sharp 0.35.5
broken-link-checker 0.7.8
pixelmatch 8.0.0
pngjs 7.0.0
```

## Sticker asset count

```sh
find assets/stickers -maxdepth 1 -type f -iname '*.png' | wc -l
```

```text
152
```

Result: **PASS**.

## Original accent discovery

The experimental source inherited:

```css
--green:#18e13a;
```

The owner authorized normalizing the accent to `#13dd13` **inside the experimental preview only**. Production remains untouched.

## Production host behavior

```sh
curl -sI https://lilgwapz.xyz/
```

Previously observed:

```text
HTTP/2 200
```

The production apex → `www` redirect is explicitly deferred during this experimental run.

## Lighthouse mobile baseline — fresh resume run

Baseline source: `experiment/ui-ux-v2` served locally.

| Page | SEO | Performance | LCP | CLS | Transfer | Images |
|---|---:|---:|---:|---:|---:|---:|
| Home `/` | 1.00 | 0.77 | 6909.008 ms | 0.022219 | 2,051,250 B | 9 |
| Browse `/browse.html` | 1.00 | 0.57 | 8273.250 ms | 0.397641 | 5,601,017 B | 27 |
| IP policy `/ip-policy.html` | 1.00 | 0.96 | 2854.225 ms | 0 | 349,561 B | 1 |

## Baseline screenshots captured in the isolated runner

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

The binary screenshots were generated successfully in the isolated runner. The connected GitHub write interface used here supports text mutations but does not directly transfer these sandbox-generated binary files into the repository.