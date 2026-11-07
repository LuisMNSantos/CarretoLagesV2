# Três versões do site (base, formulario, sanity) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One codebase that builds three variants of the Carreto Lages site (no form; working form; working form + Sanity CMS), each published to its own `*.pages.dev` address and verified end to end with real data.

**Architecture:**
- A build-time flag `PUBLIC_PLAN` (`base` | `formulario` | `sanity`, default `formulario`) is read in `src/lib/env.ts`.
- A small Astro integration adjusts `dist/` per plan: it drops the thank-you pages in `base` and adds the Turnstile origins to the CSP in the form plans.
- The form posts to a Cloudflare Pages Function, `functions/api/contacto.ts`. The function is a thin wrapper around a pure, unit-tested handler: validation with the existing schema, then Turnstile siteverify, then the Cloudflare Email Sending REST API.
- In `sanity`, `src/lib/content.ts` reads the raw content from Sanity at build time (top-level await) instead of the JSON files. It still validates with the same Zod schemas.

**Tech Stack:**
- Already in use: Astro 7 (static), TypeScript strict, Zod 4, Vitest 5, Playwright (Chrome channel), Cloudflare Pages + Pages Functions, `cf` CLI v0.15, `npx wrangler pages deploy`/`pages secret`.
- New: Cloudflare Turnstile, Cloudflare Email Sending (REST), Sanity (`@sanity/client` in the site, a Studio in `studio/`).

**Spec:** `docs/superpowers/specs/2026-11-07-tres-versoes-design.md` (read it first). Background: the original spec `D:\PersonalProjects\CarretoLagesLawyer\docs\superpowers\specs\2026-11-04-redesign-website-design.tex`, sections "Formulário de contacto" and "Gestão de conteúdos".

## Global Constraints

- **Pages projects** (new; the existing `carretolages` project is left untouched):
  - `carretolages-base`
  - `carretolages-formulario`
  - `carretolages-sanity`
- **All three variants:** `PUBLIC_DESIGN_PREVIEW=true` (example content stays) and `PUBLIC_NOINDEX=true`. The `pages.dev` `X-Robots-Tag` rules in `public/_headers` stay as they are.
- **Email:**
  - Recipient: `luismanuelsantos2801@gmail.com`.
  - Sender: `formulario@builtbyluis.dev`. The `builtbyluis.dev` zone is on Cloudflare and has no MX.
  - Reply-To: the visitor's validated email.
  - Body: always in Portuguese, stating the visitor's language. Subject: `Novo contacto pelo site — <área>`.
- **Area labels:**
  - `penal` → `Direito Penal`
  - `imobiliario` → `Direito Imobiliário`
  - `fiscal` → `Direito Fiscal`
  - `financeiro` → `Direito Financeiro`
  - `outro` or empty → `Outra / não sei`
- **Office labels:** `aveiro` → `Aveiro`, `oliveira-de-frades` → `Oliveira de Frades`, `indiferente` or empty → `Indiferente`.
- **No auto-reply to the visitor.** Never store messages, and never log message content.
- **Secrets** live only in Pages project secrets, never in git or in client code:
  - `EMAIL_API_TOKEN`
  - `TURNSTILE_SECRET`
  - `SANITY_WRITE_TOKEN`, which is used only locally by the import and never in Pages.
- **Plain config** goes in Pages secrets as well, so one mechanism covers everything: `CF_ACCOUNT_ID`, `CONTACT_TO`, `CONTACT_FROM`.
- **Public config** goes in committed mode files (`.env.base`, `.env.formulario`, `.env.sanity`): `PUBLIC_PLAN`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET=production`.
- **Free plans only.** If any command asks for payment or a paid plan, stop and ask Luís.
- **Cloudflare tooling:**
  - Use the `cf` CLI for zone, DNS, Email Sending, Turnstile and projects. Run `--help` or `--dry-run` before any command not used before.
  - Use `npx wrangler` only for `pages deploy` and `pages secret put`.
  - Never add a Wrangler config file.
- **Before the first publish of each project:** confirm with Luís (README rule).
- **Commits:** no `Co-Authored-By` trailer. Commit only the files of the task.
- **The full suite stays green after every task:**
  - `npx vitest run`
  - `npx astro check` (0 errors)
  - `npx playwright test` (default plan)
- **Plan-specific e2e specs** read the build's `<html data-plan>` and fail fast if it does not match the plan they test, because Playwright reuses an existing server.

## Review Focus

1. **Visitor double-clicks "Enviar" or the network is slow.** Expect one email, a disabled button showing "A enviar…", and no second POST. Test: Task 3, `submits once while sending`.
2. **Turnstile token expired or missing** (page left open, then submitted). Expect a clear message, the widget reset, and the typed text kept. Tests: Task 3, `server rejection keeps the typed values and resets Turnstile`; Task 4, `missing token → 403 form.spam`.
3. **Email API down or rejecting** (bad token, unverified destination). Expect the visitor to see `form.sendFailed`, with phone and email, never the thank-you page. Expect no message content in logs. Test: Task 4, `email API failure → 502 sendFailed, nothing logged`.
4. **Visitor text with HTML or newlines in the name or subject** (`<script>`, `\r\nBcc:`). Expect it escaped in HTML and stripped from the subject. Test: Task 4, `escapes html and strips newlines from the subject`.
5. **Editor leaves a required field empty in Sanity and publishes.** Expect the build to fail on Zod, and the previous deployment to stay live. Test: Task 6, `fromSanity output with a missing required field fails the schema`. The live check is in Task 8.

---

### Task 1: Plan flag, per-plan build adjustments and deploy script

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/layouts/Base.astro:22` (add `data-plan={plan}`)
- Modify: `astro.config.mjs`
- Modify: `.gitignore` (add `!.env.base`, `!.env.formulario`, `!.env.sanity`)
- Modify: `package.json`
- Create: `scripts/plan-build.mjs`, `scripts/plan-build.test.ts`
- Create: `scripts/deploy-plan.mjs`
- Create: `.env.base`, `.env.formulario`, `.env.sanity`

**Interfaces:**
- Produces in `src/lib/env.ts`:
  - `export type Plan = 'base' | 'formulario' | 'sanity'`
  - `export const plan: Plan`. Unknown or unset values give `'formulario'`.
  - `export const hasForm: boolean`, which is `plan !== 'base'`.
  - `export const turnstileSiteKey: string`, from `PUBLIC_TURNSTILE_SITE_KEY`, falling back to Cloudflare's always-pass test key `1x00000000000000000000AA`.
- Produces in `scripts/plan-build.mjs`:
  - `export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'`
  - `export function cspForPlan(csp: string, plan: string): string`. It appends `TURNSTILE_ORIGIN` to `script-src` and `frame-src` when the plan is not `base`.
  - `export function pagesToDrop(plan: string): string[]`. It returns `['obrigado.html', 'en/thank-you.html']` for `base` and `[]` otherwise.
  - `export function resolvePlan(argv: string[], cwd: string): string`. Order of precedence:
    1. `process.env.PUBLIC_PLAN`;
    2. otherwise Vite `loadEnv(<value after --mode in argv, or 'production'>, cwd, 'PUBLIC_').PUBLIC_PLAN`;
    3. otherwise `'formulario'`.

    Astro does not pass the mode to the config, so `astro.config.mjs` calls `planBuild(resolvePlan(process.argv, process.cwd()))`.
  - `export function planBuild(plan: string): AstroIntegration`. On `astro:build:done` it deletes `pagesToDrop`, and rewrites the `/*` CSP in `dist/_headers` with `cspForPlan`, using `parseHeaders` from `scripts/headers-file.mjs`.
- Produces `scripts/deploy-plan.mjs <plan>`:
  1. Runs `astro build --mode <plan>`.
  2. Runs `npx wrangler pages deploy . --project-name carretolages-<plan> --branch main`, with `cwd` set to `dist/` for `base` so `functions/` is not uploaded, and from the repo root otherwise.

- [ ] **Step 1: Write failing tests** in `scripts/plan-build.test.ts`:
  - `cspForPlan(publicCsp, 'formulario')` contains `script-src 'self' https://challenges.cloudflare.com` and `frame-src https://www.google.com https://challenges.cloudflare.com`.
  - `cspForPlan(publicCsp, 'base') === publicCsp`.
  - `pagesToDrop('base')` equals `['obrigado.html','en/thank-you.html']`, and `pagesToDrop('sanity')` equals `[]`.
  - `.env.formulario` and `.env.sanity` each set `PUBLIC_PLAN` to their plan and a `PUBLIC_TURNSTILE_SITE_KEY` that does not start with `1x000` or `2x000` or `3x000`. Write the test now; it passes once Task 5 fills in the real key. Until then mark it `test.todo`.
  - `.env.base` sets `PUBLIC_PLAN=base`.
  - `resolvePlan(['node','astro','build','--mode','base'], cwd)` returns `'base'` with `PUBLIC_PLAN` unset.
  - `resolvePlan(['node','astro','build'], cwd)` returns `'formulario'`.
  - With `process.env.PUBLIC_PLAN='sanity'`, `resolvePlan` returns `'sanity'` whatever the mode.
- [ ] **Step 2: Run** `npx vitest run scripts/plan-build.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the env exports, the `plan-build.mjs` functions, the integration (`integrations: [sitemap(...), planBuild(resolvePlan(process.argv, process.cwd()))]`), `data-plan` on `<html>`, the three mode files, the `.gitignore` exceptions and `deploy-plan.mjs`.
  - Add package scripts `build:base`, `build:formulario` and `build:sanity` (`astro build --mode <plan>`), and `deploy:plan` (`node scripts/deploy-plan.mjs`).
  - `allRoutes()` in `src/lib/all-routes.ts` skips the `thanks` key when `plan === 'base'`.
- [ ] **Step 4: Run** `npx vitest run`, then `npm run build:base`. Expected: tests PASS, and `dist/obrigado.html` is absent and `dist/_headers` is unchanged. Then run `npm run build:formulario`. Expected: `dist/_headers` CSP contains `challenges.cloudflare.com`.
- [ ] **Step 5: Commit** with `feat: build-time plan flag (base/formulario/sanity) with per-plan pages and CSP`.

### Task 2: Base variant — contact section without a form, copy that never mentions a form

**Files:**
- Create: `src/components/shared/ContactDirect.astro`
- Modify: `src/components/shared/ContactSection.astro`
- Modify: `src/content/schemas.ts` (block `when`)
- Modify: `src/lib/content.ts` (filter blocks by plan)
- Modify: `src/content/pages.json`, `src/content/faq.json`, `src/content/settings.json`, and any other string the e2e finds
- Modify: `src/i18n/ui.ts`
- Create: `tests/e2e/plan-base.spec.ts`

**Interfaces:**
- Consumes `plan` and `hasForm` from Task 1.
- Produces:
  - Every `block` variant in `schemas.ts` gets `when: z.enum(['form', 'noForm']).optional()`.
  - `export function blocksFor(blocks: Block[], hasForm: boolean): Block[]` in `content.ts`. It keeps a block when `when` is unset, or when it equals `hasForm ? 'form' : 'noForm'`. It is applied to every `body`, `description`, `context` and `bio` when `pages`, `areas`, `cases`, `insights` and `lawyers` are parsed.
- `ContactDirect.astro` (props `{ locale: Locale }`) renders inside the same frame where the form sat:
  - a lead from the new UI key `contact.directLead` (PT `Ligue-nos ou escreva-nos. Respondemos em 24 horas úteis.`, EN `Call or write to us. We reply within one working day.`);
  - the email (`mailto:`) and the phone (`settings.phoneHref`) as large links with the `mail` and `phone` icons;
  - the hours.

- [ ] **Step 1: Write failing e2e** `tests/e2e/plan-base.spec.ts`:
  - `beforeAll` asserts `<html data-plan="base">`.
  - For every route in `allRoutes(true)`: no `[data-contact-form]`, and `page.locator('main')` text does not match `/formulário|contact form|\bthe form\b/i`.
  - `/#contacto` shows a `a[href^="mailto:"]` and a `a[href^="tel:"]` inside `#contacto`.
  - `GET /obrigado` → 404.
  - No request to `challenges.cloudflare.com`.
- [ ] **Step 2: Run** `PUBLIC_PLAN=base npx playwright test tests/e2e/plan-base.spec.ts --project=desktop`. Expected: FAIL. Kill any server reused from another plan first.
- [ ] **Step 3: Implement**:
  - `ContactSection` renders `ContactForm` when `hasForm` and `ContactDirect` otherwise.
  - Copy:
    - Mark the form-specific blocks with `when: "form"` and add `when: "noForm"` counterparts. These are proBono block 3, privacy block 3, and the privacy subprocessor list. In the `form` list, replace `Resend (a ativar na versão final)` with `Cloudflare (envio de email)` / `Cloudflare (email delivery)`.
    - Rewrite non-block strings to a neutral wording in both locales, e.g. faq `primeiro-contacto` → `Pode ligar-nos ou escrever-nos. …`.
- [ ] **Step 4: Run** the base spec (PASS), then `npx vitest run` and the default `npx playwright test` (PASS; the default plan is still `formulario`).
- [ ] **Step 5: Commit** with `feat: base plan shows direct contacts instead of the form`.

### Task 3: Form client — Turnstile, real submit, sending and error states

**Files:**
- Modify: `src/components/shared/ContactForm.astro`
- Modify: `src/scripts/contact-form.ts`
- Modify: `src/lib/contact-schema.ts`
- Modify: `src/i18n/ui.ts`
- Modify: `src/components/pages/SimplePages.astro:43`
- Modify: `scripts/js-budget.test.ts` (count only same-origin scripts)
- Modify: `tests/e2e/form.spec.ts`, `tests/e2e/form-nojs.spec.ts`, `tests/e2e/review-fixes.spec.ts:43`
- Create: `tests/e2e/turnstile-stub.ts`

**Interfaces:**
- Produces in `contact-schema.ts`: `export function splitSubmission(fd: Iterable<[string, FormDataEntryValue]>): { fields: Record<string, string>; token: string; locale: Locale }`. It removes `cf-turnstile-response` and `locale` before `validateContact`. Task 4 uses it on the server.
- The form gets:
  - `action="/api/contacto"`;
  - a hidden `<input name="locale">`;
  - `<div class="cf-turnstile" data-sitekey={turnstileSiteKey} data-language={locale === 'pt' ? 'pt-PT' : 'en'} data-theme="light">`;
  - `<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer>`.

  These are rendered only when `hasForm`.
- Client flow on a valid submit:
  1. Set the button to disabled with `aria-busy="true"` and the label to `form.sending`.
  2. `fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })`.
  3. On `{ ok: true }`, go to `data-thanks`.
  4. On `{ ok: false, errors }`, show the errors exactly like the client validation does.
  5. On a network error, or a non-JSON or 5xx response, show `form.sendFailed` in the summary.
  6. After any failure, call `window.turnstile?.reset()` and re-enable the button.
- New UI keys:
  - `form.sendFailed`: PT `Não foi possível enviar a mensagem. Tente de novo ou contacte-nos por telefone ou email.`; EN `We could not send your message. Please try again or contact us by telephone or email.`
- Changed UI keys:
  - `form.noscript`: PT `O formulário precisa de JavaScript. Pode contactar-nos por telefone ou email.`; EN `The form needs JavaScript. You can contact us by telephone or email.`
  - `thanks.lead` stays.
- Remove `form.previewNotice` from the form and the thank-you page, because sending is real.
- `tests/e2e/turnstile-stub.ts`: `export async function stubTurnstile(page: Page): Promise<void>`. It routes the Turnstile `api.js` to a script that defines `window.turnstile = { reset() { /* counts resets in window.__tsResets */ } }` and appends a hidden `cf-turnstile-response` input with value `XXXX.DUMMY.TOKEN.XXXX` to every `.cf-turnstile`.

- [ ] **Step 1: Write failing tests**, all using `stubTurnstile` and `page.route('**/api/contacto', …)`:
  - In `form.spec.ts`, replace `a valid submission goes to the thank-you page and sends nothing` with:
    - `a valid submission posts once and goes to the thank-you page`: the route returns `{ ok: true }`; exactly 1 POST; the body contains `cf-turnstile-response` and `locale=pt`; the URL is `/obrigado`.
    - `submits once while sending`: the route delays 1 s; double-click; 1 POST; the button shows `A enviar…` and `aria-busy="true"` while pending.
    - `server rejection keeps the typed values and resets Turnstile`: the route returns 422 `{ ok:false, errors:{ email:'Indique um email válido.' } }`; the email error is visible; the name keeps its value; `window.__tsResets === 1`.
    - `send failure shows the fallback message`: the route returns 502 `{ ok:false, errors:{ form: … } }` and the summary text matches `/telefone ou email/`. Also abort the route and expect the same message.
  - `form-nojs.spec.ts`: without JS, the notice `O formulário precisa de JavaScript` is visible and `[data-submit]` is hidden.
  - `review-fixes.spec.ts:43`: the thank-you page no longer contains `pré-visualização`.
  - Vitest in `src/lib/contact-schema.test.ts`: `splitSubmission` strips the token and the locale; with `locale=en` the locale is `en`; an unknown locale gives `pt`.
- [ ] **Step 2: Run** `npx vitest run src/lib/contact-schema.test.ts` and `npx playwright test tests/e2e/form.spec.ts tests/e2e/form-nojs.spec.ts --project=desktop --project=nojs`. Expected: FAIL.
- [ ] **Step 3: Implement** the form markup, the client flow, `splitSubmission`, the UI keys, and the `js-budget` same-origin filter (skip `src` starting with `http`).
- [ ] **Step 4: Run** the full `npx vitest run`, `npx astro check` and `npx playwright test`. Expected: PASS.
  - If the real Turnstile script makes other specs flaky (a11y or network), apply `stubTurnstile` to every spec through a shared Playwright fixture in `tests/e2e/turnstile-stub.ts`. Do not weaken the assertions. Then run `npm run serve:headers` after `npm run build:formulario`, and check that `tests/e2e/security.spec.ts` reports no CSP violations with the real Turnstile script.
- [ ] **Step 5: Commit** with `feat: contact form submits to /api/contacto with Turnstile and sending states`.

### Task 4: Server handler and Pages Function

**Files:**
- Create: `src/server/contact-email.ts`, `src/server/contact-email.test.ts`
- Create: `src/server/contact-handler.ts`, `src/server/contact-handler.test.ts`
- Create: `functions/api/contacto.ts`
- Modify: `tsconfig.json` (include `functions`; add `@cloudflare/workers-types` only if the function needs types beyond the standard `Request`/`Response`)

**Interfaces:**
- Consumes `validateContact` and `splitSubmission` (Task 3), and `t` from `src/i18n/ui.ts`.
- Produces:
  - `export type ContactEnv = { TURNSTILE_SECRET: string; EMAIL_API_TOKEN: string; CF_ACCOUNT_ID: string; CONTACT_TO: string; CONTACT_FROM: string }`
  - `export function buildContactEmail(data: ContactData, locale: Locale, receivedAt: Date): { subject: string; text: string; html: string }`
    - Portuguese only. Subject: `Novo contacto pelo site — ${areaLabel}`, with every `\r` and `\n` removed.
    - Body lines: `Nome`, `Email`, `Telefone`, `Área`, `Escritório`, `Língua` (`Português`/`Inglês`), `Recebido em` (Europe/Lisbon, `dd/mm/aaaa hh:mm`), then `Mensagem`.
    - `html` escapes `& < > " '`.
  - `export async function handleContact(request: Request, env: ContactEnv, deps: { fetch: typeof fetch; now: () => number }): Promise<Response>`. It always returns JSON.
    1. Rate limit: more than 5 POSTs per `CF-Connecting-IP` in 10 minutes, in an in-memory `Map` at module scope, gives 429 `{ ok:false, errors:{ form: t(locale,'form.spam') } }`.
    2. `splitSubmission`, then `validateContact`. On failure: 422 `{ ok:false, errors }`.
    3. Turnstile: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (form body `secret`, `response`, `remoteip`). A missing token or `success !== true` gives 403 `{ ok:false, errors:{ form: t(locale,'form.spam') } }`.
    4. Send: `POST https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/email/sending/send` with `Authorization: Bearer ${EMAIL_API_TOKEN}` and JSON `{ to: CONTACT_TO, from: CONTACT_FROM, reply_to: data.email, subject, text, html }`. Confirm the exact `reply_to` and `from` name shapes against the Email Sending REST docs before coding.
    5. Response: on `success === true` with `CONTACT_TO` in `result.delivered` or `result.queued`, return 200 `{ ok:true }`. Otherwise return 502 `{ ok:false, errors:{ form: t(locale,'form.sendFailed') } }`, and `console.error` only the HTTP status and the API error codes.
  - `functions/api/contacto.ts` is `export const onRequestPost: PagesFunction<ContactEnv> = ({ request, env }) => handleContact(request, env, { fetch, now: Date.now })`. Any other method → 405.

- [ ] **Step 1: Write failing tests**, with `deps.fetch` as a `vi.fn` routing by URL:
  - `buildContactEmail`:
    - `escapes html and strips newlines from the subject`, with the name `<b>Ana</b>\r\nBcc: x@y.z` and the area `fiscal`.
    - Subject `Novo contacto pelo site — Direito Fiscal`.
    - Empty area gives `Outra / não sei`; empty office gives `Indiferente`; `Língua: Inglês` for `en`.
    - The time formats in Europe/Lisbon.
  - `handleContact`:
    - `valid submission → 200 and one send with reply_to`.
    - `invalid email → 422 with errors.email in the request language`.
    - `missing token → 403 form.spam`, with no call to the email API.
    - `turnstile success:false → 403`.
    - `email API failure → 502 sendFailed, nothing logged`: spy on `console.error`, assert that no argument contains the message text or the visitor's email.
    - `sixth POST from the same IP within 10 min → 429`.
- [ ] **Step 2: Run** `npx vitest run src/server`. Expected: FAIL.
- [ ] **Step 3: Implement** both modules and the function file.
- [ ] **Step 4: Run** `npx vitest run`, `npx astro check` and `npx wrangler pages functions build --outdir .tmp-fn` (bundling check, no deploy). Expected: PASS and the bundle builds. Delete `.tmp-fn`.
- [ ] **Step 5: Commit** with `feat: Pages Function sends contact requests via Cloudflare Email Sending`.

### Task 5: Cloudflare setup and publish `base` + `formulario`, verified live

**Files:**
- Modify: `.env.formulario`, `.env.sanity` (real `PUBLIC_TURNSTILE_SITE_KEY`)
- Modify: `scripts/plan-build.test.ts` (turn the `test.todo` into a test)
- Modify: `README.md` (section "Três versões")

No code beyond the key. Each step is a command and its expected result. Record IDs in the ledger, never secrets.

- [ ] **Step 1: Email Sending on `builtbyluis.dev`.**
  - Command: `cf email-sending subdomains --help`, then the enable or create command it lists for the zone `builtbyluis.dev` (`--dry-run` first).
  - Expected: the SPF/DKIM records exist (`cf dns records list --zone builtbyluis.dev`).
- [ ] **Step 2: Verify the destination.**
  - Command: `cf email-routing addresses create` with `luismanuelsantos2801@gmail.com` (check `--help`).
  - **Luís clicks the verification email.** Expected: the address shows as verified.
- [ ] **Step 3: API token with Email Sending permission.** Create it with `cf accounts tokens --help` if supported, otherwise Luís creates it in the dashboard. The token goes straight into `npx wrangler pages secret put EMAIL_API_TOKEN` in Step 6, and is never written to disk.
- [ ] **Step 4: Turnstile widget.**
  - Command: `cf turnstile widgets create`, mode `managed`, domains `carretolages-formulario.pages.dev` and `carretolages-sanity.pages.dev`.
  - Put the site key in `.env.formulario` and `.env.sanity`. Keep the secret for Step 6.
  - Enable the `.env` key test and run `npx vitest run scripts/plan-build.test.ts`. Expected: PASS.
- [ ] **Step 5: Ask Luís to confirm publishing**, then create the projects with `cf pages projects create` (`--help` first) for `carretolages-base` and `carretolages-formulario`, production branch `main`.
- [ ] **Step 6: Secrets for `carretolages-formulario`.** Use `npx wrangler pages secret put <NAME> --project-name carretolages-formulario` for `TURNSTILE_SECRET`, `EMAIL_API_TOKEN`, `CF_ACCOUNT_ID`, `CONTACT_TO=luismanuelsantos2801@gmail.com` and `CONTACT_FROM=formulario@builtbyluis.dev`.
- [ ] **Step 7: Deploy.**
  - Command: `npm run deploy:plan -- base`, then `npm run deploy:plan -- formulario`.
  - Expected:
    - `curl -sI https://carretolages-base.pages.dev/obrigado` → 404.
    - `curl -sI https://carretolages-formulario.pages.dev/` has `x-robots-tag: noindex, nofollow` and a CSP with `challenges.cloudflare.com`.
- [ ] **Step 8: Live negative checks.**
  - `curl -s -X POST -F nome=Teste -F email=a@b.pt -F mensagem='mensagem de teste longa' -F consentimento=on -F startedAt=1 https://carretolages-formulario.pages.dev/api/contacto` → 403 JSON (no token).
  - `curl -s -X POST https://carretolages-base.pages.dev/api/contacto` → 404 or 405 (no function in base).
- [ ] **Step 9: Live positive check.**
  1. Open `https://carretolages-formulario.pages.dev/contactos` in headed Chrome (Playwright `headless: false`).
  2. Fill in real-looking data in PT, pass Turnstile and submit. Expected: `/obrigado`.
  3. **Luís confirms** that the email arrived in `luismanuelsantos2801@gmail.com` with every field, and that replying addresses the visitor's email.
  4. Repeat once in EN (`/en/contact`): the email states `Língua: Inglês`.
- [ ] **Step 10: Commit** with `chore: Turnstile site key and publish base and formulario variants`, including the README section. The section lists the two URLs, the deploy command, which secrets exist (names only), and how to change `CONTACT_TO` later.

### Task 6: Content from Sanity at build time (loader + mapping)

**Files:**
- Create: `src/lib/sanity-map.ts`, `src/lib/sanity-map.test.ts`
- Create: `src/lib/sanity-source.ts`
- Modify: `src/lib/content.ts`
- Modify: `src/content/schemas.ts`
- Modify: `src/lib/images.ts`, `src/components/shared/StockImage.astro`, `src/components/shared/LawyerCard.astro`, `src/components/pages/LawyerPage.astro`
- Modify: `astro.config.mjs` (`image: { domains: ['cdn.sanity.io'] }`)
- Modify: `package.json` (`@sanity/client`)

**Interfaces:**
- **`schemas.ts`:**
  - `imageId` becomes `imageRef = z.union([z.string().regex(/^[a-z0-9-]+$/), remoteImage])`.
  - `remoteImage = z.strictObject({ url: z.string().url().startsWith('https://cdn.sanity.io/'), width: z.number().int().positive(), height: z.number().int().positive() })`.
  - `lawyer.photo` becomes `imageRef.optional()`.
- **`images.ts`:** `export function imageSource(ref: ImageRef, kind: 'stock' | 'team'): { src: ImageMetadata } | { src: string; width: number; height: number }`. Components spread it into `<Picture>`. The existing `stockImage` and `teamPhoto` stay for local ids.
- **`sanity-map.ts`** has type-only imports, so Node can import it directly from `.mjs` with type stripping:
  - `export const COLLECTIONS = ['settings','offices','areas','situations','steps','lawyers','cases','testimonials','faq','insights','pages'] as const`
  - `export type RawContent = Record<(typeof COLLECTIONS)[number], unknown>`
  - `export const SANITY_TYPE: Record<(typeof COLLECTIONS)[number], string>`, e.g. `cases → 'caseStudy'`.
  - `export function toSanityDocs(raw: RawContent, assetRef: (kind: 'stock' | 'team', id: string) => string): SanityDoc[]`
    - `_id` is `${type}.${id}`; settings is the singleton `_id: 'settings'`.
    - Blocks become `{ _type: block.type, _key, ...rest }`.
    - Array items get `_key`.
    - Image ids become `{ _type: 'image', asset: { _type: 'reference', _ref } }`.
  - `export function fromSanity(docs: unknown[]): RawContent`
    - Groups by `_type`.
    - Recursively drops keys starting with `_`, except that a block's `_type` becomes `type`.
    - Drops `null` values.
    - Settings becomes the single object.
  - `export const CONTENT_QUERY: string`. It is a GROQ query for all `_type in [...]` published docs. Every `image`/`photo` is projected as `{ "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`.
- **`sanity-source.ts`:** `export async function fetchSanityContent(projectId: string, dataset: string): Promise<RawContent>`. It uses `@sanity/client` with `useCdn: false`, `apiVersion: '2026-11-01'`, `perspective: 'published'` and no token, then returns `fromSanity(await client.fetch(CONTENT_QUERY))`.
- **`content.ts`:** `const raw = plan === 'sanity' ? await fetchSanityContent(...) : jsonRaw`. All parsing below stays as it is (Zod still guards the build).

- [ ] **Step 1: Write failing tests** in `src/lib/sanity-map.test.ts`:
  - `round trip keeps every collection`:
    1. Take `fromSanity(project(toSanityDocs(jsonRaw, fakeRef)))`, where the test helper `project` replaces each image reference with `{ url: 'https://cdn.sanity.io/images/p/d/<id>-10x10.jpg', width: 10, height: 10 }`.
    2. Each collection parses with its Zod schema.
    3. It deep-equals `jsonRaw` with the image fields swapped for those objects.
  - `fromSanity strips _key/_rev and maps block _type to type`.
  - `fromSanity output with a missing required field fails the schema`: delete `areas[0].title`, and `areaSchema.parse` throws.
- [ ] **Step 2: Run** `npx vitest run src/lib/sanity-map.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**:
  - the modules;
  - `imageSource`, with the 3 components switched to it (local output must be byte-identical: compare `dist` HTML of `npm run build` before and after for one area page and one lawyer page);
  - the `content.ts` switch;
  - the `astro.config` image domain.
- [ ] **Step 4: Run** `npx vitest run`, `npx astro check` and `npx playwright test`. Expected: PASS (the JSON path is unchanged).
- [ ] **Step 5: Commit** with `feat: sanity plan reads content from Sanity at build time`.

### Task 7: Sanity project, Studio and import

**Files:**
- Create: `studio/` (Sanity Studio, own `package.json`)
  - `studio/sanity.config.ts`
  - `studio/sanity.cli.ts`
  - `studio/schemaTypes/*.ts`
  - `studio/structure.ts`
- Create: `scripts/sanity-import.mjs`
- Modify: `tsconfig.json` (exclude `studio`), `.env.sanity` (`PUBLIC_SANITY_PROJECT_ID`), `package.json` (`sanity:import`), `.gitignore` (`studio/node_modules`, `studio/dist`)

**Interfaces:**
- Consumes `toSanityDocs` and `SANITY_TYPE` (Task 6).
- **Studio schema rules:**
  - The document types match `SANITY_TYPE`.
  - Object types: `localizedString` and `localizedText`, with fields `pt` (required) and `en` (optional), labelled `Português` / `Inglês` and shown side by side (`options: { columns: 2 }`). Also `p`, `h2`, `h3`, `ul`, `quote`, plus the optional `when` select (`Só com formulário` / `Só sem formulário`).
  - Fields copy the Zod constraints: required, the `min`/`length` of arrays, the tuple titles as arrays of exactly 2, and the enums as `options.list` with pt-PT titles.
  - Images: `image` with `options.hotspot`, and alt text from the existing names.
  - Labels and descriptions are in pt-PT.
  - Settings is a singleton in `structure.ts`.
- **`scripts/sanity-import.mjs`:**
  1. Reads the JSON files and uploads each referenced image from `src/assets/stock/<id>.jpg` / `src/assets/team/<id>.png`, once each.
  2. Writes `createOrReplace` for every doc in one transaction.
  3. Takes the token from `process.env.SANITY_WRITE_TOKEN`; the project id and dataset come from `.env.sanity`.

- [ ] **Step 1: Luís logs in.** Ask him to run `! npx sanity@latest login`. Expected: logged in.
- [ ] **Step 2: Create the project and Studio.**
  - Command: `npx sanity@latest init --create-project "Carreto Lages" --dataset production --output-path studio --template clean --typescript -y`. Check `--help` for the current flag names first.
  - Expected: a project id. Put it in `.env.sanity` and `studio/sanity.cli.ts`.
  - Confirm the dataset is public with `npx sanity dataset visibility get production`.
- [ ] **Step 3: Write the schemas, structure and config.** Run `cd studio && npx sanity schema validate` (or `npx sanity build`). Expected: no errors.
- [ ] **Step 4: Import.**
  - Create a token with `npx sanity tokens add "import" --role editor` (from `studio/`), keep it only in the shell env, and run `npm run sanity:import`.
  - Expected: every document is created.
  - Then run `PUBLIC_PLAN=sanity` with `npm run build:sanity` locally. Expected: the build passes and `dist` has the same routes as `npm run build:formulario`. Compare `allRoutes` counts and diff the visible text of the home and one area page.
- [ ] **Step 5: Deploy the Studio.**
  - Command: `cd studio && npx sanity deploy`, hostname `carretolages`.
  - Expected: `https://carretolages.sanity.studio` opens with pt-PT labels.
  - Revoke the import token: `npx sanity tokens delete`.
- [ ] **Step 6: Commit** with `feat: Sanity Studio and content import for the sanity plan`.

### Task 8: Publish `sanity`, automatic rebuild, verified live

**Files:**
- Modify: `README.md`
- Modify: `docs/plan/2026-11-04-v2-build-ledger.md`

- [ ] **Step 1: Ask Luís to confirm publishing.**
  - Create `carretolages-sanity` as a **Git-connected** Pages project on `LuisMNSantos/CarretoLagesV2`, branch `main`, with build command `npm ci && npm run build:sanity`, output `dist`, and env `NODE_VERSION=24`.
  - If the Cloudflare GitHub app is not yet authorised, Luís does it once in the dashboard. Try `cf pages projects create` with a source config first; use the dashboard if `cf` cannot.
- [ ] **Step 2: Secrets** for `carretolages-sanity`: the same five as Task 5 Step 6. Expected: the first Git build succeeds and `https://carretolages-sanity.pages.dev` serves the Sanity content.
- [ ] **Step 3: Deploy hook and webhook.**
  1. Create a deploy hook on `carretolages-sanity` (dashboard → Settings → Builds → Deploy hooks).
  2. Create a Sanity webhook with `cd studio && npx sanity hook create`. Settings: URL = the deploy hook, dataset `production`, triggers create/update/delete, filter `!(_id in path("drafts.**"))`, HTTP POST.
- [ ] **Step 4: Live check of the CMS.**
  1. In the Studio, change one lawyer's `role` (PT) and one area's `summary`, and publish.
  2. Expected: within 3 minutes, `https://carretolages-sanity.pages.dev` shows both changes. Check with `curl` and grep.
  3. Revert both and publish. Expected: the original text is back.
  4. Swap one lawyer's photo, check it, then revert it.
- [ ] **Step 5: Broken-content check.** Clear a required field (an area `title.pt`) and publish.
  - Expected: the Pages build fails on Zod, and the site keeps serving the previous version.
  - Restore the field and publish. Expected: the build is green again.
- [ ] **Step 6: Form on sanity.** Repeat Task 5 Step 9 once on `https://carretolages-sanity.pages.dev/contactos`. **Luís confirms** that the email arrived.
- [ ] **Step 7: Side by side.** Open the three URLs at 1440 px and 390 px. Expected: the same design; the only differences are the form, the direct contacts and the content source.
- [ ] **Step 8: Commit** with `docs: three variants published (base, formulario, sanity)`, including:
  - the README: the three URLs, the Studio URL, how a change flows, and how to redeploy;
  - the ledger: the rulings and the divergences from the original spec;
  - the spec and this plan.
