// Minimal static server for dist/ that mimics Cloudflare Pages: `/x` → `x.html`, nearest 404.html,
// and the rules from dist/_headers. Used by the security e2e suite (Astro's preview ignores _headers).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { headersFor, parseHeaders } from './headers-file.mjs';

const root = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = Number(process.env.PORT ?? 4330);
const rules = parseHeaders(await readFile(join(root, '_headers'), 'utf8'));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml', '.txt': 'text/plain',
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}

async function resolve(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  if (clean.includes('..')) return null;
  const candidates = pathname === '/' ? ['index.html'] : [clean, `${clean}.html`, join(clean, 'index.html')];
  for (const c of candidates) if (await isFile(join(root, c))) return join(root, c);
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let file = await resolve(url.pathname);
  let status = 200;
  if (!file) {
    status = 404;
    file = join(root, url.pathname.startsWith('/en/') ? 'en/404.html' : '404.html');
  }
  const body = await readFile(file);
  res.writeHead(status, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    ...headersFor(rules, url.pathname),
  });
  res.end(body);
}).listen(port, () => console.log(`serving dist/ with _headers on http://localhost:${port}`));
