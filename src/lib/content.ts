import { z } from 'zod';
import type { Locale } from '../i18n/locale';
import {
  areaSchema, caseSchema, faqSchema, insightSchema, lawyerSchema, officeSchema, pageSchema,
  settingsSchema, situationSchema, stepSchema, testimonialSchema,
  type Block, type Localized, type Page, type PageId,
} from '../content/schemas';
import settingsJson from '../content/settings.json' with { type: 'json' };
import officesJson from '../content/offices.json' with { type: 'json' };
import areasJson from '../content/areas.json' with { type: 'json' };
import situationsJson from '../content/situations.json' with { type: 'json' };
import stepsJson from '../content/steps.json' with { type: 'json' };
import lawyersJson from '../content/lawyers.json' with { type: 'json' };
import casesJson from '../content/cases.json' with { type: 'json' };
import testimonialsJson from '../content/testimonials.json' with { type: 'json' };
import faqJson from '../content/faq.json' with { type: 'json' };
import insightsJson from '../content/insights.json' with { type: 'json' };
import pagesJson from '../content/pages.json' with { type: 'json' };
import { designPreview, plan, sanityDataset, sanityProjectId } from './env';
import { fetchSanityContent } from './sanity-source';
import type { RawContent } from './sanity-map';

export * from '../content/schemas';

/** The sanity plan reads the content from Sanity at build time; the other plans use the JSON files. */
const raw: RawContent =
  plan === 'sanity'
    ? await fetchSanityContent(sanityProjectId, sanityDataset)
    : {
        settings: settingsJson, offices: officesJson, areas: areasJson, situations: situationsJson, steps: stepsJson,
        lawyers: lawyersJson, cases: casesJson, testimonials: testimonialsJson, faq: faqJson, insights: insightsJson, pages: pagesJson,
      };

/** Content is validated at import time: a malformed file or CMS document fails the build and the tests. */
export const settings = settingsSchema.parse(raw.settings);
export const offices = z.array(officeSchema).parse(raw.offices);
export const areas = z.array(areaSchema).parse(raw.areas);
export const situations = z.array(situationSchema).parse(raw.situations);
export const steps = z.array(stepSchema).parse(raw.steps);
export const lawyers = z.array(lawyerSchema).parse(raw.lawyers);
export const cases = z.array(caseSchema).parse(raw.cases);
export const testimonials = z.array(testimonialSchema).parse(raw.testimonials);
export const faq = z.array(faqSchema).parse(raw.faq);
export const insights = z.array(insightSchema).parse(raw.insights);
export const pages: Record<PageId, Page> = Object.fromEntries(
  z.array(pageSchema).parse(raw.pages).map((p) => [p.id, p]),
) as Record<PageId, Page>;

/** Drops the blocks written for the other plan (contact form present or not). */
export function blocksFor(blocks: readonly Block[], hasForm: boolean): Block[] {
  return blocks.filter((b) => !b.when || b.when === (hasForm ? 'form' : 'noForm'));
}

export function pick(field: { pt: string; en?: string | undefined }, locale: Locale): string | undefined {
  return field[locale];
}

/** Like pick() for fields known to be translated (render code only receives visible() items). */
export function tr(field: Localized, locale: Locale): string {
  return field[locale] ?? field.pt;
}

function isLocalizedShape(v: object): v is Localized {
  const keys = Object.keys(v);
  return typeof (v as { pt?: unknown }).pt === 'string' && keys.every((k) => k === 'pt' || k === 'en');
}

/** True when every localized field (at any depth) has a value for `locale`. */
export function isTranslated(item: unknown, locale: Locale): boolean {
  if (locale === 'pt') return true;
  if (Array.isArray(item)) return item.every((i) => isTranslated(i, locale));
  if (item && typeof item === 'object') {
    if (isLocalizedShape(item)) return typeof item.en === 'string' && item.en.length > 0;
    return Object.values(item).every((v) => isTranslated(v, locale));
  }
  return true;
}

export function visible<T extends { placeholder?: boolean | undefined; order: number }>(
  items: readonly T[],
  locale: Locale,
  opts: { preview: boolean } = { preview: designPreview },
): T[] {
  return items
    .filter((i) => isTranslated(i, locale))
    .filter((i) => opts.preview || !i.placeholder)
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function getCollectionCounts(locale: Locale, preview: boolean = designPreview) {
  return {
    cases: visible(cases, locale, { preview }).length,
    testimonials: visible(testimonials, locale, { preview }).length,
    insights: visible(insights, locale, { preview }).length,
  };
}

export const areaById = (id: string) => areas.find((a) => a.id === id);
