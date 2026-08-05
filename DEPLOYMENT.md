# Deployment

## Cloudflare Pages

Connect this repository to Cloudflare Pages. Use build command `npm run build` and output directory `dist`. Set `PUBLIC_SITE_URL` to the final canonical HTTPS domain. Deploy a preview first, then verify headers, RSS, sitemap, search, canonical URLs, and 404 behavior.

- `public/_headers` ships security headers, CSP, and immutable caching for hashed assets (`/_astro/*`) and the Pagefind index (`/pagefind/*`).
- Roll back by promoting the previous Cloudflare Pages deployment or reverting the release commit.

## Content editing (Pages CMS)

`public/admin/index.html` redirects editors to Pages CMS, which reads `.pages.yml` at the repository root. Editors sign in with their GitHub account and publish to Git; Cloudflare Pages rebuilds only when the build succeeds.

## CI

`.github/workflows/ci.yml` runs on every pull request and push to `main`: install via lockfile (`npm ci`) → `npm run build` (includes Pagefind indexing) → `npm run check:links`. Treat the CI status as a merge gate. `npm run check` (Astro content/type checking) requires `@astrojs/check`; install it with `npm i -D @astrojs/check` when the registry is reachable, then add `npm run check` to the workflow.
