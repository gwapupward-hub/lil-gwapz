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
- Experimental Vercel project: `lil-gwapz` (`prj_cXCW1emalg3eDXTUatVKjGlQkOE3`).
- Production remains out of scope for this experiment.

## Tooling

Installed outside the repository in the isolated Vercel runner:

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

The experimental source inherited:

```css
--green:#18e13a;
```

The stage specification requires `#13dd13`. The owner explicitly authorized normalizing this legacy accent **inside the experimental preview only**. Production remains untouched.

## Production host behavior / experiment exception

The production apex had previously returned:

```text
HTTP/2 200
```

The original Stage 1.1 gate expected a 301/308 redirect from `lilgwapz.xyz` to `www`. The owner explicitly restricted this entire run to the experimental preview, so production domain routing is not modified here. That production redirect is deferred until/if the experimental version is approved for release.

## Lighthouse mobile baseline

Baseline source: clean `experiment/ui-ux-v2` checkout served locally.

| Page | SEO | Performance | LCP | CLS | Transfer | Images |
|---|---:|---:|---:|---:|---:|---:|
| Home `/` | 1.00 | 0.77 | 6909.008 ms | 0.022219 | 2,051,250 B | 9 |
| Browse `/browse.html` | 1.00 | 0.57 | 8273.250 ms | 0.397641 | 5,601,017 B | 27 |
| IP policy `/ip-policy.html` | 1.00 | 0.96 | 2854.225 ms | 0 | 349,561 B | 1 |

## Baseline screenshots

Generated in the isolated stage runner:

- `docs/baseline/home-375.png`
- `docs/baseline/home-768.png`
- `docs/baseline/home-1280.png`
- `docs/baseline/browse-375.png`
- `docs/baseline/browse-768.png`
- `docs/baseline/browse-1280.png`

The connected GitHub write interface used for this run supports text mutations but does not directly transfer the sandbox-generated screenshot binaries into the repository. The screenshots were generated and used for the visual gate; their paths are preserved in the stage report.
