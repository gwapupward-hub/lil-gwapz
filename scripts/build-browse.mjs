import fs from 'node:fs';

const file='browse.html';
const stickers=JSON.parse(fs.readFileSync('data/stickers.json','utf8'));
if(stickers.length!==152) throw new Error(`Expected 152 stickers, got ${stickers.length}`);

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const moodLabel=s=>s.mood==='attitude'?(s.sex==='M'?'Swagger':'Sassy'):(s.mood==='love'?'Love':s.mood[0].toUpperCase()+s.mood.slice(1));
const moodGroups=[
  {key:'happy',label:'Happy'},
  {key:'attitude',label:'Attitude'},
  {key:'chill',label:'Chill'},
  {key:'hype',label:'Hype'},
  {key:'love',label:'Much love'}
];

let tileIndex=0;
const renderTile=s=>{
  const i=tileIndex++;
  return `<article class="browse-tile" data-sticker-tile data-mood="${s.mood}" data-sex="${s.sex}" data-color="${s.color}" data-search="${esc(`${s.id} ${s.name} ${s.emoji} ${s.keywords.join(' ')} ${s.gender} ${s.colorway}`.toLowerCase())}"><a class="browse-tile-link" href="s/${s.slug}.html" aria-label="Open ${esc(s.name)}, ${s.gender} Lil Gwapz"><div class="browse-tile-art"><img ${i<8?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async" width="256" height="256" src="${s.thumb}" alt="${esc(s.name)}, ${s.gender} Lil Gwapz"></div><div class="browse-tile-copy"><h2>${esc(s.emoji)} ${esc(s.name)}</h2><p>${s.gender==='male'?'Male':'Female'} · ${moodLabel(s)} · ${esc(s.colorway)}</p></div></a></article>`;
};

const groupedTiles=moodGroups.map((group,index)=>{
  const members=stickers.filter(s=>s.mood===group.key);
  if(!members.length) throw new Error(`Mood group ${group.key} is empty`);
  const tiles=members.map(renderTile).join('');
  return `<section class="browse-mood-group mood-group-${group.key}" data-mood-group="${group.key}" aria-labelledby="mood-group-${group.key}-title"><header class="browse-mood-heading" data-mood-heading="${group.key}"><div><p class="eyebrow">MOOD ${String(index+1).padStart(2,'0')}</p><h2 id="mood-group-${group.key}-title"><span data-mood-group-label>${group.label}</span></h2></div><span class="browse-mood-count" data-mood-group-count>${members.length} stickers</span></header><div class="browse-tile-grid" data-mood-grid="${group.key}">${tiles}</div></section>`;
}).join('');

if(tileIndex!==152) throw new Error(`Expected 152 rendered tiles, got ${tileIndex}`);

const head=`<!-- STAGE21:HEAD -->\n  <link rel="stylesheet" href="css/browse-tiles.css">\n  <link rel="stylesheet" href="css/browse-groups.css">\n<!-- /STAGE21:HEAD -->`;
const scripts=`<!-- STAGE21:SCRIPTS -->\n  <script defer src="js/track.js"></script>\n  <script defer src="js/browse-filters.js"></script>\n  <script defer src="js/browse-groups.js"></script>\n  <script defer src="js/browse-tiles.js"></script>\n  <script defer src="legal.js"></script>\n<!-- /STAGE21:SCRIPTS -->`;
const controls=`    <section class="gallery-controls" aria-label="Filter stickers">\n      <label class="search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Find a reaction…" autocomplete="off"><kbd>/</kbd></label>\n      <div class="filter-row" id="mood-filters" aria-label="Filter by mood">\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="all" aria-pressed="true">All moods</button>\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="happy" aria-pressed="false">Happy</button>\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="attitude" aria-pressed="false">Attitude</button>\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="chill" aria-pressed="false">Chill</button>\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="hype" aria-pressed="false">Hype</button>\n        <button class="filter-chip mood-chip" data-filter-group="mood" data-filter-value="love" aria-pressed="false">Much love</button>\n      </div>\n      <div class="filter-row secondary-filters"><div class="filter-group desktop-secondary-filter" aria-label="Filter by character"><span class="filter-group-label">Character</span><button class="filter-chip" data-filter-group="sex" data-filter-value="all" aria-pressed="true">All</button><button class="filter-chip" data-filter-group="sex" data-filter-value="M" aria-pressed="false">Male</button><button class="filter-chip" data-filter-group="sex" data-filter-value="F" aria-pressed="false">Female</button></div><div class="filter-group desktop-secondary-filter" aria-label="Filter by color"><span class="filter-group-label">Color</span><button class="filter-chip" data-filter-group="color" data-filter-value="all" aria-pressed="true">All</button><button class="filter-chip" data-filter-group="color" data-filter-value="GRN" aria-pressed="false">Green</button><button class="filter-chip" data-filter-group="color" data-filter-value="ORG" aria-pressed="false">Orange</button><button class="filter-chip" data-filter-group="color" data-filter-value="RED" aria-pressed="false">Red</button><button class="filter-chip" data-filter-group="color" data-filter-value="PUR" aria-pressed="false">Purple</button></div><button class="button button-outline mobile-filter-open" id="mobile-filter-open" type="button">Character &amp; color</button><span class="result-count" id="result-count" aria-live="polite">152 stickers</span></div>\n    </section>\n    <div class="browse-groups" id="browse-grid" aria-label="Sticker gallery grouped by mood">${groupedTiles}</div>`;
const browseBlock=`<!-- STAGE21:BROWSE -->\n${controls}\n<!-- /STAGE21:BROWSE -->`;
const dialog=`<!-- STAGE21:DIALOG -->\n  <dialog class="mobile-filter-dialog" id="mobile-filter-dialog" aria-labelledby="mobile-filter-title"><header><h2 id="mobile-filter-title">Filters</h2><button class="button button-outline" id="mobile-filter-close" type="button">Done</button></header><div class="filter-group" aria-label="Mobile character filter"><span class="filter-group-label">Character</span><button class="filter-chip" data-filter-group="sex" data-filter-value="all" aria-pressed="true">All</button><button class="filter-chip" data-filter-group="sex" data-filter-value="M" aria-pressed="false">Male</button><button class="filter-chip" data-filter-group="sex" data-filter-value="F" aria-pressed="false">Female</button></div><div class="filter-group" aria-label="Mobile color filter"><span class="filter-group-label">Color</span><button class="filter-chip" data-filter-group="color" data-filter-value="all" aria-pressed="true">All</button><button class="filter-chip" data-filter-group="color" data-filter-value="GRN" aria-pressed="false">Green</button><button class="filter-chip" data-filter-group="color" data-filter-value="ORG" aria-pressed="false">Orange</button><button class="filter-chip" data-filter-group="color" data-filter-value="RED" aria-pressed="false">Red</button><button class="filter-chip" data-filter-group="color" data-filter-value="PUR" aria-pressed="false">Purple</button></div></dialog>\n<!-- /STAGE21:DIALOG -->`;
const licenseNote='<p class="download-license-note">Downloads are for personal reaction use. By downloading, you agree to the <a href="terms.html">Terms</a> and <a href="ip-policy.html">IP Policy</a>.</p>';

let html=fs.readFileSync(file,'utf8');
html=html.replace(/<div class="browse-actions">([\s\S]*?)<\/div>/,m=>m.includes('download-license-note')?m:m.replace('</div>',`${licenseNote}</div>`));
html=html.replace(/<!-- STAGE21:HEAD -->[\s\S]*?<!-- \/STAGE21:HEAD -->\n?/g,'').replace('  <link rel="stylesheet" href="css/tokens.css">',`  <link rel="stylesheet" href="css/tokens.css">\n${head}`);
html=html.replace(/<!-- STAGE21:SCRIPTS -->[\s\S]*?<!-- \/STAGE21:SCRIPTS -->/g,'  <script defer src="app.js"></script>\n  <script defer src="legal.js"></script>');
html=html.replace('  <script defer src="app.js"></script>\n  <script defer src="legal.js"></script>',scripts);
if(/<!-- STAGE21:BROWSE -->/.test(html)) html=html.replace(/<!-- STAGE21:BROWSE -->[\s\S]*?<!-- \/STAGE21:BROWSE -->/,browseBlock); else html=html.replace(/    <section class="gallery-controls"[\s\S]*?<\/section>\n    <section class="gallery-grid" id="gallery-grid" aria-label="Sticker gallery"><\/section>/,browseBlock);
html=html.replace(/<!-- STAGE21:DIALOG -->[\s\S]*?<!-- \/STAGE21:DIALOG -->\n?/g,'');
html=html.replace('  <footer class="site-footer">',`${dialog}\n  <footer class="site-footer">`);
fs.writeFileSync(file,html);
console.log(`browse groups generated: ${moodGroups.map(g=>`${g.key}:${stickers.filter(s=>s.mood===g.key).length}`).join(', ')}; tiles: ${stickers.length}; eager: 8; lazy: ${stickers.length-8}`);
