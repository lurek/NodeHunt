import { useEffect, useState } from 'react';
import { setAdminKey } from '@/lib/admin';
import { AdminAuth } from './AdminAuth';
import { PostManager } from './PostManager';
import { PostEditor, type EditingPost } from './PostEditor';
import { AdManager } from './AdManager';
import { IndexNowManager } from './IndexNowManager';

type Tab = 'posts' | 'ads' | 'indexnow';

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState<EditingPost | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setAuthed(Boolean(sessionStorage.getItem('nodehunt_admin_key')));
  }, []);

  if (!authed) {
    return (
      <div className="admin">
        <AdminAuth onAuthed={() => setAuthed(true)} />
      </div>
    );
  }

  function logout() {
    setAdminKey('');
    setAuthed(false);
  }

  function startNew() {
    setEditing(null);
    setTab('posts');
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <strong className="admin-logo">NodeHunt<span>Publisher</span></strong>
          <nav className="admin-nav">
            <button className={`admin-tab ${tab === 'posts' ? 'admin-tab-active' : ''}`} onClick={() => { setTab('posts'); setEditing(null); }}>Posts</button>
            <button className={`admin-tab ${tab === 'ads' ? 'admin-tab-active' : ''}`} onClick={() => setTab('ads')}>Ads</button>
            <button className={`admin-tab ${tab === 'indexnow' ? 'admin-tab-active' : ''}`} onClick={() => setTab('indexnow')}>IndexNow</button>
          </nav>
          <div className="admin-bar-actions">
            <a className="admin-btn" href="/" target="_blank" rel="noreferrer">View site ↗</a>
            <button className="admin-btn" onClick={logout}>Lock</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {tab === 'posts' && (editing ? (
          <PostEditor editing={editing} onBack={() => setEditing(null)} onChanged={() => { setEditing(null); setReloadKey((k) => k + 1); }} />
        ) : (
          <PostManager key={reloadKey} onEdit={setEditing} onNew={startNew} />
        ))}
        {tab === 'ads' && <AdManager />}
        {tab === 'indexnow' && <IndexNowManager />}
      </main>
    </div>
  );
}
