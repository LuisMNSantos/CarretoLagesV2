export type VideoVariant = 'mobile' | 'tablet' | 'desktop';
export type VideoEnv = {
  width: number;
  height: number;
  saveData: boolean;
  effectiveType?: string | undefined;
  reducedMotion: boolean;
};

const SLOW = new Set(['slow-2g', '2g', '3g']);

/** Which background-video file to load, or null to keep only the poster (spec: "Vídeo de fundo"). */
export function chooseVideoVariant(env: VideoEnv): VideoVariant | null {
  if (env.reducedMotion || env.saveData) return null;
  if (env.effectiveType && SLOW.has(env.effectiveType)) return null;
  const portrait = env.height > env.width;
  if (portrait && env.width < 768) return 'mobile';
  if (env.width < 1280) return 'tablet';
  return 'desktop';
}

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

function readEnv(): VideoEnv {
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    saveData: Boolean(conn?.saveData),
    effectiveType: conn?.effectiveType,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

/**
 * Progressive enhancement for the hero: the poster is the LCP element; the video is only
 * requested after `load`, fades in on `playing`, pauses off-screen / in background tabs,
 * and removes itself on error so the poster stays.
 */
export function initHeroVideo(root: HTMLElement): void {
  const video = root.querySelector<HTMLVideoElement>('video[data-hero-video]');
  const toggle = root.querySelector<HTMLButtonElement>('button[data-hero-toggle]');
  if (!video) return;

  const variant = chooseVideoVariant(readEnv());
  if (!variant) {
    video.remove();
    toggle?.remove();
    return;
  }

  let userPaused = false;
  let inView = true;

  const setToggle = (playing: boolean) => {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(!playing));
    toggle.setAttribute('aria-label', playing ? toggle.dataset.labelPause ?? '' : toggle.dataset.labelPlay ?? '');
    toggle.dataset.state = playing ? 'playing' : 'paused';
  };

  const tryPlay = () => {
    if (userPaused || !inView || document.hidden) return;
    video.play().catch(() => {
      /* autoplay refused: the poster remains, which is fine */
    });
  };

  const start = () => {
    for (const type of ['mp4', 'webm'] as const) {
      const src = video.dataset[`${variant}${type === 'mp4' ? 'Mp4' : 'Webm'}`];
      if (!src) continue;
      const source = document.createElement('source');
      source.src = src;
      source.type = `video/${type}`;
      video.append(source);
    }
    video.addEventListener('playing', () => {
      root.dataset.video = 'playing';
      setToggle(true);
    });
    video.addEventListener('pause', () => setToggle(false));
    video.addEventListener('error', fail, true);
    video.querySelectorAll('source').forEach((s) => s.addEventListener('error', () => {
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) fail();
    }));
    video.load();
    tryPlay();
  };

  function fail() {
    root.dataset.video = 'failed';
    video?.remove();
    toggle?.remove();
  }

  toggle?.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      tryPlay();
    } else {
      userPaused = true;
      video.pause();
    }
  });

  new IntersectionObserver((entries) => {
    inView = entries.some((e) => e.isIntersecting);
    if (inView) tryPlay();
    else video.pause();
  }).observe(root);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else tryPlay();
  });

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
