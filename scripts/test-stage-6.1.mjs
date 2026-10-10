import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const root = process.cwd();
const evidenceDir = path.join(root, 'artifacts', 'stage-6.1');
fs.mkdirSync(evidenceDir, { recursive: true });

const fail = (message, details) => {
  const extra = details === undefined ? '' : `\n${JSON.stringify(details, null, 2)}`;
  throw new Error(`${message}${extra}`);
};
const assert = (condition, message, details) => {
  if (!condition) fail(message, details);
};

assert(fs.existsSync(path.join(root, '404.html')), 'source 404.html exists');
assert(fs.existsSync(path.join(root, 'dist', '404.html')), 'dist/404.html exists');

const routes = [
  '/',
  '/browse.html',
  '/terms.html',
  '/ip-policy.html',
  '/privacy.html',
  '/s/big-smile-male.html',
  '/404.html'
];

const browser = await chromium.launch({ headless: true });
const routeResults = [];

for (const route of routes) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedResponses = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
  });
  page.on('requestfailed', (request) => {
    failedResponses.push({ failed: true, url: request.url(), error: request.failure()?.errorText || null });
  });

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  assert(response?.status() === 200, `${route} returns HTTP 200`, { status: response?.status() });

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const seriousCritical = axe.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical'
  );
  assert(seriousCritical.length === 0, `${route} has no serious/critical axe violations`, seriousCritical.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 10).map((node) => node.target)
  })));

  assert(consoleErrors.length === 0, `${route} has no console errors`, consoleErrors);
  assert(failedResponses.length === 0, `${route} has no failed resource responses`, failedResponses);

  const visual = await page.evaluate(() => {
    const canonicalGreen = 'rgb(19, 221, 19)';
    const canonicalBg = 'rgb(9, 8, 13)';
    const transparent = 'rgba(0, 0, 0, 0)';
    const legacyPattern = /(?:rgb|rgba)\(24,\s*225,\s*58(?:,|\))/i;
    const legacyHeroPattern = /rgba\(13,\s*225,\s*57,/i;

    const directText = (el) => Array.from(el.childNodes).some((node) =>
      node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0
    );

    const nearestPaint = (el) => {
      let current = el;
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== 'none') return `image:${style.backgroundImage}`;
        if (style.backgroundColor && style.backgroundColor !== transparent) return style.backgroundColor;
        current = current.parentElement;
      }
      return null;
    };

    const relativeLuminance = (rgb) => {
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return 1;
      const channels = match.slice(1, 4).map(Number).map((v) => {
        const c = v / 255;
        return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
      });
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    };

    const greenTextViolations = [];
    const greenFillViolations = [];
    const legacyGreenPaint = [];

    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if (style.color === canonicalGreen && directText(el)) {
        const paint = nearestPaint(el);
        if (paint !== canonicalBg) {
          greenTextViolations.push({
            tag: el.tagName,
            cls: typeof el.className === 'string' ? el.className : '',
            text: el.textContent.trim().slice(0, 100),
            paint
          });
        }
      }

      if (style.backgroundColor === canonicalGreen && directText(el)) {
        if (relativeLuminance(style.color) >= .20) {
          greenFillViolations.push({
            tag: el.tagName,
            cls: typeof el.className === 'string' ? el.className : '',
            text: el.textContent.trim().slice(0, 100),
            color: style.color
          });
        }
      }

      const paintProps = {
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderTopColor: style.borderTopColor,
        borderRightColor: style.borderRightColor,
        borderBottomColor: style.borderBottomColor,
        borderLeftColor: style.borderLeftColor,
        boxShadow: style.boxShadow,
        textShadow: style.textShadow
      };
      for (const [property, value] of Object.entries(paintProps)) {
        if (legacyPattern.test(value) || legacyHeroPattern.test(value)) {
          legacyGreenPaint.push({
            tag: el.tagName,
            cls: typeof el.className === 'string' ? el.className : '',
            property,
            value: value.slice(0, 220)
          });
          break;
        }
      }
    }

    const targetSelectors = [
      '.header-cta', '.desktop-nav a', '.site-footer a', '.mobile-nav a',
      '.legal-sidebar nav a', '.legal-action-link', '.button', '.text-link',
      '.filter-chip', '#mobile-filter-open', '.sticker-viewer-close', '.sticker-viewer-nav'
    ].join(',');
    const undersizedTargets = Array.from(document.querySelectorAll(targetSelectors))
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          cls: typeof el.className === 'string' ? el.className : '',
          text: el.textContent.trim().slice(0, 80),
          width: rect.width,
          height: rect.height
        };
      })
      .filter((item) => item.width < 44 || item.height < 44);

    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      greenTextViolations,
      greenFillViolations,
      legacyGreenPaint,
      undersizedTargets,
      gwapGreen: getComputedStyle(document.documentElement).getPropertyValue('--gwap-green').trim(),
      greenAlias: getComputedStyle(document.documentElement).getPropertyValue('--green').trim()
    };
  });

  assert(visual.scrollWidth <= visual.width + 1, `${route} has no horizontal overflow`, visual);
  assert(visual.greenTextViolations.length === 0, `${route} obeys green-text background rule`, visual.greenTextViolations);
  assert(visual.greenFillViolations.length === 0, `${route} uses dark text on green fills`, visual.greenFillViolations);
  assert(visual.legacyGreenPaint.length === 0, `${route} has no rendered legacy green paint`, visual.legacyGreenPaint);
  assert(visual.undersizedTargets.length === 0, `${route} critical interactive targets are at least 44x44`, visual.undersizedTargets);
  assert(visual.gwapGreen.toLowerCase() === '#13dd13', `${route} canonical --gwap-green is #13dd13`, visual);

  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    return {
      tag: el?.tagName || null,
      text: el?.textContent?.trim().slice(0, 80) || '',
      outlineStyle: style?.outlineStyle || null,
      outlineWidth: style?.outlineWidth || null,
      outlineColor: style?.outlineColor || null
    };
  });
  assert(focus.tag && focus.tag !== 'BODY', `${route} Tab reaches an interactive element`, focus);
  assert(focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth || '0') >= 2, `${route} keyboard focus is visibly outlined`, focus);

  if (route === '/browse.html') {
    const browseContract = await page.evaluate(() => ({
      tiles: document.querySelectorAll('[data-sticker-tile]').length,
      mobileFilterOpen: document.querySelectorAll('#mobile-filter-open').length,
      mobileFilterDialog: document.querySelectorAll('#mobile-filter-dialog').length
    }));
    assert(browseContract.tiles === 152, 'Browse retains 152 static tiles', browseContract);
    assert(browseContract.mobileFilterOpen === 1, 'Browse retains one mobile filter trigger', browseContract);
    assert(browseContract.mobileFilterDialog === 1, 'Browse retains one generated mobile filter dialog', browseContract);
  }

  if (route === '/') {
    const reduced = await page.evaluate(() => {
      const sticker = document.querySelector('.hero-sticker');
      const image = document.querySelector('.hero-sticker img');
      const stickerStyle = sticker ? getComputedStyle(sticker) : null;
      const imageStyle = image ? getComputedStyle(image) : null;
      return {
        stickerAnimation: stickerStyle?.animationName || null,
        stickerTranslate: stickerStyle?.translate || null,
        imageAnimation: imageStyle?.animationName || null
      };
    });
    assert(reduced.stickerAnimation === 'none' && reduced.imageAnimation === 'none', 'Reduced motion disables hero animation', reduced);
  }

  if (route === '/404.html') {
    const notFound = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent.trim() || '',
      home: document.querySelector('.not-found-actions a[href="/"]')?.getAttribute('href') || null,
      browse: document.querySelector('.not-found-actions a[href="/browse.html"]')?.getAttribute('href') || null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null
    }));
    assert(/page not found/i.test(notFound.h1), '404 has a clear H1', notFound);
    assert(notFound.home === '/' && notFound.browse === '/browse.html', '404 exposes Home and Browse recovery links', notFound);
    assert(/noindex/i.test(notFound.robots || ''), '404 is noindex', notFound);
  }

  routeResults.push({ route, axeSeriousCritical: 0, consoleErrors: 0, focus, visual });
  await context.close();
}

// The static server should use the custom 404 document for an unknown route and preserve HTTP 404.
{
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseURL}/definitely-not-a-lil-gwapz-page`, { waitUntil: 'networkidle' });
  const state = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent.trim() || '',
    hasHome: Boolean(document.querySelector('a[href="/"]')),
    hasBrowse: Boolean(document.querySelector('a[href="/browse.html"]'))
  }));
  assert(response?.status() === 404, 'Unknown route preserves HTTP 404', { status: response?.status(), state });
  assert(/page not found/i.test(state.title) && /page not found/i.test(state.h1), 'Unknown route renders custom Lil Gwapz 404', state);
  assert(state.hasHome && state.hasBrowse, 'Unknown route provides recovery links', state);
  await context.close();
}

// 404 must remain usable with JavaScript completely disabled.
{
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/404.html`, { waitUntil: 'domcontentloaded' });
  const state = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent.trim() || '',
    home: Boolean(document.querySelector('.not-found-actions a[href="/"]')),
    browse: Boolean(document.querySelector('.not-found-actions a[href="/browse.html"]'))
  }));
  assert(/page not found/i.test(state.h1) && state.home && state.browse, '404 remains fully usable with JavaScript disabled', state);
  await context.close();
}

// Prior-stage JS-off Browse contract remains intact.
{
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/browse.html`, { waitUntil: 'domcontentloaded' });
  const state = await page.evaluate(() => ({
    tiles: document.querySelectorAll('[data-sticker-tile]').length,
    visibleTiles: Array.from(document.querySelectorAll('[data-sticker-tile]')).filter((el) => getComputedStyle(el).display !== 'none').length,
    mobileFilterDialog: document.querySelectorAll('#mobile-filter-dialog').length
  }));
  assert(state.tiles === 152 && state.visibleTiles === 152 && state.mobileFilterDialog === 1, 'JS-off Browse retains all 152 tiles and generated dialog', state);
  await context.close();
}

// Screenshot evidence.
{
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  await mobile.goto(`${baseURL}/404.html`, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: path.join(evidenceDir, 'mobile-404-375.png'), fullPage: true });
  await mobile.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: path.join(evidenceDir, 'mobile-home-375.png'), fullPage: true });
  await mobile.goto(`${baseURL}/browse.html`, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: path.join(evidenceDir, 'mobile-browse-375.png'), fullPage: true });
  await mobile.close();

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await desktop.goto(`${baseURL}/404.html`, { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: path.join(evidenceDir, 'desktop-404-1280.png'), fullPage: true });
  await desktop.close();
}

await browser.close();
console.log('STAGE61_BROWSER_PASS');
console.log(JSON.stringify({ routes: routeResults.map((r) => ({ route: r.route, focus: r.focus })) }, null, 2));
