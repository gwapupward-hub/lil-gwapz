const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const ensure = (p) => fs.mkdirSync(path.join(root, p), { recursive: true });
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const source = JSON.parse(read('stickers.json'));
const moodRows = parseCSV(read('data/mood-map.csv'));
const moodById = new Map(moodRows.map((r) => [r.reaction_id, r]));
const colorNames = { GRN:'green', ORG:'orange', RED:'red', PUR:'purple' };

if (source.length !== 152) throw new Error(`Expected 152 source stickers, got ${source.length}`);
if (moodRows.length !== 76) throw new Error(`Expected 76 mood-map rows, got ${moodRows.length}`);

const items = source.map((s) => {
  const m = moodById.get(s.id);
  if (!m) throw new Error(`Missing mood for ${s.id}`);
  const gender = s.sex === 'M' ? 'male' : 'female';
  const colorway = colorNames[s.color];
  if (!colorway) throw new Error(`Missing colorway for ${s.filename}`);
  const slug = `${slugify(s.name)}-${gender}`;
  return {
    id: s.id,
    name: s.name,
    slug,
    mood: m.mood,
    moodLabel: m.mood === 'attitude' ? (gender === 'male' ? 'Swagger' : 'Sassy') : m.all_label,
    allMoodLabel: m.all_label,
    gender,
    sex: s.sex,
    colorway,
    color: s.color,
    thumb: `/thumbs/${slug}.webp`,
    full: `/stickers/${s.filename}`,
    og: `/og/${slug}.jpg`,
    filename: s.filename,
    emoji: s.emoji,
    keywords: s.keywords,
    width: 512,
    height: 512
  };
});

if (new Set(items.map((x) => x.slug)).size !== 152) throw new Error('Sticker slugs are not unique');
for (const dir of ['stickers','thumbs','s','og','data','js','scripts']) ensure(dir);
fs.writeFileSync(path.join(root, 'data/stickers.json'), JSON.stringify(items, null, 2) + '\n');

const canonicalBase = 'https://www.lilgwapz.xyz';

function stickerPage(s) {
  const title = `${s.name} — ${s.gender[0].toUpperCase() + s.gender.slice(1)} Lil Gwapz`;
  const desc = `Download the ${s.name} ${s.gender} Lil Gwapz reaction sticker as a transparent 512×512 PNG.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#09080d">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonicalBase}/s/${s.slug}.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lil Gwapz">
<meta property="og:url" content="${canonicalBase}/s/${s.slug}.html">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${canonicalBase}${s.og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../css/tokens.css">
<style>body{background:#09080d;color:#fff}.sticker-page{min-height:100vh;display:grid;grid-template-rows:auto 1fr auto}.sticker-detail{width:min(960px,calc(100% - 32px));margin:0 auto;padding:48px 0 64px;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:48px;align-items:center}.sticker-detail-art{background:#14121b;border-radius:28px;padding:28px;display:grid;place-items:center}.sticker-detail-art img{width:min(100%,512px);height:auto}.sticker-detail-copy h1{font-size:clamp(2.4rem,7vw,5rem);line-height:.95;margin:.25em 0}.sticker-detail-copy p{color:#aaa3b4}.sticker-meta{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0}.sticker-meta span{border:1px solid #35313f;border-radius:999px;padding:8px 12px}.sticker-actions{display:flex;gap:12px;flex-wrap:wrap}.sticker-actions a{min-height:48px;display:inline-flex;align-items:center;justify-content:center}.back-link{color:#fff}@media(max-width:720px){.sticker-detail{grid-template-columns:1fr;padding-top:24px;gap:28px}}</style>
<script defer src="../js/track.js"></script>
</head>
<body class="sticker-page">
<header class="site-header"><a class="wordmark" href="../" aria-label="Lil Gwapz home"><img src="../assets/brand/lil-gwapz-logo-v2.png" width="672" height="448" alt="Lil Gwapz"></a><nav class="desktop-nav" aria-label="Main navigation"><a href="../">Explore</a><a href="../browse.html">Browse 152</a><a href="../#pack">The pack</a><a href="../ip-policy.html">Legal</a></nav><a class="header-cta" href="../browse.html">Browse all</a></header>
<main class="sticker-detail"><div class="sticker-detail-art"><img src="..${s.full}" width="512" height="512" alt="${esc(s.name)}, ${s.gender} Lil Gwapz"></div><div class="sticker-detail-copy"><a class="back-link" href="../browse.html">← Back to Browse</a><p class="eyebrow">${esc(s.id)} · ${esc(s.moodLabel)}</p><h1>${esc(s.emoji)} ${esc(s.name)}</h1><p>${s.gender[0].toUpperCase() + s.gender.slice(1)} Lil Gwapz · ${s.colorway[0].toUpperCase() + s.colorway.slice(1)} · transparent PNG.</p><div class="sticker-meta"><span>512 × 512</span><span>${esc(s.moodLabel)}</span><span>${esc(s.colorway)}</span></div><div class="sticker-actions"><a class="button button-primary" href="..${s.full}" download data-track-download>Download PNG</a><a class="button button-outline" href="../browse.html">Browse 152</a></div></div></main>
<footer class="site-footer"><a class="wordmark" href="../"><img src="../assets/brand/lil-gwapz-logo-v2.png" width="672" height="448" alt="Lil Gwapz"></a><div><p>© 2026 Tha GwapSpot. Lil Gwapz · All rights reserved.</p><div class="footer-links"><a href="../terms.html">Terms</a><a href="../ip-policy.html">IP Policy</a><a href="../privacy.html">Privacy</a></div></div><a href="https://gwapspot.com" rel="noreferrer">A Tha GwapSpot creation</a></footer>
<script>document.querySelector('[data-track-download]')?.addEventListener('click',()=>window.gwapTrack?.('download_single',{slug:${JSON.stringify(s.slug)}}));</script>
</body></html>\n`;
}

async function build() {
  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    const src = path.join(root, 'assets/stickers', s.filename);
    if (!fs.existsSync(src)) throw new Error(`Missing source ${src}`);
    fs.copyFileSync(src, path.join(root, 'stickers', s.filename));
    await sharp(src).resize(256, 256, { fit:'contain' }).webp({ quality:80, alphaQuality:100 }).toFile(path.join(root, 'thumbs', `${s.slug}.webp`));
    const sticker = await sharp(src).resize(330, 330, { fit:'contain' }).png().toBuffer();
    const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#09080d"/><text x="60" y="74" fill="#13dd13" font-family="Arial,sans-serif" font-size="28" font-weight="700">LIL GWAPZ · REACTION PACK 01</text><text x="600" y="500" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="54" font-weight="800">${esc(s.name)}</text><text x="600" y="548" text-anchor="middle" fill="#aaa3b4" font-family="Arial,sans-serif" font-size="24">${esc(s.gender[0].toUpperCase() + s.gender.slice(1))} · ${esc(s.moodLabel)} · ${esc(s.colorway)}</text></svg>`);
    await sharp({ create:{ width:1200, height:630, channels:3, background:'#09080d' } }).composite([{ input:sticker, left:435, top:105 }, { input:svg, left:0, top:0 }]).jpeg({ quality:88, mozjpeg:true }).toFile(path.join(root, 'og', `${s.slug}.jpg`));
    fs.writeFileSync(path.join(root, 's', `${s.slug}.html`), stickerPage(s));
    if ((i + 1) % 25 === 0 || i === items.length - 1) console.log(`built ${i + 1}/${items.length}`);
  }

  const urls = ['/', '/browse.html', '/ip-policy.html', '/privacy.html', '/terms.html', ...items.map((s) => `/s/${s.slug}.html`)];
  fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${canonicalBase}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${canonicalBase}/sitemap.xml\n`);
  console.log('complete', { stickers:items.length, urls:urls.length });
}

build().catch((error) => { console.error(error); process.exit(1); });
