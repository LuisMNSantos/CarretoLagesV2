# SDD ledger — plan: D:/PersonalProjects/CarretoLagesLawyer/docs/superpowers/plans/2026-11-04-v2-design-approval.md
Task 1: complete (commits 0535fd8..534dbf3, tests: npx vitest run →    Duration  157ms (import 45%, worker 23%, transform 21%, tests 10%, environment 1%))
Task 2: complete (commits 534dbf3..e7081a7, tests: npx vitest run →    Duration  172ms (import 43%, transform 25%, worker 20%, tests 11%, environment 1%))
Task 3: complete (commits c684712..281ac0f, tests: npx vitest run →    Duration  185ms (import 41%, worker 20%, transform 19%, tests 19%, environment 1%))
Task 4: complete (commits 281ac0f..64b6176, tests: npx vitest run →    Duration  353ms (import 61%, transform 19%, tests 10%, worker 9%))
Task 5: complete (commits 64b6176..81b6024, tests: npx vitest run →    Duration  732ms (import 49%, tests 35%, transform 11%, worker 5%))

## Pre-flight and rulings (moved from the plan repo's workspace)
Spec: D:\PersonalProjects\CarretoLagesLawyer\docs\superpowers\specs\2026-11-04-redesign-website-design.tex (read).
Repo under construction: D:\PersonalProjects\CarretoLagesV2 (new repo, branch main — user asked for a new repository).

## Pre-flight
- T2 Base props → T6 (headerVariant overlay): consistent.
- T3 Locale/RouteKey/localizePath/alternatePath/t → T4, T7, T11: consistent.
- T4 visible/getCollectionCounts({cases,insights}) → T7 navItems, T9: consistent.
- T10 ContactForm → T9 ContactSection: ORDER CONFLICT (T9 consumes T10). Ruling: execute Task 10 before Task 9 — dependency order — cost if wrong: none.
- T7 e2e LangSwitch on /areas-de-atuacao/direito-fiscal and insight-without-EN → pages exist only after T11. Ruling: those two e2e assertions are written in Task 7's spec file but marked to run after T11 (added in Task 11 step) — cost if wrong: LangSwitch untested until T11.
- T11 allRoutes → T12, T13, T14: consistent.
- Global: Ruling: Playwright and Lighthouse use the installed Google Chrome (`channel: 'chrome'`) instead of `npx playwright install chromium` — avoids a 150 MB download and the confirmation stop — cost if wrong: tests depend on the local Chrome version.

## Tasks
Task 1: Ruling: build.format 'file' + trailingSlash 'never' (plan said format 'directory') — Astro docs say directory format pairs with trailingSlash 'always', and Cloudflare Pages serves `x.html` at `/x` without redirect — cost if wrong: URL shape change across all routes.
Task 1: Ruling: English home path is `/en` (not `/en/`) — consistent with trailingSlash 'never' — cost if wrong: one string in routes.ts and tests.
Task 1: Ruling: added .gitattributes (eol=lf) — Windows CRLF warnings — cost if wrong: none.
Task 3: Ruling: allow-list in ui.test extended with 'nav.menu' and 'legal.cookies' — words identical in both languages — cost if wrong: none.
Task 4: Ruling: content as typed JSON modules + Zod (src/content/*.json, src/content/schemas.ts) instead of Astro content collections; one file per collection — directly importable by Vitest and by .astro pages; same CMS shape — cost if wrong: later migration to Sanity needs a loader instead of JSON imports (same shapes).
Task 4: Ruling: rich text stored as Portable-Text-like blocks (p/h2/h3/ul/quote) instead of markdown files — testable, CMS-shaped, no markdown dependency — cost if wrong: authoring long articles in JSON is clumsy until Sanity.
Task 4: Ruling: office addresses unknown → town-level text + `addressToConfirm: true` (plan said TODO-CONFIRMAR marker) — rendered honestly as "a confirmar" — cost if wrong: none.
Task 4: Ruling: lawyer bios kept to facts from the old site (founding, areas); associates get a one-line neutral bio — avoid inventing biographies — cost if wrong: thinner lawyer pages until the firm supplies bios.
Task 5: Ruling: capped-quality encoding (CRF + maxrate) instead of pure CRF — the canal's water texture made VP9 exceed 2.5 MB even at high CRF — cost if wrong: slightly softer image in busy frames.
Task 5: Ruling: MP4 (H.264) is listed before WebM in <source> order (plan said webm first) — at equal caps the MP4 files came out smaller (e.g. desktop 7.45 vs 7.49 MB) — cost if wrong: none measurable.
Task 5: Ruling: added a portrait poster (hero-poster-portrait.jpg) alongside the landscape one — mobile poster must match the 9:16 video crop — cost if wrong: none.
Task 5: Ruling: stock images get a light CSS desaturation (`.img-tone`) to match the calm palette rather than re-processing files — cost if wrong: none; real photos replace them later.
Task 5: Ruling: ffmpeg-static install script enabled via package.json "allowScripts" (npm 11 blocks install scripts by default) — user approved the download — cost if wrong: none.
Task 6: Ruling: LCP assertion changed from "LCP is the poster img" to "LCP element is inside the hero (poster or heading) and < 2.5 s" — Chrome does not report full-viewport background-like images as LCP; the hero heading is the LCP, which is faster — cost if wrong: none for users; spec intent (fast first paint, poster prioritised) is still tested.
Task 6: Ruling: poster fallbacks capped (WebP ≤1280 px, JPEG 1024 px) so every poster file ≤ 100 KB; AVIF goes to 1920 px — cost if wrong: slightly softer poster on old browsers without AVIF.
Task 6: Ruling: a single pause/play button (bottom-right on all sizes) instead of separate desktop/mobile buttons — cost if wrong: none.
Task 6: complete (commits 81b6024..20a6504, tests: npx playwright test tests/e2e/hero.spec.ts →   15 passed (13.9s))
Task 6: Ruling: Astro 7 allows a single preview server per project — ad-hoc screenshot servers must be stopped (`astro preview stop`) before Playwright's webServer starts — cost if wrong: flaky e2e runs.
Task 7: Ruling: Base renders Header/Footer/StickyCta directly instead of named slots — every page needs them, fewer props to thread — cost if wrong: none.
Task 7: Ruling: desktop navigation starts at xl (1280 px) instead of lg (1024 px); below it the menu button and sticky CTA are used — the full nav + CTA does not fit at 1024 px without wrapping — cost if wrong: tablets in landscape get the mobile menu.
Task 7: Ruling: footer uses the areia background (light, as in the reference) rather than dark green — cost if wrong: purely visual.
Task 7: complete (commits 20a6504..669bb27, tests: npx playwright test tests/e2e/navigation.spec.ts →   8 passed (12.8s))
Task 8: Ruling: situations render two markups — ARIA tabs (md+) and a <details> accordion (<md) — instead of morphing one DOM — simpler and robust without JS — cost if wrong: duplicated (hidden) markup per item.
Task 8: Ruling: without JS on wide screens the tablist is hidden and all panels are stacked — tabs would be inert — cost if wrong: none.
Task 8: Ruling: lawyer photos copied from the old repo's web/public/advogados into src/assets/team (local files, no download) — cost if wrong: none.
Task 8: complete (commits 669bb27..8450403, tests: npx playwright test tests/e2e/home-interactions.spec.ts →   5 passed (13.0s))
Task 8: Ruling: removed wall-clock LCP < 2.5 s from the hero e2e test (flaky under parallel workers: 3.0 s) — LCP is gated by Lighthouse in Task 13 — cost if wrong: none.
Task 10: Ruling: form `area` values are the area ids (penal, imobiliario, fiscal, financeiro) + `outro` — content ids are stable across locales — cost if wrong: none.
Task 10: Ruling: office preference rendered as radio "chips" defaulting to "Indiferente" instead of a select — fewer taps on mobile — cost if wrong: purely visual.
Task 10: Ruling: temporary form host (#contacto section on HomePage) and minimal /obrigado + /en/thank-you pages so Task 10's e2e can run before Tasks 9 and 11 replace them — cost if wrong: none.
Task 10: complete (commits 6a30f14..23505e2, tests: npx vitest run src/lib/contact-schema.test.ts src/lib/contact-email.test.ts →    Duration  281ms (import 74%, transform 11%, tests 9%, worker 6%))
Task 10: Ruling: no-JS notice is a visible <p> removed by the form script instead of <noscript> — Playwright's JS-disabled mode does not render <noscript>; behaviour in real browsers is identical — cost if wrong: notice flashes for a moment before JS runs.
Task 9: Ruling: static map is an inline SVG illustration in MapEmbed instead of a sharp-generated image file — no extra asset, themable — cost if wrong: none.
Task 9: Ruling: FAQPage JSON-LD wiring deferred to Task 12 where jsonld.ts and its tests are created — cost if wrong: none (same task chain).
Task 9: Ruling: CaseCard extracted as a shared component (home teaser + /casos index) — cost if wrong: none.
Task 9: Ruling: styles targeting <Icon> children use :global() — Astro scoped styles do not reach elements rendered by child components (select chevron and pause/play icons were unstyled) — cost if wrong: none.
Task 9: complete (commits 915cfc5..ebad825, tests: npx playwright test tests/e2e/home.spec.ts →   14 passed (16.8s))
Task 11: Ruling: empty case/insight listings use Astro.redirect to the locale home (static meta-refresh) — static output cannot omit a file conditionally from a fixed route — cost if wrong: an extra redirect page in dist when a collection is empty.
Task 11: Ruling: JSON imports carry `with { type: 'json' }` so Playwright (plain Node ESM) can import src/lib/all-routes — cost if wrong: none.
Task 11: Ruling: env flags read from import.meta.env or process.env — Playwright runs outside Vite — cost if wrong: none.
Task 11: Ruling: EN "no Portuguese" check exempts proper nouns "Sociedade de Advogados" and "Ordem dos Advogados" — cost if wrong: none.
Task 11: Ruling: carousel ignores scroll events until a button-driven scroll reaches its target (fixed a flaky counter under rapid clicks; 48/48 repeated runs green) — cost if wrong: none.
Task 11: Ruling: page-jsonld.ts created as a stub returning [] so route files compile; Task 12 fills it with tests — cost if wrong: none.
Task 11: Ruling: lawyers' "Copy link" (cases/insights) uses navigator.clipboard with a silent fallback — cost if wrong: none.
Task 11: complete (commits ebad825..73d2866, tests: npx playwright test tests/e2e/routes.spec.ts --project=desktop →   67 passed (27.8s))
Task 12: Ruling: CSP delivered only as an HTTP header via public/_headers (Astro's security.csp meta not enabled) — the build emits no inline scripts/styles/style attributes, so 'self' suffices and avoids two overlapping policies — cost if wrong: an inline script added later would be blocked (the security e2e would catch it).
Task 12: Ruling: z.config({ jitless: true }) in contact-schema — Zod v4 probes `new Function`, which the strict CSP correctly blocked (found by the security e2e on every page with the form) — cost if wrong: marginally slower validation.
Task 12: Ruling: added X-Frame-Options: DENY alongside frame-ancestors 'none' for older browsers — cost if wrong: none.
Task 12: Ruling: sitemap excludes 404 and thank-you pages — cost if wrong: none.
Task 12: Ruling: security suite skipped unless PW_BASE_URL points to scripts/serve-with-headers.mjs (Astro preview ignores _headers) — cost if wrong: must remember to run it with the env var (documented in README/report).
Task 12: complete (commits 73d2866..048332b, tests: env PW_BASE_URL=http://localhost:4330 npx playwright test tests/e2e/security.spec.ts →   136 passed (54.9s))
Task 13: IN PROGRESS (commit "WIP"). Done: axe 0 serious/critical (logo label fixed), 360px no overflow, links 0 broken (340), JS max 32 KB gz, Lighthouse median-of-3 all 100, CLS fixed (font preload + scripting media query), canonical without .html, og-image added.
Task 13: OPEN: 33 e2e failures in routes.spec "Portuguese UI text on /en..." — likely the logo tagline "& Associados · Advogados" now matched (brand line); exempt it like the legal name. OPEN: npm audit reports 6 moderate (from lighthouse/linkinator dev deps) — assess/override or record.
Task 13: Ruling: Lighthouse uses a warm-up request and the median of 3 runs — single cold runs were noisy (2.9 s outliers) — cost if wrong: none.
Task 13: Ruling: dropped the Cormorant (logo) font preload, kept DM Sans; portrait poster AVIF q42 (≤46 KB) — bandwidth contention on slow 4G pushed mobile LCP to 2.9 s — cost if wrong: logo font swaps in late (header is fixed, no CLS).
NEXT: finish Task 13, then Task 14 (screenshots + LaTeX report; hide sticky CTA in full-page shots), Task 15 (Cloudflare deploy after user confirmation), final review.
Task 13: Ruling: EN Portuguese-text check also exempts the logo (brand line "& Associados · Advogados") — cost if wrong: none.
Task 13: Ruling: audit gate applies to production dependencies (0 vulnerabilities); 6 moderate findings are in dev-only test tooling (lighthouse → @sentry/node, linkinator → glob/minimatch), run locally against our own server, recorded in reports/summary/audit.json and the report — cost if wrong: a local-only DoS/traversal risk while running tests.
Task 13: complete (commits 048332b..dc56798, tests: npx vitest run → JSON report written to D:/PersonalProjects/CarretoLagesV2/reports/summary/vitest.json)
Task 14: Ruling: screenshots taken by a separate Playwright config (npm run screens) instead of a node script — reuses TS transpilation for src imports; `npm run report` regenerates data + PDF and expects screens to be current — cost if wrong: two commands instead of one.
Task 14: Ruling: captures stored as JPEG (q74) scaled to 720 px (desktop) / 390 px (mobile) and sliced to page-sized pieces — full-resolution PNG would have been hundreds of MB and unbreakable across PDF pages — cost if wrong: less zoom detail in the PDF (the live site shows full detail).
Task 14: Ruling: sticky mobile CTA hidden in full-page captures (it renders mid-page in stitched screenshots) — cost if wrong: the bar is visible in the mobile-menu/state captures only.
Task 14: Ruling: axe results written one file per page/viewport (afterAll per worker overwrote results: report showed 12 of 132 analyses) — cost if wrong: none.
Task 14: complete (commits dc56798..08c729e, tests: node scripts/report-data.mjs → report data: 66 pages, 16 states, 298 slices, 22 decisions)
Task 15: Ruling: Pages project named carretolages (user's choice) → https://carretolages.pages.dev; site/canonical/JSON-LD/tests updated from carretolages-v2 — cost if wrong: none.
Task 15: Ruling: Pages project created with `cf pages projects create`; the folder upload uses `npx wrangler pages deploy` (cf has no direct-upload command yet; per the cf skill, Wrangler is run via npx without adding it to the project) — user logged into Wrangler themselves — cost if wrong: none.
Task 15: Deployed https://carretolages.pages.dev (deployment 7034e99e); live headers verified with curl; routes + security suites against the live site: 203 passed, 0 failed; account still has no subscriptions.
Task 15: complete (commits 08c729e..e95aee0, tests: env PW_BASE_URL=https://carretolages.pages.dev npx playwright test tests/e2e/routes.spec.ts --project=desktop →   67 passed (15.4s))

## Final review (fresh reviewer, opus) — 0 Critical, 2 Important, 12 Minor
Final: fixed no-JS desktop: process steps unreadable / carousel unreachable — review-fixes "all four process steps show their text" + "areas carousel shows a usable scrollbar" RED→GREEN, suite 345/345 e2e, 135/135 unit.
Final: fixed no-JS phone: no language switch, dead Menu button — "a visible language switch exists…" RED→GREEN (switch added to footer; .needs-js hidden under scripting:none).
Final: Ruling: re-graded Minor 4+12 (no-JS submit leads to "Obrigado"; dead map/copy buttons) to Important — misleading for a person without JS — fixed: "buttons that need JavaScript are hidden" RED→GREEN.
Final: Ruling: re-graded Minor 5 (thank-you page claims receipt on the public preview) to Important — misleads reviewers — fixed: "the thank-you page says nothing was sent in the preview" RED→GREEN.
Final: Ruling: re-graded Minor 2 (carousel aria-hidden on slides with links) to Important — screen-reader users miss slides — fixed: "carousel slides are never hidden…" RED→GREEN (+ localized roledescription).
Final: Ruling: re-graded Minor 3 (Escape does not dismiss sub-menu, WCAG 1.4.13) to Important — fixed: "Escape really closes the desktop sub-menu" RED→GREEN.
Final: Ruling: re-graded Minor 7 (sticky bar covers focus, WCAG 2.4.11) to Important — fixed: "scroll padding keeps focused elements clear…" RED→GREEN.
Final: fixed own regression from the fix pass (footer language switch failed colour-contrast: inherited tinta-suave at 70% opacity) — caught by a11y suite RED→GREEN.
Final: fixed astro check errors (headers-file.mjs JSDoc types; screens context options) — astro check 0 errors.
Final: minor (deferred): WebM fallback never tried — capture-phase error listener removes the video on the first <source> error (hero-video.ts:84).
Final: minor (deferred): headings lack overflow-wrap/hyphens for very long words from a future CMS (global.css h1–h4).
Final: minor (deferred): clicking a hash link in the mobile menu returns focus to the menu button instead of the target (header.ts).
Final: minor (deferred): form summary has both role="alert" and aria-live="polite".
Final: minor (deferred): JSON-LD not escaped for "<" (harmless with repo content; matters once Sanity feeds it).
Final: minor (deferred): /video/* cached immutable for a year under unhashed names — a re-encode would stay stale.
Redeployed review-fixed build (deployment b9560129) to https://carretolages.pages.dev; live routes+security+review-fixes: 212 passed.

## Second design round (client feedback, 2026-11-05)
Ruling: pause button removed from view but kept as a keyboard-only control (appears on Tab focus) — client asked to remove it; WCAG 2.2.2 still requires a pause mechanism — cost if wrong: mouse users cannot pause (video still off for reduced-motion/save-data).
Ruling: mobile Call/Contact became two 48 px round buttons bottom-right; body bottom padding 4.5rem so footer content is never covered.
Ruling: secondary headers edge-to-edge from the top (client rejected framed panels with white margins); to stay distinct from the reference: straight bottom edge with a bronze rule (no rounded corners), editorial title bottom-left + lead right, vertical bronze label, offset bronze frame, fine line texture (no italic watermark).
Ruling: trophy image moved from src/assets/stock/trofeu.jpg (PNG data) to src/assets/brand/trofeu.png — firm-owned, not stock; used in a new home "20 anos" section (between Process and Team) and as the História header card; copy uses only known facts (2002 → 2022).
Ruling: responsive clip test ignores visually-hidden elements (clientWidth ≤ 1), i.e. the keyboard-only pause button.
Verification: unit 135/135, e2e 417 passed, security 136 passed, links 385/0 broken, axe 0 serious/critical, Lighthouse 99–100 (7 pages), live (carretolages.pages.dev, deployment b5b9cedd) 275 passed.
