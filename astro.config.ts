import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL || 'https://nodehunt.example';

export default defineConfig({
  site,
  output: 'static',
  integrations: [react(), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: { theme: 'github-dark-default', wrap: true },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
