# Haunted Gwapz 2026 — staged release handoff

**STATUS: BLOCKED UNTIL BINARY ASSET IMPORT + PREVIEW QA. DO NOT MERGE THIS DRAFT PR YET.**

Seasonal addition to **Lil Gwapz**, separate from GwapMojis and separate from the original Reaction Pack 01. The core collection remains **76 reactions × 2 = 152 stickers**. Halloween adds **20 seasonal designs (10 male, 10 female)** with LG-HW26 IDs; it does not renumber or overwrite existing core assets.

## Import supplied website kit

The owner received **Lil_Gwapz_Halloween_2026_Website_Deploy_Kit.zip** as a ChatGPT deliverable. It includes the page, styles, JS, 20 transparent masters, 20 WebP previews, manifest, two downloadable ZIPs, and Open Graph artwork. The GitHub connector used for this handoff supports writing text but cannot transfer the local binary package.

1. On an owner-controlled checkout of this feature branch, download the kit from the original ChatGPT conversation.
2. Run:
   \`\`\`sh
   python3 scripts/import_halloween_2026.py /path/to/Lil_Gwapz_Halloween_2026_Website_Deploy_Kit.zip
   python3 scripts/verify_halloween_assets.py
   node --check halloween.js
   \`\`\`
3. Add only the resulting seasonal files, then commit and push to this branch.
4. Confirm the GitHub Action **Halloween 2026 Release Gate** passes.
5. Inspect the **Vercel preview** of /halloween.html on mobile and desktop. Test all 20 cards, character filters, search, dialog, original PNG download, both ZIP downloads, and OG share card.
6. Optionally link the seasonal page from index.html only after the preview passes.
7. **Require explicit owner approval before merging to main/production.**

## Protection rules
- Never replace files in assets/stickers or data/stickers.json.
- Never claim the @Stickers Telegram pack has been published; the provided ZIP is an upload package only.
- Keep the master artwork and the downloadable exclusive edition unchanged.
- Honor the existing Lil Gwapz personal-use license and commercial licensing restrictions.

## Release gates
- Exactly 20 LG-HW26 sticker IDs, 10 male and 10 female
- Every manifest master SHA-256 matches the provided original PNG
- Every preview and the 2 ZIP files exist and can be opened
- No broken images or links in preview
- Existing 152 core gallery and favicon unchanged
- Explicit owner review of finished preview before production

**© 2026 Tha GwapSpot. All rights reserved.**
