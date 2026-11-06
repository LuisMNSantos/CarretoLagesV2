# Carreto Lages & Associados — v2 (aprovação do design)

Site estático e bilingue (PT/EN) construído em Astro para o escritório aprovar o design completo,
em computador e telemóvel, antes da construção final.

- Requisitos: `docs/spec/2026-11-04-redesign-website-design.pdf`
- Plano de implementação: `docs/plan/2026-11-04-v2-design-approval.md`
- Relatório (capturas, testes, segurança): `docs/report/relatorio-v2.pdf`
- Pré-visualização publicada: https://carretolages.pages.dev (Cloudflare Pages, gratuito, `noindex`)

## Publicar a pré-visualização

```bash
npm run build
npx wrangler pages deploy dist --project-name carretolages --branch main
```

O `cf` cria e gere o projeto Pages, mas o envio direto de uma pasta ainda é feito com o Wrangler (via `npx`, sem o adicionar ao projeto). O Wrangler tem login próprio: `npx wrangler login`.

## Publicar no domínio do cliente (www.carretolages.com)

```bash
npm run build:live      # usa .env.live: indexável, mantém o conteúdo de exemplo
npx wrangler pages deploy dist --project-name carretolages --branch main
```

- `site` (canónicos, sitemap, JSON-LD) é `https://www.carretolages.com`.
- Os endereços `*.pages.dev` ficam sempre com `X-Robots-Tag: noindex` (regra por anfitrião em `public/_headers`); o domínio real segue `PUBLIC_NOINDEX`.
- `public/_redirects` leva os endereços do WordPress antigo para as páginas novas (301); os artigos de spam ficam de fora de propósito (404).
- Análise do domínio atual (site pirateado, riscos) e passos da migração do DNS para a Cloudflare: `docs/report/dominio/relatorio-dominio.pdf`. Capturas: `node scripts/domain-audit.mjs`.

## Testes de segurança

A pré-visualização do Astro ignora `public/_headers`. Para testar os cabeçalhos e a CSP:

```bash
npm run build && npm run serve:headers        # http://localhost:4330
PW_BASE_URL=http://localhost:4330 npx playwright test tests/e2e/security.spec.ts
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm run preview` | gerar e servir a versão estática |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright, usa o Google Chrome instalado) |
| `npm run video` | gerar as versões do vídeo do topo (requer `VIDEO_SRC`) |
| `npm run serve:headers` | servir `dist/` com os cabeçalhos de segurança de `public/_headers` |
| `npm run screens` | capturas de ecrã de todas as páginas |
| `npm run report` | gerar o relatório `.tex` / PDF |

## Regras desta fase

- **Custo zero:** sem domínio, sem Resend, sem Sanity, sem funções de servidor, sem serviços pagos da Cloudflare.
- **O formulário não envia emails** nesta fase.
- **Pré-visualização com `noindex`.** Publicação na Cloudflare Pages só com confirmação explícita.
- **Commits sem linhas de co-autoria.**

## Variáveis (`.env`, ver `.env.example`)

- `PUBLIC_DESIGN_PREVIEW=true` — mostra conteúdo de exemplo (testemunhos, casos, artigos) com selo "Exemplo ilustrativo".
- `PUBLIC_NOINDEX=true` — páginas com `noindex` e `robots.txt` a bloquear tudo.
