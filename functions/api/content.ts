import { getFile, listDir } from '../_lib/github';
import { json, onOptions } from '../_lib/helpers';
import { COLLECTIONS } from '../_lib/post';

export const onRequestOptions = onOptions;

function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export const onRequestGet = async (context: any) => {
  const env = context.env;
  const url = new URL(context.request.url);
  const file = url.searchParams.get('file');

  try {
    if (url.searchParams.get('images')) {
      const files = await listDir(env.GITHUB_TOKEN, 'src/assets/content');
      return json({
        images: files
          .filter((f: any) => f.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name))
          .map((f: any) => f.name)
          .sort(),
      });
    }

    if (file) {
      const existing = await getFile(env.GITHUB_TOKEN, file);
      if (!existing) return json({ error: 'File not found' }, 404);
      return json({ path: file, sha: existing.sha, content: decodeBase64(existing.content) });
    }

    const posts: Record<string, string[]> = {};
    for (const collection of COLLECTIONS) {
      const files = await listDir(env.GITHUB_TOKEN, `src/content/posts/${collection}`);
      posts[collection] = files
        .filter((f: any) => f.type === 'file' && (f.name.endsWith('.md') || f.name.endsWith('.mdx')))
        .map((f: any) => f.name);
    }
    return json({ posts });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to list content' }, 500);
  }
};
