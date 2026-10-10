const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

cp.execFileSync(process.execPath, [path.join(__dirname, 'build-stage-1.2.cjs')], {
  cwd: root,
  stdio: 'inherit'
});

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const files = [
  'index.html','browse.html','ip-policy.html','privacy.html','terms.html',
  'app.js','styles.css','legal.css','legal.js',
  'favicon.ico','favicon-32.png','favicon-96.png','apple-touch-icon.png','site.webmanifest',
  'sitemap.xml','robots.txt'
];

for (const file of files) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, file));
}

for (const dir of ['assets/brand','css','data','js','stickers','thumbs','s','og']) {
  const src = path.join(root, dir);
  const dst = path.join(dist, dir);
  if (fs.existsSync(src)) fs.cpSync(src, dst, { recursive: true });
}

const count = (dir, ext) => fs.readdirSync(path.join(dist, dir)).filter((name) => name.endsWith(ext)).length;
const result = {
  stickers: count('stickers', '.png'),
  thumbs: count('thumbs', '.webp'),
  pages: count('s', '.html'),
  og: count('og', '.jpg')
};

if (result.stickers !== 152 || result.thumbs !== 152 || result.pages !== 152 || result.og < 152) {
  throw new Error(`Unexpected preview build counts: ${JSON.stringify(result)}`);
}

console.log('dist ready', result);
