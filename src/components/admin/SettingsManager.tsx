import { useState } from 'react';
import { adminFetch } from '@/lib/admin';

export function SettingsManager({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMessage(null);
    if (next.length < 8) {
      setMessage({ ok: false, text: 'New password must be at least 8 characters.' });
      return;
    }
    if (next !== confirm) {
      setMessage({ ok: false, text: 'New password and confirmation do not match.' });
      return;
    }
    setBusy(true);
    const res = await adminFetch('/api/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setBusy(false);
    if (res.ok && res.data) {
      setMessage({ ok: true, text: (res.data as { message?: string }).message || 'Password updated.' });
      setCurrent('');
      setNext('');
      setConfirm('');
      window.setTimeout(onPasswordChanged, 1200);
    } else {
      setMessage({ ok: false, text: res.error || 'Failed to update password' });
    }
  }

  return (
    <div className="admin-manager">
      <div className="admin-editor-head">
        <h2>Settings</h2>
      </div>

      <section className="admin-section">
        <h3>Change password</h3>
        <p className="admin-hint">The new password replaces the passcode used to unlock this panel. You will be signed out after saving.</p>
        <label className="admin-label">
          Current password
          <input className="admin-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </label>
        <label className="admin-label">
          New password <span className="admin-req">min 8 chars</span>
          <input className="admin-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="admin-label">
          Confirm new password
          <input className="admin-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </label>
        {message && <p className={message.ok ? 'admin-success' : 'admin-error'}>{message.text}</p>}
        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary" onClick={submit} disabled={busy || !current || !next || !confirm}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>
        <p className="admin-hint">Passwords are stored as a salted hash in <code>src/data/admin_password.json</code>. The Cloudflare <code>ADMIN_KEY</code> environment variable also still works — remove it from the dashboard if you want it disabled.</p>
      </section>
    </div>
  );
}
