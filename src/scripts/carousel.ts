export const slideLabel = (index: number, total: number): string =>
  `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

export const nextIndex = (current: number, delta: 1 | -1, total: number): number =>
  Math.min(total - 1, Math.max(0, current + delta));

/** Scroll-snap carousel enhancement: arrows, counter and progress bars. Swipe stays native. */
export function initCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-carousel-track]');
  const slides = track ? Array.from(track.querySelectorAll<HTMLElement>('[data-slide]')) : [];
  if (!track || slides.length === 0) return;
  const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const counter = root.querySelector<HTMLElement>('[data-carousel-counter]');
  const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-bar]'));
  let current = 0;

  const render = () => {
    if (counter) counter.textContent = slideLabel(current, slides.length);
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
    bars.forEach((b, i) => { b.dataset.active = String(i === current); });
    slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== current && isOutOfView(s))));
  };

  const isOutOfView = (s: HTMLElement) => {
    const t = track.getBoundingClientRect();
    const r = s.getBoundingClientRect();
    return r.right <= t.left + 1 || r.left >= t.right - 1;
  };

  // While a button-driven scroll is running, the button's target is the truth; intermediate
  // scroll positions (or an interrupted earlier animation) must not overwrite it.
  let target: { left: number; until: number } | undefined;
  const goTo = (i: number) => {
    current = i;
    const left = slides[i]!.offsetLeft - track.offsetLeft;
    target = { left, until: performance.now() + 1500 };
    track.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    render();
  };

  prev?.addEventListener('click', () => goTo(nextIndex(current, -1, slides.length)));
  next?.addEventListener('click', () => goTo(nextIndex(current, 1, slides.length)));

  let raf = 0;
  track.addEventListener('scroll', () => {
    if (target) {
      const arrived = Math.abs(track.scrollLeft - target.left) < 2;
      if (!arrived && performance.now() < target.until) return;
      target = undefined;
    }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = track.scrollLeft;
      let best = 0;
      slides.forEach((s, i) => {
        if (Math.abs(s.offsetLeft - track.offsetLeft - x) < Math.abs(slides[best]!.offsetLeft - track.offsetLeft - x)) best = i;
      });
      if (best !== current) { current = best; render(); }
    });
  }, { passive: true });

  root.dataset.enhanced = 'true';
  render();
}
