import { getFile } from './github';

export interface Env {
  GITHUB_TOKEN: string;
  ADMIN_KEY: string;
  PUBLIC_SITE_URL: string;
  INDEXNOW_KEY: string;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const PASSWORD_PATH = 'src/data/admin_password.json';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function decodeUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

async function matchesStoredPassword(env: Env, candidate: string): Promise<boolean> {
  if (!env.GITHUB_TOKEN || !candidate) return false;
  let file;
  try {
    file = await getFile(env.GITHUB_TOKEN, PASSWORD_PATH);
  } catch {
    return false;
  }
  if (!file) return false;
  try {
    const stored = JSON.parse(decodeUtf8(file.content)) as { salt?: string; hash?: string };
    if (!stored.salt || !stored.hash) return false;
    const hash = await sha256Hex(`${stored.salt}:${candidate}`);
    return hash === stored.hash;
  } catch {
    return false;
  }
}

/** Verifies a candidate admin key against the env ADMIN_KEY or the stored repo password hash. */
export async function requireAdminAsync(context: any): Promise<boolean> {
  const env = context.env as Env;
  const header = (context.request as Request).headers.get('x-admin-key') || '';
  if (!!env.ADMIN_KEY && header === env.ADMIN_KEY) return true;
  return matchesStoredPassword(env, header);
}

/** Generates a salted SHA-256 hash for a new password. */
export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hash = await sha256Hex(`${salt}:${password}`);
  return { salt, hash };
}

export async function onOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
