import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const failures = [];

page.on('response', (response) => {
  if (response.status() >= 400) failures.push({ status: response.status(), url: response.url() });
});
page.on('requestfailed', (request) => {
  failures.push({ failed: true, url: request.url(), error: request.failure()?.errorText || null });
});

await page.goto(`${baseURL}/s/big-smile-male.html`, { waitUntil: 'networkidle' });
console.log('STAGE61_RESOURCE_DIAGNOSTIC', JSON.stringify(failures, null, 2));
await browser.close();
