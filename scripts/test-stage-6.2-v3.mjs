import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const sourcePath = path.join(root, 'scripts', 'test-stage-6.2-v2.mjs');
const runtimePath = path.join(root, 'scripts', '.stage-6.2-v3-runtime.mjs');

const original = fs.readFileSync(sourcePath, 'utf8');
const before = `const firstId=dialog.id;\nawait browse.keyboard.press('ArrowRight');\nawait browse.waitForFunction(id=>document.querySelector('#sticker-viewer-id')?.textContent?.trim()!==id,firstId);\ncheck((await browse.textContent('#sticker-viewer-id'))?.trim()!==firstId,'ArrowRight advances within visible sticker order');`;
const after = `const firstDownload=dialog.download;\nawait browse.keyboard.press('ArrowRight');\nawait browse.waitForFunction(download=>document.querySelector('#sticker-viewer-download')?.getAttribute('download')!==download,firstDownload);\nconst arrowState=await browse.evaluate(()=>({id:document.querySelector('#sticker-viewer-id')?.textContent?.trim(),download:document.querySelector('#sticker-viewer-download')?.getAttribute('download'),image:document.querySelector('#sticker-viewer-image')?.src,mood:document.querySelector('#sticker-viewer-mood')?.textContent?.trim()}));\ncheck(arrowState.download!==firstDownload&&arrowState.image!==dialog.image,'ArrowRight advances within visible sticker order',arrowState);`;

if (!original.includes(before)) {
  throw new Error('Stage 6.2 v2 ArrowRight assertion block was not found; refusing to patch an unexpected harness.');
}

fs.writeFileSync(runtimePath, original.replace(before, after));
console.log('Stage 6.2 v3 harness: ArrowRight assertion now tracks unique sticker download/image rather than shared reaction ID.');

try {
  await import(`${pathToFileURL(runtimePath).href}?v=${Date.now()}`);
} finally {
  try { fs.unlinkSync(runtimePath); } catch {}
}
