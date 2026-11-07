# Três versões do site, uma por orçamento — desenho

Data: 2026-11-07. Base: especificação original
(`D:\PersonalProjects\CarretoLagesLawyer\docs\superpowers\specs\2026-11-04-redesign-website-design.tex`,
secções "Formulário de contacto" e "Gestão de conteúdos") e os orçamentos em `orcamentos/`.
Onde este documento e a especificação divergem, vale este documento, e cada divergência está marcada.

## Porquê

O Luís vai mostrar ao escritório três endereços lado a lado, um por orçamento, para o cliente escolher o
plano. Antes de dizer que tem estas versões, quer ter testado cada uma de ponta a ponta com dados reais:
só as apresenta quando souber que funcionam.

| Versão | Orçamento | O que a distingue |
|---|---|---|
| **base** | 2026-003, Plano base (350 €) | Sem formulário. Contacto por email, telefone, morada e mapa. |
| **formulario** | 2026-001, Plano 1 (450 €) | Formulário que envia mesmo um email com o pedido. |
| **sanity** | 2026-002, Plano 2 (750 €) | Formulário, mais o painel Sanity: uma alteração publicada aparece no site sozinha. |

## Objetivos

- Um único código. Uma variável de compilação (ex.: `PUBLIC_PLAN=base|formulario|sanity`) escolhe a
  versão. Uma correção ao design chega às três versões; nada de ramos ou cópias.
- Três projetos Cloudflare Pages na conta do Luís (a mesma do projeto `carretolages` atual), cada um
  no seu endereço `*.pages.dev` (decidido pelo Luís). Os três ficam fora do Google: a regra de `noindex`
  por endereço `pages.dev` em `public/_headers` já os cobre.
- As três versões mantêm o conteúdo de exemplo (`PUBLIC_DESIGN_PREVIEW=true`).
- "Funciona" quer dizer verificado com dados reais (ver "Como se prova que funciona").

## Fora do âmbito (não fazer)

- Email automático de confirmação ao visitante. Está nos orçamentos como opção paga (exige o plano
  Workers Paid) e a especificação desaconselha-o por omissão.
- Domínio do cliente, conta Cloudflare do cliente, `build:live`, DNS da PTisp. A ida para
  `carretolages.com` é um passo posterior, depois de o cliente escolher.
- Endereços no domínio `builtbyluis.dev` para as versões. Ficam nos `pages.dev`, por decisão do Luís.
- Contas no Sanity para o cliente. Na demonstração é o Luís que edita (decidido pelo Luís).
- Guia em PDF do painel para o escritório. É uma entrega do Plano 2 depois de aceite, não desta
  demonstração.

## O que falharia mesmo funcionando tecnicamente (anti-objetivos)

- As três versões ficarem visualmente diferentes além do que o plano muda: o cliente compara planos,
  não designs.
- Um formulário que perde mensagens em silêncio, que pode ser usado para enviar spam a terceiros ou que
  expõe dados pessoais (especificação, "O que seria um fracasso").
- Segredos (chaves de API, tokens) no repositório ou no código enviado ao browser.
- A versão sanity mostrar uma página partida ou vazia porque um campo ficou por preencher no painel. A
  validação Zod atual tem de continuar a impedir uma compilação inválida, e a versão publicada anterior
  continua no ar.
- Custos: tudo nos planos gratuitos. Se algum passo exigir pagamento, pára-se e pergunta-se.

## Versão base (sem formulário)

- A secção de contacto (`ContactSection`), usada na página inicial, nas áreas e em Contactos, perde o
  formulário. No lugar dele ficam o email `geral@`, o telefone e uma frase a convidar ao contacto, com
  ligações `mailto:`/`tel:`. A secção mantém a mesma moldura visual (fotografia à esquerda, título).
- Os botões "Contacte-nos" ou "Marcar uma conversa" (cabeçalho, botão fixo no telemóvel, passos do
  processo, situações, páginas de área) continuam a levar a `#contacto`/Contactos, que agora mostram os
  meios diretos. Nenhuma ligação aponta para um formulário inexistente.
- As páginas `/obrigado` e `/en/thank-you` não são geradas, e o script do formulário não é carregado.
- A Política de Privacidade não fala do formulário. Os textos legais são de exemplo, mas não podem
  afirmar o contrário do que o site faz.
- Sem função de servidor publicada.

## Versão formulario (formulário a funcionar)

Segue a secção "Formulário de contacto" da especificação (campos, fluxo, segurança), com estas
concretizações:

- **Envio: Resend, plano gratuito** (3.000 emails por mês, 100 por dia), como na especificação original.
  *Atualização de 2026-11-07:* o desenho previa o Cloudflare Email Sending, mas o painel exige o plano Workers Paid
  para o ativar, e o Luís escolheu o Resend gratuito.
  - Remetente: `formulario@builtbyluis.dev`, domínio verificado no Resend (registos DNS na zona Cloudflare).
  - Destinatário: `luismanuelsantos2801@gmail.com` (decidido pelo Luís), numa variável de ambiente para mais
    tarde passar a `geral@carretolages.com`.
  - `reply_to` com o email do visitante, depois de validado.
- **Função no servidor:** uma Cloudflare Pages Function (ex.: `functions/api/contacto.ts`).
  - Valida no servidor com o mesmo esquema de `src/lib/contact-schema.ts`.
  - Escapa todo o texto do visitante no HTML do email e tira as quebras de linha do assunto.
  - Envia e responde em JSON. O JavaScript da página leva o visitante a `/obrigado` ou
    `/en/thank-you`.
  - *Divergência:* a especificação queria envio sem JavaScript, mas o Turnstile precisa de JavaScript.
    Sem ele, o botão de envio não aparece (como hoje) e um aviso indica o telefone e o email.
- **Email recebido:**
  - Sempre em português, com a língua do visitante indicada.
  - Assunto com a área (ex.: "Novo contacto pelo site — Direito Fiscal").
  - Todos os campos, mais a data e a hora.
  - Versões em texto e em HTML.
- **Anti-spam:**
  - Campo-armadilha e tempo mínimo de preenchimento (já existem no formulário).
  - Limite de envios por IP: um contador de melhor esforço na função. As regras de limitação da
    Cloudflare só se aplicam a zonas da conta, e os endereços `pages.dev` não são uma delas.
  - **Turnstile ativo.** *Divergência:* a especificação deixava-o desligado por omissão. Foi proposto ao
    Luís nesta conversa como a proteção contra spam do orçamento, e ele não se opôs.
  - A CSP passa a permitir `challenges.cloudflare.com` só nas versões com formulário.
- **Erros visíveis:**
  - Com o envio a falhar (serviço em baixo, Turnstile recusado), o visitante vê uma mensagem clara na
    língua da página, com o telefone e o email como alternativa. O que escreveu não se apaga.
  - Os estados "A enviar…", sucesso e erro são anunciados (`aria-live`).
- **Privacidade e registos:**
  - Nada fica guardado: nem base de dados, nem conteúdo das mensagens nos registos.
  - A Política de Privacidade menciona o formulário, o Resend (envio) e a Cloudflare (alojamento, Turnstile).
- **Segredos:** chave de API do Resend, chave secreta do Turnstile e destinatário, tudo em
  variáveis ou segredos do projeto Pages. Nunca no repositório.

## Versão sanity (formulário + painel)

Igual à versão formulario, mais o que a secção "Gestão de conteúdos" da especificação define:

- **Projeto Sanity na conta que o Luís já tem.**
  - O Luís faz os passos interativos: `npx sanity login` e a confirmação da criação do projeto. O resto
    fica preparado para ele.
  - Plano gratuito, dataset `production`.
- **Studio no mesmo repositório**, numa pasta própria (ex.: `studio/`).
  - Alojado gratuitamente pelo Sanity, num endereço do tipo `<nome>.sanity.studio`.
  - Rótulos em pt-PT, com os campos PT e EN lado a lado.
  - Os modelos espelham `src/content/schemas.ts`: definições, escritórios, áreas, situações, passos,
    advogados, casos, testemunhos, perguntas frequentes, destaques e páginas.
- **Importação:** um script carrega uma vez o conteúdo atual dos JSON, exemplos incluídos, no dataset.
  Os JSON continuam a ser a fonte das versões base e formulario.
- **Leitura na compilação:** com `PUBLIC_PLAN=sanity`, `src/lib/content.ts` lê o conteúdo do Sanity (GROQ)
  em vez dos JSON.
  - Valida com os mesmos esquemas Zod.
  - O resto do site não muda: as mesmas formas de dados, as mesmas páginas.
- **Imagens:** as que o painel gere vêm do Sanity e o Astro descarrega-as e otimiza-as na compilação
  (AVIF/WebP, os mesmos tamanhos de hoje). Ficam servidas pelo próprio site, por isso a CSP não muda.
  *Divergência:* a especificação previa servi-las pelo CDN do Sanity; o resultado visual é o mesmo.
- **Publicação automática:** publicar no Sanity faz a Cloudflare compilar e publicar a versão sanity
  outra vez, em 1 a 2 minutos.
  - Os projetos atuais são publicados por envio direto (`wrangler pages deploy`), que não tem *deploy
    hook*. Este projeto precisa de outro caminho:
    - (a) ligá-lo ao repositório GitHub (`LuisMNSantos/CarretoLagesV2`) e usar o *deploy hook* da Pages;
    - (b) ou um GitHub Action disparado pelo *webhook* do Sanity.
  - A escolha fica ao critério de quem implementa; recomenda-se (a), por ter menos segredos.
  - O conteúdo é lido na compilação, no servidor, e não no browser, por isso não é preciso CORS para
    o `pages.dev`.

## Restrições

- Ferramentas Cloudflare: o `cf` CLI para zona, DNS, Email Sending e projetos (`CLAUDE.md` global: não
  há configuração do Wrangler no projeto). O `npx wrangler pages deploy` continua para o envio direto,
  como no README.
  - Antes de qualquer comando `cf` não verificado: `--help` ou `--dry-run`.
  - Não acrescentar ficheiros de configuração do Wrangler.
- Nada é publicado sem confirmação explícita do Luís (regra do README).
- Os testes existentes continuam a passar: Vitest, e2e, segurança e `astro check`. Cada versão tem os
  seus testes e2e do que muda (presença ou ausência do formulário, páginas obrigado, CSP).
- Commits sem `Co-Authored-By`.

## Como se prova que funciona

- **base:** em todas as páginas e nas duas línguas não existe formulário, e todos os botões de contacto
  levam a meios diretos (e2e). `/obrigado` responde 404.
- **formulario:**
  - Um envio real a partir do endereço `pages.dev` chega a `luismanuelsantos2801@gmail.com` com os
    campos certos. Responder a esse email vai para o visitante.
  - Um envio sem Turnstile válido é recusado.
  - Um envio com erros mostra as mensagens em PT e EN.
  - Sem JavaScript, o aviso com o telefone e o email aparece e o botão de envio não.
- **sanity:**
  - Mudar o nome ou a fotografia de um advogado e uma frase de uma área no Studio, publicar, e ver a
    alteração no endereço `pages.dev` sem tocar no código.
  - Repor a alteração da mesma forma.
  - O formulário funciona como na versão formulario.
- Os três endereços abertos lado a lado mostram o mesmo design.

## Fica ao critério de quem implementa

- Nomes dos três projetos Pages. Sugestão: `carretolages-base`, `carretolages-formulario`,
  `carretolages-sanity`. O projeto `carretolages` atual não muda.
- Como impedir que a pasta `functions/` seja publicada na versão base.
- Como gerar `_headers` com a CSP certa por versão.
- Binding `send_email` ou API REST do Email Sending a partir da Pages Function.
- Dataset público ou privado com token de leitura, desde que nenhum token chegue ao browser.
- Ordem de trabalho. Sugestão: versão base, depois formulario, depois sanity, cada uma verificada
  antes da seguinte.
