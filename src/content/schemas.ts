import { z } from 'zod';

/** A text that exists in Portuguese and (optionally, until translated) in English. Mirrors Sanity i18n fields. */
export const localized = z.strictObject({ pt: z.string().min(1), en: z.string().min(1).optional() });
export type Localized = z.infer<typeof localized>;

/** A block shown only in the plans with the contact form ('form') or only in the base plan ('noForm'). */
const when = z.enum(['form', 'noForm']).optional();

/** Rich text as simple blocks (Portable-Text-like), so it maps 1:1 to the future CMS. */
export const block = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('p'), text: localized, when }),
  z.strictObject({ type: z.literal('h2'), text: localized, when }),
  z.strictObject({ type: z.literal('h3'), text: localized, when }),
  z.strictObject({ type: z.literal('ul'), items: z.array(localized).min(1), when }),
  z.strictObject({ type: z.literal('quote'), text: localized, cite: localized.optional(), when }),
]);
export type Block = z.infer<typeof block>;

const base = { id: z.string().min(1), order: z.number().int() };
const imageId = z.string().regex(/^[a-z0-9-]+$/);
/** A CMS image (sanity plan), already dereferenced by the GROQ query; Astro downloads and optimises it at build. */
export const remoteImage = z.strictObject({
  url: z.string().url().startsWith('https://cdn.sanity.io/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
/** A local image id (src/assets/stock or team) or a CMS image. */
export const imageRef = z.union([imageId, remoteImage]);
export type ImageRef = z.infer<typeof imageRef>;
export const areaId = z.enum(['penal', 'imobiliario', 'fiscal', 'financeiro']);
export type AreaId = z.infer<typeof areaId>;

export const settingsSchema = z.strictObject({
  foundedYear: z.literal(2002),
  phone: z.string(),
  phoneHref: z.string().startsWith('tel:'),
  email: z.string().email(),
  hours: localized,
  responsePromise: localized,
  hero: z.strictObject({ eyebrow: localized, title: z.tuple([localized, localized]), lead: localized, caption: localized }),
  pillars: z.array(z.strictObject({ icon: z.enum(['conversation', 'experience', 'clock']), title: localized, text: localized })).length(3),
  stats: z.array(z.strictObject({ value: z.string(), label: localized })).min(3),
  sections: z.strictObject({
    areas: z.strictObject({ eyebrow: localized, title: z.tuple([localized, localized]), lead: localized }),
    situations: z.strictObject({ eyebrow: localized, title: z.tuple([localized, localized]), lead: localized }),
    process: z.strictObject({ eyebrow: localized, title: z.tuple([localized, localized]), lead: localized }),
  }),
  seo: z.strictObject({ homeTitle: localized, homeDescription: localized }),
});

export const officeSchema = z.strictObject({
  ...base,
  name: z.string(),
  address: localized,
  addressToConfirm: z.boolean(),
  phone: z.string(),
  mapsUrl: z.string().url(),
  embedUrl: z.string().url(),
  image: imageRef,
});

export const areaSchema = z.strictObject({
  ...base,
  id: areaId,
  slug: localized,
  eyebrow: localized,
  title: localized,
  headline: z.tuple([localized, localized]),
  summary: localized,
  keywords: z.array(localized).min(2),
  services: z.array(localized).min(3),
  description: z.array(block).min(1),
  image: imageRef,
  metaDescription: localized,
});

export const situationSchema = z.strictObject({
  ...base,
  icon: z.enum(['scale', 'home', 'document', 'bank']),
  eyebrow: localized,
  prompt: localized,
  title: z.tuple([localized, localized]),
  body: localized,
  tags: z.array(localized).min(2),
  area: areaId,
  linkLabel: localized,
  image: imageRef,
  imageCaption: localized,
});

export const stepSchema = z.strictObject({
  ...base,
  number: z.string().regex(/^0[1-4]$/),
  title: localized,
  headline: localized,
  body: localized,
  image: imageRef,
});

export const lawyerSchema = z.strictObject({
  ...base,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: localized,
  group: z.enum(['partner', 'associate', 'consultant']),
  areas: z.array(areaId),
  email: z.string().email(),
  photo: imageRef.optional(),
  bio: z.array(block).min(1),
  linkedin: z.string().url().optional(),
});

export const caseSchema = z.strictObject({
  ...base,
  placeholder: z.boolean().optional(),
  slug: localized,
  area: areaId,
  title: localized,
  summary: localized,
  context: z.array(block).min(1),
  outcome: localized,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const testimonialSchema = z.strictObject({
  ...base,
  placeholder: z.boolean().optional(),
  quote: localized,
  author: z.string(),
  descriptor: localized,
});

export const faqSchema = z.strictObject({ ...base, question: localized, answer: localized });

export const insightSchema = z.strictObject({
  ...base,
  placeholder: z.boolean().optional(),
  slug: localized,
  area: areaId.optional(),
  title: localized,
  excerpt: localized,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  readingMinutes: z.number().int().positive(),
  body: z.array(block).min(1),
  image: imageRef,
});

export const pageSchema = z.strictObject({
  id: z.enum(['firm', 'history', 'values', 'proBono', 'privacy', 'terms', 'disputes', 'cookies']),
  eyebrow: localized,
  title: z.tuple([localized, localized]),
  lead: localized,
  body: z.array(block).min(1),
  draft: z.boolean().optional(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  image: imageRef.optional(),
  metaDescription: localized,
});

export type Settings = z.infer<typeof settingsSchema>;
export type Office = z.infer<typeof officeSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Situation = z.infer<typeof situationSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Lawyer = z.infer<typeof lawyerSchema>;
export type CaseStudy = z.infer<typeof caseSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type Page = z.infer<typeof pageSchema>;
export type PageId = Page['id'];
