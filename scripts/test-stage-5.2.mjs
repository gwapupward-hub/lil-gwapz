import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const pages=['/','/browse.html','/terms.html','/ip-policy.html','/privacy.html'];
const requiredFooterHrefs=[
  'terms.html',
  'ip-policy.html',
  'privacy.html',
  'https://gwapspot.com/contact',
  'https://gwapspot.com',
  'https://gwapspot.fun/name',
  'https://gwapscore.live/',
  'https://dimimusic.xyz/',
  'https://gwapspot.store/',
  'https://x.com/_gwapspot?s=21'
];
const allowedExternalOrigins=new Set([
  'https://gwapspot.com',
  'https://gwapspot.fun',
  'https://gwapscore.live',
  'https://dimimusic.xyz',
  'https://gwapspot.store',
  'https://x.com'
]);

fs.mkdirSync('artifacts/stage-5.2',{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence=[];

for(const path of pages){
  const context=await browser.newContext({viewport:{width:375,height:900}});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  const response=await page.goto(`${base}${path}`,{waitUntil:'networkidle'});
  assert.equal(response?.status(),200,`${path} returns 200`);

  const footer=page.locator('.site-footer');
  assert.equal(await footer.count(),1,`${path} has one public footer`);
  assert.equal(await footer.locator('.footer-group').count(),3,`${path} has Legal/Ecosystem/Connect groups`);

  const hrefs=await footer.locator('a[href]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
  for(const href of requiredFooterHrefs){
    assert.ok(hrefs.includes(href),`${path} footer contains ${href}`);
  }
  assert.equal(hrefs.some(h=>String(h).startsWith('mailto:')),false,`${path} does not invent a licensing email`);
  for(const href of hrefs.filter(h=>/^https?:/i.test(String(h)))){
    const origin=new URL(href).origin;
    assert.ok(allowedExternalOrigins.has(origin),`${path} uses only approved external footer origins: ${origin}`);
  }

  const groups=await footer.locator('.footer-group>span').allTextContents();
  assert.deepEqual(groups.map(x=>x.trim()),['LEGAL','GWAP ECOSYSTEM','CONNECT'],`${path} footer group labels are locked`);

  const renderedTargets=await footer.locator('a').evaluateAll(nodes=>nodes.map(a=>{
    const r=a.getBoundingClientRect();
    const s=getComputedStyle(a);
    return {text:(a.textContent||a.getAttribute('aria-label')||'').trim(),width:r.width,height:r.height,display:s.display,visibility:s.visibility};
  }).filter(x=>x.display!=='none'&&x.visibility!=='hidden'&&x.width>0&&x.height>0));
  const tooSmall=renderedTargets.filter(t=>t.width<44||t.height<44);
  assert.deepEqual(tooSmall,[],`${path} footer links meet 44px target minimum: ${JSON.stringify(tooSmall)}`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} has no 375px horizontal overflow`);
  assert.equal(consoleErrors.length,0,`${path} console errors: ${consoleErrors.join(' | ')}`);

  if(path==='/browse.html'){
    assert.equal(await page.locator('#mobile-filter-open').count(),1,'Browse retains mobile filter trigger');
    assert.equal(await page.locator('#mobile-filter-dialog').count(),1,'Browse retains generated mobile Character & color dialog');
    assert.equal(await page.locator('[data-sticker-tile]').count(),152,'Browse retains 152 static grouped tiles');
  }

  evidence.push({path,hrefs,targets:renderedTargets.length});
  await context.close();
}

const legalContext=await browser.newContext({viewport:{width:1280,height:900}});
const legalPage=await legalContext.newPage();
await legalPage.goto(`${base}/terms.html`,{waitUntil:'networkidle'});
assert.ok(await legalPage.locator('.legal-document a[href="https://gwapspot.com/contact"]').count()>=2,'Terms exposes direct licensing/report contact path');
const termsCta=legalPage.locator('.legal-action-link').first();
const termsCtaStyle=await termsCta.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,width:r.width,height:r.height}});
assert.equal(termsCtaStyle.background,'rgb(19, 221, 19)','licensing CTA uses canonical Gwap Green');
assert.equal(termsCtaStyle.color,'rgb(7, 16, 7)','licensing CTA uses dark text on green');
assert.ok(termsCtaStyle.height>=44,'licensing CTA is at least 44px high');
await legalPage.screenshot({path:'artifacts/stage-5.2/terms-desktop.png',fullPage:true});

await legalPage.goto(`${base}/ip-policy.html`,{waitUntil:'networkidle'});
assert.ok(await legalPage.locator('.legal-document a[href="https://gwapspot.com/contact"]').count()>=3,'IP policy exposes permission and licensing intake links');
await legalPage.screenshot({path:'artifacts/stage-5.2/ip-policy-desktop.png',fullPage:true});

await legalPage.goto(`${base}/privacy.html`,{waitUntil:'networkidle'});
assert.ok(await legalPage.locator('.legal-document a[href="https://gwapspot.com/contact"]').count()>=3,'Privacy rights/contact paths use exact contact intake');
await legalContext.close();

const jsOff=await browser.newContext({viewport:{width:375,height:900},javaScriptEnabled:false});
const jsOffPage=await jsOff.newPage();
await jsOffPage.goto(`${base}/browse.html`,{waitUntil:'domcontentloaded'});
assert.equal(await jsOffPage.locator('.site-footer').count(),1,'Browse footer is static with JS disabled');
assert.equal(await jsOffPage.locator('[data-sticker-tile]').count(),152,'Browse retains all 152 static tiles with JS disabled');
assert.ok(await jsOffPage.locator('a[href="https://gwapspot.com/contact"]').count()>=1,'licensing path remains available with JS disabled');
await jsOffPage.screenshot({path:'artifacts/stage-5.2/browse-mobile-js-off.png',fullPage:true});
await jsOff.close();

console.log(JSON.stringify({
  stage:'5.2',
  licensing:'https://gwapspot.com/contact',
  x:'https://x.com/_gwapspot?s=21',
  ecosystem:['https://gwapspot.com','https://gwapspot.fun/name','https://gwapscore.live/','https://dimimusic.xyz/','https://gwapspot.store/'],
  pages:evidence,
  termsCtaStyle,
  browseMobileFilterDialog:1,
  jsOffBrowseTiles:152,
  screenshots:['terms-desktop.png','ip-policy-desktop.png','browse-mobile-js-off.png']
},null,2));

await browser.close();
