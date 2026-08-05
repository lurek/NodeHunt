# NodeHunt

Static Astro publication for research-led Web3 infrastructure guides. Content lives in `src/content/posts`; new CMS entries default to drafts. Never publish recovered Blogger content without verifying facts, sources, image rights, and legacy URL mapping.

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build + Pagefind search index
- `npm run preview` — preview the built site locally
- `npm run check:links` — validate internal links and assets in `dist`
- `npm run format` / `format:check` — Prettier (Astro + TypeScript)

## Getting started

1. `npm install`
2. `npm run dev` and open the printed local URL
3. Before production deployment, set `PUBLIC_SITE_URL` to the canonical HTTPS domain and read `DEPLOYMENT.md`.

## Project layout

- `src/content` — posts, authors, categories, tags, and static pages (managed via Pages CMS)
- `src/utils/content.ts` — content/taxonomy helpers
- `src/components/article` — editorial components (callouts, FAQ, comparison tables, TOC, share/prev-next, byline)
- `src/components/ads` — inert ad slot boundaries (disabled until a provider is approved)
- `archive/` — legacy Blogspot theme, old post drafts, and unused images; not part of the site build
