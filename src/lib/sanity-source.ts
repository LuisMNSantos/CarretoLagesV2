// sanity plan only: reads every published content document from Sanity at build time (public dataset, no token).
import { CONTENT_QUERY, fromSanity, type RawContent } from './sanity-map';

export async function fetchSanityContent(projectId: string, dataset: string): Promise<RawContent> {
  if (!projectId) throw new Error('PUBLIC_SANITY_PROJECT_ID is missing (.env.sanity)');
  const { createClient } = await import('@sanity/client');
  const client = createClient({ projectId, dataset, apiVersion: '2026-11-01', useCdn: false, perspective: 'published' });
  return fromSanity(await client.fetch<unknown[]>(CONTENT_QUERY));
}
