import { getFile, putFile, deleteFile } from '../_lib/github';
import { json, requireAdminAsync, onOptions } from '../_lib/helpers';
import { validatePost, buildPostFile, postPath, PostValidationError, type PostInput } from '../_lib/post';
import { submitUrls } from '../_lib/indexnow';

export const onRequestOptions = onOptions;

export const onRequestGet = () => json({ status: 'publish endpoint active' });

export const onRequestPost = async (context: any) => {
  if (!(await requireAdminAsync(context))) return json({ error: 'Unauthorized' }, 401);
  const env = context.env;

  let input: PostInput;
  try {
    input = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = input.action || 'create';
  const envUrl = (env.PUBLIC_SITE_URL || 'https://nodehunt.pages.dev').replace(/\/$/, '');

  try {
    if (action === 'delete') {
      if (!input.collection || !input.slug) return json({ error: 'collection and slug are required for delete' }, 400);
      const path = postPath(input.collection, input.slug);
      const existing = await getFile(env.GITHUB_TOKEN, path);
      if (!existing) return json({ error: 'Post file not found' }, 404);
      await deleteFile(env.GITHUB_TOKEN, path, existing.sha, `Delete post ${input.slug}`);
      return json({ success: true, message: `Deleted ${path}` });
    }

    validatePost(input);

    const path = postPath(input.collection as string, input.slug as string);
    const movedFrom = input.originalPath && input.originalPath !== path ? input.originalPath : null;
    const existing = movedFrom
      ? await getFile(env.GITHUB_TOKEN, movedFrom)
      : action === 'update'
        ? await getFile(env.GITHUB_TOKEN, path)
        : null;
    const sha = input.fileSha || existing?.sha;

    if (action === 'update' && !existing) {
      return json({ error: 'Post file not found for update' }, 404);
    }

    const content = buildPostFile(input);
    await putFile(env.GITHUB_TOKEN, path, content, `Publish post ${input.slug}`, sha);

    if (movedFrom && existing) {
      await deleteFile(env.GITHUB_TOKEN, movedFrom, existing.sha, `Rename post → ${input.slug}`);
    }

    const postUrl = `${envUrl}/articles/${input.slug}/`;
    const indexnowResult = input.draft ? null : await submitUrls(env, [postUrl]);

    return json({
      success: true,
      message: `Post "${input.title}" published`,
      path,
      url: postUrl,
      movedFrom,
      indexnow: indexnowResult,
    });
  } catch (err: any) {
    if (err instanceof PostValidationError) return json({ error: err.message }, 400);
    return json({ error: err.message || 'Publish failed' }, 500);
  }
};
