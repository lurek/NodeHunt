# NodeHunt — Production Implementation Plan

**Status:** Approved planning baseline (implementation has not begun)  
**Last reviewed:** 2026-08-05  
**Owner:** NodeHunt

## 1. Product definition and planning constraints

NodeHunt will be a fast, research-led Web3 publication covering nodes, DePIN, crypto infrastructure, wallets, security, and AI x blockchain. Its editorial promise is: **practical infrastructure knowledge without investment hype**.

The public tagline is:

> Discover the latest Web3 Nodes, DePIN, Crypto Infrastructure, AI x Blockchain, and Passive Earning Opportunities.

The existing repository is a Blogger recovery archive: it contains a legacy `jettheme-v2.xml`, article drafts, PNG assets, and a logo, but no Astro application. The implementation therefore starts as a clean Astro project and selectively migrates only reviewed content/assets.

### Important decisions made before build

- The site will be fully statically generated (`output: 'static'`); it will not require a runtime database, server-side user account system, or paid API.
- Pages CMS is a GitHub-backed authoring interface, not a CMS hosted by Cloudflare. It edits repository files via a committed `.pages.yml`; Cloudflare Pages then builds/deploys the resulting Git changes.
- All article dates, external links, project claims, tokenomics, and earning statements inherited from Blogger drafts require an editorial fact check before publication. Time-sensitive information will show an update date and source links. No projected return or reward will be stated as guaranteed.
- The final primary domain must be selected before production launch. Until then, `PUBLIC_SITE_URL` is a required build/deploy setting; the production canonical domain must never be guessed.
- Permanent redirects from the deleted Blogspot URLs should be created only after the old URL inventory and new destination map are confirmed. Redirecting unrelated pages to the home page is avoided because it harms users and SEO.
- The original Blogger template is reference material, not a code dependency. NodeHunt will retain recognizable brand assets and content focus while receiving a new, accessible, dark-first visual system.

## 2. Target architecture

### System architecture

```text
Authors → Pages CMS → GitHub repository (.md/.mdx + images + .pages.yml)
                         ↓ commit / pull request
                    Cloudflare Pages build
                         ↓
 Astro content collections → typed content helpers → static HTML/CSS/search index/RSS/sitemap
                         ↓
                Cloudflare CDN + custom domain
                         ↓
          Readers (zero-JS by default; small progressive enhancements only)
```

### Design system and component hierarchy

```text
BaseLayout
├─ SiteHead (metadata, canonical, JSON-LD, theme-color)
├─ SkipLink
├─ SiteHeader
│  ├─ Brand
│  ├─ DesktopNavigation
│  ├─ ThemeToggle (small island/script)
│  └─ MobileNavigation (progressive enhancement)
├─ main
│  ├─ PageHero / SectionHeader
│  ├─ Content-specific modules
│  │  ├─ ArticleCard / FeatureCard / CompactArticleCard
│  │  ├─ CategoryPill / TagPill / AuthorByline
│  │  ├─ ArticleBody / TableOfContents / Callout / CodeBlock
│  │  ├─ RelatedArticles / PreviousNext / ShareLinks
│  │  ├─ SearchDialog / SearchResults
│  │  └─ AdSlot variants (disabled by configuration)
│  └─ NewsletterSignup (provider-neutral UI)
├─ SiteFooter
└─ Client enhancements (search, copy button, theme, menu only)
```

### Proposed folder structure

```text
.
├─ public/
│  ├─ favicon.svg, favicon.png, site.webmanifest
│  ├─ fonts/                         # self-hosted WOFF2 only if licensing permits
│  ├─ images/                        # static brand/social fallback images
│  ├─ _headers                       # Cloudflare Pages security/caching headers
│  └─ robots.txt
├─ src/
│  ├─ assets/
│  │  ├─ brand/                      # vetted logo source assets
│  │  └─ content/                    # optimized collection images managed with content
│  ├─ components/
│  │  ├─ ads/, article/, cards/, common/, layout/, search/, seo/
│  ├─ content/
│  │  ├─ config.ts                   # Astro collection schemas
│  │  ├─ authors/
│  │  ├─ categories/
│  │  ├─ tags/
│  │  ├─ pages/                      # editable About/contact/legal copy
│  │  └─ posts/
│  │     ├─ news/, tutorials/, nodes/, wallet-guides/, airdrops/
│  │     └─ comparisons/, security/, opinion/, ai-crypto/
│  ├─ layouts/                       # BaseLayout, ArticleLayout, LegalLayout
│  ├─ pages/
│  │  ├─ index.astro, blog/[...page].astro, articles/[...slug].astro
│  │  ├─ category/[slug]/[...page].astro, tag/[slug]/[...page].astro
│  │  ├─ search.astro, about.astro, contact.astro, 404.astro
│  │  ├─ privacy.astro, terms.astro, disclaimer.astro
│  │  ├─ rss.xml.ts, sitemap-index.xml.ts
│  │  └─ og/[...slug].png.ts          # optional later build-time/social card route
│  ├─ scripts/                        # build-time search-index generation/validation
│  ├─ styles/                         # Tailwind entry, tokens, prose, print
│  ├─ utils/                          # content, dates, links, seo, reading-time, schema
│  └─ config/                         # site, navigation, ads, social, redirects
├─ .github/workflows/ci.yml
├─ .pages.yml                         # Pages CMS configuration
├─ astro.config.ts, tailwind config, tsconfig.json
├─ package.json, wrangler.jsonc
├─ PROJECT_PLAN.md
└─ README.md, DEPLOYMENT.md, PAGES_CMS_SETUP.md, SEO_GUIDE.md,
   CONTENT_GUIDE.md, CUSTOMIZATION.md
```

`articles/[...slug].astro` deliberately supports collection-prefixed, human-readable URLs such as `/guides/running-a-validator-node/`. The source collection remains a content-management concern; public URLs remain stable even if an editorial desk reorganizes collection folders later.

### Data flow and content model

1. An author creates/edits Markdown or MDX frontmatter and body in Pages CMS.
2. Astro validates every entry against the Zod schema at build time. Invalid dates, missing authors, malformed images, unsafe states, or duplicate slugs fail CI rather than publishing broken pages.
3. `src/utils/content.ts` produces a normalized `PostSummary`: URL, cover image, category/tag objects, calculated reading time, headings, and visibility.
4. Every list page consumes the normalized helper; components never read raw frontmatter independently.
5. Static routes build lists, pagination, related content, RSS, sitemap, structured data, and the client search index from published entries only.
6. `draft: true` entries are kept in Git/Pages CMS but excluded from production routes, feeds, sitemap, search index, and internal recommendations.

### Naming and coding conventions

- TypeScript `strict: true`; no `any` in application code.
- Components use `PascalCase.astro`; utilities use `kebab-case.ts`; route files follow Astro conventions.
- Use semantic HTML first. Component props are typed interfaces. Avoid visual-only divs when an element has semantic meaning.
- Imports use `@/` aliases. Centralize user-facing URLs and labels in configuration instead of scattering literals.
- Tailwind is used for layout/utility composition; reusable colors, shadows, spacing, typography, and transitions live in CSS variables/tokens. No arbitrary one-off color values in content.
- Keep scripts local and module-scoped. No large UI framework. Any interactive element must work in a non-JavaScript fallback or be nonessential.
- Markdown is editorial content; MDX is reserved for vetted, reusable editorial components such as `<Callout>`, `<ComparisonTable>`, `<ProsCons>`, and `<FAQ>`. Authors do not inject raw HTML/scripts.

### Scalability strategy

- File-based collections and static delivery scale cheaply through Git and Cloudflare CDN.
- Pagination is serverless-free and generated at build time (12 cards/page initially; configurable).
- Taxonomies use structured author/category/tag documents, avoiding inconsistent free-text labels.
- Search index includes concise fields only (title, description, headings, tags, category, URL) and is split/minified for a modest client download; revisit index sharding when published content exceeds roughly 2,000 posts.
- The content helper layer isolates any future move to a headless CMS or database. Future comment/newsletter/account services remain optional integrations without changing page architecture.

## 3. Technology decisions and required packages

Use currently supported stable versions at scaffold time and commit the lockfile. Do not pin speculative future versions in planning documentation.

| Technology/package | Role and reason |
|---|---|
| `astro` | Static-first site framework with excellent content and image pipeline; minimizes JavaScript by default. |
| `typescript` | Type-safe content schemas, utilities, and build configuration. |
| `tailwindcss` + `@tailwindcss/vite` | Fast, maintainable token-driven styling without a runtime CSS library. Use the current Astro-supported Tailwind integration pattern. |
| Cloudflare Pages static deployment | The initial site is pure static output, so it deploys directly to Cloudflare Pages without a runtime adapter. Add `@astrojs/cloudflare` only when an approved SSR/Worker feature genuinely needs it. |
| `@astrojs/mdx` | Allows a small, controlled set of editorial components where Markdown alone is insufficient. |
| `@astrojs/sitemap` | Generates XML sitemap(s) from static routes. |
| `@astrojs/rss` | Generates standards-compliant RSS directly from published content. |
| `@astrojs/partytown` (deferred) | Optional only if analytics/ads later require third-party scripts and performance testing supports its use. Not installed in the first build without a concrete integration. |
| `sharp` | Astro image transforms and responsive WebP/AVIF output during static builds. |
| `zod` | Content schema validation (included/transitively available with Astro but declared only if direct imports are used). |
| `remark-gfm` | Tables, strikethrough, task lists, and autolinked headings for technical posts. |
| `remark-toc` / custom heading extractor | Consistent accessible table of contents. Prefer a small internal heading utility if it avoids duplicate headings. |
| `rehype-slug`, `rehype-autolink-headings` | Stable heading IDs and accessible heading links. |
| `rehype-sanitize` | Explicit HTML sanitization if any transformed raw HTML is permitted; raw untrusted HTML remains disabled by default. |
| `rehype-pretty-code` + `shiki` | Build-time syntax highlighting with no client highlighter runtime; custom copy control is tiny vanilla JS. |
| `pagefind` | Fast, static, client-side full-text search with no hosted service or external API. Its generated index is created post-build and deployed with the site. |
| Inline SVG icon component (no package) | A tiny reviewed set of decorative UI icons avoids an unnecessary dependency; each interactive control still receives a textual accessible name. |
| `@fontsource-variable/inter` and `@fontsource-variable/manrope` (or self-hosted licensed equivalents) | Predictable, privacy-preserving typography. Inter is body/UI; Manrope is display. Choose final families after visual testing. |
| `@playwright/test` (future CI phase) | Cross-browser route, navigation, and visual smoke tests. |
| `axe-core` / `@axe-core/playwright` (future CI phase) | Automated accessibility regression checks. |
| `lighthouse-ci` (future CI phase) | Enforces performance and SEO budgets on preview builds. |

No React is planned. Search, dark-mode preference, mobile menu, code-copy, and share actions are small progressive enhancements. Do not add a framework merely to implement them.

## 4. UI/UX plan

### Visual identity

NodeHunt will use a restrained “signal infrastructure” aesthetic: graphite/ink surfaces, a warm off-white light theme, electric mint and violet as sparing signal colors, fine grid/noise accents, rounded 16–24px panels, and subtle translucent layers. Avoid a generic neon-crypto look, excess glass blur, animated backgrounds, and low-contrast text.

- Dark is the default system preference, with an explicit persisted light/dark toggle.
- Typography: a compact geometric display face for titles and a highly legible variable sans for body/UI.
- Layout: 1200–1280px max content width; reading column about 720px; generous whitespace and consistent 8px spacing scale.
- Motion: 150–200ms opacity/transform transitions only; disable/reduce when `prefers-reduced-motion` is set.

### Global shell

- Header: accessible skip link, logo, primary links (Blog, Nodes, DePIN, Security, AI x Crypto), search trigger, theme toggle, and mobile menu. Header remains sticky only after testing it does not reduce mobile reading space.
- Footer: short mission, category links, policies, RSS, contact, social links, copyright, and an editorial/financial disclaimer link.
- Card variants: `featured`, `standard`, `compact`, and `horizontal`; all expose the same meaningful metadata with appropriately sized imagery.
- All click/tap targets are at least 44px on touch devices. Focus state is visibly distinct in both themes.

### Page-by-page requirements

| Page | Layout and sections | Mobile/accessibility/performance |
|---|---|---|
| Home `/` | Hero with focused search; one featured story; latest news/tutorial/node-guide grids; trending, category directory, editor’s picks, recent updates, newsletter CTA. | Hero is concise; grids collapse 3→2→1; first cover gets priority image loading, other covers lazy-load; all sections retain real headings. |
| Blog `/blog/` | Intro, optional filters by type, paginated article grid, category navigation, pagination. | Filters are links rather than JS-only controls; canonical pagination and `rel=prev/next` conventions; no infinite scroll. |
| Article `/guides/[slug]/` | Breadcrumbs, title/deck/byline, cover/caption, facts/updated label, TOC, body, callouts, in-article ad placeholder, share links, tags, related, previous/next, comment placeholder. | 1-column reading flow; TOC becomes collapsible; responsive tables scroll in labelled wrapper; lazy body images with explicit dimensions; code copy is optional. |
| Category `/category/[slug]/` | Category description and expertise statement, featured item, paginated feed, subtopic/tag links. | Noindex empty states; list items are server rendered and keyboard navigable. |
| Tag `/tag/[slug]/` | Tag title, description where available, paginated matching feed. | No thin duplicate archive descriptions; canonical, pagination, concise static output. |
| Search `/search/` | Search input, keyboard shortcut hint, instant Pagefind result list, empty/default guidance. | Search loads only on this route/interaction; labelled status updates (`aria-live`); results remain usable with keyboard. |
| About `/about/` | Mission, editorial principles, team/authors, corrections policy, methodology, contact CTA. | Trust content is crawlable, light, and not hidden behind animation. |
| Contact `/contact/` | Contact purposes, secure mailto or future form endpoint, response expectation, spam/privacy notice. | Initial solution is static mailto to avoid collecting data. A Cloudflare Turnstile-protected form is a separately approved future addition. |
| Privacy, Terms, Disclaimer | Calm legal reading layout with effective date, headings, contact endpoint, no decorative distractions. | Version/review date; readable measure and anchor links. Legal language must be reviewed by the owner/legal professional before launch. |
| 404 | Helpful message, search, latest useful links, return-home action. | Correct HTTP 404 via static `404.astro`; no broken illustrations or dead-end route. |
| RSS, sitemap, robots | Machine-readable endpoints with visible links in footer where useful. | Exclude drafts and noindex pages; validate XML and robots directives in CI. |

## 5. Content architecture

### Collections

Posts live in these required collections: `news`, `tutorials`, `nodes`, `wallet-guides`, `airdrops`, `comparisons`, `security`, `opinion`, and `ai-crypto`. All use one shared post schema so templates and search are consistent; the collection itself supplies the editorial `contentType`.

Reference collections: `authors`, `categories`, `tags`, and editable `pages` (About, contact copy, and legal text). Authors/categories/tags are first-class documents referenced by ID, not strings typed independently on each post.

### Shared post frontmatter schema

```yaml
title: string                         # 55–65 character target where practical
description: string                   # unique 140–160 character target
slug: string                          # immutable kebab case after publishing
publishedAt: date
updatedAt: date | null
draft: boolean                        # defaults true for CMS-created articles
author: reference(authors)
category: reference(categories)       # one primary category
tags: [reference(tags)]               # 2–6 controlled tags
cover:
  image: image
  alt: string
  caption: string | null
featured: boolean
trendingScore: number | null          # editorial curation, no fake real-time metric
editorPick: boolean
seo:
  title: string | null
  description: string | null
  canonical: url | null
  noindex: boolean
  ogImage: image | null
  ogAlt: string | null
disclosure: string | null             # affiliate/sponsor/editorial disclosures
sources: [{ label: string, url: url }]
relatedSlugs: [string] | null         # optional editorial override
```

Build rules: published posts need cover alt text, author, category, description, date, and at least one source for claims-heavy content. `updatedAt` cannot precede `publishedAt`; `featured`, `editorPick`, and trending values are validated. Source links gain `rel="noopener noreferrer"` when external.

### Taxonomy and editorial curation

Initial categories: Web3 Nodes, DePIN, Crypto Infrastructure, Wallet Guides, Tutorials, Airdrops, Security, AI x Blockchain, News & Analysis. Tags capture project/protocol and narrower subjects (Grass, Dawn, Gradient, Nodepay, validators, mining, Layer 2, DeFi, RWA, staking, AI agents).

Featured posts are a bounded homepage selection controlled by `featured`. Trending means an editor-curated score with explicit ordering; it is not presented as live analytics. Editor’s picks use `editorPick`. This avoids adding analytics infrastructure or misleading popularity claims.

### Migration and sample content sequence

1. Inventory every old Blogger URL, post title, publish date, image, category, incoming-link value, and destination route in a spreadsheet/CSV before importing.
2. Preserve accurate original publishing date where it is known; use `updatedAt` for substantive revisions; never invent a new date to make old content appear current.
3. Review current archive drafts for factual accuracy, citations, claims about rewards, and license/source of every image. The legacy dates and future/market claims must be validated against authoritative sources before shipping.
4. Create the following ten reviewed demo articles, each with an original short description, author, sources, cover alt/caption, disclosure, related links, and appropriate collection:
   - What Is Grass? A Practical Overview of Its Network and Participation Model
   - What Is Dawn? Understanding Decentralized Broadband Infrastructure
   - Gradient Guide: What It Does and What to Check Before Participating
   - Nodepay Tutorial: Setup, Account Safety, and Risk Checks
   - Best DePIN Projects to Research: Evaluation Framework, Not Investment Advice
   - Best Crypto Nodes for Beginners: Hardware, Cost, and Responsibility Comparison
   - AI + Crypto Trends: Infrastructure Themes Worth Watching
   - Web3 Infrastructure Explained: Nodes, RPCs, Validators, and Indexers
   - How to Secure Your Crypto Wallet: A Practical Threat-Model Guide
   - Beginner’s Guide to Running Nodes: Choosing a Chain and Operating Safely
5. Do not publish the legacy Blogger markup directly. Convert valid text to clean Markdown/MDX, replace inline styles with components, and redirect only mapped old URLs.

## 6. SEO and discoverability strategy

### Technical SEO

- Define one `site` URL in `astro.config.ts` from `PUBLIC_SITE_URL`; production builds fail or warn loudly if it is absent/invalid.
- `SiteHead` emits a unique title, description, canonical, robots directive, Open Graph, Twitter card, and `theme-color` for every indexable page.
- Canonicals use the preferred HTTPS custom domain with a trailing-slash policy set consistently by Astro. Query parameters never become canonicals.
- Use `@astrojs/sitemap` for all public static routes; exclude drafts, search, CMS/admin paths, 404, and `noindex` content. Validate sitemap XML and submit it after domain verification.
- Generate `/rss.xml` from the latest published entries with absolute URLs and content excerpts. Link it with an alternate feed tag.
- Publish deliberate `robots.txt`: allow public pages/assets, point to sitemap, disallow staging/CMS routes only when relevant; do not use robots to hide sensitive data.
- Pagination has unique page title/description, self-referencing canonical, crawlable page links, and avoids a false canonical to page one.
- Content URLs are concise, category-neutral, immutable kebab-case slugs. Change a published slug only with a permanent redirect.

### Structured data

- `Organization` (or `NewsMediaOrganization` only if operationally accurate) and `WebSite` schema on the home page, with logo, URL, sameAs only for owned profiles, and SearchAction only after the site search URL behavior is confirmed.
- `BlogPosting`/`Article` schema on articles with headline, description, dates, author, publisher, primary image, mainEntityOfPage, articleSection, and citations where appropriate.
- `BreadcrumbList` on archive and article paths.
- `CollectionPage` or `Blog` schema for category and blog archives where it describes the page accurately.
- Serialize JSON-LD safely (`JSON.stringify` with `<` escaped) and validate in Rich Results Test. Never mark opinion, unverified, or financial promotional material as news solely to chase enhanced results.

### On-page, editorial, and internal linking SEO

- One H1 per page; logical H2–H3 hierarchy; human-readable introductions; descriptive anchors; source links near important factual claims.
- Generate reading time at build time. Render headings/TOC only when enough headings exist.
- Related content ranking: same category first, then shared tags, then matching collection; exclude current post/drafts; use date as tie-breaker; allow `relatedSlugs` editor override. Limit to 3–4 genuinely useful articles.
- Article author pages/details, editorial standards, corrections, disclaimer, and source lists support trust and transparent YMYL-adjacent crypto coverage.
- Cover alt text is required in CMS. The CMS may prefill a title-derived suggestion, but editors must edit it to describe the image; automatic filename-based alt text is prohibited.
- Use image captions where attribution/context matters. Track image license/creator/source in media metadata or article sources.
- Submit the verified domain to Search Console and Bing Webmaster Tools after launch, monitor crawl errors, Core Web Vitals, sitemap coverage, and 404s monthly.

## 7. Performance plan

Target 95–100 Lighthouse Performance, Accessibility, Best Practices, and SEO on representative mobile/desktop pages in production-like conditions. Scores are targets, not a substitute for field Core Web Vitals.

- Serve responsive images through Astro `Image`/`Picture`: AVIF/WebP where supported, meaningful `sizes`, fixed intrinsic dimensions, and no lazy loading for the LCP hero.
- Compress/migrate recovered PNGs after visual review; preserve source files outside public output if they are too large. Never use a background image for content-critical cover art.
- Preload only the LCP image and critical font subset when measurement proves it helps. Use local variable fonts, `font-display: swap`, minimal weights, and sensible fallbacks.
- Static HTML and hashed assets deploy through Cloudflare’s CDN. Give immutable hashed assets long cache lifetimes; HTML can use Cloudflare defaults/revalidation policy appropriate to Pages.
- Keep initial JS to theme/menu enhancements; Pagefind and sharing load only when used. Avoid client hydration for cards, TOC, social links, and article rendering.
- Inline only tiny critical theme-preference logic if needed to prevent flash; ensure CSP uses a hash/nonce-compatible approach. Prefer CSS media query default where it removes script entirely.
- Use native `loading="lazy"` and `decoding="async"` below the fold; reserve dimensions to eliminate CLS.
- Enable Astro prefetch conservatively for likely internal navigation, not every link. Monitor bundle sizes and avoid premature animation libraries.
- Test LCP, INP, CLS, total JS/CSS, image bytes, and third-party requests before each release. Ads/analytics cannot ship if they breach budgets without an explicit product decision.

## 8. Accessibility plan

Aim for WCAG 2.2 AA.

- Landmark structure: skip link, `header`, `nav`, one `main`, complementary areas only where meaningful, and `footer`.
- Each interactive control has an accessible name; icon-only controls use visible tooltip plus `aria-label`; toggles expose state with `aria-pressed`/appropriate semantics.
- Visible keyboard focus, logical tab order, Escape/return-focus behavior for search and mobile menu, and no keyboard trap.
- Body copy, controls, and muted text meet contrast thresholds in both themes. Color never communicates category/status alone.
- Respect `prefers-reduced-motion`; no essential information appears only on hover, animation, or color change.
- Article tables have headers/scope and a labelled responsive overflow wrapper; code blocks offer a copy button without preventing text selection.
- Images have purposeful alt text or empty alt if purely decorative. Charts/complex visuals include adjacent text summaries.
- Forms have real labels, error text, required state, and understandable privacy disclosure. The first contact version avoids form complexity by using a static email route.
- Validate with keyboard-only walkthroughs, automated axe scans, and screen-reader spot checks (VoiceOver/NVDA) at release gates.

## 9. Security and privacy plan

- Static-first delivery minimizes attack surface. No database, authentication endpoint, or secrets are required for the initial public site.
- Add Cloudflare Pages `_headers`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` with unused features disabled, clickjacking protection via CSP `frame-ancestors 'none'`, and an enforced Content Security Policy after validating all assets. Do not use obsolete `X-XSS-Protection` as a primary control.
- CSP initially permits only self-hosted assets plus explicitly approved integrations. No wildcard script/style origins; document any exception in `CUSTOMIZATION.md`.
- No unreviewed `set:html`, raw MDX imports, inline event handlers, or user-generated HTML. Markdown sanitation remains defense in depth, and content is code-reviewed where raw markup is unavoidable.
- Add `target="_blank" rel="noopener noreferrer external"` to external links as appropriate. Preserve safe `mailto:` and trusted protocol allowlists.
- Store no private keys, CMS tokens, analytics IDs with secrets, or personal data in Git. Use Cloudflare/GitHub encrypted secrets only for later deployment or notification integrations.
- Pages CMS permissions follow least privilege: owners/admins only for configuration and publishing; authors/editors use their own GitHub accounts. Review collaborator access quarterly.
- Publish a transparent privacy policy before enabling analytics, newsletter, ads, comments, or a contact form. Use privacy-friendly analytics only after owner approval.

## 10. Pages CMS design

### CMS configuration

`.pages.yml` is the single CMS configuration file. It will define local repository media folders and the collections below. Pages CMS uses GitHub authentication and writes back to the repository; it does not need a Cloudflare Pages runtime integration.

| CMS collection | Repository path | Editor | Core fields |
|---|---|---|---|
| News | `src/content/posts/news` | Markdown/MDX | shared post schema, type fixed to news |
| Tutorials | `src/content/posts/tutorials` | Markdown/MDX | shared post schema |
| Node Guides | `src/content/posts/nodes` | Markdown/MDX | shared post schema |
| Wallet Guides | `src/content/posts/wallet-guides` | Markdown/MDX | shared post schema |
| Airdrops | `src/content/posts/airdrops` | Markdown/MDX | shared post schema plus risk/disclosure emphasis |
| Comparisons | `src/content/posts/comparisons` | Markdown/MDX | shared post schema |
| Security | `src/content/posts/security` | Markdown/MDX | shared post schema plus reviewed-by future field |
| Opinion | `src/content/posts/opinion` | Markdown/MDX | shared post schema and opinion label |
| AI x Crypto | `src/content/posts/ai-crypto` | Markdown/MDX | shared post schema |
| Authors | `src/content/authors` | Markdown/YAML | name, slug, role, bio, avatar, social/website, expertise |
| Categories | `src/content/categories` | YAML/Markdown | name, slug, description, color token, featured image optional |
| Tags | `src/content/tags` | YAML/Markdown | name, slug, description optional |
| Site/legal pages | `src/content/pages` | Markdown | title, SEO fields, updated date, body |

### Field behavior and media workflow

- Required fields: title, description, draft, author, category, tags, published date, cover image, cover alt text, and SEO noindex. `updatedAt`, caption, social image, sources, disclosure, and curated flags are optional but surfaced clearly.
- `slug` is created from title only before first publish; an editor may correct it before release. Once public, editing it requires an accompanying redirect entry and review.
- Upload media to `src/assets/content/<year>/<slug>/`; use lower-case kebab-case filenames. The CMS accepts only allowed image types and provides focal/alt/caption/source fields.
- The build produces optimized output, while originals remain versioned. Establish size guidance (e.g., 1600–2400px wide, compressed source preferably under 1.5MB) in `CONTENT_GUIDE.md`.
- New entries default to `draft: true`. A publish checklist in the CMS includes source verification, disclaimer/disclosure, alt text, related articles, and SEO preview. Publishing means setting draft false in a reviewed Git change; Cloudflare’s successful production deployment is the final release gate.
- Pages CMS edits are tracked by Git history. Require branch protection/PR review for production changes if the editorial team is larger than one trusted owner.

## 11. Ad architecture

Advertising is deliberately absent from the initial release. Components are present only as inert, reusable layout boundaries:

- `TopBannerAd`, `SidebarAd`, `InlineArticleAd`, `StickyMobileAd`, `BottomBannerAd`, `FooterAd`
- One `src/config/ads.ts` controls global enablement, per-slot enablement, provider identifier, and reserved dimensions.
- With ads disabled, components render no container, script, network request, or blank spacing.
- With ads later enabled, slots reserve their dimensions to prevent CLS; external network scripts are loaded only after a CSP/privacy/performance review; ad labels are clear; mobile sticky ads include an accessible close control and safe-area spacing.
- Editorial text and layout decisions remain independent of ads. No ads are placed inside TOC, immediately beside destructive/financial claims, or in a way that resembles editorial cards.

## 12. Deployment and operational plan

### GitHub and Cloudflare Pages

1. Create a GitHub repository and protect `main` (PR required, passing CI required).
2. Connect it to a Cloudflare Pages project. Set production branch `main`; use preview deployments for pull requests.
3. Build command: `npm run build`; output directory: `dist`; Node version is pinned in `.nvmrc`/Cloudflare compatibility configuration.
4. Configure `PUBLIC_SITE_URL` for production and a correct preview-safe URL policy. Keep actual secrets out of public `PUBLIC_*` variables.
5. Attach custom domain, force HTTPS, choose canonical host, set DNS records, and verify Search Console/Bing Webmaster ownership.
6. Publish `_headers`, `robots.txt`, sitemap/RSS, and redirects only after route audit.

### CI workflow

On pull request and main push: dependency install via lockfile → format/lint/typecheck → content validation → production build → Pagefind indexing → link/asset checks → optional Playwright/axe/Lighthouse jobs as introduced. Cloudflare preview deployment is reviewed before merge for template, performance, and canonical behavior.

### Environment variables

Initial public configuration: `PUBLIC_SITE_URL`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_SOCIAL_*` where genuinely public. Future private values (analytics token, newsletter API key, webhook secret) stay only in Cloudflare/GitHub encrypted secret stores and are introduced with a separate architecture change.

### Rollback and incident response

- Cloudflare Pages retains previous deployments; rollback by promoting the last known good deployment or reverting the Git commit.
- Content mistakes: revert the commit, redeploy, then correct the source draft. Do not overwrite history destructively.
- A release checklist verifies canonical host, headers, sitemap, search, primary routes, and no accidental draft release. Log incidents/corrections in Git issues.

## 13. Documentation deliverables

- `README.md`: project overview, prerequisite versions, local development, scripts, architecture summary, and contribution basics.
- `DEPLOYMENT.md`: GitHub/Cloudflare setup, DNS, environment variables, preview production workflow, headers, redirects, rollback, and launch checklist.
- `PAGES_CMS_SETUP.md`: GitHub authorization, `.pages.yml`, content/media editing, draft/publish process, collaborator permissions, and troubleshooting.
- `SEO_GUIDE.md`: metadata fields, content URLs, schema, sitemap/RSS, image alt/captions, redirects, indexing verification, and monitoring.
- `CONTENT_GUIDE.md`: editorial standards, source/citation practice, financial-risk language, articles/MDX components, images/licenses, accessibility, and publish checklist.
- `CUSTOMIZATION.md`: brand tokens, navigation, categories, themes, ads config, social links, and safe integration procedure.

## 14. Testing and acceptance plan

### Before each release

- **Build/content:** clean install, typecheck, `astro check`, production build, schema validation, duplicate URL/slug check, broken internal link check, Pagefind index generated.
- **Manual functional:** home, article, archives, tag/category, search, RSS, sitemap, robots, 404, mobile menu, theme persistence, code-copy, pagination, draft exclusion, and ad-disabled zero footprint.
- **Accessibility:** keyboard-only navigation, focus return, touch target review, light/dark contrast, reduced motion, axe scan, and screen-reader spot checks.
- **Performance:** test home and a long article on mobile/desktop with a cold cache. Track LCP/CLS/INP, JS/CSS/images, font behavior, and third-party requests.
- **SEO:** inspect title/description/canonical/OG, validate schema and sitemap, verify noindex/draft exclusion, review pagination and redirects.
- **Deployment:** check a Cloudflare preview first, then the canonical production domain/HTTPS/headers after deployment.

### Future automated testing

Add Playwright route smoke tests, `@axe-core/playwright`, Lighthouse CI budgets, a scheduled link checker, visual regression tests for core templates, and content-lint rules for alt text/source/disclosure. Coverage should grow from critical public pathways rather than testing implementation details first.

## 15. Implementation phases

1. **Foundation:** initialize Astro/TypeScript/Tailwind, strict linting, site config, base tokens/layout, local brand assets. No raw legacy content is published.
2. **Content platform:** configure collections/schemas/content helpers, Pages CMS, optimized images, Markdown/MDX components, and migrate/review initial ten articles.
3. **Public templates:** build home, blog, articles, taxonomies, legal/about/contact, 404, responsive navigation, theme toggle, and ad placeholders.
4. **Discovery:** add Pagefind search, related/previous-next logic, SEO head/schema, RSS, sitemap, robots, pagination, and redirects from audited old routes.
5. **Hardening:** headers/CSP, accessibility audits, performance tuning, build/link validation, final documentation, Cloudflare preview/production deployment.
6. **Post-launch:** monitor indexation, CWV, 404s, source accuracy, and CMS workflow; prioritize roadmap items only from measured need.

Each phase is reviewable and deployable. Any material architecture change discovered during implementation must update this file before related code changes are made.

## 16. Future roadmap (not scope for first release)

| Priority | Feature | Approach and guardrails |
|---|---|---|
| Near | Newsletter | Provider-neutral form or Cloudflare Worker endpoint, explicit consent, double opt-in where legally needed, privacy policy update. |
| Near | Analytics | Privacy-respecting analytics after consent/legal review; use only aggregated performance/editorial signals. |
| Later | Comments | Hosted/moderated service with anti-spam, clear privacy policy, and no impact on static article rendering. |
| Later | Bookmarks/accounts | Cloudflare Workers/D1 or approved auth provider only after a concrete privacy/security model. |
| Later | Localization | Astro i18n, translated content collections, locale-aware canonicals/hreflang; do not machine-translate blindly. |
| Later | Theme refinements | Additional high-contrast/theme presets built from semantic tokens, not duplicated stylesheets. |
| Later | PWA/push | Web manifest first; service worker and push only after caching/privacy/offline behavior are designed and tested. |
| Later | AI summaries | Clearly labelled editorial assist, source-grounded, human-reviewed; never replace article substance or create unsupported claims. |
| Later | Recommendations | Improve related-content ranking from transparent taxonomy/editorial signals before personalized profiling. |

## 17. Decisions needing owner input before production launch

- Final primary domain and whether an old `nodehunt.blogspot.com` redirect/URL inventory is available.
- Brand usage rights for the recovered logo and all existing PNGs; replacement assets are needed where rights/source cannot be confirmed.
- Named editorial contact email and whether a contact form is desired later.
- Legal-policy review and business details for Privacy, Terms, Disclaimer, affiliate/sponsorship disclosures, and any newsletter/analytics/advertising use.
- Whether the legacy drafts should be migrated as historical posts, comprehensively updated, or used only as research/source material.

## Plan review record

This plan was reviewed against the requested architecture, technology, package, UI/UX, content, SEO, performance, accessibility, security, Pages CMS, ad, deployment, documentation, testing, and future-roadmap requirements. It also adds the recovery-specific controls required by a deleted Blogger origin: content claim audit, image rights review, URL inventory, redirect discipline, and canonical-domain verification. It is the single source of truth for the build until revised.
