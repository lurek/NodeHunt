# Content guide

Write original, source-led educational content. Distinguish verified facts from analysis, use official sources for project claims, explain risks, and never promise returns. Use Markdown headings in order, descriptive links, meaningful image alt text, and disclosures for commercial relationships. Never request or publish seed phrases/private keys.

## Editorial components (MDX only)

Reusable editorial components are reserved for `.mdx` files; they are available automatically in rendered articles. Do not write raw HTML or scripts in content.

- `<Callout type="note|info|warning|danger" title="Optional">…</Callout>` — short emphasis blocks; keep them brief and factual.
- `<ProsCons pros={["…"]} cons={["…"]} />` — balanced pro/con lists; never use it to imply guaranteed outcomes.
- `<ComparisonTable headers={["A","B"]} rows={[["…","…"]]} caption="…" />` — side-by-side comparisons; keep cells short.
- `<FAQ items={[{ question: "…", answer: "…" }]} />` — plain-text questions/answers; do not put long prose or links in answers.
