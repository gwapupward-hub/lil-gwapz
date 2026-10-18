# Haunted Gwapz 2026 — Hybrid Splash Launch Handoff

**PR #10 is a draft; do not merge before final approval.**

## What is implemented

- A full-screen seasonal homepage splash on `/index.html`, shown **once per browser session**.
- Static fallback reuses the approved `LG-HW26-M08` and `LG-HW26-F10` Halloween preview artwork.
- A muted, playsinline, non-looping video auto-plays when supported and its file is available; the overlay remains interactive throughout.
- Buttons: **Enter Halloween Edition**, **Add on Telegram** (the official published pack), and **Browse 152**.
- Fixed-position **Skip** button, Escape support, focus containment, background inertness, and scroll locking.
- Video errors/stalls or reduced-motion preferences fall back to approved static art automatically.
- Seasonal feature flag in `js/halloween-splash.js`, with automatic expiration after November 1, 2026.

## Only blocking asset: optimized uploaded MP4

The user uploaded the original 10-second vertical Halloween animation. A lightweight H.264 derivative was prepared and packaged as **Haunted_Gwapz_Splash_Video_Ready_For_GitHub.zip** (around 0.8 MB), made available in the ChatGPT conversation.

**Upload the ZIP contents, preserving the exact relative path:**

```
assets/halloween-2026/splash/haunted-gwapz-2026-splash.mp4
```

Target feature branch: `feat/haunted-gwapz-2026-seasonal-drop`.

Expected SHA-256:
```
b83c5262338328a1247c3f1884cdccd7ddd54d5ea30cafefbb68a8546212f92d
```

The script already requests this exact path. Do **not** rewrite the HTML/JS or substitute another generated video. The copy operation in `scripts/build-preview.cjs` recursively includes `assets/halloween-2026/` in the Vercel build.

If using Manus, upload the small optimized ZIP and request a **single binary file commit** to the existing feature branch. Do not merge or change other approved files.

## Release QA

1. Upload the MP4, then rerun `python3 scripts/verify_halloween_splash.py`.
2. Confirm the whole **Halloween 2026 Release Gate** is green (including the prior 20-sticker integrity gates).
3. Confirm Vercel preview is READY for the latest commit.
4. Owner reviews on iPhone, including video playback and silent fallback, Skip/Escape, and the three navigation destinations.
5. Confirm the original 152-sticker gallery, seasonal landing page, HD ZIP and Telegram pack links still work.
6. Ask for **explicit merge approval**; no automatic production release.

The static fallback is intended to keep the page usable even while the MP4 is missing. The release gate intentionally remains **red** until the optimized source is present.
