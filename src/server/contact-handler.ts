// POST /api/contacto (Cloudflare Pages Function): validate → Turnstile → Resend (free plan).
// Spec: docs/superpowers/specs/2026-11-07-tres-versoes-design.md ("Versão formulario"). Never stores or logs
// message content: the only log line on failure carries HTTP status and API error codes.
import { splitSubmission, validateContact } from '../lib/contact-schema';
import { renderContactEmail } from '../lib/contact-email';
import { t } from '../i18n/ui';
import type { Locale } from '../i18n/locale';

export type ContactEnv = {
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
};
type Deps = { fetch: typeof fetch; now: () => number };

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SEND_URL = 'https://api.resend.com/emails';
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const fail = (status: number, locale: Locale, key: 'form.spam' | 'form.sendFailed') => json(status, { ok: false, errors: { form: t(locale, key) } });

/** Builds the handler with its own best-effort, per-isolate rate limiter (pages.dev has no zone rate-limit rules). */
export function createContactHandler(deps: Deps) {
  const hits = new Map<string, number[]>();

  const limited = (ip: string): boolean => {
    const now = deps.now();
    const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > RATE_LIMIT;
  };

  return async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail(400, 'pt', 'form.spam');
    }
    const { fields, token, locale } = splitSubmission(form.entries());
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (limited(ip)) return fail(429, locale, 'form.spam');

    const result = validateContact(fields, locale, deps.now());
    if (!result.ok) return json(422, { ok: false, errors: result.errors });

    if (!token) return fail(403, locale, 'form.spam');
    const verify = await deps.fetch(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const verdict = (await verify.json().catch(() => ({}))) as { success?: boolean };
    if (verdict.success !== true) return fail(403, locale, 'form.spam');

    const email = renderContactEmail(result.data, { locale, receivedAt: new Date(deps.now()) });
    const send = await deps.fetch(SEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: [env.CONTACT_TO], from: env.CONTACT_FROM, reply_to: result.data.email, ...email }),
    });
    const reply = (await send.json().catch(() => ({}))) as { id?: string; name?: string };
    if (send.ok && typeof reply.id === 'string' && reply.id) return json(200, { ok: true });

    // Resend error names (e.g. validation_error) carry no visitor data; the message text may, so it is not logged.
    console.error('contact: email send failed', send.status, reply.name ?? '');
    return fail(502, locale, 'form.sendFailed');
  };
}
