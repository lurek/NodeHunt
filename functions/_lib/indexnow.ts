import type { Env } from './helpers';

export async function submitUrls(env: Env, urlList: string[]): Promise<{ success: boolean; statusCode: number; statusText: string; submittedUrls: string[]; message: string }> {
  const baseUrl = (env.PUBLIC_SITE_URL || 'https://nodehunt.pages.dev').replace(/\/$/, '');
  const host = new URL(baseUrl).host;
  const payload = {
    host,
    key: env.INDEXNOW_KEY,
    keyLocation: `${baseUrl}/indexnow-key.txt`,
    urlList,
  };

  let response: Response;
  try {
    response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    return {
      success: false,
      statusCode: 0,
      statusText: 'network error',
      submittedUrls: urlList,
      message: `IndexNow request failed: ${err.message || String(err)}`,
    };
  }

  const isSuccess = response.status === 200 || response.status === 202;
  const responseText = await response.text().catch(() => '');

  return {
    success: isSuccess,
    statusCode: response.status,
    statusText: response.statusText,
    submittedUrls: urlList,
    message: isSuccess
      ? `URLs submitted to IndexNow (HTTP ${response.status})`
      : `IndexNow returned HTTP ${response.status}: ${responseText.slice(0, 300) || response.statusText}`,
  };
}
