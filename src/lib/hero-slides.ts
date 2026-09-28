import { readdir } from 'node:fs/promises';
import path from 'node:path';

export type HeroSlide = {
  url: string;
  alt: string;
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif)$/i;

/**
 * Loads hero slides from public/hero/.
 * Any image file placed in that folder becomes a slide.
 * Sorted alphabetically by filename.
 */
export async function loadHeroSlides(): Promise<HeroSlide[]> {
  try {
    const dir = path.join(process.cwd(), 'public', 'hero');
    const files = await readdir(dir);
    const images = files.filter((file) => IMAGE_EXTENSIONS.test(file)).sort();
    return images.map((file) => ({
      url: '/hero/' + file,
      alt: '',
    }));
  } catch {
    return [];
  }
}