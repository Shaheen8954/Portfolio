import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import tailwindcss from '@tailwindcss/vite';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import rehypeMermaid from 'rehype-mermaid';

// Use different strategies based on environment
const isProduction = process.env.NODE_ENV === 'production';

// Use 'pre-built' in production to avoid Playwright, 'inline-svg' locally
const mermaidStrategy = isProduction ? 'pre-built' : 'inline-svg';

console.log(`Using Mermaid strategy: ${mermaidStrategy}`);

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // IMPORTANT: Replace with your actual domain in production
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkReadingTime],
      rehypePlugins: [
        [
          rehypeMermaid,
          {
            strategy:
              process.env.NODE_ENV === 'production'
                ? 'pre-mermaid'
                : 'inline-svg',
          },
        ],
      ],
      syntaxHighlight: {
        type: 'shiki',
        excludeLangs: ['mermaid'],
      },
    }),
  ],

  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});