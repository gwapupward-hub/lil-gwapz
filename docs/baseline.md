# Stage 1.1 Baseline

Branch: `sprint-1-foundations`
Base: `experiment/ui-ux-v2`
Date: 2026-10-10

## Build and deployment findings

- Site type: static root-HTML site.
- Root pages found: `index.html`, `browse.html`, `ip-policy.html`, `privacy.html`, `terms.html`.
- `package.json`: not present.
- `vercel.json`: not present.
- `netlify.toml`: not present.
- Deployment: repository is connected to Vercel and served as a static project.

## Preflight checks completed before stop

### Sticker asset count

Command:

```sh
find assets/stickers -maxdepth 1 -type f -iname '*.png' | wc -l
```

Output:

```text
152
```

Result: PASS — expected 152 sticker PNGs and found 152.

### Live accent check

Relevant live CSS:

```css
:root{color-scheme:dark;--bg:#09080d;--surface:#14121b;--surface-2:#1c1925;--line:#302b39;--text:#fbf9ff;--muted:#aaa3b4;--green:#18e13a;--purple:#8d3cff;--orange:#ff9b21;--red:#ff3c58;...}
```

Result: FAIL — the live accent is `#18e13a`, not the required `#13dd13`.

Per Stage 1.1, this is an explicit stop condition. No UI/token/canonical changes were made.

### Canonical host preflight

Command:

```sh
curl -sI https://lilgwapz.xyz/
```

Observed first status line:

```text
HTTP/2 200
```

Expected by the stage: `301` or `308` redirect to `www`.

Result: FAIL — the apex currently serves `200` instead of redirecting to `https://www.lilgwapz.xyz/`.

## Baseline tasks not run

Lighthouse baselines and viewport screenshots were not run after the explicit accent-color stop condition was discovered. Continuing would violate the stage's `Stop if` rule.
