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
    const item = btn.closest<HTMLElement>('[data-nav-item]');
    const set = (open: boolean) => {
      btn.setAttribute('aria-expanded', String(open));
      sub.dataset.open = String(open);
      if (item) item.dataset.dismissed = String(!open && item.contains(document.activeElement));
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    item?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') { btn.focus(); set(false); if (item) item.dataset.dismissed = 'true'; }
    });
    // Leaving the item (focus or pointer) lifts the dismissal so hover/focus work again.
    item?.addEventListener('focusout', (e) => { if (!item.contains((e as FocusEvent).relatedTarget as Node)) item.dataset.dismissed = 'false'; });
    item?.addEventListener('mouseleave', () => { if (!item.contains(document.activeElement)) item.dataset.dismissed = 'false'; });
    document.addEventListener('click', (e) => { if (!btn.closest('[data-nav-item]')?.contains(e.target as Node)) set(false); });
  });

  const dialog = document.querySelector<HTMLDialogElement>('[data-mobile-menu]');
  const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (dialog && opener) {
    opener.setAttribute('aria-expanded', 'false');
    opener.addEventListener('click', () => { dialog.showModal(); opener.setAttribute('aria-expanded', 'true'); });
    dialog.querySelector('[data-menu-close]')?.addEventListener('click', () => dialog.close());
    dialog.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => dialog.close()));
    // Tapping the visible strip of the page (the dialog backdrop) closes the drawer.
    dialog.addEventListener('click', (e) => {
      const r = dialog.getBoundingClientRect();
      const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (outside) dialog.close();
    });
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
