import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('artifacts/stage-2.1',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
await page.addInitScript(()=>{window.__stage21cls=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__stage21cls+=e.value}).observe({type:'layout-shift',buffered:true})});
const fullPng=[]; const consoleErrors=[];
page.on('request',r=>{if(/\/stickers\/.*\.png(?:\?|$)/.test(r.url()))fullPng.push(r.url())});
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
assert.equal(await page.locator('[data-sticker-tile]').count(),152,'tile count');
assert.equal(await page.locator('[data-sticker-tile]:not([hidden])').count(),152,'initial visible count');
assert.equal(await page.locator('img[loading="eager"]').count(),8,'eager count');
assert.equal(await page.locator('img[loading="lazy"]').count(),144,'lazy count');
assert.equal(fullPng.length,0,'Browse must not request full PNGs before a user download');
const initialCls=await page.evaluate(()=>window.__stage21cls||0);
assert.equal(initialCls,0,`Initial CLS expected 0, got ${initialCls}`);

await page.keyboard.press('/');
assert.equal(await page.evaluate(()=>document.activeElement?.id),'search','slash focuses search');
await page.locator('#search').fill('smile');
assert.equal(new URL(page.url()).searchParams.get('q'),'smile','search URL sync');
await page.locator('#search').fill('');

await page.getByRole('button',{name:'Happy',exact:true}).click();
await page.getByRole('button',{name:'Hype',exact:true}).click();
const expectedMood=await page.locator('[data-sticker-tile][data-mood="happy"], [data-sticker-tile][data-mood="hype"]').count();
assert.equal(await page.locator('[data-sticker-tile]:not([hidden])').count(),expectedMood,'OR within mood group');
let u=new URL(page.url());
assert.equal(u.searchParams.get('mood'),'happy,hype','mood URL sync');

await page.getByRole('button',{name:'Character & color'}).click();
const dialog=page.getByRole('dialog',{name:'Filters'});
await dialog.getByRole('button',{name:'Male',exact:true}).click();
await dialog.getByRole('button',{name:'Green',exact:true}).click();
const expectedAnd=await page.locator('[data-sticker-tile][data-sex="M"][data-color="GRN"][data-mood="happy"], [data-sticker-tile][data-sex="M"][data-color="GRN"][data-mood="hype"]').count();
assert.equal(await page.locator('[data-sticker-tile]:not([hidden])').count(),expectedAnd,'AND across groups');
u=new URL(page.url());
assert.equal(u.searchParams.get('sex'),'M','sex URL sync');
assert.equal(u.searchParams.get('color'),'GRN','color URL sync');
await dialog.getByRole('button',{name:'Done'}).click();

await page.locator('#search').fill('gwap');
u=new URL(page.url());
assert.equal(u.searchParams.get('q'),'gwap','search preserved with filters');
assert.equal(u.searchParams.get('mood'),'happy,hype','mood preserved with search');
assert.equal(u.searchParams.get('sex'),'M','sex preserved with search');
assert.equal(u.searchParams.get('color'),'GRN','color preserved with search');

const tapTargets=await page.locator('#mood-filters button, #mobile-filter-open').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height,text:el.textContent}}));
for(const t of tapTargets) assert.ok(t.h>=44,`tap target ${t.text} height ${t.h}`);
const postInteractionCls=await page.evaluate(()=>window.__stage21cls||0);
assert.equal(consoleErrors.length,0,`console errors: ${consoleErrors.join(' | ')}`);
assert.equal(fullPng.length,0,'No full PNG requests after filter interactions');

await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
for(const [width,height,name] of [[390,844,'mobile-390'],[768,1024,'tablet-768'],[1280,900,'desktop-1280']]){
  await page.setViewportSize({width,height});
  await page.screenshot({path:`artifacts/stage-2.1/${name}.png`,fullPage:true});
}

const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
const noJsPage=await noJs.newPage();
await noJsPage.goto(`${base}/browse.html`,{waitUntil:'load'});
assert.equal(await noJsPage.locator('[data-sticker-tile]').count(),152,'JS-off tile count');
assert.equal(await noJsPage.locator('[data-sticker-tile]:not([hidden])').count(),152,'JS-off visible tiles');
await noJs.close();

console.log(JSON.stringify({tileCount:152,eager:8,lazy:144,fullPngRequests:fullPng.length,initialCls,postInteractionCls,expectedMood,expectedAnd,screenshots:['mobile-390.png','tablet-768.png','desktop-1280.png'],jsOffVisible:152},null,2));
await browser.close();
