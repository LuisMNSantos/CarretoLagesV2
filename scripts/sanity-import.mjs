// One-off import of the JSON content (examples included) into the Sanity dataset of the sanity plan.
// Usage: SANITY_WRITE_TOKEN=... npm run sanity:import   (token from `cd studio && npx sanity tokens add import --role editor`)
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { COLLECTIONS, toSanityDocs } from '../src/lib/sanity-map.ts';

const env = Object.fromEntries(
  readFileSync('.env.sanity', 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const token = process.env.SANITY_WRITE_TOKEN;
if (!token) throw new Error('SANITY_WRITE_TOKEN is not set');
const client = createClient({ projectId: env.PUBLIC_SANITY_PROJECT_ID, dataset: env.PUBLIC_SANITY_DATASET, apiVersion: '2026-11-01', token, useCdn: false });

const raw = Object.fromEntries(COLLECTIONS.map((c) => [c, JSON.parse(readFileSync(`src/content/${c}.json`, 'utf8'))]));

// Every local image the content points to: `image` fields are stock photos, `photo` fields are team portraits.
const wanted = new Map();
(function collect(v, key = '') {
  if (Array.isArray(v)) v.forEach((x) => collect(x));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) collect(x, k);
  else if (typeof v === 'string' && (key === 'image' || key === 'photo')) {
    const kind = key === 'photo' ? 'team' : 'stock';
    wanted.set(`${kind}:${v}`, { kind, id: v });
  }
})(raw);

const assets = new Map();
for (const [k, { kind, id }] of wanted) {
  const file = kind === 'team' ? `src/assets/team/${id}.png` : `src/assets/stock/${id}.jpg`;
  const asset = await client.assets.upload('image', readFileSync(file), { filename: file.split('/').pop() });
  assets.set(k, asset._id);
  console.log('image', k, '→', asset._id);
}

const docs = toSanityDocs(raw, (kind, id) => assets.get(`${kind}:${id}`));
const tx = client.transaction();
for (const d of docs) tx.createOrReplace(d);
await tx.commit();
console.log(`imported ${docs.length} documents and ${assets.size} images into ${env.PUBLIC_SANITY_PROJECT_ID}/${env.PUBLIC_SANITY_DATASET}`);
