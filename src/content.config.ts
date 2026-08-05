import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = ({ image }: { image: () => ReturnType<typeof z.object> }) =>
  z.object({
    title: z.string().min(10).max(110),
    description: z.string().min(50).max(180),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(true),
    author: z.string(),
    category: z.string(),
    tags: z.array(z.string()).min(1).max(6),
    cover: z.object({ image: image(), alt: z.string().min(8), caption: z.string().optional() }),
    featured: z.boolean().default(false),
    editorPick: z.boolean().default(false),
    trendingScore: z.number().int().min(0).max(100).optional(),
    seo: z
      .object({
        title: z.string().max(70).optional(),
        description: z.string().max(180).optional(),
        canonical: z.string().url().optional(),
        noindex: z.boolean().default(false),
        ogImage: image().optional(),
        ogAlt: z.string().optional(),
      })
      .default({ noindex: false }),
    disclosure: z.string().optional(),
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    relatedSlugs: z.array(z.string()).max(4).optional(),
  });

const postCollection = (base: string) =>
  defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base }), schema: postSchema });

const authors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/authors' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(), slug: z.string(), role: z.string(), bio: z.string(), avatar: image().optional(),
      website: z.string().url().optional(), x: z.string().url().optional(), expertise: z.array(z.string()).default([]),
    }),
});
const taxonomySchema = z.object({ name: z.string(), slug: z.string(), description: z.string().optional() });
const categories = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/categories' }), schema: taxonomySchema });
const tags = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/tags' }), schema: taxonomySchema });
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string(), updatedAt: z.coerce.date(), noindex: z.boolean().default(false) }),
});

export const collections = {
  news: postCollection('./src/content/posts/news'),
  tutorials: postCollection('./src/content/posts/tutorials'),
  nodes: postCollection('./src/content/posts/nodes'),
  depin: postCollection('./src/content/posts/depin'),
  'wallet-guides': postCollection('./src/content/posts/wallet-guides'),
  airdrops: postCollection('./src/content/posts/airdrops'),
  comparisons: postCollection('./src/content/posts/comparisons'),
  security: postCollection('./src/content/posts/security'),
  opinion: postCollection('./src/content/posts/opinion'),
  'ai-crypto': postCollection('./src/content/posts/ai-crypto'),
  authors, categories, tags, pages,
};

export type PostCollection =
  | 'news' | 'tutorials' | 'nodes' | 'depin' | 'wallet-guides' | 'airdrops'
  | 'comparisons' | 'security' | 'opinion' | 'ai-crypto';

export const postCollections: PostCollection[] = [
  'news', 'tutorials', 'nodes', 'depin', 'wallet-guides', 'airdrops', 'comparisons', 'security', 'opinion', 'ai-crypto',
];
