const KEY_STORAGE = 'nodehunt_admin_key';

export function getAdminKey(): string {
  return sessionStorage.getItem(KEY_STORAGE) || '';
}

export function setAdminKey(key: string): void {
  if (key) sessionStorage.setItem(KEY_STORAGE, key);
  else sessionStorage.removeItem(KEY_STORAGE);
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function adminFetch<T = any>(path: string, init: RequestInit = {}, key = getAdminKey()): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(key ? { 'x-admin-key': key } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch (err) {
    return { ok: false, status: 0, data: null, error: 'Network error — check your connection' };
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    return { ok: false, status: res.status, data: null, error: data?.error || `Request failed (HTTP ${res.status})` };
  }
  return { ok: true, status: res.status, data: data as T };
}
