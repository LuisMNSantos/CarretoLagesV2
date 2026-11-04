# Carreto Lages & Associados — v2 (aprovação do design)

Site estático e bilingue (PT/EN) construído em Astro para o escritório aprovar o design completo,
em computador e telemóvel, antes da construção final.

- Requisitos: `docs/spec/2026-11-04-redesign-website-design.pdf`
- Plano de implementação: `docs/plan/2026-11-04-v2-design-approval.md`
- Relatório (capturas, testes, segurança): `docs/report/relatorio-v2.pdf`

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
