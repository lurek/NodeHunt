export interface ParsedPost {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  draft: boolean;
  author: string;
  category: string;
  tags: string[];
  coverImage: string;
  coverAlt: string;
  coverCaption?: string;
  body: string;
  /** Frontmatter lines that the admin does not manage, preserved verbatim on save. */
  extraYaml: string[];
}

function stripScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      return String(parsed);
    } catch {
      return trimmed.slice(1, trimmed.length - 1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
  return trimmed;
}

function parseTags(value: string): string[] {
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((tag) => stripScalar(tag))
    .filter(Boolean)
    .slice(0, 6);
}

function parseInlineObject(value: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const re = /([a-zA-Z0-9_]+):\s*(?:'([^']*)'|"([^"]*)"|([^,}]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    fields[m[1]] = m[2] ?? m[3] ?? String(m[4] ?? '').trim();
  }
  return fields;
}

export function parsePostFile(content: string): ParsedPost | null {
  const parts = content.split(/^---\s*$/m);
  if (parts.length < 3) return null;

  const frontmatter = parts[1];
  const body = parts.slice(2).join('---').trim();

  const result: ParsedPost = {
    title: '',
    description: '',
    slug: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    draft: true,
    author: '',
    category: '',
    tags: [],
    coverImage: '../../../assets/content/nodehunt-cover.svg',
    coverAlt: 'NodeHunt default cover graphic',
    body,
    extraYaml: [],
  };

  const coverKey = (s: string) => s.trim().startsWith('image:') || s.trim().startsWith('alt:') || s.trim().startsWith('caption:');

  for (const rawLine of frontmatter.split('\n')) {
    const line = rawLine.trim();
    if (!line || line === '---') continue;

    const indent = rawLine.length - rawLine.trimStart().length;
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!match) {
      result.extraYaml.push(rawLine);
      continue;
    }

    const [key, value] = [match[1], match[2]];
    if (indent > 0 && coverKey(rawLine)) {
      if (line.startsWith('image:')) result.coverImage = stripScalar(value);
      else if (line.startsWith('alt:')) result.coverAlt = stripScalar(value);
      else if (line.startsWith('caption:')) result.coverCaption = stripScalar(value);
      else result.extraYaml.push(rawLine);
      continue;
    }

    switch (key) {
      case 'cover':
        {
          const fields = parseInlineObject(value);
          if (fields.image) result.coverImage = fields.image;
          if (fields.alt) result.coverAlt = fields.alt;
          if (fields.caption) result.coverCaption = fields.caption;
        }
        break;
      case 'title':
        result.title = stripScalar(value);
        break;
      case 'description':
        result.description = stripScalar(value);
        break;
      case 'slug':
        result.slug = stripScalar(value);
        break;
      case 'publishedAt':
        result.publishedAt = stripScalar(value).slice(0, 10);
        break;
      case 'draft':
        result.draft = value.trim() !== 'false';
        break;
      case 'author':
        result.author = stripScalar(value);
        break;
      case 'category':
        result.category = stripScalar(value);
        break;
      case 'tags':
        result.tags = parseTags(value);
        break;
      default:
        result.extraYaml.push(rawLine);
    }
  }

  return result;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
