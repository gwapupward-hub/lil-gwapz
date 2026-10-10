import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root=process.cwd();
const baseURL=process.env.BASE_URL||'http://127.0.0.1:4173';
const baseOrigin=new URL(baseURL).origin;
const artifactDir=path.join(root,'artifacts','stage-6.2');
fs.mkdirSync(artifactDir,{recursive:true});
let failed=false;
const pass=(name,detail)=>console.log(`PASS: ${name}${detail===undefined?'':` — ${typeof detail==='string'?detail:JSON.stringify(detail)}`}`);
const fail=(name,detail)=>{failed=true;console.error(`FAIL: ${name}`);if(detail!==undefined)console.error(typeof detail==='string'?detail:JSON.stringify(detail,null,2));};
const check=(condition,name,detail)=>condition?pass(name,detail):fail(name,detail);

const count=(dir,ext)=>fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith(ext)).length:0;
const dist=path.join(root,'dist');
const staticState={
  stickers:count(path.join(dist,'stickers'),'.png'),
  thumbs:count(path.join(dist,'thumbs'),'.webp'),
  pages:count(path.join(dist,'s'),'.html'),
  og:count(path.join(dist,'og'),'.jpg'),
  custom404:fs.existsSync(path.join(dist,'404.html')),
  nestedLegalCss:fs.existsSync(path.join(dist,'s','legal.css'))
};
check(staticState.stickers===152,'152 full PNGs in dist',staticState.stickers);
check(staticState.thumbs===152,'152 WebP thumbs in dist',staticState.thumbs);
check(staticState.pages===152,'152 generated sticker pages in dist',staticState.pages);
check(staticState.og>=152,'at least 152 OG images in dist',staticState.og);
check(staticState.custom404,'custom 404 included in dist');
check(staticState.nestedLegalCss,'generated /s/legal.css dependency included');

const browseHtml=fs.readFileSync(path.join(dist,'browse.html'),'utf8');
check((browseHtml.match(/data-sticker-tile/g)||[]).length===152,'generated Browse contains 152 static tiles');
check((browseHtml.match(/data-mood-group="(?:happy|attitude|chill|hype|love)"/g)||[]).length===5,'generated Browse contains five canonical mood groups');
check((browseHtml.match(/loading="eager"/g)||[]).length===8&&(browseHtml.match(/loading="lazy"/g)||[]).length===144,'Browse eager/lazy image contract is 8/144');
check((browseHtml.match(/id="mobile-filter-dialog"/g)||[]).length===1,'exactly one mobile filter dialog is generated');
const shareSource=fs.readFileSync(path.join(root,'js','share.js'),'utf8');
check(shareSource.includes("const canonicalBase='https://www.lilgwapz.xyz'"),'canonical share base remains www.lilgwapz.xyz');
check(shareSource.includes('Free for personal use. Commercial use needs written permission.'),'share usage copy remains exact');

const browser=await chromium.launch({headless:true});
const visibleTargets=page=>page.evaluate(()=>Array.from(document.querySelectorAll('a,button,select,input')).filter(el=>{
  const s=getComputedStyle(el),r=el.getBoundingClientRect();
  return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!el.closest('dialog:not([open])');
}).map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,70),width:r.width,height:r.height};}).filter(x=>x.width<44||x.height<44));

const responsiveRoutes=['/','/browse.html','/terms.html','/404.html'];
const viewports=[320,375,414,768,1280];
const matrix=[];
for(const width of viewports){
  const context=await browser.newContext({viewport:{width,height:width>=768?900:896},reducedMotion:'reduce'});
  for(const route of responsiveRoutes){
    const page=await context.newPage();
    const errors=[],bad=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{try{const u=new URL(r.url());if(u.origin===baseOrigin&&r.status()>=400)bad.push({path:u.pathname,status:r.status()});}catch{}});
    const response=await page.goto(`${baseURL}${route}`,{waitUntil:'networkidle'});
    const geom=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    const small=await visibleTargets(page);
    check(response?.status()===200,`${route} returns 200 at ${width}px`,response?.status());
    check(geom.scrollWidth<=geom.width,`${route} has no horizontal overflow at ${width}px`,geom);
    check(small.length===0,`${route} visible targets are >=44px at ${width}px`,small.slice(0,12));
    check(errors.length===0,`${route} has no console/page errors at ${width}px`,errors);
    check(bad.length===0,`${route} has no failed same-origin resources at ${width}px`,bad);
    matrix.push({route,width,overflow:geom.scrollWidth-geom.width,smallTargets:small.length,errors:errors.length,failedResources:bad.length});
    if((width===375||width===1280)&&['/','/browse.html','/404.html'].includes(route)){
      const label=route==='/'?'home':route==='/browse.html'?'browse':'404';
      await page.screenshot({path:path.join(artifactDir,`${label}-${width}.png`),fullPage:true});
    }
    await page.close();
  }
  await context.close();
}

const auditContext=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
const auditRoutes=['/','/browse.html','/terms.html','/ip-policy.html','/privacy.html','/s/big-smile-male.html','/404.html'];
for(const route of auditRoutes){
  const page=await auditContext.newPage();
  const errors=[],bad=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{try{const u=new URL(r.url());if(u.origin===baseOrigin&&r.status()>=400)bad.push({path:u.pathname,status:r.status()});}catch{}});
  await page.goto(`${baseURL}${route}`,{waitUntil:'networkidle'});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const severe=axe.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));
  const externalScripts=await page.evaluate(origin=>Array.from(document.querySelectorAll('script[src]')).map(s=>new URL(s.src,location.href)).filter(u=>u.origin!==origin).map(u=>u.href),baseOrigin);
  check(severe.length===0,`${route} axe serious/critical = 0`,severe);
  check(errors.length===0,`${route} has no console/page errors`,errors);
  check(bad.length===0,`${route} has no failed same-origin resources`,bad);
  check(externalScripts.length===0,`${route} has no third-party source scripts`,externalScripts);
  await page.close();
}

const focus=await auditContext.newPage();
await focus.goto(`${baseURL}/`,{waitUntil:'domcontentloaded'});
await focus.keyboard.press('Tab');
const focusState=await focus.evaluate(()=>{const el=document.activeElement,s=getComputedStyle(el);return{tag:el?.tagName,outline:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor};});
check(focusState.tag==='A'&&focusState.outline!=='none'&&parseFloat(focusState.width)>=2,'keyboard focus indicator remains visible',focusState);
const reduced=await focus.evaluate(()=>{const hero=document.querySelector('.hero-sticker'),img=document.querySelector('.hero-sticker img'),reveal=document.querySelector('.motion-reveal');return{hero:getComputedStyle(hero).animationName,img:getComputedStyle(img).animationName,revealTransition:reveal?getComputedStyle(reveal).transitionDuration:null};});
check(reduced.hero==='none'&&reduced.img==='none','reduced motion disables hero animation',reduced);
await focus.close();

const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
await desktop.addInitScript(()=>{window.__copiedText='';try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedText=text;}}});}catch{}});
const browse=await desktop.newPage();
await browse.goto(`${baseURL}/browse.html`,{waitUntil:'networkidle'});
await browse.waitForFunction(()=>document.querySelectorAll('[data-sticker-tile]').length===152&&document.querySelectorAll('.tile-download').length===152);
const initial=await browse.evaluate(()=>({tiles:document.querySelectorAll('[data-sticker-tile]').length,visible:Array.from(document.querySelectorAll('[data-sticker-tile]')).filter(x=>!x.hidden).length,groups:Array.from(document.querySelectorAll('[data-mood-group]')).map(g=>({mood:g.dataset.moodGroup,count:g.querySelectorAll('[data-sticker-tile]').length})),dialogs:document.querySelectorAll('#mobile-filter-dialog').length}));
check(initial.tiles===152&&initial.visible===152,'Browse initializes with 152 visible stickers',initial);
check(JSON.stringify(initial.groups)===JSON.stringify([{mood:'happy',count:32},{mood:'attitude',count:38},{mood:'chill',count:32},{mood:'hype',count:26},{mood:'love',count:24}]),'canonical grouped Browse counts remain 32/38/32/26/24',initial.groups);
check(initial.dialogs===1,'Browse retains exactly one mobile filter dialog');

await browse.click('[data-filter-group="mood"][data-filter-value="happy"]');
await browse.waitForFunction(()=>document.querySelector('#result-count')?.textContent?.trim()==='32 stickers');
check((await browse.textContent('#result-count'))?.trim()==='32 stickers','Happy filter returns 32 stickers');
await browse.click('[data-filter-group="mood"][data-filter-value="happy"]');
await browse.click('.desktop-secondary-filter [data-filter-group="color"][data-filter-value="GRN"]');
await browse.waitForFunction(()=>document.querySelector('#result-count')?.textContent?.trim()==='40 stickers');
check((await browse.textContent('#result-count'))?.trim()==='40 stickers','Green color filter returns 40 stickers');
await browse.click('.desktop-secondary-filter [data-filter-group="color"][data-filter-value="GRN"]');
await browse.click('[data-filter-group="mood"][data-filter-value="attitude"]');
await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="M"]');
await browse.waitForFunction(()=>document.querySelector('#result-count')?.textContent?.trim()==='19 stickers'&&document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()==='Swagger');
let contextLabel=await browse.evaluate(()=>({count:document.querySelector('#result-count')?.textContent?.trim(),chip:document.querySelector('[data-filter-group="mood"][data-filter-value="attitude"]')?.textContent?.trim(),heading:document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()}));
check(contextLabel.count==='19 stickers'&&contextLabel.chip==='Swagger'&&contextLabel.heading==='Swagger','male Attitude resolves to Swagger with 19 stickers',contextLabel);
await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="M"]');
await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="F"]');
await browse.waitForFunction(()=>document.querySelector('#result-count')?.textContent?.trim()==='19 stickers'&&document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()==='Sassy');
contextLabel=await browse.evaluate(()=>({count:document.querySelector('#result-count')?.textContent?.trim(),chip:document.querySelector('[data-filter-group="mood"][data-filter-value="attitude"]')?.textContent?.trim(),heading:document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()}));
check(contextLabel.count==='19 stickers'&&contextLabel.chip==='Sassy'&&contextLabel.heading==='Sassy','female Attitude resolves to Sassy with 19 stickers',contextLabel);

await browse.goto(`${baseURL}/browse.html`,{waitUntil:'networkidle'});
await browse.waitForFunction(()=>document.querySelectorAll('.tile-download').length===152);
await browse.click('.browse-tile-link');
await browse.waitForFunction(()=>document.querySelector('#sticker-viewer')?.open===true);
const dialog=await browse.evaluate(()=>({open:document.querySelector('#sticker-viewer')?.open,image:document.querySelector('#sticker-viewer-image')?.src,download:document.querySelector('#sticker-viewer-download')?.getAttribute('download'),usage:document.querySelector('.sticker-viewer-usage')?.textContent?.trim(),id:document.querySelector('#sticker-viewer-id')?.textContent?.trim()}));
check(dialog.open&&dialog.image.startsWith(baseOrigin+'/stickers/')&&/^gwap-.+\.png$/.test(dialog.download||''),'sticker dialog uses same-origin PNG and exact download filename',dialog);
check(dialog.usage==='Free for personal use. Commercial use needs written permission.','dialog usage copy remains exact');
const firstId=dialog.id;
await browse.keyboard.press('ArrowRight');
await browse.waitForFunction(id=>document.querySelector('#sticker-viewer-id')?.textContent?.trim()!==id,firstId);
check((await browse.textContent('#sticker-viewer-id'))?.trim()!==firstId,'ArrowRight advances within visible sticker order');
await browse.click('#sticker-viewer-copy');
await browse.waitForFunction(()=>window.__copiedText?.startsWith('https://www.lilgwapz.xyz/s/'));
const copied=await browse.evaluate(()=>window.__copiedText);
check(/^https:\/\/www\.lilgwapz\.xyz\/s\/[a-z0-9-]+\.html$/.test(copied),'Copy link uses canonical www sticker URL',copied);
await browse.click('#sticker-viewer-close');
check(!(await browse.evaluate(()=>document.querySelector('#sticker-viewer')?.open)),'sticker viewer closes cleanly');
await browse.close();

const mobile=await browser.newContext({viewport:{width:375,height:812}});
const mobileBrowse=await mobile.newPage();
await mobileBrowse.goto(`${baseURL}/browse.html`,{waitUntil:'networkidle'});
await mobileBrowse.click('#mobile-filter-open');
await mobileBrowse.waitForFunction(()=>document.querySelector('#mobile-filter-dialog')?.open===true);
check(await mobileBrowse.evaluate(()=>document.querySelector('#mobile-filter-dialog')?.open===true),'mobile Character & color dialog opens');
await mobileBrowse.click('#mobile-filter-close');
await mobile.close();

const unknown=await desktop.newPage();
const unknownResponse=await unknown.goto(`${baseURL}/definitely-not-a-lil-gwapz-page`,{waitUntil:'networkidle'});
const unknownState=await unknown.evaluate(()=>({title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||'',actions:document.querySelectorAll('.not-found-actions a').length}));
check(unknownResponse?.status()===404,'unknown route preserves HTTP 404',unknownResponse?.status());
check(/Page Not Found/i.test(unknownState.title)&&/Page not found/i.test(unknownState.h1)&&unknownState.actions>=2,'unknown route renders branded custom 404',unknownState);
await unknown.close();
const cssResponse=await desktop.request.get(`${baseURL}/s/legal.css`);
check(cssResponse.status()===200,'/s/legal.css returns 200',cssResponse.status());

const internal=new Set();
for(const route of auditRoutes){
  const page=await desktop.newPage();
  await page.goto(`${baseURL}${route}`,{waitUntil:'domcontentloaded'});
  const hrefs=await page.evaluate(origin=>Array.from(document.querySelectorAll('a[href]')).map(a=>{try{const u=new URL(a.href,location.href);u.hash='';return u.origin===origin?u.href:null;}catch{return null;}}).filter(Boolean),baseOrigin);
  hrefs.forEach(x=>internal.add(x));
  await page.close();
}
const broken=[];
const links=[...internal].sort();
for(let i=0;i<links.length;i+=16){
  const chunk=links.slice(i,i+16);
  const results=await Promise.all(chunk.map(async href=>{try{const r=await desktop.request.get(href,{maxRedirects:5});return{href,status:r.status()};}catch(e){return{href,status:0,error:String(e)};}}));
  broken.push(...results.filter(x=>x.status<200||x.status>=400));
}
check(broken.length===0,'all discovered internal links resolve below HTTP 400',broken.slice(0,20));
pass('internal link crawl checked URLs',links.length);
await desktop.close();

const jsOff=await browser.newContext({viewport:{width:375,height:812},javaScriptEnabled:false});
for(const route of ['/','/browse.html','/404.html']){
  const page=await jsOff.newPage();
  await page.goto(`${baseURL}${route}`,{waitUntil:'domcontentloaded'});
  if(route==='/')check(await page.locator('h1').count()===1&&await page.locator('.mood-tile').count()===5,'Home remains usable with JavaScript disabled');
  if(route==='/browse.html')check(await page.locator('[data-sticker-tile]').count()===152,'Browse exposes 152 tiles with JavaScript disabled');
  if(route==='/404.html')check(await page.locator('h1').count()===1&&await page.locator('.not-found-actions a').count()>=2,'404 remains usable with JavaScript disabled');
  await page.close();
}
await jsOff.close();
await auditContext.close();
await browser.close();

const hashes={};
for(const file of fs.readdirSync(artifactDir).filter(x=>x.endsWith('.png')).sort())hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(artifactDir,file))).digest('hex');
console.log('STAGE62_STATIC',JSON.stringify(staticState,null,2));
console.log('STAGE62_MATRIX',JSON.stringify(matrix,null,2));
console.log('STAGE62_SCREENSHOT_HASHES',JSON.stringify(hashes,null,2));
if(failed)process.exit(1);
console.log('STAGE62_FULL_QA_PASS');
