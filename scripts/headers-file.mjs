/** @typedef {{ pattern: string; headers: Record<string, string> }} HeaderRule */

/**
 * Parser for Cloudflare Pages `_headers` files (pattern line, then indented "Name: value" lines).
 * @param {string} text
 * @returns {HeaderRule[]}
 */
export function parseHeaders(text) {
  /** @type {HeaderRule[]} */
  const rules = [];
  let current;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: {} };
      rules.push(current);
    } else if (current) {
      const i = raw.indexOf(':');
      current.headers[raw.slice(0, i).trim()] = raw.slice(i + 1).trim();
    }
  }
  return rules;
}

/** Headers that apply to a path, later rules overriding earlier ones (Cloudflare merges matching rules). */
export function headersFor(rules, path) {
  const out = {};
  for (const r of rules) {
    const re = new RegExp('^' + r.pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    if (re.test(path)) Object.assign(out, r.headers);
  }
  return out;
}
