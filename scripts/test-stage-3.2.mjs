import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const widths=[320,375,414];
fs.mkdirSync('artifacts/stage-3.2',{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];

const visibleTargets=async page=>page.locator('a,button').evaluateAll(nodes=>nodes.map(node=>{
  const r=node.getBoundingClientRect();
  const s=getComputedStyle(node);
  return {text:(node.textContent||node.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,60),width:r.width,height:r.height,display:s.display,visibility:s.visibility};
}).filter(x=>x.display!=='none'&&x.visibility!=='hidden'&&x.width>0&&x.height>0));

for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  await page.goto(`${base}/`,{waitUntil:'networkidle'});

  const actions=page.locator('.hero-actions .button');
  assert.equal(await actions.count(),2,`hero has two CTAs at ${width}px`);
  assert.equal(await actions.nth(0).evaluate(el=>el.classList.contains('button-primary')),true,'primary CTA is first in DOM');
  assert.equal(await actions.nth(1).evaluate(el=>el.classList.contains('button-outline')),true,'secondary CTA is second in DOM');

  const primary=await actions.nth(0).evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,height:r.height,width:r.width,touchAction:s.touchAction}});
  const secondary=await actions.nth(1).evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,border:s.borderColor,height:r.height,width:r.width}});
  assert.equal(primary.background,'rgb(19, 221, 19)','primary uses canonical Gwap Green');
  assert.equal(primary.color,'rgb(7, 16, 7)','primary uses dark text on green');
  assert.ok(primary.height>=48,`primary CTA is >=48px high at ${width}px`);
  assert.equal(primary.touchAction,'manipulation','primary CTA uses touch-action manipulation');
  assert.notEqual(secondary.background,'rgb(19, 221, 19)','secondary is not solid green');
  assert.match(secondary.background,/rgba\(/,'secondary remains ghost/translucent');
  assert.ok(secondary.height>=48,`secondary CTA is >=48px high at ${width}px`);

  const geometry=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    const first=document.querySelector('.hero-actions .button:first-child').getBoundingClientRect();
    const second=document.querySelector('.hero-actions .button:nth-child(2)').getBoundingClientRect();
    const mark=document.querySelector('.site-header .wordmark').getBoundingClientRect();
    const headerCta=document.querySelector('.site-header .header-cta').getBoundingClientRect();
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:rect('.hero h1'),copy:rect('.hero-copy'),art:rect('.hero-art'),hero:rect('.hero'),first:{top:first.top,bottom:first.bottom},second:{top:second.top,bottom:second.bottom},header:{markRight:mark.right,ctaLeft:headerCta.left}};
  });
  assert.ok(geometry.scrollWidth<=width+1,`no horizontal page overflow at ${width}px`);
  assert.ok(geometry.h1.left>=-1&&geometry.h1.right<=width+1,`heading stays inside viewport at ${width}px`);
  assert.ok(geometry.copy.bottom<=geometry.art.top+1,`hero copy and art do not overlap at ${width}px`);
  assert.ok(geometry.first.bottom<=geometry.second.top+1,`hero CTAs stack without overlap at ${width}px`);
  assert.ok(geometry.header.markRight<=geometry.header.ctaLeft+1,`header logo and CTA do not overlap at ${width}px`);

  const targets=await visibleTargets(page);
  const tooSmall=targets.filter(t=>t.width<44||t.height<44);
  assert.deepEqual(tooSmall,[],`all visible home links/buttons are at least 44x44 at ${width}px: ${JSON.stringify(tooSmall)}`);

  const box=await actions.nth(0).boundingBox();
  assert.ok(box,'primary CTA has a bounding box');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.waitForTimeout(40);
  const pressed=await actions.nth(0).evaluate(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter}));
  assert.match(pressed.transform,/matrix\(0\.94, 0, 0, 0\.94/,'press state scales CTA to .94');
  assert.match(pressed.filter,/drop-shadow/,'press state adds glow');
  await page.mouse.up();

  assert.equal(consoleErrors.length,0,`console errors at ${width}px: ${consoleErrors.join(' | ')}`);
  const screenshot=`home-${width}.png`;
  await page.screenshot({path:`artifacts/stage-3.2/${screenshot}`,fullPage:true});
  evidence.push({width,primary,secondary,geometry,targets:targets.length,pressed,screenshot});
  await context.close();
}

const browse=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'no-preference'});
const browsePage=await browse.newPage();
await browsePage.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
assert.equal(await browsePage.locator('[data-sticker-tile]').count(),152,'Browse retains 152 tiles');
const browseControls=await browsePage.locator('#download-all,.filter-chip,.mobile-nav a').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').map(node=>{const r=node.getBoundingClientRect();return {text:(node.textContent||'').trim().replace(/\s+/g,' ').slice(0,50),width:r.width,height:r.height}}));
const smallBrowse=browseControls.filter(t=>t.width<44||t.height<44);
assert.deepEqual(smallBrowse,[],`critical Browse controls are at least 44x44: ${JSON.stringify(smallBrowse)}`);
assert.ok(await browsePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Browse has no horizontal page overflow at 375px');
await browsePage.screenshot({path:'artifacts/stage-3.2/browse-375.png',fullPage:true});
await browse.close();

const reduced=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});
const reducedPage=await reduced.newPage();
await reducedPage.goto(`${base}/`,{waitUntil:'networkidle'});
const reducedPrimary=reducedPage.locator('.hero-actions .button').first();
const reducedBox=await reducedPrimary.boundingBox();
await reducedPage.mouse.move(reducedBox.x+reducedBox.width/2,reducedBox.y+reducedBox.height/2);
await reducedPage.mouse.down();
await reducedPage.waitForTimeout(40);
const reducedPressed=await reducedPrimary.evaluate(el=>({transform:getComputedStyle(el).transform,filter:getComputedStyle(el).filter}));
assert.equal(reducedPressed.transform,'none','reduced motion disables press scaling');
assert.equal(reducedPressed.filter,'none','reduced motion disables press glow');
await reducedPage.mouse.up();
await reduced.close();

console.log(JSON.stringify({stage:'3.2',widths,evidence,browseTiles:152,browseControls:browseControls.length,reducedPressed,screenshots:[...widths.map(w=>`home-${w}.png`),'browse-375.png']},null,2));
await browser.close();
