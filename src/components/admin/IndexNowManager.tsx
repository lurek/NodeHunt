import { useState } from 'react';
import { adminFetch } from '@/lib/admin';

export function IndexNowManager() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; statusCode?: number } | null>(null);

  async function submit() {
    const urlList = input
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 50);
    if (urlList.length === 0) return;
    setBusy(true);
    setResult(null);
    const res = await adminFetch<{ success: boolean; statusCode: number; message: string }>('/api/indexnow', {
      method: 'POST',
      body: JSON.stringify({ urlList }),
    });
    setBusy(false);
    if (res.ok && res.data) {
      setResult({ success: res.data.success, message: res.data.message, statusCode: res.data.statusCode });
    } else {
      setResult({ success: false, message: res.error || 'Request failed' });
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-editor-head">
        <h2>IndexNow</h2>
        <button className="admin-btn admin-btn-primary" onClick={submit} disabled={busy || !input.trim()}>
          {busy ? 'Submitting…' : 'Submit to IndexNow'}
        </button>
      </div>
      <p className="admin-hint">Nudge Bing and Yandex to re-crawl updated URLs. One URL per line (or comma separated), up to 50. New publishes submit automatically.</p>
      <textarea
        className="admin-input admin-body"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={'/articles/my-post/\nhttps://nodehunt.pages.dev/articles/another-post/'}
        spellCheck={false}
      />
      {result && (
        <p className={result.success ? 'admin-success' : 'admin-error'}>
          {result.statusCode ? `HTTP ${result.statusCode} — ` : ''}{result.message}
        </p>
      )}
    </div>
  );
}
