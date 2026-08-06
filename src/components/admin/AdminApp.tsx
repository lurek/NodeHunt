import { useEffect, useState } from 'react';
import { setAdminKey } from '@/lib/admin';
import { AdminAuth } from './AdminAuth';
import { PostManager } from './PostManager';
import { PostEditor, type EditingPost } from './PostEditor';
import { AdManager } from './AdManager';
import { IndexNowManager } from './IndexNowManager';
import { SettingsManager } from './SettingsManager';

type Tab = 'posts' | 'ads' | 'indexnow' | 'settings';
type Theme = 'dark' | 'light';

const THEME_STORAGE = 'nodehunt_admin_theme';

function initialTheme(): Theme {
  try {
    return (document.documentElement.dataset.adminTheme as Theme) || 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.adminTheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE, theme);
  } catch {
    /* ignore */
  }
}

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');
  const [screen, setScreen] = useState<'list' | 'editor'>('list');
  const [editing, setEditing] = useState<EditingPost | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    setAuthed(Boolean(sessionStorage.getItem('nodehunt_admin_key')));
    setTheme(initialTheme());
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

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }

  function openEditor(editingPost: EditingPost | null) {
    setEditing(editingPost);
    setScreen('editor');
  }

  function closeEditor() {
    setScreen('list');
    setEditing(null);
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <strong className="admin-logo">NodeHunt<span>Publisher</span></strong>
          <nav className="admin-nav">
            <button className={`admin-tab ${tab === 'posts' ? 'admin-tab-active' : ''}`} onClick={() => { setTab('posts'); closeEditor(); }}>Posts</button>
            <button className={`admin-tab ${tab === 'ads' ? 'admin-tab-active' : ''}`} onClick={() => setTab('ads')}>Ads</button>
            <button className={`admin-tab ${tab === 'indexnow' ? 'admin-tab-active' : ''}`} onClick={() => setTab('indexnow')}>IndexNow</button>
            <button className={`admin-tab ${tab === 'settings' ? 'admin-tab-active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
          </nav>
          <div className="admin-bar-actions">
            <button className="admin-btn admin-theme-toggle" onClick={toggleTheme} title="Toggle color theme">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <a className="admin-btn" href="/" target="_blank" rel="noreferrer">View site ↗</a>
            <button className="admin-btn" onClick={logout}>Lock</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {tab === 'posts' && (screen === 'editor' ? (
          <PostEditor editing={editing} onBack={closeEditor} onChanged={() => { closeEditor(); setReloadKey((k) => k + 1); }} />
        ) : (
          <PostManager key={reloadKey} onEdit={(post) => openEditor(post)} onNew={() => openEditor(null)} />
        ))}
        {tab === 'ads' && <AdManager />}
        {tab === 'indexnow' && <IndexNowManager />}
        {tab === 'settings' && <SettingsManager onPasswordChanged={logout} />}
      </main>
    </div>
  );
}
