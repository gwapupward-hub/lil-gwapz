(() => {
  const allowed = new Set(['sticker_open','filter_change','download_single','download_pack','copy_link','share','share_cancel']);
  window.gwapTrack = (event, payload = {}) => {
    if (!allowed.has(event)) return;
    window.gwapAnalytics?.(event, payload);
  };
})();
