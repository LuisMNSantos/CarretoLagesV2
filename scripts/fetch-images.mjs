// Downloads the stock images listed in src/content/image-credits.json into src/assets/stock/.
// Run only after the list has been approved (plan Task 5). Skips files that already exist.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';

const credits = JSON.parse(await readFile(new URL('../src/content/image-credits.json', import.meta.url), 'utf8'));
const outDir = new URL('../src/assets/stock/', import.meta.url);
await mkdir(outDir, { recursive: true });

for (const c of credits) {
  const target = new URL(`${c.id}.jpg`, outDir);
  try { await access(target); console.log(`skip ${c.id}`); continue; } catch {}
  if (!c.url.startsWith('https://images.unsplash.com/')) throw new Error(`Unexpected host for ${c.id}`);
  const res = await fetch(`${c.url}?fm=jpg&q=82&w=2400`);
  if (!res.ok) throw new Error(`${c.id}: HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/jpeg')) throw new Error(`${c.id}: unexpected content-type ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(target, buf);
  console.log(`ok   ${c.id} ${(buf.length / 1e6).toFixed(2)} MB`);
}
