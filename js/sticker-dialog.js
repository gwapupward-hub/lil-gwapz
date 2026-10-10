(() => {
  const grid=document.getElementById('browse-grid');
  const dialog=document.getElementById('sticker-viewer');
  if(!grid||!dialog) return;

  const image=document.getElementById('sticker-viewer-image');
  const title=document.getElementById('sticker-viewer-title');
  const id=document.getElementById('sticker-viewer-id');
  const mood=document.getElementById('sticker-viewer-mood');
  const download=document.getElementById('sticker-viewer-download');
  const shareButton=document.getElementById('sticker-viewer-share');
  const copyButton=document.getElementById('sticker-viewer-copy');
  const status=document.getElementById('sticker-viewer-status');
  const closeButton=document.getElementById('sticker-viewer-close');
  const prevButton=document.getElementById('sticker-viewer-prev');
  const nextButton=document.getElementById('sticker-viewer-next');
  const tileBySlug=new Map();
  let stickerBySlug=new Map();
  let currentSlug='';
  let currentSticker=null;
  let lastTrigger=null;
  let ready=false;

  const slugFromTile=tile=>tile.querySelector('.browse-tile-link')?.getAttribute('href')?.match(/s\/([^/?#]+)\.html/)?.[1]||'';
  const visibleTiles=()=>[...grid.querySelectorAll('[data-sticker-tile]:not([hidden])')];
  const sameOriginFull=sticker=>{const url=new URL(sticker.full,location.href);if(url.origin!==location.origin)throw new Error(`Full PNG must be same-origin: ${sticker.slug}`);return url.href};
  const setStatus=message=>{if(status)status.textContent=message||''};

  function setSticker(slug){
    const sticker=stickerBySlug.get(slug); if(!sticker) return false;
    let full; try{full=sameOriginFull(sticker)}catch(error){console.error(error);download.hidden=true;return false}
    currentSlug=slug;
    currentSticker=sticker;
    image.src=full;
    image.alt=`${sticker.name}, ${sticker.gender} Lil Gwapz`;
    title.textContent=`${sticker.emoji} ${sticker.name}`;
    id.textContent=sticker.id;
    mood.textContent=`${sticker.gender==='male'?'Male':'Female'} · ${sticker.moodLabel} · ${sticker.colorway}`;
    download.href=full;
    download.download=`gwap-${sticker.slug}.png`;
    download.hidden=false;
    setStatus('');
    const visible=visibleTiles();
    const index=visible.findIndex(tile=>slugFromTile(tile)===slug);
    prevButton.disabled=index<=0;
    nextButton.disabled=index<0||index>=visible.length-1;
    return true;
  }

  function openSticker(slug,trigger){
    if(!ready||!setSticker(slug)) return;
    lastTrigger=trigger||tileBySlug.get(slug)?.querySelector('.browse-tile-link')||null;
    if(!dialog.open) dialog.showModal();
    closeButton.focus();
    window.gwapTrack?.('sticker_open',{slug});
  }

  function navigate(delta){
    const visible=visibleTiles();
    const index=visible.findIndex(tile=>slugFromTile(tile)===currentSlug);
    const target=visible[index+delta]; if(!target) return;
    setSticker(slugFromTile(target));
  }

  dialog.addEventListener('sticker:open',event=>openSticker(event.detail?.slug,event.detail?.trigger));
  closeButton.addEventListener('click',()=>dialog.close());
  prevButton.addEventListener('click',()=>navigate(-1));
  nextButton.addEventListener('click',()=>navigate(1));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>{const target=lastTrigger;lastTrigger=null;target?.focus?.()});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();navigate(-1)}else if(event.key==='ArrowRight'){event.preventDefault();navigate(1)}});
  download.addEventListener('click',()=>{if(currentSlug)window.gwapTrack?.('download_single',{slug:currentSlug,surface:'dialog'})});

  shareButton?.addEventListener('click',async()=>{
    if(!currentSticker||!window.gwapShare) return;
    shareButton.disabled=true;
    setStatus('');
    try{
      const result=await window.gwapShare.shareSticker({sticker:currentSticker,surface:'dialog'});
      if(result.status==='shared') setStatus(result.mode==='file'?'Sticker ready to share.':'Link ready to share.');
      else if(result.status==='copied') setStatus('Link copied.');
      else if(result.status==='cancelled') setStatus('Share cancelled.');
      else setStatus('Could not share this sticker.');
    }catch(error){
      console.error('Could not share sticker',error);
      setStatus('Could not share this sticker.');
    }finally{shareButton.disabled=false}
  });

  copyButton?.addEventListener('click',async()=>{
    if(!currentSlug||!window.gwapShare) return;
    copyButton.disabled=true;
    setStatus('');
    try{
      await window.gwapShare.copyStickerLink({slug:currentSlug,surface:'dialog'});
      setStatus('Link copied.');
    }catch(error){
      console.error('Could not copy sticker link',error);
      setStatus('Could not copy the link.');
    }finally{copyButton.disabled=false}
  });

  let activeTile=null,startX=0,startY=0,pressTimer=0,longPressed=false,moved=false,suppressUntil=0;
  const clearPress=()=>{if(pressTimer){clearTimeout(pressTimer);pressTimer=0}};
  const showPressLabel=tile=>{longPressed=true;suppressUntil=Date.now()+700;tile.classList.add('touch-label-visible');setTimeout(()=>tile.classList.remove('touch-label-visible'),1500)};

  grid.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'||event.target.closest('.tile-download')) return;
    const tile=event.target.closest('[data-sticker-tile]'); if(!tile) return;
    activeTile=tile;startX=event.clientX;startY=event.clientY;longPressed=false;moved=false;clearPress();
    pressTimer=setTimeout(()=>{pressTimer=0;if(activeTile===tile&&!moved)showPressLabel(tile)},350);
  },{passive:true});
  grid.addEventListener('pointermove',event=>{
    if(!activeTile||event.pointerType==='mouse') return;
    if(Math.hypot(event.clientX-startX,event.clientY-startY)>10){moved=true;suppressUntil=Date.now()+500;clearPress()}
  },{passive:true});
  const finishTouch=()=>{clearPress();activeTile=null};
  grid.addEventListener('pointerup',finishTouch,{passive:true});
  grid.addEventListener('pointercancel',()=>{moved=true;suppressUntil=Date.now()+500;finishTouch()},{passive:true});

  grid.addEventListener('click',event=>{
    const dl=event.target.closest('.tile-download');
    if(dl){event.preventDefault();event.stopPropagation();const slug=dl.dataset.slug,sticker=stickerBySlug.get(slug);if(!sticker)return;let full;try{full=sameOriginFull(sticker)}catch(error){console.error(error);return}const a=document.createElement('a');a.href=full;a.download=`gwap-${slug}.png`;document.body.append(a);a.click();a.remove();window.gwapTrack?.('download_single',{slug,surface:'tile'});return}
    const link=event.target.closest('.browse-tile-link'); if(!link) return;
    if(Date.now()<suppressUntil||longPressed||moved){event.preventDefault();longPressed=false;moved=false;return}
    event.preventDefault();
    const tile=link.closest('[data-sticker-tile]');const slug=slugFromTile(tile);if(slug)dialog.dispatchEvent(new CustomEvent('sticker:open',{detail:{slug,trigger:link}}));
  });

  fetch('data/stickers.json').then(response=>{if(!response.ok)throw new Error(`Sticker data ${response.status}`);return response.json()}).then(stickers=>{
    for(const sticker of stickers){sameOriginFull(sticker);stickerBySlug.set(sticker.slug,sticker)}
    for(const tile of grid.querySelectorAll('[data-sticker-tile]')){
      const slug=slugFromTile(tile);if(!slug||!stickerBySlug.has(slug))continue;tileBySlug.set(slug,tile);
      if(!tile.querySelector('.tile-action-label'))tile.insertAdjacentHTML('beforeend','<span class="tile-action-label" aria-hidden="true">Preview</span>');
      if(!tile.querySelector('.tile-download'))tile.insertAdjacentHTML('beforeend',`<button class="tile-download" type="button" data-slug="${slug}" aria-label="Download ${stickerBySlug.get(slug).name} PNG">⇩</button>`);
    }
    ready=true;
  }).catch(error=>console.error('Could not initialize sticker dialog',error));
})();
