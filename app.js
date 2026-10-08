(() => {
  const base = new URL('.', window.location.href);
  const asset = (path) => new URL(path, base).href;
  let stickers = [];
  const moodNames = ['All moods','Happy','Sassy','Chill','Hype','Much love'];
  const moodTerms = {
    happy: ['smile','laugh','happy','joy','grateful','win','victory','peace','good vibe','proud','celebrat','tear'],
    sassy: ['side eye','smirk','unimpressed','wink','boss','cold flex','plot','no way','hush'],
    chill: ['sleep','think','please','calm','chill','dua','knocked','relax'],
    hype: ['hype','fire','mad','cash','money','locked in','victory','dance','mic drop','pumped','train','gwap'],
    love: ['love','heart','hug','kiss','miss','bestie','grateful']
  };
  const category = (s) => {
    const haystack = `${s.name} ${s.keywords.join(' ')}`.toLowerCase();
    for (const key of ['love','sassy','chill','hype','happy']) if (moodTerms[key].some(term => haystack.includes(term))) return key;
    return 'happy';
  };
  const titleCase = (text) => text.replace(/\b\w/g, ch => ch.toUpperCase());
  const sexName = (s) => s.sex === 'M' ? 'Male' : 'Female';
  const colorName = (c) => ({GRN:'Green',ORG:'Orange',RED:'Red',PUR:'Purple'})[c] || c;
  const filenamePath = (s) => asset(`assets/stickers/${encodeURIComponent(s.filename)}`);
  const toast = (message) => {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role','status'); el.textContent = message;
    document.body.append(el); setTimeout(() => el.remove(), 2600);
  };
  const download = (s) => {
    const a = document.createElement('a'); a.href = filenamePath(s); a.download = s.filename; document.body.append(a); a.click(); a.remove();
  };
  const crcTable = (() => { const t = new Uint32Array(256); for (let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t; })();
  const crc32 = (bytes) => { let c=0xffffffff; for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; };
  const u16 = (v) => [v&255,(v>>>8)&255];
  const u32 = (v) => [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  const join = (parts) => { const length=parts.reduce((n,p)=>n+p.length,0);const out=new Uint8Array(length);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out; };
  async function downloadPack(button) {
    if (!stickers.length) return;
    button.disabled = true; const old = button.textContent; button.textContent = 'Preparing your pack…';
    try {
      const locals=[], centrals=[]; let offset=0;
      for (let i=0;i<stickers.length;i+=8) {
        const batch=stickers.slice(i,i+8);
        const loaded=await Promise.all(batch.map(async s=>({s,bytes:new Uint8Array(await (await fetch(filenamePath(s))).arrayBuffer())})));
        for(const {s,bytes} of loaded) {
          const name=new TextEncoder().encode(`${s.sex==='M'?'Male':'Female'}/${s.filename}`);const crc=crc32(bytes);
          const local=join([new Uint8Array([0x50,0x4b,0x03,0x04]),new Uint8Array(u16(20)),new Uint8Array(u16(0x0800)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u32(crc)),new Uint8Array(u32(bytes.length)),new Uint8Array(u32(bytes.length)),new Uint8Array(u16(name.length)),new Uint8Array(u16(0)),name,bytes]);
          const central=join([new Uint8Array([0x50,0x4b,0x01,0x02]),new Uint8Array(u16(20)),new Uint8Array(u16(20)),new Uint8Array(u16(0x0800)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u32(crc)),new Uint8Array(u32(bytes.length)),new Uint8Array(u32(bytes.length)),new Uint8Array(u16(name.length)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u32(0)),new Uint8Array(u32(offset)),name]);
          locals.push(local);centrals.push(central);offset+=local.length;
        }
        button.textContent=`Preparing ${Math.min(i+batch.length,stickers.length)} / ${stickers.length}…`;
      }
      const centralBytes=join(centrals);const end=join([new Uint8Array([0x50,0x4b,0x05,0x06]),new Uint8Array(u16(0)),new Uint8Array(u16(0)),new Uint8Array(u16(stickers.length)),new Uint8Array(u16(stickers.length)),new Uint8Array(u32(centralBytes.length)),new Uint8Array(u32(offset)),new Uint8Array(u16(0))]);
      const blob=new Blob([...locals,centralBytes,end],{type:'application/zip'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Lil-Gwapz-Reaction-Pack-01-152-PNGs.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Your 152 sticker pack is ready.');
    } catch(e) { console.error(e);toast('Could not prepare the pack. Try again on a stronger connection.'); }
    finally {button.disabled=false;button.textContent=old;}
  }
  const bindStickerImages = () => {
    document.querySelectorAll('img[data-sticker]').forEach(img=>{const bits=img.dataset.sticker.split('-');const id=bits.slice(0,3).join('-');const sex=bits[3];const use=stickers.find(s=>s.id===id&&s.sex===sex);if(use)img.src=filenamePath(use);});
  };
  const setupHome = () => {
    bindStickerImages(); const grid=document.getElementById('peek-grid');if(!grid)return;
    const featured=['LG-R01-001','LG-R01-003','LG-R01-010','LG-R01-024'];
    grid.innerHTML=featured.map((id,i)=>{const s=stickers.find(x=>x.id===id && x.sex===(i%2?'F':'M'))||stickers.find(x=>x.id===id);if(!s)return '';return `<article class="peek-card"><div class="peek-card-art"><img loading="lazy" src="${filenamePath(s)}" alt="${s.name}, ${sexName(s)} Lil Gwapz"></div><h3>${s.name}</h3><p>${sexName(s)} · ${colorName(s.color)} mood</p><button class="card-download" data-download="${s.filename}" aria-label="Download ${s.name} sticker">⇩</button></article>`;}).join('');
    grid.addEventListener('click',e=>{const b=e.target.closest('[data-download]');if(b){const s=stickers.find(x=>x.filename===b.dataset.download);if(s)download(s);}});
  };
  const setupBrowse = () => {
    const grid=document.getElementById('gallery-grid');if(!grid)return;
    const search=document.getElementById('search'), color=document.getElementById('color-filter'), count=document.getElementById('result-count'), empty=document.getElementById('empty-state');let sex='all',mood='all';
    const moodFilters=document.getElementById('mood-filters');moodFilters.innerHTML=moodNames.map((name,i)=>`<button class="filter-chip${i===0?' selected':''}" data-mood="${['all','happy','sassy','chill','hype','love'][i]}">${name}</button>`).join('');
    const params=new URLSearchParams(location.search);if(params.has('mood')){const start=params.get('mood').toLowerCase();if(moodTerms[start])mood=start;}
    const render=()=>{const q=search.value.trim().toLowerCase();const filtered=stickers.filter(s=>{const text=`${s.id} ${s.name} ${s.sex} ${s.color} ${s.keywords.join(' ')}`.toLowerCase();return (!q||text.includes(q))&&(sex==='all'||s.sex===sex)&&(color.value==='all'||s.color===color.value)&&(mood==='all'||category(s)===mood);});count.textContent=`${filtered.length} sticker${filtered.length===1?'':'s'}`;empty.hidden=filtered.length>0;grid.hidden=filtered.length===0;grid.innerHTML=filtered.map(s=>`<article class="sticker-card"><button class="sticker-preview" data-view="${s.filename}" aria-label="Preview ${s.name}, ${sexName(s)}"><img loading="lazy" src="${filenamePath(s)}" alt="${s.name}, ${sexName(s)} Lil Gwapz"></button><div class="sticker-info"><h2>${s.emoji} ${s.name}</h2><p>${sexName(s)} · ${colorName(s.color)}</p><p class="sticker-id">${s.id}</p><button class="download-one" data-download="${s.filename}" aria-label="Download ${s.name}, ${sexName(s)} PNG">⇩</button></div></article>`).join('');moodFilters.querySelectorAll('.filter-chip').forEach(b=>b.classList.toggle('selected',b.dataset.mood===mood));};
    render();
    moodFilters.addEventListener('click',e=>{const b=e.target.closest('[data-mood]');if(b){mood=b.dataset.mood;render();}});
    document.querySelector('.segmented').addEventListener('click',e=>{const b=e.target.closest('[data-sex]');if(b){sex=b.dataset.sex;document.querySelectorAll('[data-sex]').forEach(x=>x.classList.toggle('selected',x===b));render();}});
    search.addEventListener('input',render);color.addEventListener('change',render);document.getElementById('clear-filters').addEventListener('click',()=>{search.value='';color.value='all';sex='all';mood='all';document.querySelectorAll('[data-sex]').forEach(x=>x.classList.toggle('selected',x.dataset.sex==='all'));render();});
    document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search.focus();}});
    grid.addEventListener('click',e=>{const dl=e.target.closest('[data-download]');if(dl){const s=stickers.find(x=>x.filename===dl.dataset.download);if(s)download(s);return;}const view=e.target.closest('[data-view]');if(view){const s=stickers.find(x=>x.filename===view.dataset.view);if(s)openDialog(s);}});
    document.getElementById('download-all').addEventListener('click',e=>downloadPack(e.currentTarget));document.getElementById('download-all-bottom').addEventListener('click',e=>downloadPack(e.currentTarget));
  };
  const openDialog=(s)=>{const d=document.getElementById('sticker-dialog');document.getElementById('dialog-image').src=filenamePath(s);document.getElementById('dialog-image').alt=`${s.name}, ${sexName(s)} Lil Gwapz`;document.getElementById('dialog-id').textContent=s.id;document.getElementById('dialog-name').textContent=`${s.emoji} ${s.name}`;document.getElementById('dialog-variant').textContent=`${sexName(s)} Lil Gwapz · ${colorName(s.color)} · 512 × 512 transparent PNG`;const a=document.getElementById('dialog-download');a.href=filenamePath(s);a.download=s.filename;d.showModal();};
  const init=async()=>{try{stickers=await(await fetch(asset('stickers.json'))).json();setupHome();setupBrowse();}catch(e){console.error('Could not load sticker collection',e);}};
  document.getElementById('dialog-close')?.addEventListener('click',()=>document.getElementById('sticker-dialog').close());
  document.getElementById('sticker-dialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
  init();
})();
