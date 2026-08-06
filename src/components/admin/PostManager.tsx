import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin';
import { parsePostFile } from '@/lib/frontmatter';
import type { EditingPost } from './PostEditor';

interface PostManagerProps {
  onEdit: (post: EditingPost) => void;
  onNew: () => void;
}

export function PostManager({ onEdit, onNew }: PostManagerProps) {
  const [posts, setPosts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyPath, setBusyPath] = useState('');

  async function load() {
    setLoading(true);
    const res = await adminFetch<{ posts: Record<string, string[]> }>('/api/content');
    setLoading(false);
    if (res.ok && res.data) setPosts(res.data.posts || {});
    else setError(res.error || 'Failed to load posts');
  }

  useEffect(() => {
    load();
  }, []);

  async function edit(collection: string, filename: string) {
    const path = `src/content/posts/${collection}/${filename}`;
    setError('');
    const res = await adminFetch<{ content: string; sha: string }>(`/api/content?file=${encodeURIComponent(path)}`);
    if (!res.ok || !res.data) {
      setError(res.error || `Failed to load ${path}`);
      return;
    }
    const parsed = parsePostFile(res.data.content);
    if (!parsed) {
      setError(`Could not parse ${path}`);
      return;
    }
    onEdit({ parsed, path, sha: res.data.sha });
  }

  async function remove(collection: string, filename: string) {
    const slug = filename.replace(/\.mdx?$/, '');
    if (!window.confirm(`Delete "${slug}"? This removes the post from the repo.`)) return;
    setBusyPath(`${collection}/${filename}`);
    setError('');
    const res = await adminFetch('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', slug, collection }),
    });
    setBusyPath('');
    if (res.ok) load();
    else setError(res.error || 'Delete failed');
  }

  const entries = Object.entries(posts)
    .map(([collection, files]) => ({ collection, files: files.map((f) => ({ name: f, slug: f.replace(/\.mdx?$/, '') })) }))
    .filter(({ files }) => files.length > 0)
    .sort((a, b) => a.collection.localeCompare(b.collection));

  return (
    <div className="admin-manager">
      <div className="admin-editor-head">
        <h2>Posts</h2>
        <button className="admin-btn admin-btn-primary" onClick={onNew}>+ New post</button>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-hint">Loading posts…</p>}
      {!loading && entries.length === 0 && <p className="admin-hint">No posts yet. Create your first post.</p>}
      {entries.map(({ collection, files }) => (
        <section key={collection} className="admin-group">
          <h3>{collection} <span className="admin-count">{files.length}</span></h3>
          <table className="admin-table">
            <tbody>
              {files.map(({ name, slug }) => (
                <tr key={name}>
                  <td>
                    <a className="admin-post-link" href={`/articles/${slug}/`} target="_blank" rel="noreferrer">{slug}</a>
                  </td>
                  <td className="admin-table-actions">
                    <button className="admin-btn" onClick={() => edit(collection, name)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" disabled={busyPath === `${collection}/${name}`} onClick={() => remove(collection, name)}>
                      {busyPath === `${collection}/${name}` ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
