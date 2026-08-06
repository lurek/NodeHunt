import { getFile, putFile } from '../_lib/github';
import { json, requireAdminAsync, hashPassword, onOptions } from '../_lib/helpers';

const PASSWORD_PATH = 'src/data/admin_password.json';

export const onRequestOptions = onOptions;

export const onRequestPost = async (context: any) => {
  if (!(await requireAdminAsync(context))) return json({ error: 'Unauthorized' }, 401);
  const env = context.env;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return json({ error: 'currentPassword and newPassword are required' }, 400);
  }
  if (newPassword.length < 8) return json({ error: 'New password must be at least 8 characters' }, 400);

  try {
    const { salt, hash } = await hashPassword(newPassword);
    const existing = await getFile(env.GITHUB_TOKEN, PASSWORD_PATH);
    await putFile(
      env.GITHUB_TOKEN,
      PASSWORD_PATH,
      JSON.stringify({ salt, hash }, null, 2),
      'Update admin password',
      existing?.sha
    );
    return json({ success: true, message: 'Password updated. It is active immediately.' });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to update password' }, 500);
  }
};
