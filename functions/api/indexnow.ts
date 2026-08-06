import { json, requireAdminAsync, onOptions } from '../_lib/helpers';
import { submitUrls } from '../_lib/indexnow';

export const onRequestOptions = onOptions;

export const onRequestGet = () => json({ status: 'IndexNow endpoint active' });

export const onRequestPost = async (context: any) => {
  if (!(await requireAdminAsync(context))) return json({ error: 'Unauthorized' }, 401);
  const env = context.env;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const rawUrls: string[] = Array.isArray(body.urlList)
    ? body.urlList
    : body.url
      ? [body.url]
      : [];
  const baseUrl = (env.PUBLIC_SITE_URL || 'https://nodehunt.pages.dev').replace(/\/$/, '');

  const validUrls = rawUrls
    .map((u) => String(u).trim())
    .filter((u) => u.length > 0 && u.length < 2000)
    .slice(0, 50)
    .map((u) => (u.startsWith('http') ? u : `${baseUrl}${u.startsWith('/') ? '' : '/'}${u}`));

  if (validUrls.length === 0) return json({ error: 'No valid URLs provided' }, 400);

  const result = await submitUrls(env, validUrls);
  return json({ ...result, host: new URL(baseUrl).host, keyLocation: `${baseUrl}/indexnow-key.txt` });
};
