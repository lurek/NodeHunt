import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { postCollections, type PostCollection } from '@/content.config';

export type Post = CollectionEntry<PostCollection>;
export type PageDocument = CollectionEntry<'pages'>;

export interface AuthorSummary {
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: ImageMetadata;
  website?: string;
  x?: string;
  expertise: string[];
  url: string;
}

export interface CategorySummary {
  slug: string;
  name: string;
  description?: string;
  url: string;
}

export interface TagSummary {
  slug: string;
  name: string;
  description?: string;
  url: string;
}

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  updatedAt?: Date;
  cover: { image: ImageMetadata; alt: string; caption?: string };
  author: AuthorSummary;
  category: CategorySummary;
  tags: TagSummary[];
  readingTime: number;
  featured: boolean;
  editorPick: boolean;
  trendingScore?: number;
  disclosure?: string;
  sources: { label: string; url: string }[];
  relatedSlugs: string[];
  visible: boolean;
  collection: PostCollection;
  headings?: { depth: number; slug: string; text: string }[];
}

export interface TaxonomyLookup {
  authors: Map<string, AuthorSummary>;
  categories: Map<string, CategorySummary>;
  tags: Map<string, TagSummary>;
}

export async function getPublishedPosts(): Promise<Post[]> {
  const groups = await Promise.all(postCollections.map((collection) => getCollection(collection, ({ data }) => !data.draft)));
  return groups.flat().sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()) as Post[];
}

export async function getPageDocument(slug: string): Promise<PageDocument> {
  const page = await getEntry('pages', slug);
  if (!page) {
    throw new Error(`Page document not found: ${slug}`);
  }
  return page;
}

export function postUrl(slug: string): string {
  return `/articles/${slug}/`;
}

export function categoryUrl(slug: string): string {
  return `/category/${slug}/`;
}

export function tagUrl(slug: string): string {
  return `/tag/${slug}/`;
}

export function authorUrl(slug: string): string {
  return `/author/${slug}/`;
}

export function humanize(slug: string): string {
  return slug.replaceAll('-', ' ');
}

export function readingTime(body: string): number {
  const words = body?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export async function getTaxonomyLookup(): Promise<TaxonomyLookup> {
  const [authors, categories, tags] = await Promise.all([
    getCollection('authors'),
    getCollection('categories'),
    getCollection('tags'),
  ]);
  const toAuthors = authors.map((entry) => ({
    slug: entry.data.slug,
    name: entry.data.name,
    role: entry.data.role,
    bio: entry.data.bio,
    avatar: entry.data.avatar,
    website: entry.data.website,
    x: entry.data.x,
    expertise: entry.data.expertise ?? [],
    url: authorUrl(entry.data.slug),
  }));
  const toCategories = categories.map((entry) => ({
    slug: entry.data.slug,
    name: entry.data.name,
    description: entry.data.description,
    url: categoryUrl(entry.data.slug),
  }));
  const toTags = tags.map((entry) => ({
    slug: entry.data.slug,
    name: entry.data.name,
    description: entry.data.description,
    url: tagUrl(entry.data.slug),
  }));
  return {
    authors: new Map(toAuthors.map((author) => [author.slug, author])),
    categories: new Map(toCategories.map((category) => [category.slug, category])),
    tags: new Map(toTags.map((tag) => [tag.slug, tag])),
  };
}

export function toPostSummary(post: Post, taxonomy: TaxonomyLookup, headings?: PostSummary['headings']): PostSummary {
  const category =
    taxonomy.categories.get(post.data.category) ??
    ({ slug: post.data.category, name: humanize(post.data.category), url: categoryUrl(post.data.category) } as CategorySummary);
  const tags = post.data.tags.map((slug) => taxonomy.tags.get(slug) ?? ({ slug, name: humanize(slug), url: tagUrl(slug) } as TagSummary));
  const author =
    taxonomy.authors.get(post.data.author) ??
    ({ slug: post.data.author, name: humanize(post.data.author), expertise: [], url: authorUrl(post.data.author) } as AuthorSummary);
  return {
    slug: post.data.slug,
    title: post.data.title,
    description: post.data.description,
    url: postUrl(post.data.slug),
    publishedAt: post.data.publishedAt,
    updatedAt: post.data.updatedAt,
    cover: post.data.cover,
    author,
    category,
    tags,
    readingTime: readingTime(post.body),
    featured: post.data.featured,
    editorPick: post.data.editorPick,
    trendingScore: post.data.trendingScore,
    disclosure: post.data.disclosure,
    sources: post.data.sources,
    relatedSlugs: post.data.relatedSlugs ?? [],
    visible: !post.data.draft,
    collection: post.collection as PostCollection,
    headings,
  };
}

export async function getPublishedSummaries(taxonomy?: TaxonomyLookup, headingsBySlug?: Map<string, PostSummary['headings']>): Promise<PostSummary[]> {
  const lookup = taxonomy ?? (await getTaxonomyLookup());
  const posts = await getPublishedPosts();
  return posts.map((post) => toPostSummary(post, lookup, headingsBySlug?.get(post.data.slug)));
}

export function relatedPosts(post: PostSummary, all: PostSummary[]): PostSummary[] {
  const explicit = post.relatedSlugs ?? [];
  return all
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      candidate,
      score:
        (explicit.includes(candidate.slug) ? 100 : 0) +
        (candidate.category.slug === post.category.slug ? 10 : 0) +
        (candidate.collection === post.collection ? 4 : 0) +
        candidate.tags.filter((tag) => post.tags.some(({ slug }) => slug === tag.slug)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.publishedAt.valueOf() - a.candidate.publishedAt.valueOf())
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}
