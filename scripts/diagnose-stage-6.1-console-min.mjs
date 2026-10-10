import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send('Network.enable');
await client.send('Log.enable');

const rows = [];
client.on('Network.responseReceived', ({ response, type }) => {
  if (response.status >= 400) rows.push({ kind: 'response', status: response.status, url: response.url, type });
});
client.on('Network.requestWillBeSent', ({ request, initiator, type }) => {
  if (/stickers\.json/i.test(request.url)) rows.push({ kind: 'request', url: request.url, type, initiator });
});
client.on('Log.entryAdded', ({ entry }) => {
  if (entry.level === 'error' || /404|failed to load|stickers\.json/i.test(entry.text || '')) {
    rows.push({ kind: 'log', level: entry.level, source: entry.source, text: entry.text, url: entry.url || null, lineNumber: entry.lineNumber ?? null });
  }
});
page.on('console', (msg) => {
  if (msg.type() === 'error' || /stickers\.json/i.test(msg.text())) rows.push({ kind: 'console', type: msg.type(), text: msg.text(), location: msg.location() });
});

await page.goto(`${baseURL}/s/big-smile-male.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const scripts = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src || '[inline]'));
console.log('STAGE61_MIN_TRACE', JSON.stringify({ scripts, rows }, null, 2));

await client.detach();
await context.close();
await browser.close();
