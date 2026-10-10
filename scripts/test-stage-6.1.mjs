import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const baseOrigin = new URL(baseURL).origin;
const root = process.cwd();
const artifactDir = path.join(root, 'artifacts', 'stage-6.1');
fs.mkdirSync(artifactDir, { recursive: true });

const fail = (message, detail) => {
  console.error(`FAIL: ${message}`);
  if (detail !== undefined) console.error(typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2));
  process.exitCode = 1;
};
const pass = (message, detail) => console.log(`PASS: ${message}${detail !== undefined ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);

const tokens = fs.readFileSync(path.join(root, 'css', 'tokens.css'), 'utf8');
const dist404 = path.join(root, 'dist', '404.html');
const distStickerDir = path.join(root, 'dist', 'stickers');
const distThumbDir = path.join(root, 'dist', 'thumbs');
const distPageDir = path.join(root, 'dist', 's');

if (/--gwap-green:\s*#13dd13\b/i.test(tokens)) pass('canonical Gwap Green token is #13DD13');
else fail('canonical Gwap Green token is #13DD13');

if (fs.existsSync(path.join(root, '404.html')) && fs.existsSync(dist404)) pass('custom 404 exists in source and dist');
else fail('custom 404 exists in source and dist');

const count = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith(ext)).length : 0;
const counts = {
  stickers: count(distStickerDir, '.png'),
  thumbs: count(distThumbDir, '.webp'),
  pages: count(distPageDir, '.html')
};
if (counts.stickers === 152 && counts.thumbs === 152 && counts.pages === 152) pass('generated collection counts preserved', counts);
else fail('generated collection counts preserved', counts);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
const routes = ['/', '/browse.html', '/terms.html', '/ip-policy.html', '/privacy.html', '/s/big-smile-male.html', '/404.html'];
const routeResults = [];

const auditGreen = async (page) => page.evaluate(() => {
  const canonicalGreen = 'rgb(19, 221, 19)';
  const canonicalBg = 'rgb(9, 8, 13)';
  const transparent = 'rgba(0, 0, 0, 0)';
  const directText = (el) => Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  const nearestBackground = (el) => {
    let current = el;
    while (current) {
      const style = getComputedStyle(current);
      if (style.backgroundImage && style.backgroundImage !== 'none') return `image:${style.backgroundImage}`;
      if (style.backgroundColor && style.backgroundColor !== transparent) return style.backgroundColor;
      current = current.parentElement;
    }
    return null;
  };
  const textOffCanonical = [];
  const fillsWithLightText = [];
  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    if (style.color === canonicalGreen && directText(el)) {
      const background = nearestBackground(el);
      if (background !== canonicalBg) textOffCanonical.push({ tag: el.tagName, className: String(el.className || ''), text: el.textContent.trim().slice(0, 80), background });
    }
    if (style.backgroundColor === canonicalGreen && directText(el)) {
      const match = style.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) fillsWithLightText.push({ tag: el.tagName, className: String(el.className || ''), text: el.textContent.trim().slice(0, 80), color: style.color });
      else {
        const [r, g, b] = match.slice(1).map(Number);
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luminance > 110) fillsWithLightText.push({ tag: el.tagName, className: String(el.className || ''), text: el.textContent.trim().slice(0, 80), color: style.color });
      }
    }
  }
  return { textOffCanonical, fillsWithLightText };
});

for (const route of routes) {
  const page = await context.newPage();
  const badResponses = [];
  const pageErrors = [];
  page.on('response', (response) => {
    try {
      const u = new URL(response.url());
      if (u.origin === baseOrigin && response.status() >= 400) badResponses.push({ url: u.pathname, status: response.status() });
    } catch {}
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const seriousCritical = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  const green = await auditGreen(page);
  const overflow = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  const targets = await page.evaluate(() => Array.from(document.querySelectorAll('a,button,select')).filter((el) => {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
  }).map((el) => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, text: el.textContent.trim().slice(0,60), width: r.width, height: r.height };
  }).filter((x) => x.width < 44 || x.height < 44));

  if (seriousCritical.length === 0) pass(`axe serious/critical = 0 ${route}`); else fail(`axe serious/critical = 0 ${route}`, seriousCritical);
  if (pageErrors.length === 0) pass(`no page errors ${route}`); else fail(`no page errors ${route}`, pageErrors);
  if (badResponses.length === 0) pass(`no same-origin HTTP failures ${route}`); else fail(`no same-origin HTTP failures ${route}`, badResponses);
  if (green.textOffCanonical.length === 0) pass(`green text only on #09080D ${route}`); else fail(`green text only on #09080D ${route}`, green.textOffCanonical);
  if (green.fillsWithLightText.length === 0) pass(`green fills use dark text ${route}`); else fail(`green fills use dark text ${route}`, green.fillsWithLightText);
  if (overflow.scrollWidth <= overflow.width) pass(`no horizontal overflow ${route}`); else fail(`no horizontal overflow ${route}`, overflow);
  if (targets.length === 0) pass(`visible link/button/select targets >=44px ${route}`); else fail(`visible link/button/select targets >=44px ${route}`, targets.slice(0, 20));

  routeResults.push({ route, status: response?.status() ?? null, seriousCritical: seriousCritical.length, badResponses, pageErrors, green, overflow, smallTargets: targets.length });

  if (route === '/' || route === '/browse.html' || route === '/404.html') {
    const name = route === '/' ? 'home-375.png' : route === '/browse.html' ? 'browse-375.png' : '404-375.png';
    await page.screenshot({ path: path.join(artifactDir, name), fullPage: true });
  }
  await page.close();
}

const page404 = await context.newPage();
await page404.goto(`${baseURL}/404.html`, { waitUntil: 'networkidle' });
const notFound = await page404.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim(),
  noindex: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
  browseHref: document.querySelector('.not-found-actions a')?.getAttribute('href') || ''
}));
if (notFound.title === 'Page not found — Lil Gwapz' && notFound.h1 === 'Lost in the Gwap.' && /noindex/i.test(notFound.noindex) && notFound.browseHref === '/browse.html') pass('custom 404 semantic contract', notFound);
else fail('custom 404 semantic contract', notFound);
await page404.close();

const focusPage = await context.newPage();
await focusPage.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
await focusPage.keyboard.press('Tab');
const focusState = await focusPage.evaluate(() => {
  const el = document.activeElement; const style = el ? getComputedStyle(el) : null;
  return { tag: el?.tagName || null, outlineStyle: style?.outlineStyle || null, outlineWidth: style?.outlineWidth || null, outlineColor: style?.outlineColor || null };
});
if (focusState.tag === 'A' && focusState.outlineStyle !== 'none' && parseFloat(focusState.outlineWidth || '0') >= 2) pass('keyboard focus indicator is visible', focusState);
else fail('keyboard focus indicator is visible', focusState);
await focusPage.close();

const jsOffContext = await browser.newContext({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
const jsOffPage = await jsOffContext.newPage();
await jsOffPage.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
const jsOff = await jsOffPage.evaluate(() => ({ h1: document.querySelector('h1')?.textContent?.trim() || '', moodLinks: document.querySelectorAll('.mood-tile').length, footerLinks: document.querySelectorAll('.footer-group a').length }));
if (jsOff.h1 && jsOff.moodLinks === 5 && jsOff.footerLinks >= 10) pass('home content remains visible with JavaScript disabled', jsOff);
else fail('home content remains visible with JavaScript disabled', jsOff);
await jsOffContext.close();

await context.close();
await browser.close();

const screenshotHashes = {};
for (const name of fs.readdirSync(artifactDir).filter((x) => x.endsWith('.png')).sort()) {
  screenshotHashes[name] = crypto.createHash('sha256').update(fs.readFileSync(path.join(artifactDir, name))).digest('hex');
}
console.log('STAGE61_SCREENSHOT_HASHES', JSON.stringify(screenshotHashes, null, 2));
console.log('STAGE61_RESULTS', JSON.stringify(routeResults, null, 2));
if (process.exitCode) process.exit(process.exitCode);
