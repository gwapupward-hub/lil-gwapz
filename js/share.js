(() => {
  const canonicalBase='https://www.lilgwapz.xyz';
  const usage='Free for personal use. Commercial use needs written permission.';

  const canonicalStickerUrl=slug=>`${canonicalBase}/s/${encodeURIComponent(slug)}.html`;

  async function copyText(text){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea=document.createElement('textarea');
    textarea.value=text;
    textarea.setAttribute('readonly','');
    textarea.style.position='fixed';
    textarea.style.opacity='0';
    document.body.append(textarea);
    textarea.select();
    const copied=document.execCommand?.('copy');
    textarea.remove();
    if(!copied) throw new Error('Clipboard unavailable');
  }

  async function copyStickerLink({slug,surface='unknown'}={}){
    if(!slug) throw new Error('Sticker slug is required');
    const url=canonicalStickerUrl(slug);
    await copyText(url);
    window.gwapTrack?.('copy_link',{slug,surface,url});
    return {status:'copied',mode:'url',url};
  }

  async function shareFile(sticker,title,text){
    if(typeof File!=='function'||typeof navigator.canShare!=='function') return null;
    const full=new URL(sticker.full,location.href);
    if(full.origin!==location.origin) return null;
    const response=await fetch(full.href,{credentials:'same-origin'});
    if(!response.ok) return null;
    const blob=await response.blob();
    const file=new File([blob],`gwap-${sticker.slug}.png`,{type:blob.type||'image/png'});
    if(!navigator.canShare({files:[file]})) return null;
    await navigator.share({files:[file],title,text});
    return file;
  }

  async function shareSticker({sticker,surface='unknown'}={}){
    if(!sticker?.slug) throw new Error('Sticker data is required');
    const url=canonicalStickerUrl(sticker.slug);
    const title=`${sticker.emoji||''} ${sticker.name||'Lil Gwapz'}`.trim()+' — Lil Gwapz';
    const text=usage;

    if(typeof navigator.share==='function'){
      try{
        const file=await shareFile(sticker,title,text);
        if(file){
          window.gwapTrack?.('share',{slug:sticker.slug,surface,mode:'file',url});
          return {status:'shared',mode:'file',url};
        }
      }catch(error){
        if(error?.name==='AbortError'){
          window.gwapTrack?.('share_cancel',{slug:sticker.slug,surface,mode:'file'});
          return {status:'cancelled',mode:'file',url};
        }
      }

      try{
        await navigator.share({title,text,url});
        window.gwapTrack?.('share',{slug:sticker.slug,surface,mode:'url',url});
        return {status:'shared',mode:'url',url};
      }catch(error){
        if(error?.name==='AbortError'){
          window.gwapTrack?.('share_cancel',{slug:sticker.slug,surface,mode:'url'});
          return {status:'cancelled',mode:'url',url};
        }
      }
    }

    try{
      await copyText(url);
      window.gwapTrack?.('copy_link',{slug:sticker.slug,surface,url,fallback:'share'});
      return {status:'copied',mode:'url',url};
    }catch(error){
      return {status:'error',mode:'url',url,error};
    }
  }

  window.gwapShare={canonicalBase,usage,canonicalStickerUrl,copyStickerLink,shareSticker};
})();
