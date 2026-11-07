import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createContactHandler, type ContactEnv } from './contact-handler';

const env: ContactEnv = {
  TURNSTILE_SECRET: 'ts-secret',
  EMAIL_API_TOKEN: 'email-token',
  CF_ACCOUNT_ID: 'acc123',
  CONTACT_TO: 'luismanuelsantos2801@gmail.com',
  CONTACT_FROM: 'formulario@builtbyluis.dev',
};
const NOW = 1_800_000_000_000;
const SEND_URL = 'https://api.cloudflare.com/client/v4/accounts/acc123/email/sending/send';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const fields = (over: Record<string, string> = {}) => ({
  nome: 'Maria Silva', email: 'maria@example.pt', telefone: '', area: 'fiscal', escritorio: 'aveiro',
  mensagem: 'Recebi uma notificação das Finanças e preciso de ajuda.', consentimento: 'on', website: '',
  startedAt: String(NOW - 10_000), locale: 'pt', 'cf-turnstile-response': 'token-ok', ...over,
});
const post = (f: Record<string, string>, ip = '203.0.113.7') => {
  const body = new FormData();
  for (const [k, v] of Object.entries(f)) body.append(k, v);
  return new Request('https://carretolages-formulario.pages.dev/api/contacto', { method: 'POST', body, headers: { 'CF-Connecting-IP': ip, Accept: 'application/json' } });
};

let verifyOk: boolean;
let sendReply: { status: number; body: unknown };
const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url === VERIFY_URL) return Response.json({ success: verifyOk, 'error-codes': verifyOk ? [] : ['invalid-input-response'] });
  if (url === SEND_URL) return Response.json(sendReply.body, { status: sendReply.status });
  throw new Error(`unexpected fetch ${url} ${init?.method}`);
});
const sends = () => fetchMock.mock.calls.filter(([u]) => String(u) === SEND_URL);
let handle: ReturnType<typeof createContactHandler>;

beforeEach(() => {
  fetchMock.mockClear();
  verifyOk = true;
  sendReply = { status: 200, body: { success: true, errors: [], messages: [], result: { delivered: [env.CONTACT_TO], queued: [], permanent_bounces: [] } } };
  handle = createContactHandler({ fetch: fetchMock as unknown as typeof fetch, now: () => NOW });
});

describe('createContactHandler', () => {
  test('valid submission → 200 and one send with reply_to', async () => {
    const res = await handle(post(fields()), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sends()).toHaveLength(1);
    const [, init] = sends()[0]!;
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer email-token');
    const body = JSON.parse(String(init!.body));
    expect(body).toMatchObject({ to: ['luismanuelsantos2801@gmail.com'], from: 'formulario@builtbyluis.dev', reply_to: 'maria@example.pt', subject: 'Novo contacto pelo site — Direito Fiscal' });
    expect(body.text).toContain('Recebi uma notificação das Finanças');
    const verify = fetchMock.mock.calls.find(([u]) => String(u) === VERIFY_URL)!;
    const vb = new URLSearchParams(String(verify[1]!.body));
    expect([vb.get('secret'), vb.get('response'), vb.get('remoteip')]).toEqual(['ts-secret', 'token-ok', '203.0.113.7']);
  });

  test('invalid email → 422 with errors.email in the request language', async () => {
    const res = await handle(post(fields({ email: 'maria@', locale: 'en' })), env);
    expect(res.status).toBe(422);
    const json = (await res.json()) as { ok: boolean; errors: Record<string, string> };
    expect(json.ok).toBe(false);
    expect(json.errors.email).toMatch(/email/i);
    expect(json.errors.email).not.toMatch(/Indique/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('missing token → 403 form.spam, no call to the email API', async () => {
    const res = await handle(post(fields({ 'cf-turnstile-response': '' })), env);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { errors: { form: string } }).errors.form).toMatch(/validar o envio/);
    expect(sends()).toHaveLength(0);
  });

  test('turnstile success:false → 403', async () => {
    verifyOk = false;
    const res = await handle(post(fields()), env);
    expect(res.status).toBe(403);
    expect(sends()).toHaveLength(0);
  });

  test('email API failure → 502 sendFailed, nothing logged', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendReply = { status: 403, body: { success: false, errors: [{ code: 10000, message: 'Authentication error' }], result: null } };
    const res = await handle(post(fields()), env);
    expect(res.status).toBe(502);
    expect(((await res.json()) as { errors: { form: string } }).errors.form).toMatch(/telefone ou email/);
    const logged = JSON.stringify(log.mock.calls);
    for (const secret of ['Recebi uma notificação', 'maria@example.pt', 'Maria Silva', 'email-token']) expect(logged).not.toContain(secret);
    log.mockRestore();
  });

  test('a recipient that is not delivered or queued counts as a failure', async () => {
    sendReply = { status: 200, body: { success: true, errors: [], result: { delivered: [], queued: [], permanent_bounces: [env.CONTACT_TO] } } };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await handle(post(fields()), env)).status).toBe(502);
  });

  test('sixth POST from the same IP within 10 min → 429', async () => {
    for (let i = 0; i < 5; i++) expect((await handle(post(fields()), env)).status).toBe(200);
    expect((await handle(post(fields()), env)).status).toBe(429);
    expect((await handle(post(fields(), '198.51.100.9'), env)).status).toBe(200);
  });

  test('a body that is not form data → 400 JSON', async () => {
    const res = await handle(new Request('https://x/api/contacto', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } }), env);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
