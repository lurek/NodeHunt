import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin';
import { AD_CODE_KEYS, AD_SLOT_KEYS } from '@/config/ads';

const SLOT_NOTES: Record<string, string> = {
  topBanner: 'Top of page · 728x90 → 468x90 → 320x50 · hidden below 728px so the sticky takes over',
  sidebar: 'Sidebar · 728x90 → 468x90 → 320x50',
  inlineArticle: 'Inside content · 728x90 → 468x90 → 320x50',
  bottomBanner: 'End of article · 728x90 → 468x90 → 320x50',
  footer: 'Above footer · 728x90 → 468x90 → 320x50',
  stickyBottom: 'Fixed bottom bar · native banner on desktop, banner on smaller screens',
};

const CODE_NOTES: Record<string, string> = {
  popunder: 'Adsterra Popunder JS tag (place above </head>)',
  socialbar: 'Adsterra Social Bar JS tag (place above </body>)',
  nativeBanner: 'Adsterra Native Banner JS tag (sticky, desktop)',
  banner728x90: 'Banner 728x90 JS tag',
  banner468x90: 'Banner 468x90 JS tag',
  banner320x50: 'Banner 320x50 JS tag',
};

interface AdsStore {
  enabled: boolean;
  provider: string;
  sandboxNative: boolean;
  socialbarAfterAds: boolean;
  codes: Record<string, string>;
  slots: Record<string, { enabled: boolean }>;
}

const EMPTY: AdsStore = {
  enabled: false,
  provider: 'adsterra',
  sandboxNative: false,
  socialbarAfterAds: false,
  codes: Object.fromEntries(AD_CODE_KEYS.map((key) => [key, ''])),
  slots: Object.fromEntries(AD_SLOT_KEYS.map((slot) => [slot, { enabled: false }])),
};

export function AdManager() {
  const [config, setConfig] = useState<AdsStore>(EMPTY);
  const [sha, setSha] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminFetch<{ config: AdsStore | null; sha: string | null }>('/api/ads').then((res) => {
      if (res.ok && res.data) {
        if (res.data.config) {
          const merged = { ...EMPTY, ...res.data.config, codes: { ...EMPTY.codes, ...(res.data.config.codes ?? {}) }, slots: { ...EMPTY.slots, ...(res.data.config.slots ?? {}) } };
          setConfig(merged);
        }
        setSha(res.data.sha ?? undefined);
      } else {
        setMessage({ ok: false, text: res.error || 'Failed to load ads config' });
      }
      setLoaded(true);
    });
  }, []);

  function setCode(key: string, value: string) {
    setConfig((prev) => ({ ...prev, codes: { ...prev.codes, [key]: value } }));
  }

  function toggleSlot(slot: string) {
    setConfig((prev) => ({ ...prev, slots: { ...prev.slots, [slot]: { enabled: !prev.slots[slot]?.enabled } } }));
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
        <h2>Ad placements (Adsterra)</h2>
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save config'}</button>
      </div>
      {message && <p className={message.ok ? 'admin-success' : 'admin-error'}>{message.text}</p>}

      <div className="admin-form">
        <label className="admin-label admin-checkbox">
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
          Enable ads sitewide
        </label>
        <label className="admin-label">
          Provider
          <input className="admin-input" value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value })} placeholder="adsterra" />
        </label>
        <p className="admin-hint">Paste the Adsterra JavaScript tags below. Banners swap responsively: 728x90 on wide screens, 468x90 on medium, 320x50 on small. The sticky bottom bar shows the native banner on desktop and a banner on smaller screens.</p>
      </div>

      <div className="admin-section">
        <h3>Ad safety &amp; timing</h3>
        <label className="admin-label admin-checkbox">
          <input type="checkbox" checked={Boolean(config.sandboxNative)} onChange={(e) => setConfig({ ...config, sandboxNative: e.target.checked })} />
          Sandbox native ads
        </label>
        <p className="admin-hint">Renders native ads inside an isolated iframe (<code>sandbox="allow-scripts allow-popups"</code>) so third-party scripts cannot navigate the page or touch cookies/localStorage. Disable if a specific ad network refuses to render sandboxed.</p>
        <label className="admin-label admin-checkbox">
          <input type="checkbox" checked={Boolean(config.socialbarAfterAds)} onChange={(e) => setConfig({ ...config, socialbarAfterAds: e.target.checked })} />
          Load social bar last
        </label>
        <p className="admin-hint">Defers the social bar until after every other ad slot has loaded, so it never blocks or delays the banners above the fold.</p>
      </div>

      <div className="admin-section">
        <h3>Adsterra JS codes</h3>
        {AD_CODE_KEYS.map((key) => (
          <label key={key} className="admin-label">
            {key}
            <textarea className="admin-input admin-textarea" rows={key === 'popunder' || key === 'socialbar' ? 5 : 4} value={config.codes[key] ?? ''} onChange={(e) => setCode(key, e.target.value)} placeholder={`<script async="async" ...>`} />
            <small className="admin-hint">{CODE_NOTES[key]}</small>
          </label>
        ))}
      </div>

      <div className="admin-section">
        <h3>Placements</h3>
        <div className="admin-slot-grid">
          {AD_SLOT_KEYS.map((slot) => (
            <label key={slot} className="admin-slot">
              <input type="checkbox" checked={Boolean(config.slots[slot]?.enabled)} onChange={() => toggleSlot(slot)} />
              <span>
                <strong>{slot}</strong>
                <small>{SLOT_NOTES[slot]}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
