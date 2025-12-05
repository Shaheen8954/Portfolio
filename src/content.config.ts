import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/features/blog/content',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.object({
        url: image(),
        alt: z.string(),
      }),
      tags: z.array(z.string()).optional(),
      relatedPosts: z.array(reference('blog')),
      readingTimeMinutes: z.number().optional(), // Added by remark plugin
      isDraft: z.boolean(),
    }),
});

export const collections = {
  blog: blogCollection,
};
