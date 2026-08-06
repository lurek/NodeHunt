import { getFile, putFile } from '../_lib/github';
import { json, requireAdmin, onOptions } from '../_lib/helpers';

const ADS_PATH = 'src/data/ads_store.json';
const AD_SLOTS = ['topBanner', 'sidebar', 'inlineArticle', 'stickyMobile', 'bottomBanner', 'footer'];

function decodeUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export const onRequestOptions = onOptions;

export const onRequestGet = async (context: any) => {
  const env = context.env;
  try {
    const existing = await getFile(env.GITHUB_TOKEN, ADS_PATH);
    if (!existing) return json({ config: null, sha: null });
    return json({ config: JSON.parse(decodeUtf8(existing.content)), sha: existing.sha });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to read ads config' }, 500);
  }
};

export const onRequestPost = async (context: any) => {
  if (!requireAdmin(context)) return json({ error: 'Unauthorized' }, 401);
  const env = context.env;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const config = body.config;
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return json({ error: 'config object is required' }, 400);
  }
  if (typeof config.enabled !== 'boolean') return json({ error: 'config.enabled must be a boolean' }, 400);
  if (typeof config.provider !== 'string') return json({ error: 'config.provider must be a string' }, 400);
  if (config.providerId !== undefined && typeof config.providerId !== 'string') {
    return json({ error: 'config.providerId must be a string' }, 400);
  }
  if (!config.slots || typeof config.slots !== 'object') return json({ error: 'config.slots object is required' }, 400);
  for (const slot of AD_SLOTS) {
    const entry = config.slots[slot];
    if (!entry || typeof entry !== 'object' || typeof entry.enabled !== 'boolean') {
      return json({ error: `slot "${slot}" must have an enabled boolean` }, 400);
    }
  }

  try {
    const existing = await getFile(env.GITHUB_TOKEN, ADS_PATH);
    const serialized = JSON.stringify(
      {
        enabled: config.enabled,
        provider: config.provider,
        providerId: config.providerId ?? '',
        slots: Object.fromEntries(AD_SLOTS.map((slot) => [slot, config.slots[slot]])),
      },
      null,
      2
    );
    await putFile(env.GITHUB_TOKEN, ADS_PATH, serialized, 'Update ad config', existing?.sha);
    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to save ads config' }, 500);
  }
};
