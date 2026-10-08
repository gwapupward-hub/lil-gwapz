# Lil Gwapz — Reaction Pack 01 hub

Mobile-first static site for the standalone Lil Gwapz collection. It includes the selected Playground-style home page, a full 152-sticker gallery, searchable mood/character/color filters, individual transparent PNG downloads, and a client-generated ZIP download of the complete pack.

## Run locally

Serve this directory with any static web server, for example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Artwork and exports

`assets/stickers/` contains the 152 owner-approved 512 × 512 transparent Telegram PNG exports from Reaction Pack 01. The gallery retains their canonical filenames and `stickers.json` maps each image to its reaction ID, label, variant, emoji, colorway, and keywords. The bulk download builds an uncompressed ZIP in the browser so the repository only stores each image once.

The separately supplied GwapMojis archive is not used here.
