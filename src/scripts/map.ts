/** Click-to-load Google Maps: the iframe (and Google's cookies) only appear after the visitor asks. */
export function initMaps(): void {
  document.querySelectorAll<HTMLElement>('[data-map]').forEach((box) => {
    const button = box.querySelector<HTMLButtonElement>('[data-map-load]');
    if (!button || box.dataset.bound) return;
    box.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const src = box.dataset.embed;
      if (!src || !src.startsWith('https://www.google.com/maps')) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.title = box.dataset.title ?? 'Map';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'absolute inset-0 h-full w-full border-0';
      iframe.setAttribute('allowfullscreen', '');
      box.replaceChildren(iframe);
      box.dataset.loaded = 'true';
      iframe.focus();
    });
  });
}
