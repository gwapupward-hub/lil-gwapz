# Haunted Gwapz 2026 — release checklist

**STATUS: VERCEL PREVIEW READY · OWNER REVIEW PENDING · DO NOT MERGE UNTIL APPROVAL.**

Seasonal release for **Lil Gwapz**. It remains separate from GwapMojis and from core Reaction Pack 01 (76 × 2 = 152 stickers). This collection adds **20 seasonal stickers**: 10 male and 10 female, with independent `LG-HW26` IDs.

## Release channels

- **Telegram — PUBLISHED:** [Install the official Haunted Gwapz 2026 pack](https://t.me/addstickers/lil_gwapz_haunted2026_by_thalilgwapz_bot). The owner confirmed this as the live sticker-pack link on October 18, 2026.
- **Website — PREVIEW:** `https://lil-gwapz-ll8vda4eg-bigdaddygwaps-projects.vercel.app/halloween.html`. The preview may require Vercel authentication.
- **Website exclusive:** 20 original-resolution transparent PNGs (1254 × 1254). Download and individual artwork files are included in this branch.
- **Telegram ZIP:** Retained for archival/export purposes; the user-facing primary action is **Add stickers on Telegram**, not uploading the pack again.

## Verified implementation state

- 20 original PNG masters and 20 optimized WebP previews committed in `assets/halloween-2026/`
- Manifest with individual master hashes and published Telegram URL
- Halloween landing page, responsive styling, gallery/search/filter/dialog, and separate download archives
- Build allowlist updated to include Halloween page, assets, OG card, and downloads
- Existing Reaction Pack 01 assets and favicon preserved
- Local functional browser QA reported by the implementation agent, including the mobile dialog close-button fix; the owner still needs to check the protected Vercel preview personally

## Release gates to close before merge

1. GitHub Actions **Halloween 2026 Release Gate** passes on the latest PR commit; build script changes must trigger it.
2. Owner opens the Vercel preview on their iPhone and approves the design, all 20 cards, filter/search, and direct Telegram install link.
3. Owner tests the large HD ZIP download. If iOS downloading fails, provide smaller-part or optimized WebP options on the website.
4. Optional: add a promotional link to `index.html` only after preview approval. Keep original 152-sticker navigation intact.
5. Explicit owner approval required before merging PR #10 to main. Production must not be changed by this handoff.

## Safeguards

- Do not replace `assets/stickers/`, `data/stickers.json`, the core 152 images, or favicon files.
- Do not regenerate or alter approved Halloween artwork.
- Keep the exclusive high-resolution PNG edition separate from the Telegram edition.
- Respect the existing proprietary Lil Gwapz licensing terms.

**© 2026 Tha GwapSpot. All rights reserved.**
