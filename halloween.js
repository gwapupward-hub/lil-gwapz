(() => {
  'use strict';
  const grid = document.getElementById('sticker-grid');
  const status = document.getElementById('result-status');
  const empty = document.getElementById('no-results');
  const input = document.getElementById('sticker-search');
  const viewer = document.getElementById('viewer');
  const closeViewer = document.getElementById('viewer-close');
  const filters = [...document.querySelectorAll('.filter')];
  const items = [];
  let filter = 'all';
  const cleanPath = path => {
    // All paths are read from our local, controlled collection manifest.
    if (typeof path !== 'string' || !/^\/assets\/halloween-2026\/(masters|previews)\/[A-Za-z0-9-]+\.(png|webp)$/.test(path)) return '';
    return path;
  };
  function render() {
    const query = input.value.trim().toLowerCase();
    const visible = items.filter(s => (filter === 'all' || s.gender === filter) &&
      `${s.title} ${s.emotion} ${s.id}`.toLowerCase().includes(query));
    status.textContent = `${visible.length} of ${items.length} Halloween stickers shown`;
    grid.replaceChildren();
    for (const s of visible) {
      const article = document.createElement('article');
      article.className = 'sticker-card';
      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'sticker-art';
      preview.setAttribute('aria-label', `Preview ${s.title}, ${s.gender}`);
      const img = document.createElement('img');
      img.src = cleanPath(s.preview);
      img.alt = `${s.gender === 'male' ? 'Male' : 'Female'} Lil Gwapz — ${s.title}`;
      img.width = 640;
      img.height = 640;
      img.loading = 'lazy';
      img.decoding = 'async';
      preview.append(img);
      preview.addEventListener('click', () => showViewer(s));
      const info = document.createElement('div');
      info.className = 'sticker-info';
      const minor = document.createElement('small');
      minor.textContent = `${s.gender.toUpperCase()} · DROP ${s.batch} · ${s.id}`;
      const title = document.createElement('h3');
      title.textContent = s.title;
      const note = document.createElement('p');
      note.textContent = `${s.emoji} ${s.emotion}`;
      const download = document.createElement('a');
      download.href = cleanPath(s.full);
      download.download = `${s.slug}.png`;
      download.textContent = 'Download HD PNG ↓';
      download.setAttribute('aria-label', `Download original-resolution ${s.title} sticker`);
      info.append(minor, title, note, download);
      article.append(preview, info);
      grid.append(article);
    }
    empty.hidden = visible.length > 0;
  }
  function showViewer(s) {
    const art = document.getElementById('viewer-image');
    art.src = cleanPath(s.preview);
    art.alt = `${s.gender} Lil Gwapz, ${s.title}`;
    document.getElementById('viewer-code').textContent = `${s.id} · ORIGINAL HALLOWEEN 2026`;
    document.getElementById('viewer-title').textContent = s.title;
    document.getElementById('viewer-mood').textContent = `${s.gender === 'male' ? 'Male' : 'Female'} Lil Gwapz · ${s.emotion} · 1254 × 1254 transparent PNG`;
    const link = document.getElementById('viewer-download');
    link.href = cleanPath(s.full);
    link.download = `${s.slug}.png`;
    if (!viewer.open) viewer.showModal();
  }
  filters.forEach(btn => btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    for (const other of filters) {
      other.classList.toggle('active', other === btn);
      other.setAttribute('aria-pressed', String(other === btn));
    }
    render();
  }));
  input.addEventListener('input', render);
  closeViewer.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
  fetch('/assets/halloween-2026/manifest.json', { cache: 'default' })
    .then(r => { if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { if (!Array.isArray(data.stickers) || data.stickers.length !== 20) throw Error('Unexpected Halloween manifest'); items.push(...data.stickers); render(); })
    .catch(() => { status.textContent = 'Could not load the Halloween gallery. Please refresh or try again later.'; });
})();
