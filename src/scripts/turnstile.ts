/** Cloudflare Turnstile, loaded on demand and rendered explicitly so the widget size can follow the form width
 *  (the "flexible" widget is at least 300px wide and would overflow narrow phones). */
type Turnstile = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(widgetId?: string): void;
};

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<Turnstile> | undefined;

function load(): Promise<Turnstile> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => {
      const ts = (window as unknown as { turnstile?: Turnstile }).turnstile;
      if (ts) resolve(ts);
      else reject(new Error('turnstile missing'));
    };
    s.onerror = () => reject(new Error('turnstile blocked'));
    document.head.append(s);
  });
  return loading;
}

export const widgetSize = (width: number): 'flexible' | 'compact' => (width >= 300 ? 'flexible' : 'compact');

export type TurnstileHandle = {
  /** Clears the current token and asks Cloudflare for a new one (after a failed submission). */
  reset(): void;
  /** Resolves with the current token, or waits for it up to `timeoutMs`; '' when none arrived. */
  token(timeoutMs: number): Promise<string>;
};

/** Renders the widget into `el`. If Turnstile cannot load (blocked), the handle never yields a token and the
 *  form tells the visitor to use the phone or email instead. */
export async function mountTurnstile(el: HTMLElement): Promise<TurnstileHandle> {
  let current = '';
  let waiters: ((t: string) => void)[] = [];
  const deliver = (t: string) => { current = t; waiters.splice(0).forEach((w) => w(t)); };
  try {
    const ts = await load();
    // interaction-only: the widget stays hidden unless Cloudflare needs the visitor to click (no blank band in the form).
    const id = ts.render(el, {
      sitekey: el.dataset.sitekey, theme: 'light', size: widgetSize(el.clientWidth), language: 'auto', appearance: 'interaction-only',
      callback: deliver, 'expired-callback': () => { current = ''; }, 'error-callback': () => { current = ''; },
    });
    return {
      reset: () => { current = ''; ts.reset(id); },
      token: (timeoutMs) => (current ? Promise.resolve(current) : new Promise((resolve) => { waiters.push(resolve); setTimeout(() => resolve(current), timeoutMs); })),
    };
  } catch {
    return { reset: () => {}, token: async () => '' };
  }
}
