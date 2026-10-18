(() => {
  'use strict';

  // Seasonal feature flag: change enabled to false or change endsAt to disable.
  const SETTINGS = Object.freeze({
    enabled: true,
    endsAt: '2026-11-02T05:00:00Z',
    sessionKey: 'lilgwapz-haunted-2026-splash-seen-v1',
    videoSrc: '/assets/halloween-2026/splash/haunted-gwapz-2026-splash.mp4'
  });

  const splash = document.getElementById('haunted-splash');
  if (!splash || !SETTINGS.enabled || Date.now() >= Date.parse(SETTINGS.endsAt)) return;

  let previouslySeen = false;
  try {
    previouslySeen = sessionStorage.getItem(SETTINGS.sessionKey) === '1';
  } catch {
    // Private browsing / blocked storage: degrade gracefully to this-page-only display.
  }
  if (previouslySeen) return;

  const closeButton = splash.querySelector('[data-haunted-close]');
  const video = splash.querySelector('#haunted-splash-video');
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focusable = () => [...splash.querySelectorAll('a[href], button:not([disabled])')];
  const previousFocus = document.activeElement;
  let closed = false;

  // Keep keyboard users in the modal, and prevent screen readers or clicks from
  // reaching the background content. Restore each prior inert value on dismissal.
  const inertElements = [...document.body.children]
    .filter(el => el !== splash && el.tagName !== 'SCRIPT');
  const priorInert = inertElements.map(el => [el, el.inert]);

  function close() {
    if (closed) return;
    closed = true;
    video.pause();
    video.removeAttribute('src');
    video.load();
    splash.hidden = true;
    splash.classList.remove('is-playing');
    document.documentElement.classList.remove('haunted-splash-open');
    for (const [el, oldValue] of priorInert) el.inert = oldValue;
    document.removeEventListener('keydown', onKeyDown, true);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus({ preventScroll: true });
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = focusable();
    if (!controls.length) { event.preventDefault(); return; }
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  function showStatic() {
    splash.classList.remove('is-playing');
    splash.classList.add('is-static');
  }

  splash.hidden = false;
  document.documentElement.classList.add('haunted-splash-open');
  for (const [el] of priorInert) el.inert = true;
  document.addEventListener('keydown', onKeyDown, true);
  closeButton.addEventListener('click', close);
  closeButton.focus({ preventScroll: true });

  try { sessionStorage.setItem(SETTINGS.sessionKey, '1'); } catch { /* optional */ }

  if (reducedMotion) {
    showStatic();
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.addEventListener('playing', () => {
    if (!closed) {
      splash.classList.add('is-playing');
      splash.classList.remove('is-static');
    }
  });
  video.addEventListener('error', showStatic);
  video.addEventListener('ended', showStatic);
  video.addEventListener('stalled', showStatic);
  video.src = SETTINGS.videoSrc;
  video.load();
  // Muted, inline autoplay is normally allowed, but never a requirement.
  const attempt = video.play();
  if (attempt && typeof attempt.catch === 'function') attempt.catch(showStatic);
})();