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

Installed in the isolated Vercel stage runner, outside the repository:

```text
lighthouse 13.5.0
playwright 1.64.0
@axe-core/playwright 4.13.0
sharp 0.35.5
broken-link-checker 0.7.8
serve 14.2.6
```

## Sticker asset count

Command:

```sh
find assets/stickers -maxdepth 1 -type f -iname '*.png' | wc -l
```

Output:

```text
152
```

Result: **PASS** — expected 152 and found 152.

## Original accent discovery

The original experimental source inherited this token from the current site:

```css
--green:#18e13a;
```

The stage specification requires `#13dd13`. The owner explicitly authorized replacing the legacy accent **only in the experimental preview**. Production remains untouched.

## Original host behavior

Command:

```sh
curl -sI https://lilgwapz.xyz/
```

Observed:

```text
HTTP/2 200
```

The stage originally expected a 301/308 redirect to `www`. The owner explicitly restricted this run to the experimental preview, so production domain routing is not modified in this sprint.

## Lighthouse mobile baseline

Local test host: `http://127.0.0.1:8080`

| Page | SEO | Performance | LCP | CLS | Transfer | Images |
|---|---:|---:|---:|---:|---:|---:|
| Home `/` | 1.00 | 0.77 | 6913.984 ms | 0.022219 | 2,051,250 B | 9 |
| Browse `/browse.html` | 1.00 | 0.57 | 8286.098 ms | 0.397641 | 5,601,017 B | 27 |
| IP policy `/ip-policy.html` | 1.00 | 0.95 | 2867.316 ms | 0 | 349,561 B | 1 |

## Baseline screenshots captured in the isolated runner

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

The binary screenshots were generated successfully in the stage runner. They were not committed because the connected GitHub write interface for this run supports text mutations but not direct binary-file transfer from the Vercel sandbox.
