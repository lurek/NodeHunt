import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin';

const SLOTS = ['topBanner', 'sidebar', 'inlineArticle', 'stickyMobile', 'bottomBanner', 'footer'] as const;

type SlotKey = (typeof SLOTS)[number];

interface SlotConfig {
  enabled: boolean;
  minHeight: number;
  maxWidth: number;
}

interface AdsConfig {
  enabled: boolean;
  provider: string;
  providerId: string;
  slots: Record<SlotKey, SlotConfig>;
}

const EMPTY: AdsConfig = {
  enabled: false,
  provider: '',
  providerId: '',
  slots: Object.fromEntries(
    SLOTS.map((slot) => [slot, { enabled: false, minHeight: slot === 'topBanner' ? 90 : slot === 'sidebar' ? 600 : slot === 'inlineArticle' ? 250 : slot === 'stickyMobile' ? 50 : 90, maxWidth: slot === 'topBanner' ? 970 : slot === 'sidebar' ? 300 : slot === 'stickyMobile' ? 360 : 728 }])
  ) as Record<SlotKey, SlotConfig>,
};

export function AdManager() {
  const [config, setConfig] = useState<AdsConfig>(EMPTY);
  const [sha, setSha] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminFetch<{ config: AdsConfig | null; sha: string | null }>('/api/ads').then((res) => {
      if (res.ok && res.data) {
        if (res.data.config) setConfig(res.data.config);
        setSha(res.data.sha ?? undefined);
      } else {
        setMessage({ ok: false, text: res.error || 'Failed to load ads config' });
      }
      setLoaded(true);
    });
  }, []);

  function toggleSlot(slot: SlotKey) {
    setConfig((prev) => ({ ...prev, slots: { ...prev.slots, [slot]: { ...prev.slots[slot], enabled: !prev.slots[slot].enabled } } }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const res = await adminFetch('/api/ads', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage({ ok: true, text: 'Ad config saved and committed. It will go live on the next rebuild.' });
    } else {
      setMessage({ ok: false, text: res.error || 'Save failed' });
    }
  }

  if (!loaded) return <p className="admin-hint">Loading ad config…</p>;

  return (
    <div className="admin-manager">
      <div className="admin-editor-head">
        <h2>Ad placements</h2>
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save config'}</button>
      </div>
      {message && <p className={message.ok ? 'admin-success' : 'admin-error'}>{message.text}</p>}

      <div className="admin-form">
        <label className="admin-label admin-checkbox">
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
          Enable ads sitewide
        </label>
        <div className="admin-row">
          <label className="admin-label">
            Provider
            <input className="admin-input" value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value })} placeholder="e.g. Ezoic, Monumetric, Mediavine" />
          </label>
          <label className="admin-label">
            Provider ID
            <input className="admin-input" value={config.providerId} onChange={(e) => setConfig({ ...config, providerId: e.target.value })} placeholder="Account / placement ID" />
          </label>
        </div>
        <p className="admin-hint">Ads only render when enabled AND a provider is set. Placeholder code is inserted at build time.</p>
      </div>

      <div className="admin-slot-grid">
        {SLOTS.map((slot) => (
          <label key={slot} className="admin-slot">
            <input type="checkbox" checked={config.slots[slot].enabled} onChange={() => toggleSlot(slot)} />
            <span>
              <strong>{slot}</strong>
              <small>{config.slots[slot].minHeight}×{config.slots[slot].maxWidth}px</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
