import { z } from 'zod';
import type { Locale } from '../i18n/locale';
import { t, type UiKey } from '../i18n/ui';

export const AREA_VALUES = ['penal', 'imobiliario', 'fiscal', 'financeiro', 'outro'] as const;
export const OFFICE_VALUES = ['aveiro', 'oliveira-de-frades', 'indiferente'] as const;
export const MIN_FILL_MS = 3000;

export type ContactData = {
  nome: string;
  email: string;
  telefone?: string | undefined;
  area?: (typeof AREA_VALUES)[number] | undefined;
  escritorio?: (typeof OFFICE_VALUES)[number] | undefined;
  mensagem: string;
};
export type ContactField = keyof ContactData | 'consentimento' | 'form';
export type ContactResult = { ok: true; data: ContactData } | { ok: false; errors: Partial<Record<ContactField, string>> };

const emptyToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const trimmed = z.string().transform((s) => s.trim());

const schema = z.strictObject({
  nome: trimmed.pipe(z.string().min(2).max(100)),
  email: trimmed.pipe(z.email().max(254)),
  telefone: z.preprocess(emptyToUndef, trimmed.pipe(z.string().max(30)).optional()),
  area: z.preprocess(emptyToUndef, z.enum(AREA_VALUES).optional()),
  escritorio: z.preprocess(emptyToUndef, z.enum(OFFICE_VALUES).optional()),
  mensagem: trimmed.pipe(z.string().min(10).max(3000)),
  consentimento: z.literal('on'),
  website: z.string().max(0),
  startedAt: z.coerce.number().int().positive(),
});

const fieldError: Record<Exclude<ContactField, 'form'>, UiKey> = {
  nome: 'form.err.name',
  email: 'form.err.email',
  telefone: 'form.err.phone',
  area: 'form.err.area',
  escritorio: 'form.err.office',
  mensagem: 'form.err.message',
  consentimento: 'form.err.consent',
};

/** Shared client/server validation for the contact form (spec: "Formulário de contacto"). */
export function validateContact(input: Record<string, unknown>, locale: Locale, now: number = Date.now()): ContactResult {
  const parsed = schema.safeParse({ website: '', ...input });
  if (!parsed.success) {
    const errors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (issue.code === 'unrecognized_keys' || key === 'website' || key === 'startedAt') {
        errors.form = t(locale, 'form.spam');
      } else if (typeof key === 'string' && key in fieldError) {
        errors[key as keyof typeof fieldError] ??= t(locale, fieldError[key as keyof typeof fieldError]);
      }
    }
    return { ok: false, errors };
  }
  const { consentimento: _c, website: _w, startedAt, ...data } = parsed.data;
  if (now - startedAt < MIN_FILL_MS) return { ok: false, errors: { form: t(locale, 'form.spam') } };
  return { ok: true, data };
}
