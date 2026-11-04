/** Header behaviour: scrolled state, desktop sub-menu, mobile dialog menu, sticky mobile CTA. */
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (header) {
    const update = () => { header.dataset.scrolled = String(window.scrollY > 24); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-sub-toggle]').forEach((btn) => {
    const sub = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (!sub) return;
    const set = (open: boolean) => { btn.setAttribute('aria-expanded', String(open)); sub.dataset.open = String(open); };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    btn.closest('[data-nav-item]')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') { set(false); btn.focus(); }
    });
    document.addEventListener('click', (e) => { if (!btn.closest('[data-nav-item]')?.contains(e.target as Node)) set(false); });
  });

  const dialog = document.querySelector<HTMLDialogElement>('[data-mobile-menu]');
  const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (dialog && opener) {
    opener.setAttribute('aria-expanded', 'false');
    opener.addEventListener('click', () => { dialog.showModal(); opener.setAttribute('aria-expanded', 'true'); });
    dialog.querySelector('[data-menu-close]')?.addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => { opener.setAttribute('aria-expanded', 'false'); opener.focus(); });
  }

  const sticky = document.querySelector<HTMLElement>('[data-sticky-cta]');
  const contact = document.getElementById('contacto');
  if (sticky && contact) {
    new IntersectionObserver((entries) => {
      sticky.dataset.hidden = String(entries.some((e) => e.isIntersecting));
    }, { rootMargin: '0px 0px -10% 0px' }).observe(contact);
  }
}
