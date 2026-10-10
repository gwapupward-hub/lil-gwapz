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
  'index.html','browse.html','ip-policy.html','privacy.html','terms.html','404.html',
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

// styles.css imports legal.css relatively. Audit/runtime consumers that re-inject the
// stylesheet from a generated /s/... document resolve that import as /s/legal.css.
// Keep the generated detail surface self-contained at that exact path.
const generatedLegalCss = path.join(dist, 's', 'legal.css');
fs.copyFileSync(path.join(root, 'legal.css'), generatedLegalCss);

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
if (!fs.existsSync(path.join(dist, '404.html'))) throw new Error('Missing dist/404.html');
if (!fs.existsSync(generatedLegalCss)) throw new Error('Missing dist/s/legal.css');

console.log('dist ready', result);
