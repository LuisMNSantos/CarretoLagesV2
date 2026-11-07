import type { StructureResolver } from 'sanity/structure';

const LISTS: [string, string][] = [
  ['area', 'Áreas de atuação'], ['lawyer', 'Advogados'], ['office', 'Escritórios'], ['situation', 'Situações (secção 04)'],
  ['step', 'Passos do processo (secção 05)'], ['caseStudy', 'Casos práticos'], ['testimonial', 'Testemunhos'],
  ['faq', 'Perguntas frequentes'], ['insight', 'Destaques'], ['page', 'Páginas institucionais e legais'],
];

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Conteúdo')
    .items([
      S.listItem().title('Definições gerais').id('settings').child(S.document().schemaType('settings').documentId('settings')),
      S.divider(),
      ...LISTS.map(([type, title]) => S.documentTypeListItem(type).title(title)),
    ]);
