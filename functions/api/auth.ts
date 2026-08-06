import { json, requireAdmin, onOptions } from '../_lib/helpers';

export const onRequestOptions = onOptions;

export const onRequestGet = (context: any) => {
  if (!requireAdmin(context)) return json({ error: 'Unauthorized' }, 401);
  return json({ ok: true });
};
