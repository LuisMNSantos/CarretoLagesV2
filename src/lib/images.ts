import type { ImageMetadata } from 'astro';
import type { ImageRef } from '../content/schemas';

const stock = import.meta.glob<{ default: ImageMetadata }>('../assets/stock/*.jpg', { eager: true });
const team = import.meta.glob<{ default: ImageMetadata }>('../assets/team/*.png', { eager: true });

function find(map: Record<string, { default: ImageMetadata }>, dir: string, id: string, ext: string): ImageMetadata {
  const hit = map[`../assets/${dir}/${id}.${ext}`];
  if (!hit) throw new Error(`Missing image ${dir}/${id}.${ext}`);
  return hit.default;
}

export const stockImage = (id: string): ImageMetadata => find(stock, 'stock', id, 'jpg');
export const teamPhoto = (id: string): ImageMetadata => find(team, 'team', id, 'png');

/** Props for <Picture>: bundled metadata for a local id, or a remote URL with its size for a CMS image
 *  (Astro downloads and optimises remote images at build, so they are still served from the site). */
export function imageSource(ref: ImageRef, kind: 'stock' | 'team'): { src: ImageMetadata } | { src: string; width: number; height: number } {
  if (typeof ref !== 'string') return { src: ref.url, width: ref.width, height: ref.height };
  return { src: kind === 'team' ? teamPhoto(ref) : stockImage(ref) };
}
