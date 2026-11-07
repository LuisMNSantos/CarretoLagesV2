// Sanity models for the sanity plan. They mirror src/content/schemas.ts (Zod), which still validates every build:
// a document that passes here but breaks the site's rules fails the Pages build and the live site stays as it was.
import { defineArrayMember, defineField, defineType } from 'sanity';

const AREAS = [
  { title: 'Direito Penal', value: 'penal' },
  { title: 'Direito Imobiliário', value: 'imobiliario' },
  { title: 'Direito Fiscal', value: 'fiscal' },
  { title: 'Direito Financeiro', value: 'financeiro' },
];

// ---------- Field helpers ----------
const req = <R extends { required(): R }>(r: R): R => r.required();
const str = (name: string, title: string, required = true) => defineField({ name, title, type: 'string', validation: required ? req : undefined });
const loc = (name: string, title: string, required = true) => defineField({ name, title, type: 'localizedString', validation: required ? req : undefined });
const locText = (name: string, title: string, required = true) => defineField({ name, title, type: 'localizedText', validation: required ? req : undefined });
const pair = (name: string, title: string) =>
  defineField({
    name, title, type: 'array', of: [defineArrayMember({ type: 'localizedString' })],
    description: 'Duas linhas (a primeira e a segunda do título).',
    validation: (r) => r.required().length(2),
  });
const list = (name: string, title: string, min: number) =>
  defineField({ name, title, type: 'array', of: [defineArrayMember({ type: 'localizedString' })], validation: (r) => r.required().min(min) });
const blocks = (name: string, title: string) =>
  defineField({
    name, title, type: 'array',
    of: ['p', 'h2', 'h3', 'ul', 'quote'].map((type) => defineArrayMember({ type })),
    validation: (r) => r.required().min(1),
  });
const image = (name: string, title: string, required = true) =>
  defineField({ name, title, type: 'image', options: { hotspot: true }, validation: required ? req : undefined });
const id = (description: string) =>
  defineField({ name: 'id', title: 'Identificador', type: 'string', description, validation: (r) => r.required().regex(/^[a-z0-9-]+$/) });
const order = defineField({ name: 'order', title: 'Ordem', type: 'number', description: 'Números mais baixos aparecem primeiro.', validation: (r) => r.required().integer() });
const placeholder = defineField({ name: 'placeholder', title: 'Exemplo ilustrativo', type: 'boolean', description: 'Marcado = conteúdo de exemplo (aparece com o selo "Exemplo ilustrativo").' });
const area = (required = true) =>
  defineField({ name: 'area', title: 'Área', type: 'string', options: { list: AREAS }, validation: required ? req : undefined });
const date = (name: string, title: string, required = true) =>
  defineField({ name, title, type: 'date', options: { dateFormat: 'DD/MM/YYYY' }, validation: required ? req : undefined });
const ptPreview = (field: string) => ({ select: { title: `${field}.pt` } });

// ---------- Shared object types ----------
const localizedString = defineType({
  name: 'localizedString', title: 'Texto (PT/EN)', type: 'object', options: { columns: 2 },
  fields: [
    defineField({ name: 'pt', title: 'Português', type: 'string', validation: req }),
    defineField({ name: 'en', title: 'Inglês', type: 'string', description: 'Sem tradução, o item não aparece no site em inglês.' }),
  ],
  preview: { select: { title: 'pt', subtitle: 'en' } },
});
const localizedText = defineType({
  name: 'localizedText', title: 'Texto longo (PT/EN)', type: 'object', options: { columns: 2 },
  fields: [
    defineField({ name: 'pt', title: 'Português', type: 'text', rows: 4, validation: req }),
    defineField({ name: 'en', title: 'Inglês', type: 'text', rows: 4, description: 'Sem tradução, o item não aparece no site em inglês.' }),
  ],
  preview: { select: { title: 'pt', subtitle: 'en' } },
});
const when = defineField({
  name: 'when', title: 'Mostrar só', type: 'string',
  options: { list: [{ title: 'Com formulário de contacto', value: 'form' }, { title: 'Sem formulário de contacto', value: 'noForm' }] },
  description: 'Vazio = mostrar sempre.',
});
const textBlock = (name: string, title: string) =>
  defineType({ name, title, type: 'object', fields: [locText('text', 'Texto'), when], preview: { select: { title: 'text.pt' }, prepare: ({ title }) => ({ title, subtitle: title === undefined ? '' : `${name.toUpperCase()}` }) } });
const ul = defineType({ name: 'ul', title: 'Lista', type: 'object', fields: [list('items', 'Itens', 1), when], preview: { select: { title: 'items.0.pt' }, prepare: ({ title }) => ({ title, subtitle: 'Lista' }) } });
const quote = defineType({ name: 'quote', title: 'Citação', type: 'object', fields: [locText('text', 'Texto'), loc('cite', 'Autor da citação', false), when], preview: ptPreview('text') });
const pillar = defineType({
  name: 'pillar', title: 'Pilar', type: 'object',
  fields: [
    defineField({ name: 'icon', title: 'Ícone', type: 'string', options: { list: [{ title: 'Conversa', value: 'conversation' }, { title: 'Experiência', value: 'experience' }, { title: 'Relógio', value: 'clock' }] }, validation: req }),
    loc('title', 'Título'), locText('text', 'Texto'),
  ],
  preview: ptPreview('title'),
});
const stat = defineType({ name: 'stat', title: 'Número', type: 'object', fields: [str('value', 'Valor'), loc('label', 'Legenda')], preview: { select: { title: 'value', subtitle: 'label.pt' } } });
const sectionIntro = (name: string, title: string) =>
  defineField({ name, title, type: 'object', fields: [loc('eyebrow', 'Etiqueta'), pair('title', 'Título'), locText('lead', 'Introdução')] });

// ---------- Documents ----------
const settings = defineType({
  name: 'settings', title: 'Definições gerais', type: 'document',
  fields: [
    defineField({ name: 'foundedYear', title: 'Ano de fundação', type: 'number', readOnly: true }),
    str('phone', 'Telefone (como aparece)'), str('phoneHref', 'Ligação do telefone (tel:+351…)'),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (r) => r.required().email() }),
    loc('hours', 'Horário'), loc('responsePromise', 'Prazo de resposta'),
    defineField({ name: 'hero', title: 'Topo da página inicial', type: 'object', fields: [loc('eyebrow', 'Etiqueta'), pair('title', 'Título'), locText('lead', 'Introdução'), loc('caption', 'Legenda do vídeo')] }),
    defineField({ name: 'pillars', title: 'Pilares (3)', type: 'array', of: [defineArrayMember({ type: 'pillar' })], validation: (r) => r.required().length(3) }),
    defineField({ name: 'stats', title: 'Números (faixa 02)', type: 'array', of: [defineArrayMember({ type: 'stat' })], validation: (r) => r.required().min(3) }),
    defineField({ name: 'sections', title: 'Introduções das secções', type: 'object', fields: [sectionIntro('areas', 'Áreas'), sectionIntro('situations', 'Situações'), sectionIntro('process', 'Processo')] }),
    defineField({ name: 'seo', title: 'Pesquisa (SEO)', type: 'object', fields: [loc('homeTitle', 'Título da página inicial'), locText('homeDescription', 'Descrição da página inicial')] }),
  ],
  preview: { prepare: () => ({ title: 'Definições gerais' }) },
});

const office = defineType({
  name: 'office', title: 'Escritório', type: 'document',
  fields: [
    id('Ex.: aveiro'), order, str('name', 'Nome'), locText('address', 'Morada'),
    defineField({ name: 'addressToConfirm', title: 'Morada por confirmar', type: 'boolean', initialValue: false, validation: req }),
    str('phone', 'Telefone'),
    defineField({ name: 'mapsUrl', title: 'Ligação "Abrir no Google Maps"', type: 'url', validation: req }),
    defineField({ name: 'embedUrl', title: 'Endereço do mapa embutido', type: 'url', validation: req }),
    image('image', 'Fotografia'),
  ],
  preview: { select: { title: 'name', media: 'image' } },
});

const areaDoc = defineType({
  name: 'area', title: 'Área de atuação', type: 'document',
  fields: [
    defineField({ name: 'id', title: 'Área', type: 'string', options: { list: AREAS }, validation: req }),
    order, loc('slug', 'Endereço (slug)'), loc('eyebrow', 'Etiqueta'), loc('title', 'Título'), pair('headline', 'Título da página'),
    locText('summary', 'Resumo'), list('keywords', 'Palavras-chave', 2), list('services', 'O que fazemos', 3),
    blocks('description', 'Descrição'), image('image', 'Fotografia'), locText('metaDescription', 'Descrição para pesquisa'),
  ],
  preview: { select: { title: 'title.pt', media: 'image' } },
});

const situation = defineType({
  name: 'situation', title: 'Situação', type: 'document',
  fields: [
    id('Ex.: notificacao'), order,
    defineField({ name: 'icon', title: 'Ícone', type: 'string', options: { list: ['scale', 'home', 'document', 'bank'] }, validation: req }),
    loc('eyebrow', 'Etiqueta'), loc('prompt', 'Pergunta'), pair('title', 'Título'), locText('body', 'Texto'), list('tags', 'Etiquetas', 2),
    area(), loc('linkLabel', 'Texto da ligação'), image('image', 'Fotografia'), loc('imageCaption', 'Legenda da fotografia'),
  ],
  preview: { select: { title: 'prompt.pt', media: 'image' } },
});

const step = defineType({
  name: 'step', title: 'Passo do processo', type: 'document',
  fields: [id('Ex.: ouvir'), order, defineField({ name: 'number', title: 'Número', type: 'string', validation: (r) => r.required().regex(/^0[1-4]$/) }), loc('title', 'Título'), loc('headline', 'Frase'), locText('body', 'Texto'), image('image', 'Fotografia')],
  preview: { select: { title: 'title.pt', subtitle: 'number', media: 'image' } },
});

const lawyer = defineType({
  name: 'lawyer', title: 'Advogado', type: 'document',
  fields: [
    id('Igual ao endereço, ex.: jose-carreto-lages'), order,
    defineField({ name: 'slug', title: 'Endereço (slug)', type: 'string', validation: (r) => r.required().regex(/^[a-z0-9-]+$/) }),
    str('name', 'Nome'), loc('role', 'Função'),
    defineField({ name: 'group', title: 'Grupo', type: 'string', options: { list: [{ title: 'Sócio', value: 'partner' }, { title: 'Associado', value: 'associate' }, { title: 'Consultor', value: 'consultant' }] }, validation: req }),
    defineField({ name: 'areas', title: 'Áreas', type: 'array', of: [defineArrayMember({ type: 'string', options: { list: AREAS } })] }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (r) => r.required().email() }),
    image('photo', 'Fotografia', false), blocks('bio', 'Percurso'),
    defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
  ],
  preview: { select: { title: 'name', subtitle: 'role.pt', media: 'photo' } },
});

const caseStudy = defineType({
  name: 'caseStudy', title: 'Caso prático', type: 'document',
  fields: [id('Ex.: heranca-partilha'), order, placeholder, loc('slug', 'Endereço (slug)'), area(), loc('title', 'Título'), locText('summary', 'Resumo'), blocks('context', 'Contexto'), locText('outcome', 'Resultado'), date('date', 'Data')],
  preview: { select: { title: 'title.pt', subtitle: 'date' } },
});

const testimonial = defineType({
  name: 'testimonial', title: 'Testemunho', type: 'document',
  fields: [id('Ex.: cliente-1'), order, placeholder, locText('quote', 'Testemunho'), str('author', 'Autor'), loc('descriptor', 'Descrição do autor')],
  preview: { select: { title: 'author', subtitle: 'quote.pt' } },
});

const faq = defineType({
  name: 'faq', title: 'Pergunta frequente', type: 'document',
  fields: [id('Ex.: primeiro-contacto'), order, loc('question', 'Pergunta'), locText('answer', 'Resposta')],
  preview: ptPreview('question'),
});

const insight = defineType({
  name: 'insight', title: 'Destaque', type: 'document',
  fields: [
    id('Ex.: recebi-uma-notificacao'), order, placeholder, loc('slug', 'Endereço (slug)'), area(false), loc('title', 'Título'), locText('excerpt', 'Resumo'),
    date('date', 'Data'), defineField({ name: 'readingMinutes', title: 'Minutos de leitura', type: 'number', validation: (r) => r.required().integer().positive() }),
    blocks('body', 'Texto'), image('image', 'Fotografia'),
  ],
  preview: { select: { title: 'title.pt', subtitle: 'date', media: 'image' } },
});

const page = defineType({
  name: 'page', title: 'Página', type: 'document',
  fields: [
    defineField({ name: 'id', title: 'Página', type: 'string', readOnly: true, options: { list: ['firm', 'history', 'values', 'proBono', 'privacy', 'terms', 'disputes', 'cookies'] }, validation: req }),
    loc('eyebrow', 'Etiqueta'), pair('title', 'Título'), locText('lead', 'Introdução'), blocks('body', 'Texto'),
    defineField({ name: 'draft', title: 'Texto provisório', type: 'boolean' }), date('updated', 'Atualizada em', false),
    image('image', 'Fotografia', false), locText('metaDescription', 'Descrição para pesquisa'),
  ],
  preview: { select: { title: 'eyebrow.pt', subtitle: 'id' } },
});

export const schemaTypes = [
  localizedString, localizedText, textBlock('p', 'Parágrafo'), textBlock('h2', 'Título'), textBlock('h3', 'Subtítulo'), ul, quote, pillar, stat,
  settings, office, areaDoc, situation, step, lawyer, caseStudy, testimonial, faq, insight, page,
];
