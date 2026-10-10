import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send('Network.enable');
await client.send('Log.enable');

const rows = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') rows.push({ kind: 'console', text: msg.text(), location: msg.location() });
});
page.on('pageerror', (error) => rows.push({ kind: 'pageerror', text: String(error) }));
page.on('response', (response) => {
  if (response.status() >= 400) rows.push({ kind: 'response', status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
});
page.on('requestfailed', (request) => rows.push({ kind: 'requestfailed', url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText || null }));
client.on('Network.responseReceived', ({ response, type }) => {
  if (response.status >= 400) rows.push({ kind: 'cdp-response', status: response.status, url: response.url, type });
});
client.on('Log.entryAdded', ({ entry }) => {
  if (entry.level === 'error') rows.push({ kind: 'cdp-log', source: entry.source, text: entry.text, url: entry.url || null, lineNumber: entry.lineNumber ?? null });
});

const response = await page.goto(`${baseURL}/s/big-smile-male.html`, { waitUntil: 'networkidle' });
const beforeAxe = rows.slice();
const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
await page.waitForTimeout(500);
const afterAxe = rows.slice();

console.log('STAGE61_AXE_CONSOLE_TRACE', JSON.stringify({
  status: response?.status() ?? null,
  violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
  beforeAxe,
  afterAxe,
  scripts: await page.evaluate(() => Array.from(document.scripts).map((s) => s.src || '[inline]'))
}, null, 2));

await client.detach();
await context.close();
await browser.close();
