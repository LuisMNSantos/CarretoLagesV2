import type { ImageMetadata } from 'astro';

const stock = import.meta.glob<{ default: ImageMetadata }>('../assets/stock/*.jpg', { eager: true });
const team = import.meta.glob<{ default: ImageMetadata }>('../assets/team/*.png', { eager: true });

function find(map: Record<string, { default: ImageMetadata }>, dir: string, id: string, ext: string): ImageMetadata {
  const hit = map[`../assets/${dir}/${id}.${ext}`];
  if (!hit) throw new Error(`Missing image ${dir}/${id}.${ext}`);
  return hit.default;
}

export const stockImage = (id: string): ImageMetadata => find(stock, 'stock', id, 'jpg');
export const teamPhoto = (id: string): ImageMetadata => find(team, 'team', id, 'png');
