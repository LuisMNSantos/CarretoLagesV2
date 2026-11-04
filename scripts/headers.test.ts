import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseHeaders } from './headers-file.mjs';

const rules = parseHeaders(readFileSync('public/_headers', 'utf8'));
const all = rules.find((r) => r.pattern === '/*')!.headers;

describe('public/_headers', () => {
  test('security headers for every page', () => {
    expect(all['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    expect(all['X-Content-Type-Options']).toBe('nosniff');
    expect(all['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(all['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    expect(all['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(all['X-Robots-Tag']).toBe('noindex, nofollow');
  });

  test('strict CSP', () => {
    const csp = all['Content-Security-Policy']!;
    for (const d of [
      "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:", "font-src 'self'",
      "media-src 'self'", 'frame-src https://www.google.com', "connect-src 'self'", "base-uri 'self'",
      "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'", 'upgrade-insecure-requests',
    ]) expect(csp, d).toContain(d);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  test('long cache for hashed assets and video', () => {
    for (const p of ['/_astro/*', '/video/*']) {
      expect(rules.find((r) => r.pattern === p)?.headers['Cache-Control'], p).toBe('public, max-age=31536000, immutable');
    }
  });
});
