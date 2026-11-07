import { describe, expect, test } from 'vitest';
import { renderContactEmail } from './contact-email';
import type { ContactData } from './contact-schema';

const d: ContactData = {
  nome: 'Maria Silva', email: 'maria@example.pt', telefone: '+351 912 345 678',
  area: 'fiscal', escritorio: 'aveiro', mensagem: 'Preciso de ajuda.\nObrigada.',
};
const m = { locale: 'pt' as const, receivedAt: new Date('2026-11-04T10:00:00Z') };

describe('renderContactEmail', () => {
  test('escapes HTML from the visitor', () => {
    const r = renderContactEmail({ ...d, mensagem: '<script>alert(1)</script>', nome: '<b>X</b>' }, m);
    expect(r.html).not.toContain('<script>');
    expect(r.html).toContain('&lt;script&gt;');
    expect(r.html).not.toContain('<b>X</b>');
  });

  test('strips CR/LF from the subject (header injection)', () => {
    const r = renderContactEmail({ ...d, area: undefined, nome: 'A\r\nBcc: x@y' }, m);
    expect(r.subject).not.toMatch(/[\r\n]/);
  });

  test('subject names the area in Portuguese', () => {
    expect(renderContactEmail(d, m).subject).toBe('Novo contacto pelo site — Direito Fiscal');
    expect(renderContactEmail({ ...d, area: undefined }, m).subject).toBe('Novo contacto pelo site — Área não indicada');
    expect(renderContactEmail({ ...d, area: 'outro' }, m).subject).toBe('Novo contacto pelo site — Outra / não sei');
  });

  test('always Portuguese, stating the visitor language', () => {
    expect(renderContactEmail(d, { ...m, locale: 'en' }).text).toContain('Língua do visitante: inglês');
    expect(renderContactEmail(d, m).text).toContain('Língua do visitante: português');
  });

  test('text version contains every field', () => {
    const txt = renderContactEmail(d, m).text;
    for (const v of ['Maria Silva', 'maria@example.pt', '+351 912 345 678', 'Aveiro', 'Preciso de ajuda.']) expect(txt).toContain(v);
  });
});

test('received time is shown in Lisbon local time (dd/mm/aaaa hh:mm)', () => {
  const at = (iso: string) => renderContactEmail(d, { ...m, receivedAt: new Date(iso) }).text;
  expect(at('2026-11-04T10:00:00Z')).toContain('Recebido em: 04/11/2026 10:00'); // winter: UTC+0
  expect(at('2026-07-01T10:05:00Z')).toContain('Recebido em: 01/07/2026 11:05'); // summer: UTC+1
});
