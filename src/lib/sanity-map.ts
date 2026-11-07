// Maps the site's content (src/content/*.json shapes) to Sanity documents and back.
// Type-only imports on purpose: scripts/sanity-import.mjs imports this file directly with Node's type stripping.

export const COLLECTIONS = ['settings', 'offices', 'areas', 'situations', 'steps', 'lawyers', 'cases', 'testimonials', 'faq', 'insights', 'pages'] as const;
export type Collection = (typeof COLLECTIONS)[number];
export type RawContent = Record<Collection, unknown>;
export type SanityDoc = { _id: string; _type: string; [k: string]: unknown };

export const SANITY_TYPE: Record<Collection, string> = {
  settings: 'settings', offices: 'office', areas: 'area', situations: 'situation', steps: 'step', lawyers: 'lawyer',
  cases: 'caseStudy', testimonials: 'testimonial', faq: 'faq', insights: 'insight', pages: 'page',
};
const COLLECTION_OF: Record<string, Collection> = Object.fromEntries(COLLECTIONS.map((c) => [SANITY_TYPE[c], c]));

export const BLOCK_TYPES = ['p', 'h2', 'h3', 'ul', 'quote'] as const;
/** Named object types for array items that are not blocks or localized strings (Sanity needs a _type in arrays). */
const ITEM_TYPE: Record<string, string> = { pillars: 'pillar', stats: 'stat' };

type AssetRef = (kind: 'stock' | 'team', id: string) => string;

const isLocalized = (o: Record<string, unknown>) =>
  typeof o.pt === 'string' && Object.keys(o).every((k) => k === 'pt' || k === 'en');

function toSanity(value: unknown, key: string, assetRef: AssetRef): unknown {
  if (typeof value === 'string' && (key === 'image' || key === 'photo')) {
    return { _type: 'image', asset: { _type: 'reference', _ref: assetRef(key === 'photo' ? 'team' : 'stock', value) } };
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      if (!item || typeof item !== 'object') return item;
      const o = toSanity(item, '', assetRef) as Record<string, unknown>;
      const _type = typeof o._type === 'string' ? o._type : isLocalized(item as Record<string, unknown>) ? 'localizedString' : ITEM_TYPE[key] ?? 'object';
      return { ...o, _type, _key: `${key || 'item'}-${i}` };
    });
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'type' && typeof v === 'string' && (BLOCK_TYPES as readonly string[]).includes(v)) out._type = v;
      else out[k] = toSanity(v, k, assetRef);
    }
    return out;
  }
  return value;
}

/** Content → Sanity documents. `assetRef` returns the Sanity asset id for a local image (stock or team photo). */
export function toSanityDocs(raw: RawContent, assetRef: AssetRef): SanityDoc[] {
  const docs: SanityDoc[] = [];
  for (const c of COLLECTIONS) {
    const type = SANITY_TYPE[c];
    if (c === 'settings') {
      docs.push({ ...(toSanity(raw.settings, '', assetRef) as object), _id: 'settings', _type: type });
      continue;
    }
    for (const item of raw[c] as { id: string }[]) {
      docs.push({ ...(toSanity(item, '', assetRef) as object), _id: `${type}-${item.id}`, _type: type });
    }
  }
  return docs;
}

function fromValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(fromValue);
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    if (typeof o._type === 'string' && (BLOCK_TYPES as readonly string[]).includes(o._type)) out.type = o._type;
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_') || v === null || v === undefined) continue;
      out[k] = fromValue(v);
    }
    return out;
  }
  return value;
}

/** Sanity documents (as returned by CONTENT_QUERY) → content in the JSON shapes, ready for the Zod schemas. */
export function fromSanity(docs: unknown[]): RawContent {
  const out = Object.fromEntries(COLLECTIONS.map((c) => [c, c === 'settings' ? undefined : []])) as Record<Collection, unknown>;
  for (const doc of docs as SanityDoc[]) {
    const c = COLLECTION_OF[doc._type];
    if (!c) continue;
    const value = fromValue(doc);
    if (c === 'settings') out.settings = value;
    else (out[c] as unknown[]).push(value);
  }
  return out;
}

const image = (field: string) =>
  `"${field}": select(defined(${field}.asset) => { "url": ${field}.asset->url, "width": ${field}.asset->metadata.dimensions.width, "height": ${field}.asset->metadata.dimensions.height })`;

/** Every published content document, images dereferenced to { url, width, height }. */
export const CONTENT_QUERY = `*[_type in [${COLLECTIONS.map((c) => `"${SANITY_TYPE[c]}"`).join(', ')}] && !(_id in path("drafts.**"))] | order(order asc, _id asc) { ..., ${image('image')}, ${image('photo')} }`;
