import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base='http://127.0.0.1:4173';
const canonical='https://www.lilgwapz.xyz/s/big-smile-male.html';
const usage='Free for personal use. Commercial use needs written permission.';
const artifacts=path.resolve('artifacts/stage-5.1');
fs.mkdirSync(artifacts,{recursive:true});

function assert(condition,message){if(!condition)throw new Error(message)}

async function makePage(browser,mode,viewport={width:1280,height:900}){
  const context=await browser.newContext({viewport});
  await context.addInitScript(({mode})=>{
    window.__gwapShares=[];
    window.__gwapCopied=[];
    window.__gwapEvents=[];
    window.gwapAnalytics=(event,payload)=>window.__gwapEvents.push({event,payload});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__gwapCopied.push(text)}}});
    if(mode==='file'){
      Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>Array.isArray(data?.files)&&data.files.length>0});
      Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__gwapShares.push({hasFiles:Array.isArray(data?.files)&&data.files.length>0,fileName:data?.files?.[0]?.name||'',fileType:data?.files?.[0]?.type||'',url:data?.url||'',text:data?.text||''})}});
    }else if(mode==='url'){
      Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
      Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__gwapShares.push({hasFiles:false,fileName:'',fileType:'',url:data?.url||'',text:data?.text||''})}});
    }else if(mode==='cancel'){
      Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
      Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancelled','AbortError')}});
    }else if(mode==='none'){
      try{delete navigator.share}catch{}
      try{delete navigator.canShare}catch{}
    }
  },{mode});
  const page=await context.newPage();
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.gwapShare&&document.querySelectorAll('[data-sticker-tile]').length===152&&document.querySelector('.tile-download'));
  return {context,page,errors};
}

async function openFirst(page){
  await page.locator('[data-sticker-tile] .browse-tile-link').first().click();
  await page.locator('#sticker-viewer[open]').waitFor();
  assert((await page.locator('#sticker-viewer-title').textContent())?.includes('Big Smile'),'First sticker did not open');
}

const browser=await chromium.launch({headless:true});
try{
  const fileCase=await makePage(browser,'file');
  await openFirst(fileCase.page);
  assert((await fileCase.page.locator('.sticker-viewer-usage').textContent())?.trim()===usage,'Usage copy mismatch');
  for(const selector of ['#sticker-viewer-share','#sticker-viewer-copy']){
    const box=await fileCase.page.locator(selector).boundingBox();
    assert(box&&box.width>=44&&box.height>=44,`${selector} target is smaller than 44px`);
  }
  await fileCase.page.locator('#sticker-viewer-copy').click();
  await fileCase.page.waitForFunction(()=>document.querySelector('#sticker-viewer-status')?.textContent==='Link copied.');
  const copied=await fileCase.page.evaluate(()=>window.__gwapCopied);
  assert(copied.at(-1)===canonical,`Copy link mismatch: ${copied.at(-1)}`);
  const downloadPromise=fileCase.page.waitForEvent('download');
  await fileCase.page.locator('#sticker-viewer-download').click();
  const download=await downloadPromise;
  assert(download.suggestedFilename()==='gwap-big-smile-male.png',`Unexpected download filename: ${download.suggestedFilename()}`);
  await fileCase.page.locator('#sticker-viewer-share').click();
  await fileCase.page.waitForFunction(()=>window.__gwapShares.length===1);
  const fileShare=await fileCase.page.evaluate(()=>window.__gwapShares[0]);
  assert(fileShare.hasFiles===true,'Native file share did not include a file');
  assert(fileShare.fileName==='gwap-big-smile-male.png',`Unexpected shared filename: ${fileShare.fileName}`);
  assert(fileShare.fileType==='image/png',`Unexpected shared file type: ${fileShare.fileType}`);
  assert(fileShare.text===usage,'Native file share usage text mismatch');
  const fileEvents=await fileCase.page.evaluate(()=>window.__gwapEvents);
  assert(fileEvents.some(item=>item.event==='copy_link'&&item.payload?.url===canonical),'copy_link event missing canonical URL');
  assert(fileEvents.some(item=>item.event==='share'&&item.payload?.mode==='file'&&item.payload?.url===canonical),'file share event missing');
  assert(fileEvents.some(item=>item.event==='download_single'&&item.payload?.surface==='dialog'),'dialog download event missing');
  await fileCase.page.screenshot({path:path.join(artifacts,'desktop-share-dialog.png'),fullPage:false});
  assert(fileCase.errors.length===0,`File-share console errors: ${fileCase.errors.join(' | ')}`);
  await fileCase.context.close();

  const urlCase=await makePage(browser,'url',{width:375,height:812});
  await openFirst(urlCase.page);
  await urlCase.page.locator('#sticker-viewer-share').click();
  await urlCase.page.waitForFunction(()=>window.__gwapShares.length===1);
  const urlShare=await urlCase.page.evaluate(()=>window.__gwapShares[0]);
  assert(urlShare.hasFiles===false,'URL fallback unexpectedly shared a file');
  assert(urlShare.url===canonical,`Native URL fallback mismatch: ${urlShare.url}`);
  assert(urlShare.text===usage,'Native URL share usage text mismatch');
  const overflow=await urlCase.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=1,`Mobile horizontal overflow: ${overflow}px`);
  await urlCase.page.screenshot({path:path.join(artifacts,'mobile-share-dialog.png'),fullPage:false});
  assert(urlCase.errors.length===0,`URL-share console errors: ${urlCase.errors.join(' | ')}`);
  await urlCase.context.close();

  const noneCase=await makePage(browser,'none');
  await openFirst(noneCase.page);
  await noneCase.page.locator('#sticker-viewer-share').click();
  await noneCase.page.waitForFunction(()=>document.querySelector('#sticker-viewer-status')?.textContent==='Link copied.');
  const noneCopied=await noneCase.page.evaluate(()=>window.__gwapCopied.at(-1));
  assert(noneCopied===canonical,`No-share fallback did not copy canonical URL: ${noneCopied}`);
  const noneEvents=await noneCase.page.evaluate(()=>window.__gwapEvents);
  assert(noneEvents.some(item=>item.event==='copy_link'&&item.payload?.fallback==='share'&&item.payload?.url===canonical),'No-share fallback telemetry missing');
  assert(noneCase.errors.length===0,`No-share console errors: ${noneCase.errors.join(' | ')}`);
  await noneCase.context.close();

  const cancelCase=await makePage(browser,'cancel');
  await openFirst(cancelCase.page);
  await cancelCase.page.locator('#sticker-viewer-share').click();
  await cancelCase.page.waitForFunction(()=>document.querySelector('#sticker-viewer-status')?.textContent==='Share cancelled.');
  const cancelEvents=await cancelCase.page.evaluate(()=>window.__gwapEvents);
  assert(cancelEvents.some(item=>item.event==='share_cancel'&&item.payload?.mode==='url'),'share_cancel event missing');
  assert(cancelCase.errors.length===0,`Cancel console errors: ${cancelCase.errors.join(' | ')}`);
  await cancelCase.context.close();

  console.log(JSON.stringify({
    canonical,
    usage,
    fileShare:'PASS',
    urlFallback:'PASS',
    noShareCopyFallback:'PASS',
    shareCancel:'PASS',
    downloadFilename:'gwap-big-smile-male.png',
    mobileOverflow:'PASS'
  },null,2));
}finally{
  await browser.close();
}
