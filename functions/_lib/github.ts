export const GITHUB_API = 'https://api.github.com';
export const OWNER = 'lurek';
export const REPO = 'NodeHunt';
export const BRANCH = 'main';

function encodePath(path: string): string {
  return path
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

function base64Encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'nodehunt-publisher',
  };
}

export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
}

export async function getFile(token: string, path: string): Promise<GitHubFile | null> {
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed (${res.status})`);
  return res.json();
}

export async function listDir(token: string, path: string): Promise<any[]> {
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodePath(path)}?ref=${BRANCH}`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub LIST ${path} failed (${res.status})`);
  return res.json();
}

export async function putFile(token: string, path: string, content: string, message: string, sha?: string): Promise<any> {
  const body: any = {
    message,
    content: base64Encode(content),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodePath(path)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub PUT ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

export async function deleteFile(token: string, path: string, sha: string, message: string): Promise<any> {
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${encodePath(path)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub DELETE ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}
