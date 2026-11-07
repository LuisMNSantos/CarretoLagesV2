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

/** Renders the widget into `el` and returns a reset function (a no-op if Turnstile could not load:
 *  the server then rejects the submission and the visitor sees the error with phone and email). */
export async function mountTurnstile(el: HTMLElement): Promise<() => void> {
  try {
    const ts = await load();
    const id = ts.render(el, { sitekey: el.dataset.sitekey, theme: 'light', size: widgetSize(el.clientWidth), language: 'auto' });
    return () => ts.reset(id);
  } catch {
    return () => {};
  }
}
