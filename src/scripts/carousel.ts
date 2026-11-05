export const slideLabel = (index: number, total: number): string =>
  `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

export const nextIndex = (current: number, delta: 1 | -1, total: number): number =>
  Math.min(total - 1, Math.max(0, current + delta));

/** Time each card stays before the carousel moves on by itself. */
export const AUTOPLAY_MS = 6000;

/** Autoplay never stops at the end: after the last card it goes back to the first. */
export const autoplayIndex = (current: number, total: number): number => (current + 1) % total;

/**
 * Scroll-snap carousel enhancement: arrows, counter, progress bars and autoplay. Swipe stays native.
 * Autoplay keeps going on hover (client request) but only runs while the carousel is on screen and
 * the tab is visible, never with reduced motion, and can be paused with a keyboard-only button (WCAG 2.2.2).
 */
export function initCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('[data-carousel-track]');
  const slides = track ? Array.from(track.querySelectorAll<HTMLElement>('[data-slide]')) : [];
  if (!track || slides.length === 0) return;
  const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const counter = root.querySelector<HTMLElement>('[data-carousel-counter]');
  const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-carousel-bar]'));
  const toggle = root.querySelector<HTMLButtonElement>('[data-carousel-toggle]');
  let current = 0;

  const autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let userPaused = false;
  let inView = false;
  let timer: number | undefined;
  // Called after every move (arrows, swipe or autoplay itself) so each card gets the full wait.
  const schedule = () => {
    window.clearTimeout(timer);
    timer = undefined;
    if (!autoplay || userPaused || !inView || document.hidden) return;
    timer = window.setTimeout(() => goTo(autoplayIndex(current, slides.length)), AUTOPLAY_MS);
  };
  const setToggle = () => {
    // A counter announced every few seconds is noise; only announce while the rotation is stopped.
    counter?.setAttribute('aria-live', autoplay && !userPaused ? 'off' : 'polite');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', (userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause) ?? '');
    toggle.dataset.state = userPaused ? 'paused' : 'playing';
  };

  const render = () => {
    if (counter) counter.textContent = slideLabel(current, slides.length);
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
    bars.forEach((b, i) => { b.dataset.active = String(i === current); });
  };

  // While a button-driven scroll is running, the button's target is the truth; intermediate
  // scroll positions (or an interrupted earlier animation) must not overwrite it.
  let target: { left: number; until: number } | undefined;
  const goTo = (i: number) => {
    current = i;
    const left = slides[i]!.offsetLeft - track.offsetLeft;
    target = { left, until: performance.now() + 1500 };
    track.scrollTo({ left, behavior: autoplay ? 'smooth' : 'auto' });
    render();
    schedule();
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
      if (best !== current) { current = best; render(); schedule(); }
    });
  }, { passive: true });

  if (autoplay) {
    toggle?.addEventListener('click', () => { userPaused = !userPaused; setToggle(); schedule(); });
    new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      schedule();
    }, { threshold: 0.35 }).observe(track);
    document.addEventListener('visibilitychange', schedule);
  } else {
    toggle?.remove();
  }

  root.dataset.enhanced = 'true';
  setToggle();
  render();
}
