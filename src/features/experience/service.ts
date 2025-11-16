import type { ImageMetadata } from 'astro:assets';
import type { ExperienceData } from './type';
import experienceJson from '@/collections/experience.json';

const imageModules = import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
});

function resolveImage(path?: string): ImageMetadata | undefined {
  if (!path) return undefined;
  const mod = imageModules[path] as any;
  return mod?.default as ImageMetadata | undefined;
}

export function getExperience(): Array<ExperienceData> {
  const items = (experienceJson as any).experience || [];
  const mapped: Array<ExperienceData> = items.map((e: any) => ({
    id: e.id,
    role: e.role,
    company: e.company,
    location: e.location || undefined,
    startDate: e.startDate,
    endDate: e.endDate ?? undefined,
    summary: e.summary || undefined,
    highlights: e.highlights || [],
    tags: e.tags || [],
    logo: resolveImage(e.logoPath),
  }));
  // Optional: sort by startDate desc
  return mapped.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}
