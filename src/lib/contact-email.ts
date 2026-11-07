import type { Locale } from '../i18n/locale';
import type { ContactData } from './contact-schema';

const AREA_PT: Record<string, string> = {
  penal: 'Direito Penal',
  imobiliario: 'Direito Imobiliário',
  fiscal: 'Direito Fiscal',
  financeiro: 'Direito Financeiro',
  outro: 'Outra / não sei',
};
const OFFICE_PT: Record<string, string> = { aveiro: 'Aveiro', 'oliveira-de-frades': 'Oliveira de Frades', indiferente: 'Indiferente' };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/** dd/mm/aaaa hh:mm in Lisbon time (the firm's clock), independent of the server's time zone. */
function lisbonTime(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/**
 * Email sent to the firm (production phase). Always in Portuguese, states the visitor's language,
 * escapes every visitor-provided value and keeps header-bound values on one line.
 */
export function renderContactEmail(data: ContactData, meta: { locale: Locale; receivedAt: Date }) {
  const area = data.area ? AREA_PT[data.area] ?? 'Área não indicada' : 'Área não indicada';
  const subject = oneLine(`Novo contacto pelo site — ${area}`);
  const rows: [string, string][] = [
    ['Nome', oneLine(data.nome)],
    ['Email', oneLine(data.email)],
    ['Telefone', data.telefone ? oneLine(data.telefone) : '—'],
    ['Área', area],
    ['Escritório preferido', data.escritorio ? OFFICE_PT[data.escritorio] ?? '—' : '—'],
    ['Língua do visitante', meta.locale === 'en' ? 'inglês' : 'português'],
    ['Recebido em', lisbonTime(meta.receivedAt)],
  ];
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', 'Mensagem:', data.mensagem].join('\n');
  const html = `<!doctype html><html lang="pt-PT"><body style="font-family:Arial,sans-serif;color:#1F2420">
<h2 style="font-weight:normal">Novo pedido de contacto</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#5B5347">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join('')}</table>
<p style="color:#5B5347;margin-top:16px">Mensagem</p>
<p style="white-space:pre-wrap">${escapeHtml(data.mensagem)}</p>
</body></html>`;
  return { subject, html, text };
}
