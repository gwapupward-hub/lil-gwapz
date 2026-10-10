import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const expected=[
  ['happy','Happy',32],
  ['attitude','Attitude',38],
  ['chill','Chill',32],
  ['hype','Hype',26],
  ['love','Much love',24]
];
fs.mkdirSync('artifacts/stage-4.2',{recursive:true});

const runtime=fs.readFileSync('js/browse-groups.js','utf8');
assert.match(runtime,/IntersectionObserver/,'group runtime uses IntersectionObserver');
assert.doesNotMatch(runtime,/addEventListener\s*\(\s*['"]scroll['"]/,'group runtime must not attach a page scroll listener');

const browser=await chromium.launch({headless:true});

async function snapshotGroups(page){
  return page.locator('[data-mood-group]').evaluateAll(groups=>groups.map(group=>({
    mood:group.dataset.moodGroup,
    hidden:group.hidden,
    label:group.querySelector('[data-mood-group-label]')?.textContent.trim(),
    count:group.querySelector('[data-mood-group-count]')?.textContent.trim(),
    tiles:group.querySelectorAll('[data-sticker-tile]').length,
    visibleTiles:[...group.querySelectorAll('[data-sticker-tile]')].filter(tile=>!tile.hidden).length
  })));
}

const mobile=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'no-preference'});
const page=await mobile.newPage();
const mobileErrors=[];
page.on('console',message=>{if(message.type()==='error')mobileErrors.push(message.text())});
await page.goto(`${base}/browse.html`,{waitUntil:'networkidle'});

assert.equal(await page.locator('[data-sticker-tile]').count(),152,'Browse retains all 152 static tiles');
assert.equal(await page.locator('[data-mood-group]').count(),5,'Browse renders five mood groups');
const initial=await snapshotGroups(page);
assert.deepEqual(initial.map(x=>[x.mood,x.label,x.tiles]),expected.map(([mood,label,count])=>[mood,label,count]),'mood group order, labels, and counts are canonical');
assert.deepEqual(initial.map(x=>x.hidden),[false,false,false,false,false],'all mood groups are visible initially');
assert.equal(await page.locator('#mood-filters [data-filter-value="love"]').textContent(),'Much love','love mood pill uses canonical display copy');
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'grouped Browse has no page-level horizontal overflow at 375px');

await page.evaluate(()=>{
  const heading=document.querySelector('[data-mood-heading="chill"]');
  const top=heading.getBoundingClientRect().top+scrollY-innerHeight*.34;
  scrollTo(0,top);
});
await page.waitForFunction(()=>document.querySelector('#mood-filters [data-filter-value="chill"]')?.classList.contains('is-scroll-active'));
assert.equal(await page.locator('#mood-filters [data-filter-value="chill"]').evaluate(el=>el.classList.contains('is-scroll-active')),true,'IntersectionObserver syncs Chill pill while its heading is current');

await page.locator('#mood-filters [data-filter-value="happy"]').click();
await page.waitForFunction(()=>[...document.querySelectorAll('[data-mood-group]')].filter(group=>!group.hidden).length===1);
const happyFiltered=await snapshotGroups(page);
assert.deepEqual(happyFiltered.filter(x=>!x.hidden).map(x=>[x.mood,x.visibleTiles]),[['happy',32]],'Happy filter leaves only the Happy group visible');
assert.match(page.url(),/[?&]mood=happy(?:&|$)/,'mood filter writes URL state');
assert.equal(await page.locator('#mood-filters [data-filter-value="chill"]').evaluate(el=>el.classList.contains('is-scroll-active')),false,'explicit mood filtering suspends scroll-active decoration');

await page.locator('#mood-filters [data-filter-value="all"]').click();
await page.waitForFunction(()=>[...document.querySelectorAll('[data-mood-group]')].every(group=>!group.hidden));
await page.screenshot({path:'artifacts/stage-4.2/grouped-browse-mobile-375.png',fullPage:true});
assert.equal(mobileErrors.length,0,`mobile console errors: ${mobileErrors.join(' | ')}`);
await mobile.close();

const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});
const desktopPage=await desktop.newPage();
const desktopErrors=[];
desktopPage.on('console',message=>{if(message.type()==='error')desktopErrors.push(message.text())});
await desktopPage.goto(`${base}/browse.html`,{waitUntil:'networkidle'});

const male=desktopPage.locator('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="M"]');
const allSex=desktopPage.locator('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="all"]');
const female=desktopPage.locator('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="F"]');
await male.click();
await desktopPage.waitForFunction(()=>document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent==='Swagger');
assert.equal(await desktopPage.locator('[data-mood-group="attitude"] [data-mood-group-label]').textContent(),'Swagger','male-only Browse context labels Attitude group as Swagger');
assert.equal(await desktopPage.locator('#mood-filters [data-filter-value="attitude"]').textContent(),'Swagger','male-only mood pill says Swagger');
assert.equal(await desktopPage.locator('[data-mood-group="attitude"] [data-mood-group-count]').textContent(),'19 stickers','male-only Attitude/Swagger group count is 19');

await allSex.click();
await female.click();
await desktopPage.waitForFunction(()=>document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent==='Sassy');
assert.equal(await desktopPage.locator('[data-mood-group="attitude"] [data-mood-group-label]').textContent(),'Sassy','female-only Browse context labels Attitude group as Sassy');
assert.equal(await desktopPage.locator('#mood-filters [data-filter-value="attitude"]').textContent(),'Sassy','female-only mood pill says Sassy');
assert.equal(await desktopPage.locator('[data-mood-group="attitude"] [data-mood-group-count]').textContent(),'19 stickers','female-only Attitude/Sassy group count is 19');

assert.ok(await desktopPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'grouped Browse has no desktop horizontal overflow');
await desktopPage.screenshot({path:'artifacts/stage-4.2/grouped-browse-desktop-1280.png',fullPage:true});
assert.equal(desktopErrors.length,0,`desktop console errors: ${desktopErrors.join(' | ')}`);
await desktop.close();

const noJs=await browser.newContext({viewport:{width:375,height:900},javaScriptEnabled:false});
const noJsPage=await noJs.newPage();
await noJsPage.goto(`${base}/browse.html`,{waitUntil:'networkidle'});
assert.equal(await noJsPage.locator('[data-mood-group]').count(),5,'JS-off Browse keeps all five static mood groups');
assert.equal(await noJsPage.locator('[data-sticker-tile]').count(),152,'JS-off Browse keeps all 152 static tiles');
assert.equal(await noJsPage.locator('[data-mood-group][hidden]').count(),0,'JS-off Browse does not hide mood groups');
assert.deepEqual(await noJsPage.locator('[data-mood-group-label]').allTextContents(),expected.map(([,label])=>label),'JS-off group heading labels remain canonical');
await noJs.close();

console.log(JSON.stringify({
  stage:'4.2',
  groups:expected.map(([mood,label,count])=>({mood,label,count})),
  mobile:{tiles:152,scrollSync:'chill',filteredHappy:32,screenshot:'grouped-browse-mobile-375.png'},
  desktop:{swagger:19,sassy:19,screenshot:'grouped-browse-desktop-1280.png'},
  jsOff:{groups:5,tiles:152},
  scrollListener:false
},null,2));

await browser.close();
