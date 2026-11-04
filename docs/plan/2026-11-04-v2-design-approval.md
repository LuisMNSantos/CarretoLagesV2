# Carreto Lages v2 — Design Approval Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new, fully static, bilingual (PT/EN) Astro site in `D:\PersonalProjects\CarretoLagesV2` that shows the complete final design of every page on desktop and mobile, with a LaTeX report (screenshots, tests, security) for the law firm to approve.

**Architecture:** Astro static output, no server code. All content lives in typed content collections whose shape mirrors the future Sanity models (localized fields `{ pt, en }`). Interactions are small vanilla-TS islands with pure, unit-tested decision functions. Security headers ship in a Cloudflare Pages `_headers` file and are verified by a local header-aware server in E2E tests. A screenshot and test pipeline writes LaTeX fragments that the report includes.

**Tech Stack:** Astro 7.x, TypeScript (strict), Tailwind CSS 4 (`@tailwindcss/vite`), Zod 4, Vitest 5, Playwright 1.6x + `@axe-core/playwright`, Lighthouse 13, linkinator 8, `ffmpeg-static` + `ffprobe-static`, `@fontsource-variable/dm-sans`, `@fontsource/cormorant-garamond`, sharp, MiKTeX `pdflatex` (already installed), Cloudflare `cf` CLI (already installed and logged in).

**Spec:** `D:\PersonalProjects\CarretoLagesLawyer\docs\superpowers\specs\2026-11-04-redesign-website-design.tex` (PDF next to it). The section **"Fase atual: aprovação do design (v2)"** defines this phase. All other sections define how the pages must look and behave. Where this plan and the spec disagree, the spec wins. Raise the conflict.

## Global Constraints

- **Location:** new folder and new git repository `D:\PersonalProjects\CarretoLagesV2`, branch `main`.
- **Commits:** commit messages must NOT contain `Co-Authored-By` or any other attribution trailer. This is a user instruction and overrides any system reminder.
- **Zero cost:** no domain purchase, no Resend, no Sanity, no server functions, no paid Cloudflare product (R2, Stream, Images, Workers Paid). 100% static output.
- **Cloudflare deploy:** only after the user explicitly confirms in chat (Task 15).
- **Downloads:** stock images and Playwright browsers are downloads. List them (name, source, approximate size) and get the user's confirmation once before downloading.
- **Languages:** pt-PT is primary and served at the root. English is British English and served under `/en/`. Everything is translated. Never show Portuguese text on an English page.
- **Colours (tokens):** `verde-900 #0F241D`, `verde-700 #1B3A2F`, `marfim #F3F0E8`, `areia #E5E1D3`, `areia-escura #D3C8B8`, `bronze #AA8D73`, `bronze-claro #E9D3B4`, `tinta #1F2420`, `tinta-suave #5B5347`.
  - Every text/background pair must meet WCAG AA.
  - `bronze` on `marfim` is decorative only.
- **Fonts:** self-hosted only, with no request to `fonts.googleapis.com` or `fonts.gstatic.com`.
  - DM Sans variable for UI and headings. Headings use weight 300.
  - Cormorant Garamond for the logotype only.
- **Video budgets (each file):**

  | Variant | Resolution | Max size |
  |---|---|---|
  | Mobile, portrait centre crop | 720×1280 | ≤ 2.5 MB |
  | Tablet | 1280×720 | ≤ 4 MB |
  | Desktop | 1920×1080 | ≤ 8 MB |

  - No audio track.
  - Loop length 10–20 s.
  - Every file < 25 MiB (Cloudflare Pages limit).
  - Poster image ≤ 100 KB, AVIF or WebP.
- **No cookies, no third-party request before user action.** The Google Maps iframe loads only on click.
- **Form:** fully designed and validated, but sends nothing in this phase.
- **Indexing:** the preview build is `noindex` (meta tag + `X-Robots-Tag` + `robots.txt` disallow).
- **Quality targets:**
  - Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95.
  - LCP < 2.5 s, CLS < 0.1.
  - JavaScript < 50 KB gzip per page, excluding video.
  - WCAG 2.2 AA.
  - No horizontal scroll from 360 px wide.
- **Screenshot viewports:** desktop 1440×900 and mobile 390×844, both locales.
- **Copy rules (spec "Textos"):**
  - Short sentences, in the client's language, not legal jargon.
  - No promised results and no superlatives about the firm.
  - Headings are two short lines.
- **Placeholder content:** sample testimonials, case studies and articles are allowed in this design build only.
  - Mark them `placeholder: true`.
  - Render them only when `PUBLIC_DESIGN_PREVIEW=true`, with a visible "Exemplo ilustrativo / Illustrative example" badge.

## Routes (single source of truth: `src/i18n/routes.ts`)

| Key | PT | EN |
|---|---|---|
| home | `/` | `/en/` |
| firm | `/sociedade` | `/en/the-firm` |
| history | `/sociedade/historia` | `/en/the-firm/history` |
| values | `/sociedade/perfil-e-valores` | `/en/the-firm/profile-and-values` |
| proBono | `/sociedade/pro-bono` | `/en/the-firm/pro-bono` |
| areas | `/areas-de-atuacao` + `/[slug]` | `/en/practice-areas` + `/[slug]` |
| lawyers | `/advogados` + `/[slug]` | `/en/lawyers` + `/[slug]` |
| cases | `/casos` + `/[slug]` | `/en/case-studies` + `/[slug]` |
| insights | `/destaques` + `/[slug]` | `/en/insights` + `/[slug]` |
| contact | `/contactos` | `/en/contact` |
| thanks | `/obrigado` | `/en/thank-you` |
| privacy | `/politica-de-privacidade` | `/en/privacy-policy` |
| terms | `/termos-e-condicoes` | `/en/terms-and-conditions` |
| disputes | `/resolucao-de-litigios` | `/en/dispute-resolution` |
| cookies | `/cookies` | `/en/cookies` |
| 404 | `/404.html` | `/en/404.html` |

Area slugs:

| PT | EN |
|---|---|
| `direito-penal` | `criminal-law` |
| `direito-imobiliario` | `real-estate-law` |
| `direito-fiscal` | `tax-law` |
| `direito-financeiro` | `banking-and-finance-law` |

Lawyer slugs are the same in both locales (e.g. `jose-carreto-lages`).

## Review Focus

1. **Long text at 360 px.** Long English headings, long names ("Catarina Pereira Carvalho") and long words ("contraordenações") must never cause horizontal scroll or clipped buttons. Pinned in Task 14 with a route-wide `scrollWidth` check at 360 px.
2. **Video fails or is slow.** A 404, decode error or stall must leave the poster visible, keep the text readable and throw no uncaught error. Pinned in Task 6 with an aborted video request.
3. **JavaScript disabled.** All content, all situations, all carousel cards, the FAQ and every nav destination stay reachable. The form shows a notice instead of silently doing nothing. Pinned in Tasks 8 and 9 with JS-disabled Playwright projects.
4. **Keyboard-only use.**
   - Visible focus everywhere.
   - Skip link works.
   - Escape closes the mobile menu and returns focus to its button.
   - Arrow keys move between situation tabs.
   - Pinned in Tasks 7 and 8.
5. **Hostile or odd form input.** Pasted HTML, 3 001-character messages, emoji, CRLF in the name and whitespace-only fields must produce clear localized errors with no crash. The future email renderer must escape everything. Pinned in Task 10 unit tests.

---

### Task 1: Repository scaffold and toolchain

**Files:**
- Create: `D:\PersonalProjects\CarretoLagesV2\` with these files:
  - `package.json`
  - `astro.config.mjs`
  - `tsconfig.json`
  - `.gitignore`
  - `.nvmrc` (contents `24`)
  - `README.md`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `src/pages/index.astro` (temporary)
- Create: `docs/spec/` (copy the spec `.tex` and `.pdf`) and `docs/plan/` (copy this plan)
- Test: `src/smoke.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: these npm scripts, which every later task uses:
  - `dev`, `build`, `preview`
  - `test` (vitest run)
  - `test:e2e` (playwright test)
  - `check` (astro check)
  - `video` (Task 5)
  - `screens` (Task 13)
  - `report` (Task 14)
  - `serve:headers` (Task 12)
- Produces: two env flags, both defaulting to `"true"` in `.env.example` (`.env` is ignored):
  - `PUBLIC_DESIGN_PREVIEW` shows placeholder content with badges.
  - `PUBLIC_NOINDEX` adds the noindex meta and makes `robots.txt` disallow all. Only Task 13's Lighthouse run sets it to `"false"`.
- Produces: Playwright projects:
  - `desktop`: Chromium, 1440×900
  - `mobile`: Chromium, Pixel-like, 390×844
  - `nojs`: 390×844, `javaScriptEnabled: false`

  Each project's `baseURL` comes from `PW_BASE_URL`, defaulting to `http://localhost:4321`. `webServer` runs `npm run build && npm run preview`.

- [ ] **Step 1:** Create the folder and run `git init -b main`. Scaffold Astro 7 minimal with strict TypeScript. Add Tailwind 4 through `@tailwindcss/vite`, then Vitest and Playwright.
  - `astro.config.mjs` sets `site: 'https://carretolages-v2.pages.dev'`, `output: 'static'`, `trailingSlash: 'never'`, and `build.format: 'directory'`.
  - Ask the user before `npx playwright install chromium` (it downloads about 150 MB).
- [ ] **Step 2:** Write `src/smoke.test.ts` (`expect(1+1).toBe(2)`) and `tests/e2e/smoke.spec.ts` (GET `/` → status 200, `html[lang="pt-PT"]`).
- [ ] **Step 3:** Run `npm test && npm run test:e2e -- --project=desktop`. Expected: both PASS.
- [ ] **Step 4:** Copy the spec (`.tex` + `.pdf`) into `docs/spec/` and this plan into `docs/plan/`. Write a README covering purpose, scripts, the zero-cost rule and the no-co-author rule.
- [ ] **Step 5:** Commit: `git add -A && git commit -m "chore: scaffold Astro v2 design-approval project"`. Use a plain message with no trailers.

### Task 2: Design tokens, fonts, base layout

**Files:**
- Create:
  - `src/styles/global.css` (Tailwind `@import "tailwindcss"` plus an `@theme` block holding the colour tokens from Global Constraints and the font families)
  - `src/lib/contrast.ts`
  - `src/layouts/Base.astro`
  - `src/components/seo/Head.astro`
- Test: `src/lib/contrast.test.ts`, `tests/e2e/base.spec.ts`

**Interfaces:**
- Produces: `contrastRatio(fg: string, bg: string): number`, using the WCAG relative-luminance formula with hex input.
- Produces: `Base.astro` with these props:

  ```ts
  { locale: 'pt'|'en'; title: string; description: string;
    alternates: { pt?: string; en?: string };
    headerVariant?: 'overlay'|'solid';
    jsonLd?: object[] }
  ```

  - Renders `<html lang>` as `pt-PT` or `en`.
  - Renders a skip link to `#conteudo`.
  - Renders `<main id="conteudo">`.
  - Renders the Header and Footer slots from Task 7.
- Produces: `Head.astro`, which emits:
  - title and meta description
  - canonical
  - `hreflang` links for `pt-PT`, `en` and `x-default` (pointing at pt), only for the alternates that exist
  - Open Graph tags
  - `<meta name="robots" content="noindex,nofollow">` unless `PUBLIC_NOINDEX === 'false'`
  - JSON-LD scripts as `type="application/ld+json"`

- [ ] **Step 1: Write failing tests** in `src/lib/contrast.test.ts`:

```ts
test.each([
  ['#1F2420','#F3F0E8'], ['#5B5347','#F3F0E8'], ['#F3F0E8','#0F241D'],
  ['#F3F0E8','#1B3A2F'], ['#0F241D','#E9D3B4'], ['#1F2420','#E5E1D3'],
])('AA text pair %s on %s', (fg,bg)=>expect(contrastRatio(fg,bg)).toBeGreaterThanOrEqual(4.5));
test('bronze on marfim is below AA (decorative only)', ()=>expect(contrastRatio('#AA8D73','#F3F0E8')).toBeLessThan(4.5));
test('black on white is 21', ()=>expect(contrastRatio('#000000','#FFFFFF')).toBeCloseTo(21,1));
```

- [ ] **Step 2:** Run `npx vitest run src/lib/contrast.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `contrastRatio`, write `global.css`, and import fonts via `@fontsource-variable/dm-sans` and `@fontsource/cormorant-garamond/500.css`, Latin subset only. Then build `Base.astro` and `Head.astro`.
- [ ] **Step 4:** Write `tests/e2e/base.spec.ts`:
  - The page makes no request whose URL contains `fonts.googleapis.com` or `fonts.gstatic.com` (listen to `page.on('request')`).
  - The skip link is the first focusable element and moves focus to `#conteudo`.
  - The robots meta is present.
- [ ] **Step 5:** Run `npm test && npm run test:e2e -- --project=desktop`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: design tokens, self-hosted fonts and base layout`.

### Task 3: i18n — routes and UI dictionary

**Files:**
- Create:
  - `src/i18n/routes.ts`
  - `src/i18n/ui.ts` (all fixed interface strings: nav, buttons, form labels and errors, video pause/play labels, map consent text, badges, footer)
  - `src/i18n/locale.ts`
- Modify: `astro.config.mjs`, adding the `i18n` block `{ defaultLocale: 'pt', locales: ['pt','en'], routing: { prefixDefaultLocale: false } }`
- Test: `src/i18n/routes.test.ts`, `src/i18n/ui.test.ts`

**Interfaces:**
- Produces:

  ```ts
  type Locale = 'pt'|'en'
  type RouteKey = 'home'|'firm'|'history'|'values'|'proBono'|'areas'|'lawyers'|'cases'|'insights'|'contact'|'thanks'|'privacy'|'terms'|'disputes'|'cookies'
  ```

- Produces: `localizePath(key: RouteKey, locale: Locale, slug?: string): string`, using the Routes table above.
- Produces: `alternatePath(key: RouteKey, target: Locale, slugs?: { pt?: string; en?: string }): string`. It returns the localized path. If a slug is needed but missing for `target`, it returns `localizePath('home', target)`.
- Produces: `t(locale: Locale, key: UiKey): string`, where `UiKey` is the key union of `ui.pt`.
- Produces: `getLocale(url: URL): Locale`, which is `'en'` when the path starts with `/en`.

- [ ] **Step 1: Write failing tests:**

```ts
expect(localizePath('areas','en','tax-law')).toBe('/en/practice-areas/tax-law');
expect(localizePath('home','pt')).toBe('/');
expect(localizePath('home','en')).toBe('/en/');
expect(localizePath('values','pt')).toBe('/sociedade/perfil-e-valores');
expect(alternatePath('insights','en',{pt:'artigo-x'})).toBe('/en/');
expect(alternatePath('areas','pt',{pt:'direito-fiscal',en:'tax-law'})).toBe('/areas-de-atuacao/direito-fiscal');
expect(getLocale(new URL('https://x/en/lawyers'))).toBe('en');
// ui.test.ts
test('every PT key exists in EN and both are non-empty', ...);
test('no EN value equals its PT value except allow-list', ...); // allow-list: brand names, phone, 'Pro Bono', 'Email'
```

- [ ] **Step 2:** Run `npx vitest run src/i18n`. Expected: FAIL.
- [ ] **Step 3:** Implement the three modules. The ui dictionary is `as const` objects `{ pt: {...}, en: {...} }`.
- [ ] **Step 4:** Run `npx vitest run src/i18n`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: i18n routes and UI dictionary`.

### Task 4: Content model and bilingual copy

**Files:**
- Create: `src/content.config.ts`. Use the Astro content-layer API (`defineCollection` + `glob`/`file` loaders). Check the Astro 7 docs for exact loader imports.
- Create: `src/lib/content.ts`
- Create content files under `src/content/`:
  - `settings.json` (singleton)
  - `offices.json`
  - `areas/*.json` (4)
  - `situations.json`
  - `steps.json`
  - `lawyers/*.json` (8)
  - `cases/*.json` (3)
  - `testimonials.json`
  - `faq.json`
  - `insights/*.md` (2 placeholder articles, front-matter plus localized body files `*.pt.md` / `*.en.md`)
  - `pages/*.json` for: história, perfil-e-valores, pro-bono, privacidade, termos, litígios, cookies
- Create: `src/content/image-credits.json`
- Test: `src/lib/content.test.ts`

**Interfaces:**
- Produces: the Zod helper `localized = z.object({ pt: z.string().min(1), en: z.string().min(1).optional() })` and `localizedRich` for markdown bodies.
- Produces: schemas mirroring the spec's CMS list. Every item has `placeholder?: boolean` and `order: number`.
  - Areas: `slug: {pt,en?}`, `title`, `summary`, `keywords: localized[]`, `image`, `description`.
  - Situations: `label`, `title`, `body`, `tags: localized[]`, `area: areaId`, `image`.
  - Lawyers: `name`, `role: localized`, `areas: areaId[]`, `email`, `photo?`, `bio: localized`, `slug`.
  - Settings: phone, email, hours, `heroTitle`, `heroLead`, `stats[]`, `pillars[]`, `promiseResponse`.
- Produces: `pick(field: {pt:string;en?:string}, locale: Locale): string | undefined`.
- Produces: `isTranslated(item: unknown, locale: Locale): boolean`. It is true when every localized field in the item has a value for the locale. This is a recursive walk of the item.
- Produces: `visible<T extends {placeholder?:boolean; order:number}>(items: T[], locale: Locale, opts: { preview: boolean }): T[]`. It drops untranslated items, drops placeholders unless preview is on, and sorts by `order`.
- Produces: `getCollectionCounts(locale, preview): { cases: number; testimonials: number; insights: number }`.

- [ ] **Step 1: Write failing tests:**

```ts
test('item missing EN is hidden in EN, shown in PT', ...);
test('placeholders hidden when preview=false, shown when true', ...);
test('visible() sorts by order', ...);
test('all content files parse against schemas', async () => { /* import every JSON and schema.parse */ });
test('every area has en slug and all four expected slugs exist', ...); // the eight slugs from the Routes table
test('every situation.area references an existing area id', ...);
test('only 3 lawyers have photos: jose-carreto-lages, joao-carlos-lages, catarina-pereira-carvalho', ...);
```

- [ ] **Step 2:** Run `npx vitest run src/lib/content.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `content.config.ts` and `content.ts`.
- [ ] **Step 4: Write the copy, PT and EN, for every content file.**
  - Source facts come from the spec appendix "Conteúdo existente a migrar": the 4 areas, 8 people with their roles, 5 FAQ questions, contacts `(+351) 232 762 464`, `geral@carretolages.com`, "Segunda a sexta, 9h00–18h00", and "desde 2002".
  - Use the spec's example headlines verbatim in PT:
    - hero "Decisões importantes. / Em boas mãos."
    - lead "Rigor, proximidade e estratégia nos momentos que contam."
    - areas "Experiência para o que vem a seguir."
    - situations "Cada situação é diferente. / O nosso compromisso é o mesmo."
    - process "Perceber primeiro. / Agir com clareza."
    - contact "As suas prioridades. / A nossa atenção."
  - Write natural British English for each (e.g. "Important decisions. / In safe hands.").
  - The four situations and the four steps (Ouvir, Esclarecer, Agir, Acompanhar) follow the spec's section 04/05 text.
  - Office addresses are unknown (spec open item). Use town-level text ("Aveiro", "Oliveira de Frades") and mark the field `TODO-CONFIRMAR`; Task 13 lists it in the report.
  - Testimonials, cases and insights get `placeholder: true`.
  - Legal pages are drafts headed "Rascunho para revisão / Draft for review". The EN legal pages carry the note that the Portuguese version prevails.
- [ ] **Step 5:** Run `npx vitest run src/lib/content.test.ts`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: content model mirroring CMS and bilingual copy`.

### Task 5: Media pipeline — hero video, poster, stock images

**Files:**
- Create: `scripts/encode-video.mjs`, which reads `VIDEO_SRC` (default `../CarretoLagesLawyer/web/public/Aveiro.mp4`) and writes:
  - `public/video/hero-mobile.{webm,mp4}`
  - `public/video/hero-tablet.{webm,mp4}`
  - `public/video/hero-desktop.{webm,mp4}`
  - `src/assets/hero-poster.jpg` (a high-quality frame; Astro converts it to AVIF/WebP)
- Create: `scripts/fetch-images.mjs`, which downloads the URLs listed in `src/content/image-credits.json` into `src/assets/stock/`.
- Test: `scripts/media.test.ts`

**Interfaces:**
- Produces: the static paths `/video/hero-{mobile|tablet|desktop}.{webm|mp4}` and `src/assets/hero-poster.jpg`.
- Produces: `src/assets/stock/<id>.jpg` for every id in `image-credits.json`. Each record is `{ id, url, author, source: 'Unsplash'|'Pexels', license, usedIn: string[] }`.

- [ ] **Step 1: Write failing tests** (they skip with a clear message if the outputs are missing):

```ts
const budgets = { mobile: 2.5e6, tablet: 4e6, desktop: 8e6 };
test.each(Object.entries(budgets))('%s webm and mp4 within budget', (v, max) => { for (const ext of ['webm','mp4']) expect(statSync(`public/video/hero-${v}.${ext}`).size).toBeLessThanOrEqual(max); });
test('no video has an audio stream', ...);            // ffprobe-static: streams.filter(s=>s.codec_type==='audio').length === 0
test('durations between 10 and 20 s', ...);
test('mobile is 720x1280, tablet 1280x720, desktop 1920x1080', ...);
test('every image-credits record has author, license and an existing file', ...);
```

- [ ] **Step 2:** Run `npx vitest run scripts/media.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `encode-video.mjs` with `ffmpeg-static`:
  - Trim to 15 s and add `-an`.
  - VP9 WebM: CRF ~36, `-b:v 0`, two-pass optional.
  - H.264 MP4: CRF ~28, `-preset slow`, `-movflags +faststart`, `yuv420p`.
  - The mobile variant uses a centre crop to 9:16 before scaling.
  - Tune CRF per variant until each file is within budget.
- [ ] **Step 4:** Choose about 12 stock images (architecture, office interiors, Aveiro and the region, desaturated feel) and fill in `image-credits.json`.
  - Show the list (filename, source URL, approximate size) to the user and get confirmation.
  - Then run `node scripts/fetch-images.mjs`.
- [ ] **Step 5:** Run `npm run video && npx vitest run scripts/media.test.ts`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: encoded hero video variants, poster and credited stock images`. The 62 MB source is never copied into this repo.

### Task 6: Hero with efficient background video

**Files:**
- Create: `src/scripts/hero-video.ts`, `src/components/home/Hero.astro`
- Test: `src/scripts/hero-video.test.ts`, `tests/e2e/hero.spec.ts`

**Interfaces:**
- Produces:

  ```ts
  type VideoEnv = { width: number; height: number; saveData: boolean; effectiveType?: string; reducedMotion: boolean }
  chooseVideoVariant(env: VideoEnv): 'mobile'|'tablet'|'desktop'|null
  initHeroVideo(root: HTMLElement): void
  ```

- Produces: `Hero.astro`, which renders inside `Base` with `headerVariant="overlay"`. Props: `{ locale }`. It reads settings itself.

- [ ] **Step 1: Write failing unit tests:**

```ts
expect(chooseVideoVariant({width:390,height:844,saveData:false,reducedMotion:false})).toBe('mobile');
expect(chooseVideoVariant({width:1024,height:768,saveData:false,reducedMotion:false})).toBe('tablet');
expect(chooseVideoVariant({width:1440,height:900,saveData:false,reducedMotion:false})).toBe('desktop');
expect(chooseVideoVariant({width:1440,height:900,saveData:true,reducedMotion:false})).toBeNull();
expect(chooseVideoVariant({width:1440,height:900,saveData:false,reducedMotion:true})).toBeNull();
for (const t of ['slow-2g','2g','3g']) expect(chooseVideoVariant({width:1440,height:900,saveData:false,effectiveType:t,reducedMotion:false})).toBeNull();
expect(chooseVideoVariant({width:700,height:500,saveData:false,reducedMotion:false})).toBe('tablet'); // landscape small → tablet
```

  Rule: if a null condition applies, return `null`. Otherwise, a portrait screen with `width < 768` gets mobile, `width < 1280` gets tablet, and anything else gets desktop.

- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement the module and component.**
  - The poster is `<Picture>` (AVIF/WebP), `loading="eager"`, `fetchpriority="high"`, covering 100svh.
  - `<video muted playsinline loop preload="none" aria-hidden="true">` has no `src` at first.
  - After `window.load` (or `requestIdleCallback`), `initHeroVideo` sets the `<source>` elements (webm first) and calls `play()`. On `playing` it fades the video in over the poster.
  - It pauses through an `IntersectionObserver` when the hero leaves the viewport and on `visibilitychange`.
  - The pause button is a `<button aria-pressed>` with localized labels from `t()`.
  - On a video `error`, it removes the video element and keeps the poster.
  - The overlay is a left-to-right gradient from `verde-900` at ~90% to ~10%.
  - Content uses the spec section 01 copy. The CTA links to `#contacto` and the phone is shown.
  - The pillars strip (section 02) is part of this component.
- [ ] **Step 4: Write e2e tests** in `tests/e2e/hero.spec.ts`:
  - **Default desktop:** no request to `/video/` before the `load` event, one after it, and the video becomes visible.
  - **`reducedMotion: 'reduce'`:** no request to `/video/` at all.
  - **Route `**/video/**` aborted:** the poster stays visible, there is no page error, and the h1 is readable.
  - **Pause button:** toggling it changes `aria-pressed` and `video.paused`.
  - **LCP:** the LCP candidate is the poster `img` (via `PerformanceObserver` `largest-contentful-paint`).
- [ ] **Step 5:** Run `npm test && npm run test:e2e -- tests/e2e/hero.spec.ts`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: hero with responsive, data-aware background video`.

### Task 7: Header, mobile menu, language switcher, footer, sticky mobile CTA

**Files:**
- Create:
  - `src/components/layout/Header.astro`
  - `src/components/layout/MobileMenu.astro` (native `<dialog>`)
  - `src/components/layout/LangSwitch.astro`
  - `src/components/layout/Footer.astro`
  - `src/components/layout/StickyCta.astro`
  - `src/lib/nav.ts`
  - `src/scripts/header.ts`
- Test: `src/lib/nav.test.ts`, `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `localizePath`, `alternatePath`, `t`, `getCollectionCounts`.
- Produces: `navItems(locale: Locale, counts: {cases:number; insights:number}): { key: RouteKey; href: string; label: string; children?: {...}[] }[]`. It returns, in order: Sociedade (with children Sociedade, História, Perfil e Valores, Pro Bono), Áreas de atuação, Advogados, Casos, Destaques, Contactos. Casos is omitted when `counts.cases === 0` and Destaques when `counts.insights === 0`.
- Produces: `Base` receives `alternates` and passes them to `LangSwitch`.

- [ ] **Step 1: Write failing unit tests:**
  - `navItems('pt',{cases:0,insights:2})` has no `cases` key.
  - The EN hrefs match the Routes table.
  - The order matches the list above.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Header `overlay` is transparent with ivory text. It sets `data-scrolled="true"` after 24 px of scroll, which switches it to an ivory background with green text. Header `solid` is always ivory.
  - Desktop shows the phone and a "Marcar uma conversa / Book a conversation" button.
  - Mobile has a full-screen `<dialog>` menu. Escape closes it and focus returns to the toggle.
  - `LangSwitch` shows "PT | EN" with `aria-current` on the active language and `hreflang` on the links.
  - The footer holds the logo, nav, both offices, phone, email, hours, legal links and "Voltar ao topo / Back to top".
  - `StickyCta` is mobile only, with "Ligar" (`tel:+351232762464`) and "Contactar". It never covers the form submit button: hide it while `#contacto` is in view.
- [ ] **Step 4: Write e2e tests:**
  - **Mobile:** open the menu, press Escape, and the dialog is closed with focus on the toggle.
  - **LangSwitch:** on `/areas-de-atuacao/direito-fiscal` it goes to `/en/practice-areas/tax-law`, and on an insight lacking EN it goes to `/en/`.
  - **`nojs` project at 390 px:** every nav destination is reachable through footer links (the footer duplicates the full nav).
  - **Scroll:** the header switches `data-scrolled`.
- [ ] **Step 5:** Run `npm test && npm run test:e2e -- tests/e2e/navigation.spec.ts`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: header, mobile menu, language switcher, footer`.

### Task 8: Home sections — areas carousel, situations, process

**Files:**
- Create:
  - `src/components/home/AreasCarousel.astro` + `src/scripts/carousel.ts`
  - `src/components/home/Situations.astro` + `src/scripts/tabs.ts`
  - `src/components/home/Process.astro`
- Test: `src/scripts/carousel.test.ts`, `src/scripts/tabs.test.ts`, `tests/e2e/home-interactions.spec.ts`

**Interfaces:**
- Produces: `slideLabel(index: number, total: number): string`, e.g. `(1,4)` → `"02 / 04"`, zero-padded, with index 0-based.
- Produces: `nextIndex(current: number, delta: 1|-1, total: number): number`, clamped (no wrap).
- Produces: `tabKeyTarget(key: string, current: number, total: number): number | null`.
  - ArrowRight/ArrowDown → +1 and ArrowLeft/ArrowUp → -1, both wrapping.
  - Home → 0, End → total-1.
  - Any other key → null.

- [ ] **Step 1: Write failing unit tests** for the three functions, using the examples above and the wrap/clamp edges.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement the carousel.**
  - It is a horizontal `scroll-snap` list of one large card per area: label, two-line title, summary, keywords joined with " · ", link, and a photo on the right (stacked above the text on mobile).
  - Arrows and the counter are progressive enhancement and stay hidden without JS.
  - Swipe is native.
- [ ] **Step 4: Implement situations.**
  - Use the ARIA tabs pattern: `role="tablist"` / `tab` / `tabpanel`, with roving tabindex.
  - Below 768 px it renders as an accordion (`<details>`).
  - Without JS, all panels are visible.
- [ ] **Step 5: Implement the process section.**
  - Four steps.
  - On desktop the active step expands with a photo (hover/focus/click). On mobile the steps are stacked.
  - The link reads "Comece por nos contar a sua situação" and points to `#contacto`.
- [ ] **Step 6: Write e2e tests:**
  - Clicking "next" changes the counter to `02 / 04`.
  - ArrowRight on the first tab focuses and activates the second tab, and the panel title changes.
  - In the `nojs` project, all 4 situation titles and all 4 area titles are visible.
- [ ] **Step 7:** Run `npm test && npm run test:e2e -- tests/e2e/home-interactions.spec.ts`. Expected: PASS.
- [ ] **Step 8:** Commit `feat: areas carousel, situations tabs and process steps`.

### Task 9: Home sections — team, cases, testimonials, FAQ, contact, map; assemble home

**Files:**
- Create:
  - `src/components/home/TeamTeaser.astro`
  - `src/components/shared/LawyerCard.astro` (initials avatar when there is no photo)
  - `src/components/home/CasesTeaser.astro`
  - `src/components/home/Testimonials.astro`
  - `src/components/shared/Faq.astro` (`<details>`)
  - `src/components/shared/ContactSection.astro`
  - `src/components/shared/MapEmbed.astro` + `src/scripts/map.ts`
  - `src/components/shared/PlaceholderBadge.astro`
- Create: `src/pages/index.astro`, `src/pages/en/index.astro` (thin wrappers around `src/components/pages/HomePage.astro`)
- Test: `src/lib/initials.test.ts`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Produces: `initials(name: string): string`. It takes the first letter of the first and last words, upper-cased, e.g. `"Diana Antão Seabra"` → `"DS"` and `"Adriana Silva"` → `"AS"`.
- Produces: `MapEmbed`, with props `{ office: { name: string; embedUrl: string; mapsUrl: string; staticImage: ImageMetadata }, locale }`.
  - It renders the static image, a "Ver mapa interativo / View interactive map" button, a one-line Google notice and an "Abrir no Google Maps" link.
  - On click it injects `<iframe src={embedUrl} title=... loading="lazy" referrerpolicy="strict-origin-when-cross-origin">`.
  - The static map image is a stylised drawing generated once with sharp from an SVG; no Google static API is used.
- Produces: `ContactSection` with props `{ locale, preselectArea?: string }`. It contains the form from Task 10, the offices and the maps.
- Produces: `HomePage.astro`, which assembles the 11 sections in the spec order. Sections 07 and 08 render only when `visible()` returns items.

- [ ] **Step 1:** Write failing `initials` tests (examples above, plus a single-word name → one letter). Run them. Expected: FAIL. Implement. Expected: PASS.
- [ ] **Step 2:** Implement the components and the home assembly. The FAQ emits `FAQPage` JSON-LD via `jsonLd`.
- [ ] **Step 3: Write e2e tests** in `tests/e2e/home.spec.ts`:
  - Section order: the heading text order matches the 11-section list.
  - Before the map click, no request contains `google.com`. After clicking the Aveiro button, an iframe whose `src` contains `google.com/maps/embed` exists.
  - With `PUBLIC_DESIGN_PREVIEW=true`, the testimonials have the "Exemplo ilustrativo" badge.
  - `document.cookie === ''` after a full page load and scroll.
- [ ] **Step 4:** Run `npm test && npm run test:e2e -- tests/e2e/home.spec.ts`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: complete home page with click-to-load maps`.

### Task 10: Contact form (design phase: validated, not sent) and future-safe email renderer

**Files:**
- Create:
  - `src/lib/contact-schema.ts`
  - `src/lib/contact-email.ts`
  - `src/components/shared/ContactForm.astro`
  - `src/scripts/contact-form.ts`
- Test: `src/lib/contact-schema.test.ts`, `src/lib/contact-email.test.ts`, `tests/e2e/form.spec.ts`

**Interfaces:**
- Produces:

  ```ts
  type ContactInput = { nome; email; telefone?; area?; escritorio?: 'aveiro'|'oliveira-de-frades'|'indiferente'; mensagem; consentimento; website /*honeypot*/; startedAt: number }
  validateContact(input: Record<string, unknown>, locale: Locale, now = Date.now()): { ok: true; data: ContactData } | { ok: false; errors: Partial<Record<keyof ContactInput | 'form', string>> }
  renderContactEmail(data: ContactData, meta: { locale: Locale; receivedAt: Date }): { subject: string; html: string; text: string }
  ```

  - Error messages come from `t()`.
  - The email is always in Portuguese and states the visitor's language.
- Validation rules (spec "Formulário de contacto"):
  - `nome` 2–100 characters after trim.
  - `email` must be a valid email.
  - `telefone` is optional and at most 30 characters.
  - `area` is an area id, or `outro`.
  - `mensagem` 10–3000 characters after trim.
  - `consentimento === 'on'`.
  - `website` must be empty, otherwise `errors.form = t('form.spam')`.
  - `now - startedAt >= 3000` ms, otherwise the same spam error.
  - Unknown keys are rejected.

- [ ] **Step 1: Write failing unit tests:**

```ts
ok(valid());                                                       // baseline passes
err({ ...valid(), nome: '   ' }, 'nome');
err({ ...valid(), mensagem: 'x'.repeat(3001) }, 'mensagem');
err({ ...valid(), email: 'a@b' }, 'email');
err({ ...valid(), consentimento: undefined }, 'consentimento');
err({ ...valid(), website: 'http://spam' }, 'form');
err({ ...valid(), startedAt: NOW - 1000 }, 'form');
err({ ...valid(), extra: 1 }, 'form');
ok({ ...valid(), nome: 'José 😊 Lages' });
expect(validateContact({...valid(), nome:''}, 'en').errors.nome).toMatch(/[A-Za-z]/);   // English message
// contact-email.test.ts
expect(renderContactEmail({...d, mensagem:'<script>alert(1)</script>'}, m).html).not.toContain('<script>');
expect(renderContactEmail({...d, nome:'A\r\nBcc: x@y'}, m).subject).not.toMatch(/[\r\n]/);
expect(renderContactEmail({...d, area:'direito-fiscal'}, m).subject).toBe('Novo contacto pelo site — Direito Fiscal');
expect(renderContactEmail(d, {...m, locale:'en'}).text).toContain('Língua do visitante: inglês');
```

- [ ] **Step 2:** Run `npx vitest run src/lib/contact-*`. Expected: FAIL.
- [ ] **Step 3: Implement both modules.**
  - Zod 4 `strictObject`.
  - Escape `& < > " '`.
  - Strip CR/LF from every header-bound value.
- [ ] **Step 4: Implement the form component.**
  - Fields, in order: Nome*, Email*, Telefone, Área (options from content + "Outro / não sei"), Escritório preferido, Mensagem*, consent checkbox linking to the privacy page.
  - Honeypot is visually hidden with `tabindex=-1` and `autocomplete=off`. A hidden `startedAt` is set on first focus.
  - `novalidate`; `method="post"`; `action` = the thanks path.
  - Errors appear inline with `aria-describedby` and `aria-invalid`, plus an `aria-live="polite"` summary. Values are kept.
  - Design phase, valid submit: `location.assign(thanksPath)`, with nothing sent and nothing in the URL.
  - A `<noscript>` notice explains that sending is disabled in this preview.
  - An area page can preselect the area via a `preselectArea` prop. Never use a query string carrying personal data.
- [ ] **Step 5: Write e2e tests:**
  - An empty submit shows 4 inline errors and focus moves to the first invalid field.
  - Typed values persist after an error.
  - A valid submit lands on `/obrigado`, and no network request carries the form values.
  - In the EN form, errors are in English.
- [ ] **Step 6:** Run `npm test && npm run test:e2e -- tests/e2e/form.spec.ts`. Expected: PASS.
- [ ] **Step 7:** Commit `feat: accessible contact form with shared validation and safe email renderer`.

### Task 11: All inner pages (PT and EN)

**Files:**
- Create page components in `src/components/pages/`:
  - `FirmPage.astro`, `InstitutionalPage.astro`
  - `AreasIndex.astro`, `AreaPage.astro`
  - `LawyersIndex.astro`, `LawyerPage.astro`
  - `CasesIndex.astro`, `CasePage.astro`
  - `InsightsIndex.astro`, `InsightPage.astro`
  - `ContactPage.astro`, `ThanksPage.astro`
  - `LegalPage.astro`, `NotFound.astro`
- Create: thin route files for every Routes-table entry under `src/pages/` and `src/pages/en/`. Dynamic routes use `getStaticPaths` over `visible(..., {preview})`. Add `src/pages/404.astro` and `src/pages/en/404.astro`.
- Create: `src/lib/all-routes.ts`
- Create: `src/components/shared/PageHero.astro` (solid-header page intro: label, two-line title, lead, optional image)
- Create: `src/components/shared/CtaBand.astro` (ends every inner page)
- Test: `src/lib/all-routes.test.ts`, `tests/e2e/routes.spec.ts`

**Interfaces:**
- Produces: `allRoutes(preview: boolean): { path: string; locale: Locale; key: RouteKey | '404'; alternates: { pt?: string; en?: string } }[]`. It is the complete list of built pages and is reused by Tasks 12–14.
- Area page content (spec "Páginas interiores"):
  - introduction
  - "o que fazemos" list
  - typical situations (those whose `area` matches)
  - lawyers of the area
  - CTA, with `ContactSection preselectArea`
- Lawyer page content:
  - photo or initials avatar
  - name, role, areas
  - bio
  - mailto email
  - LinkedIn if present
  - `Person` JSON-LD
- Reading pages (cases, insights):
  - line length 65–75 characters (`max-w-[68ch]`)
  - date and area
  - a "Copiar ligação / Copy link" button

- [ ] **Step 1: Write failing tests:**
  - `allRoutes(true)` contains each PT and EN path in the Routes table.
  - It contains 4 area pages per locale and 8 lawyer pages per locale.
  - Every entry with both alternates has PT and EN paths that are each other's alternate.
  - There are no duplicate paths.
- [ ] **Step 2:** Run `npx vitest run src/lib/all-routes.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement all pages and route files.
- [ ] **Step 4: Write `tests/e2e/routes.spec.ts`.** For every `allRoutes(true)` entry:
  - status is 200 (404 pages: their real status is checked via file existence in `dist`)
  - exactly one `h1`
  - `html[lang]` matches the locale
  - `title` and meta description are non-empty
  - every `hreflang` href returns 200
  - on EN pages, no text node matches a PT-only stop-list (`/\b(Advogados|Contactos|Sociedade|Marcar uma conversa)\b/`), excluding the language switcher
- [ ] **Step 5:** Run `npm test && npm run test:e2e -- tests/e2e/routes.spec.ts`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: all inner pages in Portuguese and English`.

### Task 12: SEO and security headers

**Files:**
- Create:
  - `src/lib/jsonld.ts`
  - `src/pages/robots.txt.ts` (`Disallow: /` unless `PUBLIC_NOINDEX === 'false'`)
  - sitemap via `@astrojs/sitemap` with the i18n option
  - `public/_headers`
  - `scripts/serve-with-headers.mjs` (a tiny Node static server for `dist/` that applies the `_headers` rules; npm script `serve:headers`, port 4330)
- Test: `src/lib/jsonld.test.ts`, `scripts/headers.test.ts`, `tests/e2e/security.spec.ts`

**Interfaces:**
- Produces:
  - `legalServiceLd(locale)`, which includes both offices.
  - `personLd(lawyer, locale)`.
  - `faqLd(items, locale)`.
  - `breadcrumbLd(trail: {name:string; path:string}[])`.
  - Each returns a plain object with `@context: 'https://schema.org'`.
- Produces: `public/_headers`, where `/*` gets:
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; frame-src https://www.google.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `X-Robots-Tag: noindex, nofollow`

  `/video/*`, `/_astro/*` and fonts get `Cache-Control: public, max-age=31536000, immutable`.

  If Astro emits inline scripts or styles, configure Astro so it does not: `vite.build.assetsInlineLimit: 0`, `build.inlineStylesheets: 'never'`, and Astro's CSP hashing feature if available in v7. Do not weaken the CSP. If a genuine need remains, record it in the report's decision log.

- [ ] **Step 1: Write failing tests.**
  - `headers.test.ts` parses `public/_headers` and asserts each header above for `/*`, and that `frame-ancestors 'none'` and `object-src 'none'` are present.
  - `jsonld.test.ts`: `legalServiceLd('pt').department.length === 2`; `personLd` has `name` and `jobTitle`; `faqLd` has `mainEntity.length === items.length`.
- [ ] **Step 2:** Run the tests. Expected: FAIL. Implement. Expected: PASS.
- [ ] **Step 3: Write `tests/e2e/security.spec.ts`**, run against `PW_BASE_URL=http://localhost:4330` after `npm run build && npm run serve:headers`. For every `allRoutes(true)` path:
  - The response has the CSP header.
  - Zero `securitypolicyviolation` events are collected via `page.addInitScript`. Interact with the map button on `/contactos` to cover `frame-src`.
  - There are no console errors.
  - `document.cookie === ''`.
  - No request goes to a host other than the site, except `www.google.com` after the map click.
- [ ] **Step 4:** Run the security suite. Expected: PASS.
- [ ] **Step 5:** Add the npm script `audit` = `npm audit --audit-level=moderate --json > reports/npm-audit.json; node scripts/summarize-audit.mjs`. Expected: 0 moderate-or-higher vulnerabilities, otherwise fix or record them.
- [ ] **Step 6:** Add `scripts/secret-scan.test.ts`, which scans tracked files (`git ls-files`) for `re_[A-Za-z0-9]{20,}`, `sk-[A-Za-z0-9]{20,}`, `-----BEGIN .*PRIVATE KEY-----` and `.env` files, and expects none. Run it. Expected: PASS.
- [ ] **Step 7:** Commit `feat: SEO metadata, JSON-LD and strict security headers`.

### Task 13: Quality gates — accessibility, links, Lighthouse, budgets, responsive

**Files:**
- Create:
  - `tests/e2e/a11y.spec.ts`
  - `tests/e2e/responsive.spec.ts`
  - `scripts/lighthouse.mjs`
  - `scripts/linkcheck.mjs`
  - `scripts/js-budget.test.ts`
- Output: `reports/*.json` (git-ignored except the summaries `reports/summary/*.json`, which are committed for the report)

**Interfaces:**
- Consumes: `allRoutes(true)`.
- Produces: JSON summaries that Task 14 reads:
  - `reports/summary/axe.json` (`{ path, viewport, violations: {id, impact, nodes}[] }[]`)
  - `reports/summary/lighthouse.json` (`{ path, performance, accessibility, bestPractices, seo, lcpMs, cls }[]`)
  - `reports/summary/links.json` (`{ checked, broken: {url, status, parent}[] }`)
  - `reports/summary/js-budget.json`
  - `reports/summary/tests.json` (Vitest and Playwright JSON reporters)

- [ ] **Step 1: Accessibility.** In `a11y.spec.ts`, for every route × {desktop, mobile}, run AxeBuilder with tags `wcag2a, wcag2aa, wcag21aa, wcag22aa`. Expect zero `serious` or `critical` violations and write the summary.
- [ ] **Step 2: Responsive.** In `responsive.spec.ts`, at width 360, for every route, expect `document.documentElement.scrollWidth <= window.innerWidth`, and expect no element with `getComputedStyle(el).textOverflow === 'clip'` whose text is clipped (`scrollWidth > clientWidth`) among `h1,h2,h3,a.btn,button`. This is Review Focus 1.
- [ ] **Step 3: Links.** `linkcheck.mjs` runs linkinator against `serve:headers`, recursive, skipping `tel:`, `mailto:` and `google.com`. Expected: `broken.length === 0`.
- [ ] **Step 4: JS budget.** `js-budget.test.ts` reads `dist/**/index.html`, sums the gzip size of each page's referenced `/_astro/*.js`, and expects < 51 200 bytes per page.
- [ ] **Step 5: Lighthouse.** `lighthouse.mjs` runs Lighthouse 13 (mobile preset, Playwright Chromium via `CHROME_PATH`) on `/`, `/en/`, `/areas-de-atuacao/direito-fiscal`, `/advogados` and `/contactos`.
  - Build with `PUBLIC_NOINDEX=false` for this run only, so that the SEO score is not penalized by the preview `noindex`. Record this in the report.
  - Assert Performance ≥ 90, Accessibility ≥ 95, LCP < 2500 ms, CLS < 0.1.
- [ ] **Step 6:** Run everything: `npm test && npm run test:e2e && node scripts/linkcheck.mjs && node scripts/lighthouse.mjs`. Expected: all gates pass. Fix design or code issues and re-run until they do.
- [ ] **Step 7:** Commit `test: accessibility, responsive, link, JS-budget and Lighthouse gates`.

### Task 14: Screenshots and the LaTeX report

**Files:**
- Create: `scripts/screenshots.ts` (Playwright script; npm script `screens`)
- Create: `scripts/report-data.mjs`, which writes `docs/report/generated/{screenshots,results,decisions}.tex` from the summaries and `docs/report/decisions.json`
- Create: `docs/report/relatorio-v2.tex`, `docs/report/decisions.json`
- Output: `docs/report/screenshots/{desktop|mobile}/{pt|en}/<name>.png`, `docs/report/relatorio-v2.pdf`

**Interfaces:**
- Consumes: `allRoutes(true)` and all `reports/summary/*.json`.
- Produces: the npm script `report` = `npm run screens && node scripts/report-data.mjs && pdflatex` (2 passes, run from a temp output directory, PDF copied back into `docs/report/`).

- [ ] **Step 1: Screenshots.** `screenshots.ts` takes full-page captures of every route at desktop 1440×900 and mobile 390×844, in both locales.
  - Use `reducedMotion: 'reduce'` so the poster is shown and animations are static. Wait for `document.fonts.ready`.
  - File name: route key + slug, e.g. `areas-tax-law.png`.
  - Capture these extra states in both viewports and both locales:
    - mobile menu open (mobile only)
    - carousel on slide 2
    - situation 3 selected
    - FAQ item open
    - form with validation errors
    - map loaded after click (`/contactos`)
    - video paused, with the hero `reducedMotion` off, waiting for `playing` then clicking pause
    - header scrolled state
    - 404
- [ ] **Step 2:** Run `npm run screens`. Expected: one PNG per route × viewport × locale, plus the state captures. Print the count. It must equal `allRoutes(true).length × 2 + statesCount`.
- [ ] **Step 3: Write `relatorio-v2.tex` (pt-PT)** with these sections:
  1. Objetivo da fase e como rever
  2. Sistema visual: tokens with colour swatches, typography specimens, components
  3. Página inicial secção a secção, with desktop and mobile screenshots side by side
  4. Páginas interiores
  5. Interações e estados
  6. Versão inglesa
  7. Vídeo: variants, measured sizes, loading rules
  8. Formulário: fields, validation, behaviour in this phase
  9. Segurança: headers table, CSP, audit results, secret scan, cookies/requests evidence
  10. Testes: unit and e2e counts, axe, links, JS budget, Lighthouse table
  11. Decisões tomadas durante a construção, from `decisions.json`
  12. Pendentes para produção: the spec open items, including the office addresses marked `TODO-CONFIRMAR`
  13. Créditos das imagens

  `\input` the generated fragments. Screenshots use `\includegraphics[width=...]{}` with the `graphicx` and `subcaption` packages.
- [ ] **Step 4:** Run `npm run report`. Expected: `pdflatex` exits 0 with no undefined references, and `docs/report/relatorio-v2.pdf` exists. Open the PDF and spot-check: page count > 30, one homepage desktop image and one EN mobile image present.
- [ ] **Step 5:** Commit `docs: v2 design report with screenshots, tests and security results`. Commit the PNGs and the PDF; keep LaTeX build artifacts git-ignored.

### Task 15: Preview deploy on Cloudflare Pages (only after explicit confirmation)

**Files:**
- Modify: `docs/report/relatorio-v2.tex` (add the preview URL and the deployed-headers evidence), `README.md`

- [ ] **Step 1:** Re-verify zero cost (both read-only):
  - `cf accounts subscriptions get` → `[]`
  - `cf billing profiles get` → still no billing profile
  - Confirm `dist/` holds no file over 25 MiB and contains no `functions/` directory.
- [ ] **Step 2:** Ask the user in chat: "Publicar `dist/` como projeto Cloudflare Pages `carretolages-v2` (endereço `carretolages-v2.pages.dev`, gratuito, com noindex)?" Wait for a clear yes.
- [ ] **Step 3:** Create the Pages project and deploy `dist/` with the `cf` CLI (check `cf pages --help` for the exact subcommands). Use direct upload, not a Git connection.
- [ ] **Step 4:** Verify:
  - `curl -sI https://carretolages-v2.pages.dev/` shows every `_headers` header, including `X-Robots-Tag`.
  - Run `PW_BASE_URL=https://carretolages-v2.pages.dev npx playwright test tests/e2e/security.spec.ts tests/e2e/routes.spec.ts`. Expected: PASS.
- [ ] **Step 5:** Add the URL and the header evidence to the report, rebuild the PDF, and commit `docs: add preview deployment evidence`.

---

## Self-review notes

- **Spec coverage:**

  | Requirement | Task |
  |---|---|
  | Hero, variant A | 6 |
  | Sections 02–11 | 6, 8, 9 |
  | Inner pages | 11 |
  | Video rules | 5, 6 |
  | Form | 10 |
  | CMS-shaped content | 4 |
  | Fonts, privacy, map click | 2, 9, 12 |
  | i18n | 3, 7, 11 |
  | SEO | 12 |
  | Performance, accessibility targets | 13 |
  | Report, screenshots | 14 |
  | Zero cost and preview deploy | 15 + Global Constraints |
  | Empty collections hide sections and nav | 4, 7, 9 |

- **Out of scope by spec for this phase:** Resend sending, Sanity, domain, production analytics.
