import { mkdirSync, writeFileSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { allRoutes, type BuiltRoute } from '../../src/lib/all-routes';

/**
 * Captures every built page (both locales) plus key interaction states, then slices tall
 * captures into report-sized JPEG pieces. Writes one manifest entry per capture.
 */
const OUT = 'docs/report/screenshots';
const SLICE = { desktop: { width: 720, max: 1100 }, mobile: { width: 390, max: 1700 } } as const;
type Viewport = keyof typeof SLICE;
type Shot = { id: string; title: string; locale: 'pt' | 'en'; viewport: Viewport; kind: 'page' | 'state'; path: string; height: number; slices: string[] };

const HIDE = `[data-sticky-cta]{display:none!important}`;

async function settle(page: Page) {
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

async function save(buf: Buffer, shot: Omit<Shot, 'height' | 'slices'>): Promise<Shot> {
  const cfg = SLICE[shot.viewport];
  const scaled = await sharp(buf).resize({ width: cfg.width }).toBuffer();
  const { height = 0 } = await sharp(scaled).metadata();
  const dir = `${OUT}/${shot.viewport}/${shot.locale}`;
  mkdirSync(dir, { recursive: true });
  const slices: string[] = [];
  const n = Math.max(1, Math.ceil(height / cfg.max));
  const h = Math.ceil(height / n);
  for (let i = 0; i < n; i++) {
    const top = i * h;
    const file = `${dir}/${shot.id}${n > 1 ? `-${i + 1}` : ''}.jpg`;
    await sharp(scaled).extract({ left: 0, top, width: cfg.width, height: Math.min(h, height - top) }).jpeg({ quality: 74, mozjpeg: true }).toFile(file);
    slices.push(file.replace('docs/report/', ''));
  }
  return { ...shot, height, slices };
}

const idOf = (r: BuiltRoute) => (r.path === '/' || r.path === '/en' ? 'home' : r.path.replace(/^\/en\//, '').replace(/^\//, '').replace(/\//g, '--'));

const shots: Shot[] = [];
test.afterAll(({}, info) => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/manifest-${info.project.name}.json`, JSON.stringify(shots, null, 2));
});

for (const r of allRoutes(true)) {
  test(`page ${r.path}`, async ({ page }, info) => {
    await page.goto(r.path);
    await settle(page);
    const title = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
    shots.push(await save(await page.screenshot({ fullPage: true }), {
      id: idOf(r), title, locale: r.locale, viewport: info.project.name as Viewport, kind: 'page', path: r.path,
    }));
  });
}

type State = { id: string; title: { pt: string; en: string }; path: { pt: string; en: string }; only?: Viewport; motion?: boolean; act: (p: Page, vp: Viewport) => Promise<void> };
const states: State[] = [
  { id: 'state-menu', title: { pt: 'Menu de telemóvel aberto', en: 'Mobile menu open' }, path: { pt: '/', en: '/en' }, only: 'mobile',
    act: async (p) => { await p.locator('[data-menu-open]').click(); await p.waitForTimeout(400); } },
  { id: 'state-header', title: { pt: 'Cabeçalho depois de descer na página', en: 'Header after scrolling' }, path: { pt: '/', en: '/en' },
    act: async (p) => { await p.evaluate(() => window.scrollTo(0, 1400)); await p.waitForTimeout(500); } },
  { id: 'state-carousel', title: { pt: 'Carrossel de áreas no segundo cartão', en: 'Areas carousel on the second card' }, path: { pt: '/', en: '/en' },
    act: async (p) => { await p.locator('[data-carousel-next]').click(); await p.waitForTimeout(600); await p.locator('[data-carousel]').scrollIntoViewIfNeeded(); } },
  { id: 'state-situation', title: { pt: '"Em que situação está?" com a terceira situação escolhida', en: '"Where are you today?" with the third situation selected' }, path: { pt: '/', en: '/en' },
    act: async (p, vp) => {
      if (vp === 'desktop') await p.getByRole('tab').nth(2).click();
      else await p.locator('section[aria-labelledby="situations-title"] details summary').nth(2).click();
      await p.locator('section[aria-labelledby="situations-title"]').scrollIntoViewIfNeeded();
      await p.waitForTimeout(300);
    } },
  { id: 'state-faq', title: { pt: 'Pergunta frequente aberta', en: 'FAQ item open' }, path: { pt: '/', en: '/en' },
    act: async (p) => { await p.locator('.faq-item summary').nth(4).click(); await p.locator('#faq-title').scrollIntoViewIfNeeded(); } },
  { id: 'state-form-errors', title: { pt: 'Formulário com erros de validação', en: 'Form with validation errors' }, path: { pt: '/contactos', en: '/en/contact' },
    act: async (p) => {
      const f = p.locator('[data-contact-form]').first();
      await f.locator('[name="email"]').fill('maria@');
      await f.locator('[data-submit]').click();
      await f.scrollIntoViewIfNeeded();
      await p.waitForTimeout(300);
    } },
  { id: 'state-map', title: { pt: 'Mapa interativo carregado depois do clique', en: 'Interactive map loaded after the click' }, path: { pt: '/contactos', en: '/en/contact' },
    act: async (p) => {
      await p.locator('[data-map-load]').first().click();
      await p.locator('[data-map] iframe').first().scrollIntoViewIfNeeded();
      await p.waitForTimeout(3000);
    } },
  { id: 'state-video-paused', title: { pt: 'Vídeo do topo em pausa', en: 'Hero video paused' }, path: { pt: '/', en: '/en' }, motion: true,
    act: async (p) => {
      await p.locator('[data-hero][data-video="playing"]').waitFor({ timeout: 20_000 });
      await p.waitForTimeout(1500);
      await p.locator('[data-hero-toggle]').click();
      await p.waitForTimeout(300);
    } },
];

for (const s of states) {
  for (const locale of ['pt', 'en'] as const) {
    test(`state ${s.id} ${locale}`, async ({ browser }, info) => {
      const vp = info.project.name as Viewport;
      test.skip(Boolean(s.only && s.only !== vp), `${s.id} is ${s.only}-only`);
      const context = await browser.newContext({ ...info.project.use, reducedMotion: s.motion ? 'no-preference' : 'reduce', baseURL: 'http://localhost:4321' });
      const page = await context.newPage();
      await page.goto(s.path[locale]);
      await page.addStyleTag({ content: HIDE });
      await page.evaluate(() => document.fonts.ready);
      await s.act(page, vp);
      shots.push(await save(await page.screenshot(), {
        id: s.id, title: s.title[locale], locale, viewport: vp, kind: 'state', path: s.path[locale],
      }));
      await context.close();
    });
  }
}
