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

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function requireAdmin(context: any): boolean {
  const env = context.env as Env;
  const header = (context.request as Request).headers.get('x-admin-key') || '';
  return !!env.ADMIN_KEY && header === env.ADMIN_KEY;
}

export async function onOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
