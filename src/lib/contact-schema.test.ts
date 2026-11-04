import { describe, expect, test } from 'vitest';
import { validateContact } from './contact-schema';

const NOW = 1_800_000_000_000;
const valid = (): Record<string, unknown> => ({
  nome: 'Maria Silva',
  email: 'maria@example.pt',
  telefone: '+351 912 345 678',
  area: 'fiscal',
  escritorio: 'aveiro',
  mensagem: 'Recebi uma notificação e preciso de ajuda.',
  consentimento: 'on',
  website: '',
  startedAt: String(NOW - 10_000),
});
const run = (input: Record<string, unknown>, locale: 'pt' | 'en' = 'pt') => validateContact(input, locale, NOW);
const errorsOf = (input: Record<string, unknown>, locale: 'pt' | 'en' = 'pt') => {
  const r = run(input, locale);
  if (r.ok) throw new Error('expected validation errors');
  return r.errors;
};

describe('validateContact', () => {
  test('a complete submission passes and is trimmed', () => {
    const r = run({ ...valid(), nome: '  Maria Silva  ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nome).toBe('Maria Silva');
  });

  test('optional fields may be absent or empty', () => {
    const { telefone: _t, area: _a, escritorio: _e, ...rest } = valid();
    expect(run(rest).ok).toBe(true);
    expect(run({ ...valid(), telefone: '', area: '', escritorio: '' }).ok).toBe(true);
  });

  test.each([
    ['nome', '   '],
    ['nome', 'A'],
    ['nome', 'x'.repeat(101)],
    ['email', 'a@b'],
    ['email', 'not an email'],
    ['telefone', '9'.repeat(31)],
    ['area', 'tributario'],
    ['escritorio', 'lisboa'],
    ['mensagem', 'curta'],
    ['mensagem', 'x'.repeat(3001)],
    ['mensagem', '          \n\n   '],
  ])('rejects %s = %j', (field, value) => {
    expect(errorsOf({ ...valid(), [field]: value })).toHaveProperty(field);
  });

  test('consent is required', () => {
    const { consentimento: _c, ...rest } = valid();
    expect(errorsOf(rest)).toHaveProperty('consentimento');
  });

  test('a filled honeypot is treated as spam', () => {
    expect(errorsOf({ ...valid(), website: 'http://spam.example' }).form).toBeTruthy();
  });

  test('submissions faster than 3 s are treated as spam', () => {
    expect(errorsOf({ ...valid(), startedAt: String(NOW - 1000) }).form).toBeTruthy();
  });

  test('unknown fields are rejected', () => {
    expect(errorsOf({ ...valid(), extra: '1' }).form).toBeTruthy();
  });

  test('emoji and accented names are accepted', () => {
    expect(run({ ...valid(), nome: 'José 😊 Lages' }).ok).toBe(true);
  });

  test('pasted HTML in the message is accepted as text (escaped later)', () => {
    expect(run({ ...valid(), mensagem: '<script>alert(1)</script> preciso de ajuda' }).ok).toBe(true);
  });

  test('errors are localized', () => {
    expect(errorsOf({ ...valid(), nome: '' }, 'en').nome).toBe('Please enter your name (2 to 100 characters).');
    expect(errorsOf({ ...valid(), nome: '' }, 'pt').nome).toBe('Indique o seu nome (2 a 100 caracteres).');
  });
});
