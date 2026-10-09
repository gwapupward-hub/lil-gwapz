(() => {
  const STORAGE_KEY = 'lilgwapz-license-v1-accepted';
  const DOWNLOAD_SELECTOR = '[data-download],#download-all,#download-all-bottom,#dialog-download';
  let pendingTarget = null;
  let bypassNext = false;

  const accepted = () => {
    try { return sessionStorage.getItem(STORAGE_KEY) === 'yes'; }
    catch (_) { return false; }
  };

  const rememberAcceptance = () => {
    try { sessionStorage.setItem(STORAGE_KEY, 'yes'); }
    catch (_) {}
  };

  const injectDialog = () => {
    if (document.getElementById('license-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'license-dialog';
    dialog.id = 'license-dialog';
    dialog.setAttribute('aria-labelledby', 'license-title');
    dialog.innerHTML = `
      <div class="license-dialog-inner">
        <div class="license-dialog-mark" aria-hidden="true">G</div>
        <p class="eyebrow">LIL GWAPZ PERSONAL-USE LICENSE</p>
        <h2 id="license-title">Before you download.</h2>
        <p>Lil Gwapz is proprietary IP owned by <strong>Tha GwapSpot</strong>. Downloads are licensed for personal reaction use and ordinary social sharing — they are not sold or transferred to you.</p>
        <div class="license-summary">
          <strong>You may download & share reactions.</strong>
          <p>You may not resell, merchandise, repackage, tokenize, train AI on, clone, or commercially exploit Lil Gwapz without written authorization.</p>
        </div>
        <p>By selecting <strong>I agree & continue</strong>, you confirm that you have read and agree to the <a href="terms.html" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="ip-policy.html" target="_blank" rel="noreferrer">IP Usage Policy</a>.</p>
        <div class="license-actions">
          <button class="button license-cancel" type="button" id="license-cancel">Cancel</button>
          <button class="button button-primary" type="button" id="license-agree">I agree & continue</button>
        </div>
      </div>`;
    document.body.append(dialog);

    dialog.querySelector('#license-cancel').addEventListener('click', () => {
      pendingTarget = null;
      dialog.close();
    });

    dialog.querySelector('#license-agree').addEventListener('click', () => {
      rememberAcceptance();
      dialog.close();
      const target = pendingTarget;
      pendingTarget = null;
      if (!target || !document.contains(target)) return;
      bypassNext = true;
      target.click();
    });

    dialog.addEventListener('cancel', () => { pendingTarget = null; });
  };

  const addNotices = () => {
    const make = () => {
      const p = document.createElement('p');
      p.className = 'download-license-note';
      p.innerHTML = 'Downloads are for personal reaction use. By downloading, you agree to the <a href="terms.html">Terms</a> and <a href="ip-policy.html">IP Policy</a>.';
      return p;
    };

    const heroActions = document.querySelector('.hero-actions');
    if (heroActions && !heroActions.parentElement.querySelector('.download-license-note')) {
      heroActions.insertAdjacentElement('afterend', make());
    }

    const browseActions = document.querySelector('.browse-actions');
    if (browseActions && !browseActions.querySelector('.download-license-note')) {
      browseActions.append(make());
    }

    const strip = document.querySelector('.download-strip');
    if (strip && !strip.querySelector('.download-license-note')) {
      const copy = strip.querySelector('div');
      if (copy) copy.append(make());
    }
  };

  injectDialog();
  addNotices();

  document.addEventListener('click', (event) => {
    if (bypassNext) {
      bypassNext = false;
      return;
    }
    if (accepted()) return;
    const target = event.target.closest?.(DOWNLOAD_SELECTOR);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingTarget = target;
    const dialog = document.getElementById('license-dialog');
    if (dialog && !dialog.open) dialog.showModal();
  }, true);
})();
