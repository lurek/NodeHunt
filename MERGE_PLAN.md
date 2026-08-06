# NodeHunt — Merge Plan: Blog + Custom Admin Panel (from Stack Hive HQ)

**Status:** Draft — created for a fresh session tomorrow
**Target:** Get a working blog with a custom admin panel (paste fully-styled HTML), ads, auto-sitemap, and IndexNow — all live on Cloudflare (Pages / Worker static assets).

---

## 1. Goal

Merge the useful parts of the **Stack Hive HQ** project (custom Publisher admin panel, ads logic, IndexNow) into **NodeHunt** (the Astro blog), and make it all work on the **static Cloudflare deployment**.

Non-goals (drop from Stack Hive): prompt library, tool directory, comparisons, models/topics hubs, news editor, subscribers/inquiries managers, Sanity integration, Netlify-specific bits.

---

## 2. Current state of both projects

### NodeHunt (target) — `/mnt/3E668F7D668F34A5/Software Project/Node Hunt`
| Item | Value |
|---|---|
| Framework | Astro 7 (static, `output: 'static'`), Tailwind v4, MDX, Pagefind |
| Content | Content collections + glob loader (`src/content.config.ts`) |
| Post collections | 10 folders under `src/content/posts/`: `news, tutorials, nodes, depin, wallet-guides, airdrops, comparisons, security, opinion, ai-crypto` |
| Post URL | `/articles/<slug>/` (`src/pages/articles/[slug].astro`) |
| Post frontmatter (required) | `title` (10–110), `description` (50–180), `slug` (kebab), `publishedAt`, `author`, `category`, `tags` (1–6), `cover` (`image` + `alt` ≥8) |
| Frontmatter (optional) | `draft` (default `true` — must be `false` to publish), `featured`, `editorPick`, `trendingScore`, `seo`, `disclosure`, `sources`, `relatedSlugs` |
| Build | `npm run build` = `astro build && pagefind --site dist` |
| Hosting | Cloudflare **Worker static assets** (`wrangler.toml`: `name=nodehunt`, `assets.directory=./dist`) — AND a live **Cloudflare Pages** git-integration project at `nodehunt.pages.dev` |
| Git | `github.com/lurek/NodeHunt.git`, branch `main` |
| Legacy CMS config | `.pages.yml` (Pages CMS — deprecated) + `public/admin/index.html` (redirects to admin.pagescms.org — not loading) |

### Stack Hive HQ (source) — `/mnt/.../Node Hunt/Stack Hive HQ`
| Item | Value |
|---|---|
| Framework | Astro 4 + React 18 + Tailwind v3, hosted on Netlify (`@astrojs/netlify`) |
| Admin | "Publisher Suite" at `/publisher` (React) |
| — Auth | `PublisherAuth.tsx` — client-side passcode (`sessionStorage`), config in `src/data/publisher_config.json` (`Lurek615@`) |
| — Editor | `ContentPublisherStudio.tsx` (1123 lines) — Article/News/Comparison/Prompt/Tool/Review tabs, each with an **HTML paste textarea** + preview; slug auto-derived from title; featured image = URL |
| — Manager | `PublishedContentManager.tsx` — list/edit/delete published items |
| — Ads | `AdPlacementManager.tsx` — slots: `header-banner, inline-article, sidebar, footer-cta, sticky-bottom, native-grid, social-bar, popunder`; `formatMode` visual/script; `scriptCode`/`tabletScriptCode`/`mobileScriptCode` (Adsterra/AdSense); sandboxed iframe option |
| — IndexNow | `IndexNowManager.tsx` — submit URLs |
| Persistence | `src/pages/api/publisher.ts` + `api/ads.ts` → write JSON to disk (`src/data/publisher_store.json`, `ads_store.json`) via Node fs |
| Blog render | `articles/[slug].astro` → `<Fragment set:html={htmlContent}>` + `.prose-custom` global CSS (styles the pasted Tailwind classes: `text-slate-*`, `bg-slate-950`, `text-brand-*`, captions, code blocks, light/dark overrides) |
| IndexNow | `api/indexnow.ts` (POST → `api.indexnow.org`), `indexnow-key.txt.ts` (key `4f8e91d03b7a482c9103e62f91847120`) |
| Sitemap | custom `sitemap-0.xml.ts`, `sitemap-index.xml.ts`, `robots.txt.ts` |

---

## 3. Core problem & chosen architecture

**Problem:** Stack Hive's admin persists posts/ads to a JSON file via a Node API route. NodeHunt is a **static** Cloudflare site with **no Node server** — that storage dies in production.

**Chosen architecture — "GitHub-commit publishing":**
- The admin panel runs in the browser (`/admin` route).
- Publish/edit/delete = a commit to the GitHub repo (`main`) via the **GitHub REST API**.
- Cloudflare Pages git integration sees the push → rebuilds → deploys automatically.
- Admin writes **normal NodeHunt post files** (`src/content/posts/<category>/<slug>.md`: frontmatter + pasted HTML body), so all existing rendering, internal links, sitemap, search keep working.
- Ads config lives in a committed file (`src/data/ads_store.json`); `AdSlot` renders it at build time; the Ad Manager commits edits.
- **Backend:** a small **Cloudflare Pages Function** (`functions/`) holds the GitHub token as a secret and performs the commits + IndexNow submission. Pages Functions run server-side on the same Pages project, no Node host needed.

**Why Pages Functions (not a separate Worker):** the live site is the Pages git-integration project; `functions/` at repo root is auto-deployed with it. Only `fetch` is needed (GitHub API), so no `node:fs`, no compatibility flags.

---

## 4. Backend — Cloudflare Pages Functions

Folder: `functions/` at repo root.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/publish` | POST | Validate + write/update/delete a post file in the repo (GitHub Contents API). Body: `{ action: 'create'\|'update'\|'delete', title, description, slug, category, tags, author, cover, publishedAt, draft, bodyHtml, fileSha? }`. Returns new/edited post URL. After commit, triggers IndexNow submission. |
| `/api/content` | GET | List posts (GitHub Contents API over `src/content/posts/`) + read a single file's raw content + `fileSha`. Used by the manager UI to load/edit. |
| `/api/ads` | GET/POST | GET: read committed `src/data/ads_store.json`. POST: commit new ads config. |
| `/api/indexnow` | POST | Proxy to `https://api.indexnow.org/indexnow` with `INDEXNOW_KEY` + `PUBLIC_SITE_URL` host. |

Auth for all admin endpoints: require header `x-admin-key` matching env secret `ADMIN_KEY` (the passcode the editor enters). Return `401` otherwise.

Secrets / env vars (Cloudflare Pages → Settings → Environment variables, set for Production + Preview):
- `GITHUB_TOKEN` (secret) — fine-grained PAT, repo `lurek/NodeHunt`, Contents: Read and write.
- `ADMIN_KEY` (secret) — admin passcode.
- `PUBLIC_SITE_URL` — e.g. `https://nodehunt.pages.dev` (currently falls back to placeholder `nodehunt.example` in `astro.config.ts` — MUST be set).
- `INDEXNOW_KEY` — new 32-hex key generated for the NodeHunt domain (do NOT reuse Stack Hive's).

Implementation notes:
- Commit helper: `PUT /repos/lurek/NodeHunt/contents/{path}` with base64 content (needs current file SHA for updates), `DELETE` for deletes. Commits appear under the token owner.
- Validate against NodeHunt's `postSchema` before writing (title 10–110, description 50–180, slug regex, category in the 10 allowed, tags 1–6, cover alt ≥8).
- Generate `.md`: YAML frontmatter matching `src/content.config.ts` + body = pasted HTML (raw, no escaping).
- Cover: if no image chosen, default to the existing `src/assets/content/nodehunt-cover.svg` (relative path from the post folder = `../../../assets/content/nodehunt-cover.svg`).
- Return the post URL (`{PUBLIC_SITE_URL}/articles/{slug}/`).

---

## 5. Data model mapping (Stack Hive article → NodeHunt post)

| Stack Hive field | NodeHunt frontmatter |
|---|---|
| `title` | `title` |
| `excerpt` | `description` |
| auto slug (`title.toLowerCase().replace(...)`) | `slug` (allow manual override) |
| `category.title` | `category` (must be one of the 10; UI = dropdown) |
| `tags` | `tags` (1–6) |
| `featuredImage.asset.url` | `cover.image` (local asset only — see §7) + `cover.alt` |
| `htmlContent` | **file body** (raw HTML, passed through by Astro markdown) |
| — | `publishedAt` (date picker) |
| — | `draft` (toggle; default true) |
| `author.name` | `author` (default `nodehunt-editorial`) |

---

## 6. Frontend — the admin panel (port & trim)

New React island hosted at `/admin` (new Astro page `src/pages/admin.astro`). Components ported from Stack Hive and trimmed to blog-only:

1. **`PublisherAuth.tsx`** — keep the passcode gate (client-side UX). It stores the passcode in `sessionStorage` and sends it as `x-admin-key` on every API call. (Note: this is a shared-secret gate, not a real account system — acceptable for a personal blog; real enforcement is server-side.)
2. **`ContentPublisherStudio.tsx` — Article tab only** — fields: title, description, slug (optional, auto-generate), category dropdown, tags, author, publishedAt, draft toggle, cover (default asset or pick existing), **HTML body textarea + live preview**. Remove News/Comparison/Prompt/Tool/Review tabs. Buttons: Save draft (`draft: true`), Publish (`draft: false`), plus delete. All → `POST /api/publish`.
3. **`PublishedContentManager.tsx`** — load list via `GET /api/content`, open in editor, delete.
4. **`AdPlacementManager.tsx`** — port as-is (slots, visual/script modes, desktop/tablet/mobile script codes, sandbox toggle). Save → `POST /api/ads`.
5. **`IndexNowManager.tsx`** — display key + host, submit selected/all URLs → `POST /api/indexnow`.

**New dependency:** NodeHunt has no React today. Add `@astrojs/react`, `react`, `react-dom` (match the Astro 7-compatible versions) and register the `react()` integration in `astro.config.ts`.

**Styling the admin:** Stack Hive uses Tailwind v3 classes incl. a custom `brand-*` palette that doesn't exist in NodeHunt's Tailwind v4. Simplest: port a **scoped CSS file** (copy Stack Hive's admin styles + `brand` color values) so the panel renders as before without touching the site's Tailwind theme. Apply via `is:global` scoping under a `.admin-panel` wrapper or a dedicated stylesheet imported only on the admin page.

---

## 7. Blog rendering — pasted HTML must render styled

- Astro markdown passes raw HTML through by default (`allowHTML` is on; `astro.config.ts` doesn't disable it). A post file with an HTML body will render as-is, including any `<style>` block the AI emits.
- Port Stack Hive's **`.prose-custom` CSS overrides** (from `articles/[slug].astro`) into NodeHunt's `src/pages/articles/[slug].astro` so pasted classes (`text-slate-300`, `bg-slate-950`, `text-brand-400`, captions, code blocks, light/dark) look right.
- **Tailwind v4 scanning:** NodeHunt (Tailwind v4 via `@tailwindcss/vite`) auto-scans content files, so utility classes appearing literally in pasted HTML in `.md` bodies are generated. Verify one AI-generated post visually (dark + light).
- **Images in the HTML body:** remote URLs (Unsplash etc.) work as-is. Local uploads go to `public/images/` and are referenced as `/images/<file>.jpg`.
- **Cover image:** the schema uses `image()` (needs a local asset import). Editor default = existing `src/assets/content/nodehunt-cover.svg`; optional: upload to `src/assets/content/` via GitHub API.
- **Internal links** in pasted HTML: `/articles/<slug>/` — matches NodeHunt's route already.

---

## 8. Ads

- Port `AdSlot.astro` → NodeHunt (`src/components/AdSlot.astro`) with the same slot props (`header-banner`, `inline-article`, `sidebar`, `footer-cta`; extend if the site uses sticky/native).
- Ad config becomes a committed file `src/data/ads_store.json` (copy Stack Hive's), and `AdSlot` reads **from that file at build time** (not `MOCK_AD_PLACEMENTS`).
- Place `AdSlot` where Stack Hive had it: header (below nav), inline-article (in `articles/[slug].astro`), sidebar, footer.
- Ad Manager edits commit the JSON via `POST /api/ads` → rebuild → ads update live.
- Script-mode ads (Adsterra/AdSense JS) run fine on static/Cloudflare — plain script tags. Keep the sandboxed-iframe option.

---

## 9. Sitemap

- **Already automatic:** NodeHunt uses `@astrojs/sitemap` — `sitemap-index.xml` regenerates on every build/deploy. Nothing to port.
- Prereq: `PUBLIC_SITE_URL` must be the real domain (currently placeholder `nodehunt.example`).
- Check `public/robots.txt` references the sitemap URL.

---

## 10. IndexNow

- Generate a **new** 32-char hex key for the NodeHunt domain (e.g. via `openssl rand -hex 16`).
- Serve `public/indexnow-key.txt` containing the key.
- `INDEXNOW_KEY` env var + `PUBLIC_SITE_URL` env.
- After a successful publish commit, `functions/api/publish.ts` calls IndexNow with the new post URL (or the UI calls `/api/indexnow`). Keep `IndexNowManager` for manual submissions.
- Host in the payload = production domain.

---

## 11. Cleanup / consolidation

- **Delete the old Cloudflare Worker project** (the one with `Deploy command: npx wrangler deploy` — never deployed successfully) to avoid confusion. Keep the **Pages** git-integration project (`nodehunt.pages.dev`), which is live.
- Remove `wrangler.toml` from the repo (it was for the Worker experiment; Pages ignores it and it's now misleading).
- Decide on legacy CMS files: delete `public/admin/index.html` (pagescms redirect, broken) and `.pages.yml` (deprecated Pages CMS) — unless we keep `.pages.yml` for optional pagescms.org use. Recommendation: remove both; the new custom `/admin` replaces them.
- Keep Stack Hive repo as-is as reference (do not copy `node_modules`, `dist`, `.git`).

---

## 12. Phased implementation steps (tomorrow)

### Phase 1 — Foundation
- [ ] Create GitHub fine-grained PAT (Contents read/write on `lurek/NodeHunt`), note it (do not commit it).
- [ ] Generate IndexNow key; set env vars in Cloudflare Pages project: `PUBLIC_SITE_URL`, `GITHUB_TOKEN` (secret), `ADMIN_KEY` (secret), `INDEXNOW_KEY`.
- [ ] Add deps: `@astrojs/react`, `react`, `react-dom`; register `react()` in `astro.config.ts`.
- [ ] Create `functions/` with `publish.ts`, `content.ts`, `ads.ts`, `indexnow.ts` + a shared GitHub-commit helper (`functions/_lib/github.ts`).
- [ ] Local smoke test: run `npm run dev`, hit functions via Pages dev (`npx wrangler pages dev` or `npm run preview`), verify commit lands on a throwaway branch/repo.

### Phase 2 — Admin panel
- [ ] Port `PublisherAuth`, `ContentPublisherStudio` (article-only), `PublishedContentManager` into `src/components/admin/`.
- [ ] Add `src/pages/admin.astro` + scoped admin stylesheet (brand palette).
- [ ] Wire editor → `POST /api/publish`; manager → `GET /api/content`; delete → `POST /api/publish` (action delete).
- [ ] Live preview of HTML body in the editor.

### Phase 3 — Ads + IndexNow
- [ ] Copy `src/data/ads_store.json`; port `AdSlot.astro` reading the committed file; place slots in layout + article page.
- [ ] Port `AdPlacementManager` → `POST /api/ads`.
- [ ] Add `public/indexnow-key.txt`; port `IndexNowManager`; auto-submit after publish.
- [ ] Verify sitemap URL in `robots.txt` + `PUBLIC_SITE_URL`.

### Phase 4 — Styling & verification
- [ ] Port `.prose-custom` overrides into `articles/[slug].astro`.
- [ ] Create one AI-generated test post (HTML body, image, internal link) via the admin panel.
- [ ] `npm run build` + `npm run check` pass locally; verify page appears in `/articles/`, search, sitemap.
- [ ] Commit + push; Cloudflare rebuild; verify: post live, ads render, `/api/publish` commit works end-to-end, IndexNow returns 200/202.
- [ ] Test dark mode rendering of pasted HTML.

---

## 13. Verification checklist

- [ ] `npm run build` clean (astro build + pagefind), `npm run check` clean.
- [ ] `/admin` loads behind passcode; wrong passcode rejected.
- [ ] Create → draft → publish a post from the panel → commit appears on `main` → Cloudflare deploys → `/articles/<slug>/` live.
- [ ] Edit + delete a post via the panel.
- [ ] Pasted AI HTML renders fully styled (headings, images, code blocks, captions) in light + dark.
- [ ] Internal links in pasted HTML navigate correctly.
- [ ] Ads render at their slots; Ad Manager edit → rebuild → live.
- [ ] `sitemap-index.xml` includes the new post.
- [ ] IndexNow submission returns 200/202; `/indexnow-key.txt` is served.
- [ ] Search (pagefind) indexes the new post.

---

## 14. Open questions / things the user must bring tomorrow

1. **GitHub PAT** (fine-grained, Contents read+write on `lurek/NodeHunt`) — create it, paste it to me in-session (I'll set it as a Cloudflare secret; never commit it).
2. **Production domain** for NodeHunt (e.g. `nodehunt.pages.dev` or a custom domain) — drives `PUBLIC_SITE_URL`, IndexNow host, sitemap base.
3. Confirm dropping: prompts, tools, comparisons, news editor, models/topics hubs, subscribers/inquiries, Sanity.
4. Confirm removing legacy: `wrangler.toml`, old Worker project, `.pages.yml`, `public/admin/index.html`.
5. Admin access: OK with shared-secret passcode (env `ADMIN_KEY`) as the only auth layer?
6. Ads: keep all 8 slots, or only the 4 NodeHunt will actually use?

---

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Tailwind v4 vs pasted v3 classes | `.prose-custom` overrides cover theming; verify visually; fallback = add explicit CSS for common classes |
| React version compatibility with Astro 7 | Pin versions from Astro 7 docs (`@astrojs/react` latest) |
| GitHub API rate limits | Authenticated = 5000/hr; commits are per-action, fine |
| Commits appearing as the token owner | Acceptable; or add `author`/`committer` overrides in the commit payload |
| Pages Functions + output-dir deploy not picking up `functions/` | Confirm first deploy; `functions/` at repo root is auto-detected by Pages |
| Two projects named `nodehunt` (Worker vs Pages) | Delete the Worker project; keep Pages |
| Pagefind must re-run after post changes | Already part of `npm run build` |
