import { useState, type FormEvent } from 'react';
import { adminFetch, setAdminKey } from '@/lib/admin';

export function AdminAuth({ onAuthed }: { onAuthed: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await adminFetch('/api/auth', {}, key.trim());
    setBusy(false);
    if (res.ok) {
      setAdminKey(key.trim());
      onAuthed(key.trim());
    } else {
      setError(res.error || 'Invalid passcode');
    }
  }

  return (
    <form className="admin-auth" onSubmit={submit}>
      <h1>NodeHunt Publisher</h1>
      <p>Enter the admin passcode to manage posts, ads, and IndexNow.</p>
      <input
        type="password"
        className="admin-input"
        placeholder="Admin passcode"
        value={key}
        autoFocus
        onChange={(e) => setKey(e.target.value)}
      />
      {error && <p className="admin-error">{error}</p>}
      <button className="admin-btn admin-btn-primary" type="submit" disabled={busy || !key.trim()}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  );
}
