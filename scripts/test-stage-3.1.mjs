import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
fs.mkdirSync('artifacts/stage-3.1',{recursive:true});
const browser=await chromium.launch({headless:true});

const normal=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
const page=await normal.newPage();
const consoleErrors=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
await page.goto(`${base}/`,{waitUntil:'networkidle'});
assert.equal(await page.locator('.hero-sticker').count(),3,'three hero stickers');
assert.equal(await page.locator('link[href="css/motion.css"]').count(),1,'motion stylesheet linked on home');
assert.equal(await page.locator('script[src="js/browse-tiles.js"]').count(),1,'motion runtime available on home');

const support=await page.evaluate(()=>CSS.supports('animation-timeline:view()'));
const motionState=await page.locator('.hero-sticker-one').evaluate(el=>({animationName:getComputedStyle(el).animationName,animationTimeline:getComputedStyle(el).animationTimeline,translate:getComputedStyle(el).translate,imgAnimation:getComputedStyle(el.querySelector('img')).animationName,imgDuration:getComputedStyle(el.querySelector('img')).animationDuration}));
if(support){
  assert.equal(motionState.animationName,'hero-view-drift','scroll-driven hero drift enabled');
  assert.notEqual(motionState.animationTimeline,'auto','hero uses a view timeline');
}else{
  assert.equal(motionState.imgAnimation,'hero-idle-float','idle fallback enabled');
  assert.equal(motionState.imgDuration,'6s','idle fallback duration');
}

const firstMood=page.locator('.mood-tile').first();
await firstMood.scrollIntoViewIfNeeded();
assert.equal(await firstMood.evaluate(el=>el.classList.contains('motion-reveal')),true,'reveal class installed');
await page.waitForFunction(()=>document.querySelector('.mood-tile')?.classList.contains('is-revealed'),null,{timeout:2000});
assert.equal(await firstMood.evaluate(el=>el.classList.contains('is-revealed')),true,'IntersectionObserver reveals visible content');
await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mood-tile')).opacity==='1',null,{timeout:2000});
assert.equal(await firstMood.evaluate(el=>getComputedStyle(el).opacity),'1','revealed content visible after transition');

await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
assert.equal(await page.locator('[data-sticker-tile]').count(),152,'Browse retains 152 tiles');
const firstTile=page.locator('[data-sticker-tile]').first();
await firstTile.hover();
await page.waitForTimeout(250);
const hoverState=await firstTile.locator('.browse-tile-art img').evaluate(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter}));
assert.notEqual(hoverState.transform,'none','fine-pointer hover scales artwork');
assert.match(hoverState.filter,/drop-shadow/,'fine-pointer hover adds glow/shadow');
assert.equal(consoleErrors.length,0,`console errors: ${consoleErrors.join(' | ')}`);

await page.screenshot({path:'artifacts/stage-3.1/mobile-home-390.png',fullPage:true});
await page.setViewportSize({width:1280,height:900});
await page.goto(`${base}/`,{waitUntil:'networkidle'});
await page.screenshot({path:'artifacts/stage-3.1/desktop-home-1280.png',fullPage:true});

const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const reducedPage=await reduced.newPage();
await reducedPage.goto(`${base}/`,{waitUntil:'networkidle'});
const reducedState=await reducedPage.locator('.hero-sticker-one').evaluate(el=>({animation:getComputedStyle(el).animationName,translate:getComputedStyle(el).translate,imgAnimation:getComputedStyle(el.querySelector('img')).animationName}));
assert.equal(reducedState.animation,'none','reduced motion disables hero wrapper animation');
assert.equal(reducedState.imgAnimation,'none','reduced motion disables hero image animation');
assert.ok(reducedState.translate==='none'||reducedState.translate==='0px','reduced motion removes hero drift');
const reducedReveal=await reducedPage.locator('.mood-tile').first().evaluate(el=>({opacity:getComputedStyle(el).opacity,transition:getComputedStyle(el).transitionDuration,revealed:el.classList.contains('is-revealed')}));
assert.equal(reducedReveal.opacity,'1','reduced motion content visible');
assert.equal(reducedReveal.revealed,true,'reduced motion immediately reveals content');
await reduced.close();

const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
const noJsHome=await noJs.newPage();
await noJsHome.goto(`${base}/`,{waitUntil:'load'});
assert.equal(await noJsHome.locator('.mood-tile').count(),5,'home content exists with JS off');
for(const el of await noJsHome.locator('.mood-tile').all()) assert.equal(await el.evaluate(node=>getComputedStyle(node).opacity),'1','home content visible with JS off');
const noJsBrowse=await noJs.newPage();
await noJsBrowse.goto(`${base}/browse.html`,{waitUntil:'load'});
assert.equal(await noJsBrowse.locator('[data-sticker-tile]').count(),152,'JS-off Browse tile count');
assert.equal(await noJsBrowse.locator('[data-sticker-tile]:not([hidden])').count(),152,'JS-off Browse visible tiles');
await noJs.close();

const motionSource=fs.readFileSync('js/browse-tiles.js','utf8');
assert.ok(!/addEventListener\s*\(\s*['\"]scroll['\"]/.test(motionSource),'no scroll event listener');
assert.ok(!/\.onscroll\s*=/.test(motionSource),'no onscroll handler');
assert.ok(/IntersectionObserver/.test(motionSource),'IntersectionObserver used for reveal');
const externalScripts=await page.goto(`${base}/`,{waitUntil:'networkidle'}).then(()=>page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')).filter(src=>/^https?:\/\//i.test(src||''))));
assert.deepEqual(externalScripts,[],'no third-party script URLs');

console.log(JSON.stringify({heroStickers:3,scrollTimelineSupported:support,motionState,reducedState,browseTiles:152,hoverState,jsOffBrowseVisible:152,consoleErrors:0,screenshots:['mobile-home-390.png','desktop-home-1280.png']},null,2));
await normal.close();
await browser.close();
