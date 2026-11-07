import { splitSubmission, validateContact, type ContactField } from '../lib/contact-schema';
import { t } from '../i18n/ui';
import type { Locale } from '../i18n/locale';
import { mountTurnstile, type TurnstileHandle } from './turnstile';

/** How long a submission waits for Turnstile to hand over its token before giving the phone/email fallback. */
const TOKEN_WAIT_MS = 10_000;

type ServerReply = { ok: true } | { ok: false; errors: Partial<Record<ContactField, string>> };

/**
 * Contact form: validates with the shared schema, then POSTs to the Pages Function (/api/contacto) with the
 * Turnstile token. Success goes to the thank-you page; any failure keeps what was typed and explains it.
 */
export function initContactForm(form: HTMLFormElement): void {
  const locale = (form.dataset.locale === 'en' ? 'en' : 'pt') as Locale;
  const started = form.querySelector<HTMLInputElement>('[data-started-at]');
  const summary = form.querySelector<HTMLElement>('[data-form-summary]');
  const button = form.querySelector<HTMLButtonElement>('[data-submit]');
  const label = form.querySelector<HTMLElement>('[data-submit-label]');
  const idleLabel = label?.textContent ?? '';
  let sending = false;
  const widget = form.querySelector<HTMLElement>('[data-turnstile]');
  let turnstile: Promise<TurnstileHandle | undefined> | undefined;
  const ensureTurnstile = () => (turnstile ??= widget ? mountTurnstile(widget) : Promise.resolve(undefined));

  // Turnstile (third party) loads only once the visitor starts filling in the form, never on page load.
  form.addEventListener('focusin', () => {
    if (started && !started.value) started.value = String(Date.now());
    void ensureTurnstile();
  });

  const errorEl = (field: string) => form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
  const controls = (field: string) => Array.from(form.querySelectorAll<HTMLElement>(`[name="${field}"]`));

  const clear = (field: string) => {
    const el = errorEl(field);
    if (el) { el.hidden = true; el.textContent = ''; }
    controls(field).forEach((c) => c.removeAttribute('aria-invalid'));
  };
  const clearAll = () => {
    ['nome', 'email', 'telefone', 'area', 'escritorio', 'mensagem', 'consentimento'].forEach(clear);
    if (summary) { summary.hidden = true; summary.classList.add('hidden'); summary.textContent = ''; }
  };

  const showErrors = (errors: Partial<Record<ContactField, string>>) => {
    let first: HTMLElement | undefined;
    for (const [field, message] of Object.entries(errors) as [ContactField, string][]) {
      if (field === 'form') continue;
      const el = errorEl(field);
      if (el) { el.textContent = message; el.hidden = false; }
      controls(field).forEach((c) => c.setAttribute('aria-invalid', 'true'));
      first ??= controls(field)[0];
    }
    if (summary) {
      summary.textContent = errors.form ?? t(locale, 'form.errorSummary');
      summary.hidden = false;
      summary.classList.remove('hidden');
    }
    (first ?? summary)?.focus();
  };

  const setSending = (on: boolean) => {
    sending = on;
    if (button) { button.disabled = on; on ? button.setAttribute('aria-busy', 'true') : button.removeAttribute('aria-busy'); }
    if (label) label.textContent = on ? t(locale, 'form.sending') : idleLabel;
  };

  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name;
    if (name) clear(name);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const { fields } = splitSubmission(new FormData(form).entries());
    const result = validateContact(fields, locale);
    clearAll();
    if (!result.ok) { showErrors(result.errors); return; }

    setSending(true);
    const ts = await ensureTurnstile();
    if (ts && !(await ts.token(TOKEN_WAIT_MS))) {
      setSending(false);
      ts.reset();
      showErrors({ form: t(locale, 'form.verifyFailed') });
      return;
    }
    const data = new FormData(form); // built after the token arrived, so it carries cf-turnstile-response
    let reply: ServerReply | undefined;
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      reply = (await res.json()) as ServerReply;
    } catch {
      reply = undefined;
    }
    if (reply?.ok) {
      window.location.assign(form.dataset.thanks ?? '/');
      return;
    }
    setSending(false);
    ts?.reset();
    showErrors(reply && !reply.ok && Object.keys(reply.errors).length ? reply.errors : { form: t(locale, 'form.sendFailed') });
  });
}
