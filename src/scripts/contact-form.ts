import { validateContact, type ContactField } from '../lib/contact-schema';
import { t } from '../i18n/ui';
import type { Locale } from '../i18n/locale';

/**
 * Design-phase contact form: validates with the shared schema and, when valid, goes to the
 * thank-you page WITHOUT sending anything (spec: "Fase atual"). Nothing goes into the URL.
 */
export function initContactForm(form: HTMLFormElement): void {
  const locale = (form.dataset.locale === 'en' ? 'en' : 'pt') as Locale;
  const started = form.querySelector<HTMLInputElement>('[data-started-at]');
  const summary = form.querySelector<HTMLElement>('[data-form-summary]');
  form.querySelector<HTMLElement>('[data-nojs-notice]')?.remove();

  form.addEventListener('focusin', () => {
    if (started && !started.value) started.value = String(Date.now());
  });

  const errorEl = (field: string) => form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
  const controls = (field: string) => Array.from(form.querySelectorAll<HTMLElement>(`[name="${field}"]`));

  const clear = (field: string) => {
    const el = errorEl(field);
    if (el) { el.hidden = true; el.textContent = ''; }
    controls(field).forEach((c) => c.removeAttribute('aria-invalid'));
  };

  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name;
    if (name) clear(name);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw: Record<string, unknown> = {};
    new FormData(form).forEach((v, k) => { raw[k] = typeof v === 'string' ? v : ''; });
    const result = validateContact(raw, locale);

    ['nome', 'email', 'telefone', 'area', 'escritorio', 'mensagem', 'consentimento'].forEach(clear);
    if (summary) { summary.hidden = true; summary.classList.add('hidden'); summary.textContent = ''; }

    if (result.ok) {
      window.location.assign(form.dataset.thanks ?? '/');
      return;
    }

    let first: HTMLElement | undefined;
    for (const [field, message] of Object.entries(result.errors) as [ContactField, string][]) {
      if (field === 'form') continue;
      const el = errorEl(field);
      if (el) { el.textContent = message; el.hidden = false; }
      controls(field).forEach((c) => c.setAttribute('aria-invalid', 'true'));
      first ??= controls(field)[0];
    }
    if (summary) {
      summary.textContent = result.errors.form ?? t(locale, 'form.errorSummary');
      summary.hidden = false;
      summary.classList.remove('hidden');
    }
    (first ?? summary)?.focus();
  });
}
