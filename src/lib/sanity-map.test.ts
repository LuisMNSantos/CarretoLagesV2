import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { COLLECTIONS, SANITY_TYPE, fromSanity, toSanityDocs, type RawContent } from './sanity-map';
import {
  areaSchema, caseSchema, faqSchema, insightSchema, lawyerSchema, officeSchema, pageSchema, settingsSchema,
  situationSchema, stepSchema, testimonialSchema,
} from '../content/schemas';

const FILE: Record<(typeof COLLECTIONS)[number], string> = {
  settings: 'settings', offices: 'offices', areas: 'areas', situations: 'situations', steps: 'steps', lawyers: 'lawyers',
  cases: 'cases', testimonials: 'testimonials', faq: 'faq', insights: 'insights', pages: 'pages',
};
const raw = Object.fromEntries(COLLECTIONS.map((c) => [c, JSON.parse(readFileSync(`src/content/${FILE[c]}.json`, 'utf8'))])) as RawContent;
const SCHEMA = {
  settings: settingsSchema, offices: z.array(officeSchema), areas: z.array(areaSchema), situations: z.array(situationSchema),
  steps: z.array(stepSchema), lawyers: z.array(lawyerSchema), cases: z.array(caseSchema), testimonials: z.array(testimonialSchema),
  faq: z.array(faqSchema), insights: z.array(insightSchema), pages: z.array(pageSchema),
} as const;

const fakeRef = (kind: 'stock' | 'team', id: string) => `image-${kind}-${id}-10x10-jpg`;
const projected = (ref: string) => ({ url: `https://cdn.sanity.io/images/p/d/${ref}.jpg`, width: 10, height: 10 });

/** What the GROQ query returns: image references dereferenced to { url, width, height }. */
function project(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(project);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (o._type === 'image' && o.asset) return projected((o.asset as { _ref: string })._ref);
    return Object.fromEntries(Object.entries(o).map(([k, x]) => [k, project(x)]));
  }
  return v;
}

/** The JSON content with every image id replaced by its projected remote image. */
function withRemoteImages(v: unknown, key = ''): unknown {
  if (Array.isArray(v)) return v.map((x) => withRemoteImages(x));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withRemoteImages(x, k)]));
  if (typeof v === 'string' && (key === 'image' || key === 'photo')) return projected(fakeRef(key === 'photo' ? 'team' : 'stock', v));
  return v;
}

describe('sanity-map', () => {
  test('round trip keeps every collection', () => {
    const back = fromSanity(project(toSanityDocs(raw, fakeRef)) as unknown[]);
    for (const c of COLLECTIONS) {
      expect(() => SCHEMA[c].parse(back[c]), c).not.toThrow();
      expect(back[c], c).toEqual(withRemoteImages(raw[c]));
    }
  });

  test('every document gets a stable _id and the type from SANITY_TYPE', () => {
    const docs = toSanityDocs(raw, fakeRef) as { _id: string; _type: string }[];
    expect(docs.find((d) => d._type === 'settings')?._id).toBe('settings');
    expect(docs.filter((d) => d._type === SANITY_TYPE.areas).map((d) => d._id)).toContain('area-fiscal');
    // Sanity treats ids containing a dot as private paths: they never appear in public (unauthenticated) reads.
    expect(docs.filter((d) => d._id.includes('.'))).toEqual([]);
    expect(new Set(docs.map((d) => d._id)).size).toBe(docs.length);
  });

  test('fromSanity strips _key/_rev and maps block _type to type', () => {
    const [area] = fromSanity([
      { _id: 'area.x', _type: 'area', _rev: 'r1', _updatedAt: 'x', description: [{ _type: 'p', _key: 'k1', text: { _type: 'localizedString', pt: 'Olá' } }], nothing: null },
    ]).areas as Record<string, unknown>[];
    expect(area).toEqual({ description: [{ type: 'p', text: { pt: 'Olá' } }] });
  });

  test('fromSanity output with a missing required field fails the schema', () => {
    const back = fromSanity(project(toSanityDocs(raw, fakeRef)) as unknown[]);
    const areas = structuredClone(back.areas) as Record<string, unknown>[];
    delete areas[0]!.title;
    expect(() => z.array(areaSchema).parse(areas)).toThrow();
  });
});
