import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const root = process.cwd();
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const baseOrigin = new URL(baseURL).origin;
const artifactDir = path.join(root, 'artifacts', 'stage-6.2');
fs.mkdirSync(artifactDir, { recursive: true });

let failed = false;
const pass = (name, detail) => console.log(`PASS: ${name}${detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`}`);
const fail = (name, detail) => {
  failed = true;
  console.error(`FAIL: ${name}`);
  if (detail !== undefined) console.error(typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));
};
const assert = (condition, name, detail) => condition ? pass(name, detail) : fail(name, detail);

const dist = path.join(root, 'dist');
const countExt = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(ext)).length : 0;
const staticState = {
  stickers: countExt(path.join(dist, 'stickers'), '.png'),
  thumbs: countExt(path.join(dist, 'thumbs'), '.webp'),
  stickerPages: countExt(path.join(dist, 's'), '.html'),
  og: countExt(path.join(dist, 'og'), '.jpg'),
  custom404: fs.existsSync(path.join(dist, '404.html')),
  nestedLegalCss: fs.existsSync(path.join(dist, 's', 'legal.css'))
};
assert(staticState.stickers === 152, '152 full PNGs in dist', staticState.stickers);
assert(staticState.thumbs === 152, '152 WebP thumbs in dist', staticState.thumbs);
assert(staticState.stickerPages === 152, '152 generated sticker pages in dist', staticState.stickerPages);
assert(staticState.og >= 152, 'at least 152 OG images in dist', staticState.og);
assert(staticState.custom404, 'custom 404 included in dist');
assert(staticState.nestedLegalCss, 'generated sticker stylesheet dependency included');

const generatedBrowse = fs.readFileSync(path.join(dist, 'browse.html'), 'utf8');
const tileCount = (generatedBrowse.match(/data-sticker-tile/g) || []).length;
const groupCount = (generatedBrowse.match(/data-mood-group="(?:happy|attitude|chill|hype|love)"/g) || []).length;
const eagerCount = (generatedBrowse.match(/loading="eager"/g) || []).length;
const lazyCount = (generatedBrowse.match(/loading="lazy"/g) || []).length;
assert(tileCount === 152, 'generated Browse contains 152 static tiles', tileCount);
assert(groupCount === 5, 'generated Browse contains 5 mood groups', groupCount);
assert(eagerCount === 8 && lazyCount === 144, 'Browse image loading contract preserved', { eagerCount, lazyCount });
assert((generatedBrowse.match(/id="mobile-filter-dialog"/g) || []).length === 1, 'exactly one mobile filter dialog generated');

const shareSource = fs.readFileSync(path.join(root, 'js', 'share.js'), 'utf8');
assert(shareSource.includes("const canonicalBase='https://www.lilgwapz.xyz'"), 'canonical share base remains www.lilgwapz.xyz');
assert(shareSource.includes("Free for personal use. Commercial use needs written permission."), 'share usage copy remains exact');

const browser = await chromium.launch({ headless: true });
const viewportMatrix = [
  { width: 320, height: 760 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];
const coreRoutes = ['/', '/browse.html', '/terms.html', '/ip-policy.html', '/privacy.html', '/s/big-smile-male.html', '/404.html'];
const responsiveRoutes = ['/', '/browse.html', '/terms.html', '/404.html'];
const browserSummary = [];

const visibleSmallTargets = async (page) => page.evaluate(() => Array.from(document.querySelectorAll('a,button,select,input')).filter((el) => {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('dialog:not([open])');
}).map((el) => {
  const r = el.getBoundingClientRect();
  return { tag: el.tagName, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 70), width: r.width, height: r.height };
}).filter((item) => item.width < 44 || item.height < 44));

for (const viewport of viewportMatrix) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  for (const route of responsiveRoutes) {
    const page = await context.newPage();
    const errors = [];
    const badResponses = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('response', (response) => {
      try {
        const url = new URL(response.url());
        if (url.origin === baseOrigin && response.status() >= 400) badResponses.push({ path: url.pathname, status: response.status() });
      } catch {}
    });
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    const geom = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    const targets = await visibleSmallTargets(page);
    assert(response?.status() === 200, `${route} returns 200 at ${viewport.width}px`, response?.status());
    assert(geom.scrollWidth <= geom.width, `${route} has no horizontal overflow at ${viewport.width}px`, geom);
    assert(targets.length === 0, `${route} visible targets are >=44px at ${viewport.width}px`, targets.slice(0, 12));
    assert(errors.length === 0, `${route} has no console/page errors at ${viewport.width}px`, errors);
    assert(badResponses.length === 0, `${route} has no failed same-origin resources at ${viewport.width}px`, badResponses);
    browserSummary.push({ route, viewport: viewport.width, status: response?.status(), overflow: geom.scrollWidth - geom.width, smallTargets: targets.length, errors: errors.length, failedResources: badResponses.length });
    if ((viewport.width === 375 || viewport.width === 1280) && (route === '/' || route === '/browse.html' || route === '/404.html')) {
      const label = route === '/' ? 'home' : route === '/browse.html' ? 'browse' : '404';
      await page.screenshot({ path: path.join(artifactDir, `${label}-${viewport.width}.png`), fullPage: true });
    }
    await page.close();
  }
  await context.close();
}

const auditContext = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
for (const route of coreRoutes) {
  const page = await auditContext.newPage();
  const errors = [];
  const failedResources = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('response', (response) => {
    try {
      const url = new URL(response.url());
      if (url.origin === baseOrigin && response.status() >= 400) failedResources.push({ path: url.pathname, status: response.status() });
    } catch {}
  });
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const severe = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  const thirdPartyScripts = await page.evaluate((origin) => Array.from(document.querySelectorAll('script[src]')).map((el) => new URL(el.src, location.href)).filter((url) => url.origin !== origin).map((url) => url.href), baseOrigin);
  assert(severe.length === 0, `${route} axe serious/critical = 0`, severe);
  assert(errors.length === 0, `${route} has no console/page errors`, errors);
  assert(failedResources.length === 0, `${route} has no failed same-origin resources`, failedResources);
  assert(thirdPartyScripts.length === 0, `${route} has no third-party source scripts`, thirdPartyScripts);
  await page.close();
}

const reducedPage = await auditContext.newPage();
await reducedPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
const reduced = await reducedPage.evaluate(() => {
  const hero = document.querySelector('.hero-sticker');
  const img = document.querySelector('.hero-sticker img');
  const reveal = document.querySelector('.motion-reveal');
  const hs = hero ? getComputedStyle(hero) : null;
  const is = img ? getComputedStyle(img) : null;
  const rs = reveal ? getComputedStyle(reveal) : null;
  return {
    heroAnimation: hs?.animationName || 'none',
    heroTranslate: hs?.translate || 'none',
    imageAnimation: is?.animationName || 'none',
    revealOpacity: rs?.opacity || null,
    revealTransition: rs?.transitionDuration || null
  };
});
assert(reduced.heroAnimation === 'none' && reduced.imageAnimation === 'none', 'reduced motion disables hero animations', reduced);
await reducedPage.close();

const browse = await auditContext.newPage();
await browse.addInitScript(() => {
  window.__copiedText = '';
  try {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.__copiedText = text; } } });
  } catch {}
});
await browse.goto(`${baseURL}/browse.html`, { waitUntil: 'networkidle' });
await browse.waitForFunction(() => document.querySelectorAll('[data-sticker-tile]').length === 152);
await browse.waitForFunction(() => document.querySelectorAll('.tile-download').length === 152);

const initialBrowse = await browse.evaluate(() => ({
  tiles: document.querySelectorAll('[data-sticker-tile]').length,
  visible: Array.from(document.querySelectorAll('[data-sticker-tile]')).filter((el) => !el.hidden).length,
  groups: Array.from(document.querySelectorAll('[data-mood-group]')).map((el) => ({ mood: el.dataset.moodGroup, count: el.querySelectorAll('[data-sticker-tile]').length })),
  mobileDialog: document.querySelectorAll('#mobile-filter-dialog').length
}));
assert(initialBrowse.tiles === 152 && initialBrowse.visible === 152, 'Browse initializes with all 152 stickers visible', initialBrowse);
assert(JSON.stringify(initialBrowse.groups) === JSON.stringify([
  { mood: 'happy', count: 32 },
  { mood: 'attitude', count: 38 },
  { mood: 'chill', count: 32 },
  { mood: 'hype', count: 26 },
  { mood: 'love', count: 24 }
]), 'Browse mood-group counts remain canonical', initialBrowse.groups);
assert(initialBrowse.mobileDialog === 1, 'Browse has exactly one mobile filter dialog');

await browse.click('[data-filter-group="mood"][data-filter-value="happy"]');
await browse.waitForFunction(() => document.querySelector('#result-count')?.textContent?.trim() === '32 stickers');
let filterState = await browse.evaluate(() => ({
  count: document.querySelector('#result-count')?.textContent?.trim(),
  visibleMoods: [...new Set(Array.from(document.querySelectorAll('[data-sticker-tile]')).filter((el) => !el.hidden).map((el) => el.dataset.mood))]
}));
assert(filterState.count === '32 stickers' && filterState.visibleMoods.length === 1 && filterState.visibleMoods[0] === 'happy', 'Happy filter returns exactly 32 stickers', filterState);

await browse.click('[data-filter-group="mood"][data-filter-value="happy"]');
await browse.click('[data-filter-group="color"][data-filter-value="GRN"]');
await browse.waitForFunction(() => document.querySelector('#result-count')?.textContent?.trim() === '40 stickers');
assert((await browse.textContent('#result-count'))?.trim() === '40 stickers', 'Green colorway filter returns 40 stickers');

await browse.click('[data-filter-group="color"][data-filter-value="GRN"]');
await browse.click('[data-filter-group="mood"][data-filter-value="attitude"]');
await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="M"]');
await browse.waitForFunction(() => document.querySelector('#result-count')?.textContent?.trim() === '19 stickers');
const maleAttitude = await browse.evaluate(() => ({
  count: document.querySelector('#result-count')?.textContent?.trim(),
  chip: document.querySelector('[data-filter-group="mood"][data-filter-value="attitude"]')?.textContent?.trim(),
  heading: document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()
}));
assert(maleAttitude.count === '19 stickers' && maleAttitude.chip === 'Swagger' && maleAttitude.heading === 'Swagger', 'male Attitude context becomes Swagger with 19 stickers', maleAttitude);

await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="M"]');
await browse.click('.desktop-secondary-filter [data-filter-group="sex"][data-filter-value="F"]');
await browse.waitForFunction(() => document.querySelector('#result-count')?.textContent?.trim() === '19 stickers');
const femaleAttitude = await browse.evaluate(() => ({
  count: document.querySelector('#result-count')?.textContent?.trim(),
  chip: document.querySelector('[data-filter-group="mood"][data-filter-value="attitude"]')?.textContent?.trim(),
  heading: document.querySelector('[data-mood-group="attitude"] [data-mood-group-label]')?.textContent?.trim()
}));
assert(femaleAttitude.count === '19 stickers' && femaleAttitude.chip === 'Sassy' && femaleAttitude.heading === 'Sassy', 'female Attitude context becomes Sassy with 19 stickers', femaleAttitude);

await browse.goto(`${baseURL}/browse.html`, { waitUntil: 'networkidle' });
await browse.waitForFunction(() => document.querySelectorAll('.tile-download').length === 152);
await browse.click('.browse-tile-link');
await browse.waitForFunction(() => document.querySelector('#sticker-viewer')?.open === true);
const dialogState = await browse.evaluate(() => ({
  open: document.querySelector('#sticker-viewer')?.open,
  image: document.querySelector('#sticker-viewer-image')?.src,
  download: document.querySelector('#sticker-viewer-download')?.getAttribute('download'),
  usage: document.querySelector('.sticker-viewer-usage')?.textContent?.trim(),
  id: document.querySelector('#sticker-viewer-id')?.textContent?.trim()
}));
assert(dialogState.open && dialogState.image.startsWith(baseOrigin + '/stickers/') && /^gwap-.+\.png$/.test(dialogState.download || ''), 'sticker dialog opens with same-origin PNG and exact download filename', dialogState);
assert(dialogState.usage === 'Free for personal use. Commercial use needs written permission.', 'dialog usage copy remains exact');
const firstId = dialogState.id;
await browse.keyboard.press('ArrowRight');
await browse.waitForFunction((oldId) => document.querySelector('#sticker-viewer-id')?.textContent?.trim() !== oldId, firstId);
assert((await browse.textContent('#sticker-viewer-id'))?.trim() !== firstId, 'dialog ArrowRight navigation advances sticker');
await browse.click('#sticker-viewer-copy');
await browse.waitForFunction(() => window.__copiedText?.startsWith('https://www.lilgwapz.xyz/s/'));
const copied = await browse.evaluate(() => window.__copiedText);
assert(/^https:\/\/www\.lilgwapz\.xyz\/s\/[a-z0-9-]+\.html$/.test(copied), 'Copy link uses canonical www sticker URL', copied);
await browse.click('#sticker-viewer-close');
assert(!(await browse.evaluate(() => document.querySelector('#sticker-viewer')?.open)), 'sticker dialog closes cleanly');

await browse.setViewportSize({ width: 375, height: 812 });
await browse.click('#mobile-filter-open');
await browse.waitForFunction(() => document.querySelector('#mobile-filter-dialog')?.open === true);
assert(await browse.evaluate(() => document.querySelector('#mobile-filter-dialog')?.open === true), 'mobile Character & color dialog opens');
await browse.click('#mobile-filter-close');
await browse.close();

const unknown = await auditContext.newPage();
const unknownResponse = await unknown.goto(`${baseURL}/definitely-not-a-lil-gwapz-page`, { waitUntil: 'networkidle' });
const unknownState = await unknown.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.textContent?.trim() || '', links: document.querySelectorAll('.not-found-actions a').length }));
assert(unknownResponse?.status() === 404, 'unknown route preserves HTTP 404', unknownResponse?.status());
assert(/Page Not Found/i.test(unknownState.title) && /Page not found/i.test(unknownState.h1) && unknownState.links >= 2, 'unknown route renders branded custom 404', unknownState);
await unknown.close();

const stickerCssResponse = await auditContext.request.get(`${baseURL}/s/legal.css`);
assert(stickerCssResponse.status() === 200, '/s/legal.css rollback-sensitive generated dependency returns 200', stickerCssResponse.status());

const linkSources = ['/', '/browse.html', '/terms.html', '/ip-policy.html', '/privacy.html', '/s/big-smile-male.html', '/404.html'];
const internalLinks = new Set();
for (const route of linkSources) {
  const page = await auditContext.newPage();
  await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  const hrefs = await page.evaluate((origin) => Array.from(document.querySelectorAll('a[href]')).map((a) => {
    try { const u = new URL(a.href, location.href); u.hash = ''; return u.origin === origin ? u.href : null; } catch { return null; }
  }).filter(Boolean), baseOrigin);
  hrefs.forEach((href) => internalLinks.add(href));
  await page.close();
}
const brokenLinks = [];
const internalList = [...internalLinks].sort();
for (let i = 0; i < internalList.length; i += 16) {
  const chunk = internalList.slice(i, i + 16);
  const results = await Promise.all(chunk.map(async (href) => {
    try { const response = await auditContext.request.get(href, { maxRedirects: 5 }); return { href, status: response.status() }; }
    catch (error) { return { href, status: 0, error: String(error) }; }
  }));
  brokenLinks.push(...results.filter((item) => item.status < 200 || item.status >= 400));
}
assert(brokenLinks.length === 0, 'all discovered internal links resolve below HTTP 400', brokenLinks.slice(0, 20));
pass('internal link crawl checked URLs', internalList.length);

await auditContext.close();

const jsOff = await browser.newContext({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
for (const [route, check] of [
  ['/', async (page) => ({ h1: await page.locator('h1').count(), moods: await page.locator('.mood-tile').count() })],
  ['/browse.html', async (page) => ({ tiles: await page.locator('[data-sticker-tile]').count() })],
  ['/404.html', async (page) => ({ h1: await page.locator('h1').count(), actions: await page.locator('.not-found-actions a').count() })]
]) {
  const page = await jsOff.newPage();
  await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
  const state = await check(page);
  if (route === '/') assert(state.h1 === 1 && state.moods === 5, 'Home remains usable with JavaScript disabled', state);
  if (route === '/browse.html') assert(state.tiles === 152, 'Browse exposes all 152 tiles with JavaScript disabled', state);
  if (route === '/404.html') assert(state.h1 === 1 && state.actions >= 2, '404 recovery remains usable with JavaScript disabled', state);
  await page.close();
}
await jsOff.close();

await browser.close();

const screenshotHashes = {};
for (const file of fs.readdirSync(artifactDir).filter((name) => name.endsWith('.png')).sort()) {
  screenshotHashes[file] = crypto.createHash('sha256').update(fs.readFileSync(path.join(artifactDir, file))).digest('hex');
}
console.log('STAGE62_STATIC', JSON.stringify(staticState, null, 2));
console.log('STAGE62_BROWSER_MATRIX', JSON.stringify(browserSummary, null, 2));
console.log('STAGE62_SCREENSHOT_HASHES', JSON.stringify(screenshotHashes, null, 2));

if (failed) process.exit(1);
console.log('STAGE62_FULL_QA_PASS');
