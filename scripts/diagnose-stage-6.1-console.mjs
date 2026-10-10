import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const target = '/s/big-smile-male.html';
const sequence = ['/', '/browse.html', '/terms.html', '/ip-policy.html', '/privacy.html', target];

const browser = await chromium.launch({ headless: true });

async function traceScenario(name, routes, reusePage) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  const rows = [];
  let page = reusePage ? await context.newPage() : null;

  for (const route of routes) {
    if (!reusePage) page = await context.newPage();
    const events = {
      route,
      console: [],
      pageErrors: [],
      responses400: [],
      requestFailed: [],
      cdpLog: [],
      cdpResponses400: []
    };

    const client = await context.newCDPSession(page);
    await client.send('Log.enable');
    await client.send('Network.enable');

    const onConsole = (msg) => events.console.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    const onPageError = (error) => events.pageErrors.push(String(error));
    const onResponse = (response) => {
      if (response.status() >= 400) events.responses400.push({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
    };
    const onFailed = (request) => events.requestFailed.push({ url: request.url(), resourceType: request.resourceType(), error: request.failure()?.errorText || null });
    const onLog = (entry) => {
      const e = entry.entry;
      if (e.level === 'error' || /404|not found|failed to load/i.test(e.text || '')) {
        events.cdpLog.push({ source: e.source, level: e.level, text: e.text, url: e.url || null, lineNumber: e.lineNumber ?? null });
      }
    };
    const onCdpResponse = ({ response, type }) => {
      if (response.status >= 400) events.cdpResponses400.push({ status: response.status, url: response.url, type });
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    page.on('response', onResponse);
    page.on('requestfailed', onFailed);
    client.on('Log.entryAdded', onLog);
    client.on('Network.responseReceived', onCdpResponse);

    const navigation = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    events.navigationStatus = navigation?.status() ?? null;
    events.title = await page.title();
    events.resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize
    })));
    events.documentLinks = await page.evaluate(() => ({
      icons: Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')).map((el) => ({ rel: el.rel, href: el.href })),
      styles: Array.from(document.styleSheets).map((sheet) => sheet.href).filter(Boolean),
      scripts: Array.from(document.scripts).map((script) => script.src).filter(Boolean),
      images: Array.from(document.images).map((img) => ({ src: img.currentSrc || img.src, complete: img.complete, naturalWidth: img.naturalWidth }))
    }));

    rows.push(events);

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('response', onResponse);
    page.off('requestfailed', onFailed);
    await client.detach();
    if (!reusePage) await page.close();
  }

  if (reusePage) await page.close();
  await context.close();
  return { name, reusePage, rows };
}

const results = [];
results.push(await traceScenario('sticker-alone-fresh-page', [target], false));
results.push(await traceScenario('full-sequence-fresh-page-each-route', sequence, false));
results.push(await traceScenario('full-sequence-reuse-one-page', sequence, true));

await browser.close();
console.log('STAGE61_CONSOLE_DIAGNOSTIC_START');
console.log(JSON.stringify(results, null, 2));
console.log('STAGE61_CONSOLE_DIAGNOSTIC_END');
