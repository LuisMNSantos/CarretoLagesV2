import { describe, expect, test } from 'vitest';
import { breadcrumbLd, faqLd, legalServiceLd, personLd, serviceLd } from './jsonld';
import { areas, faq, lawyers } from './content';

describe('JSON-LD builders', () => {
  test('LegalService lists both offices and the four areas', () => {
    const ld = legalServiceLd('pt');
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('LegalService');
    expect(ld.department).toHaveLength(2);
    expect(ld.foundingDate).toBe('2002');
    expect(ld.telephone).toBe('+351232762464');
    expect(ld.knowsAbout).toHaveLength(4);
  });

  test('Person has name, jobTitle and employer in the requested language', () => {
    const ld = personLd(lawyers[0]!, 'en');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('José Carreto Lages');
    expect(ld.jobTitle).toBe('Founding Partner');
    expect(ld.worksFor.name).toBe('Carreto Lages & Associados');
    expect(ld.url).toBe('https://carretolages-v2.pages.dev/en/lawyers/jose-carreto-lages');
  });

  test('FAQPage mirrors the questions', () => {
    const ld = faqLd(faq, 'pt');
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(faq.length);
    expect(ld.mainEntity[0]!.acceptedAnswer.text).toBe(faq[0]!.answer.pt);
  });

  test('BreadcrumbList uses absolute URLs and 1-based positions', () => {
    const ld = breadcrumbLd([{ name: 'Início', path: '/' }, { name: 'Advogados', path: '/advogados' }]);
    expect(ld.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, 'https://carretolages-v2.pages.dev/'],
      [2, 'https://carretolages-v2.pages.dev/advogados'],
    ]);
  });

  test('Service for an area points at the firm', () => {
    const ld = serviceLd(areas[2]!, 'en');
    expect(ld.name).toBe('Tax Law');
    expect(ld.provider['@type']).toBe('LegalService');
  });
});
