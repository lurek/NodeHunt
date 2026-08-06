import { getFile } from '../_lib/github';
import { json, requireAdmin, onOptions } from '../_lib/helpers';

export const onRequestOptions = onOptions;

const IMAGE_EXT_RE = /^[a-z0-9-]+\.(png|jpe?g|webp|gif|svg)$/i;
const MAX_BASE64_LENGTH = 8_000_000;

const MAGIC: Record<string, string[]> = {
  png: ['iVBORw0KGgo'],
  jpg: ['/9j/'],
  jpeg: ['/9j/'],
  webp: ['UklGR'],
  gif: ['R0lGOD'],
};

function matchesMagic(extension: string, base64: string): boolean {
  if (extension === 'svg') {
    try {
      return atob(base64).toLowerCase().includes('<svg');
    } catch {
      return false;
    }
  }
  return (MAGIC[extension] || []).some((prefix) => base64.startsWith(prefix));
}

export const onRequestPost = async (context: any) => {
  if (!requireAdmin(context)) return json({ error: 'Unauthorized' }, 401);
  const env = context.env;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const filename: string = String(body.filename || '').trim();
  const base64: string = String(body.base64 || '');
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (!IMAGE_EXT_RE.test(filename)) {
    return json({ error: 'Filename must be lowercase kebab-case with a png, jpg, jpeg, webp, gif, or svg extension' }, 400);
  }
  if (!base64 || base64.length < 100 || base64.length > MAX_BASE64_LENGTH) {
    return json({ error: 'Image data is missing, empty, or exceeds the 6MB limit' }, 400);
  }
  if (!matchesMagic(extension, base64)) {
    return json({ error: 'Image data does not match the file extension' }, 400);
  }

  const path = `src/assets/content/${filename}`;

  try {
    const existing = await getFile(env.GITHUB_TOKEN, path);
    if (existing) return json({ error: `Image "${filename}" already exists — rename it and try again` }, 409);

    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(`https://api.github.com/repos/lurek/NodeHunt/contents/${encoded}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nodehunt-publisher',
      },
      body: JSON.stringify({ message: `Upload image ${filename}`, content: base64, branch: 'main' }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Image upload failed (${res.status}): ${text.slice(0, 300)}`);
    }
    return json({ filename, path, ref: `../../../assets/content/${filename}` });
  } catch (err: any) {
    return json({ error: err.message || 'Upload failed' }, 500);
  }
};
