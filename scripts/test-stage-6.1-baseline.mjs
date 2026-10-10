import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const root = process.cwd();
const routes = [
  '/',
  '/browse.html',
  '/terms.html',
  '/ip-policy.html',
  '/privacy.html',
  '/s/big-smile-male.html'
];

const cssLikeFiles = [
  'styles.css',
  'legal.css',
  'css/tokens.css',
  'css/motion.css',
  'css/mood-showcase.css',
  'css/browse-tiles.css',
  'css/browse-groups.css',
  'css/dialog.css'
].filter((file) => fs.existsSync(path.join(root, file)));

const legacyGreenHits = [];
for (const file of cssLikeFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/#18e13a\b/i.test(line) || /rgba\(24\s*,\s*225\s*,\s*58\s*,/i.test(line)) {
      legacyGreenHits.push({ file, line: index + 1, sample: line.trim().slice(0, 240) });
    }
  });
}

const staticState = {
  has404: fs.existsSync(path.join(root, '404.html')),
  distHas404: fs.existsSync(path.join(root, 'dist', '404.html')),
  legacyGreenHits
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
const results = [];

for (const route of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const seriousCritical = axe.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 8).map((n) => n.target)
    }));

  const visualState = await page.evaluate(() => {
    const canonicalGreen = 'rgb(19, 221, 19)';
    const canonicalBg = 'rgb(9, 8, 13)';
    const transparent = 'rgba(0, 0, 0, 0)';

    const directText = (el) => Array.from(el.childNodes).some((node) =>
      node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0
    );

    const nearestSolidBackground = (el) => {
      let current = el;
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          return `image:${style.backgroundImage.slice(0, 90)}`;
        }
        if (style.backgroundColor && style.backgroundColor !== transparent) return style.backgroundColor;
        current = current.parentElement;
      }
      return null;
    };

    const greenText = [];
    const greenFill = [];
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if (style.color === canonicalGreen && directText(el)) {
        greenText.push({
          tag: el.tagName,
          cls: typeof el.className === 'string' ? el.className : '',
          text: el.textContent.trim().slice(0, 80),
          background: nearestSolidBackground(el)
        });
      }
      if (style.backgroundColor === canonicalGreen) {
        greenFill.push({
          tag: el.tagName,
          cls: typeof el.className === 'string' ? el.className : '',
          text: el.textContent.trim().slice(0, 80),
          color: style.color
        });
      }
    }

    return {
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      greenText,
      greenTextOffCanonicalBg: greenText.filter((x) => x.background !== canonicalBg),
      greenFill,
      greenFillNonDarkText: greenFill.filter((x) => {
        const m = x.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!m) return true;
        const [r, g, b] = m.slice(1).map(Number);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 110;
      })
    };
  });

  results.push({
    route,
    status: response?.status() ?? null,
    title: await page.title(),
    seriousCritical,
    consoleErrors,
    visualState
  });
  await page.close();
}

await browser.close();
console.log('STAGE61_BASELINE_START');
console.log(JSON.stringify({ staticState, results }, null, 2));
console.log('STAGE61_BASELINE_END');
