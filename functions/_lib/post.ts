export const COLLECTIONS = [
  'news',
  'tutorials',
  'nodes',
  'depin',
  'wallet-guides',
  'airdrops',
  'comparisons',
  'security',
  'opinion',
  'ai-crypto',
] as const;

export const DEFAULT_COVER_IMAGE = '../../../assets/content/nodehunt-cover.svg';
export const DEFAULT_COVER_ALT = 'NodeHunt default cover graphic';
export const DEFAULT_AUTHOR = 'nodehunt-editorial';

export interface PostInput {
  action: 'create' | 'update' | 'delete';
  title?: string;
  description?: string;
  slug?: string;
  /** Content collection folder: src/content/posts/<collection>/<slug>.md */
  collection?: string;
  /** Taxonomy slug written to frontmatter (independent of the collection folder). */
  category?: string;
  tags?: string[];
  author?: string;
  publishedAt?: string;
  draft?: boolean;
  coverImage?: string;
  coverAlt?: string;
  bodyHtml?: string;
  fileSha?: string;
  /** Original repo path when an existing post is edited (enables renames). */
  originalPath?: string;
  /** Unmanaged frontmatter lines preserved verbatim on edit. */
  extraYaml?: string;
}

export class PostValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostValidationError';
  }
}

export function postPath(collection: string, slug: string): string {
  return `src/content/posts/${collection}/${slug}.md`;
}

export function validatePost(input: PostInput): void {
  const { title, description, slug, collection, category, tags } = input;

  if (!title || typeof title !== 'string') throw new PostValidationError('title is required');
  if (title.length < 10 || title.length > 110) throw new PostValidationError('title must be 10-110 characters');

  if (!description || typeof description !== 'string') throw new PostValidationError('description is required');
  if (description.length < 50 || description.length > 180) throw new PostValidationError('description must be 50-180 characters');

  if (!slug || typeof slug !== 'string') throw new PostValidationError('slug is required');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new PostValidationError('slug must be lowercase kebab-case (a-z0-9 and hyphens)');

  if (!collection || !(COLLECTIONS as readonly string[]).includes(collection))
    throw new PostValidationError(`collection must be one of: ${COLLECTIONS.join(', ')}`);

  if (!category || typeof category !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category))
    throw new PostValidationError('category must be a lowercase taxonomy slug (a-z0-9 and hyphens)');

  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 6)
    throw new PostValidationError('tags must be an array of 1-6 items');

  if (input.coverAlt !== undefined && (typeof input.coverAlt !== 'string' || input.coverAlt.length < 8))
    throw new PostValidationError('cover alt must be at least 8 characters');

  if (input.bodyHtml === undefined || input.bodyHtml === null || input.bodyHtml.trim() === '')
    throw new PostValidationError('body HTML is required');
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

export function buildPostFile(input: PostInput): string {
  const tags = (input.tags || []).map((t) => JSON.stringify(t)).join(', ');
  const publishedAt = input.publishedAt ? input.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const coverImage = input.coverImage || DEFAULT_COVER_IMAGE;
  const coverAlt = input.coverAlt || DEFAULT_COVER_ALT;

  const frontmatter = [
    '---',
    `title: ${yamlString(input.title as string)}`,
    `description: ${yamlString(input.description as string)}`,
    `slug: ${yamlString(input.slug as string)}`,
    `publishedAt: "${publishedAt}"`,
    `draft: ${input.draft ? 'true' : 'false'}`,
    `author: ${yamlString(input.author || DEFAULT_AUTHOR)}`,
    `category: ${yamlString(input.category as string)}`,
    `tags: [${tags}]`,
    `cover: { image: ${JSON.stringify(coverImage)}, alt: ${yamlString(coverAlt)} }`,
    ...(input.extraYaml ? input.extraYaml.trim().split('\n').map((line) => line.trim()) : []),
    '---',
    '',
  ];

  return frontmatter.join('\n') + (input.bodyHtml as string).trim() + '\n';
}
