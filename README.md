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

## Três versões (uma por orçamento)

O mesmo código gera três versões, escolhidas por `PUBLIC_PLAN` nos ficheiros `.env.base`, `.env.formulario` e `.env.sanity`. Desenho: `docs/superpowers/specs/2026-11-07-tres-versoes-design.md`.

| Versão | Endereço | O que tem |
|---|---|---|
| `base` (orçamento 2026-003) | https://carretolages-base.pages.dev | Sem formulário: email, telefone, morada e mapa. |
| `formulario` (2026-001) | https://carretolages-formulario.pages.dev | Formulário que envia o pedido por email (Resend), com Turnstile. |
| `sanity` (2026-002) | https://carretolages-sanity.pages.dev | Formulário + conteúdo editado no Sanity. |

```bash
npm run deploy:plan -- base          # gera e publica carretolages-base (sem a pasta functions/)
npm run deploy:plan -- formulario    # gera e publica carretolages-formulario (com a função /api/contacto)
PUBLIC_PLAN=base npx playwright test tests/e2e/plan-base.spec.ts   # testes da versão base
```

- **Formulário:** `functions/api/contacto.ts` valida o pedido, verifica o Turnstile e envia pelo Resend (plano gratuito: 3.000 emails por mês, 100 por dia). Remetente: `formulario@builtbyluis.dev`. Nada fica guardado e os registos nunca incluem o conteúdo das mensagens.
- **Segredos do projeto Pages** (só os nomes; os valores nunca vão para o git): `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_TO` e `CONTACT_FROM`. Para mudar o destinatário, por exemplo para `geral@carretolages.com`: `npx wrangler pages secret put CONTACT_TO --project-name carretolages-formulario` e publicar de novo.
- **Turnstile:** o widget `0x4AAAAAAF3EQQQ2jSTc3Dul` só aceita os domínios `carretolages-formulario.pages.dev` e `carretolages-sanity.pages.dev`. Um domínio novo tem de ser acrescentado ao widget.
- **Sanity:**
  - Projeto `6e31nwsq`, dataset público `production`.
  - Painel em https://carretolages.sanity.studio (pasta `studio/`; publicar o painel: `cd studio && npx sanity deploy`).
  - Os modelos espelham `src/content/schemas.ts`. O Zod continua a validar cada build: um conteúdo inválido faz falhar o build e o site anterior continua no ar.
- **Como uma alteração chega ao site (versão sanity):**
  1. Publicar no painel.
  2. O webhook do Sanity "Cloudflare Pages: gerar o site" chama o deploy hook do projeto `carretolages-sanity`.
  3. A Cloudflare gera o site a partir do ramo `feat/tres-versoes` com `npm ci && npm run build:sanity`, em cerca de 2 a 3 minutos.
  - Cada push para esse ramo também gera o site. Para gerar à mão: `cf pages projects deployments create carretolages-sanity --body '{"branch":"feat/tres-versoes"}'`.
- **Importação inicial:** `npm run sanity:import` carrega os JSON e as imagens no Sanity. Precisa de `SANITY_WRITE_TOKEN`, um token temporário criado com `npx sanity tokens add` e apagado a seguir. Só serve para começar do zero: substitui os documentos com o mesmo identificador.

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
