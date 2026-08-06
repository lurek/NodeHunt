import { json, requireAdminAsync, onOptions } from '../_lib/helpers';

export const onRequestOptions = onOptions;

export const onRequestGet = async (context: any) => {
  if (!(await requireAdminAsync(context))) return json({ error: 'Unauthorized' }, 401);
  return json({ ok: true });
};
