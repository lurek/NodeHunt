import { useMemo, useState } from 'react';
import { adminFetch } from '@/lib/admin';
import { slugifyTitle, type ParsedPost } from '@/lib/frontmatter';
import { ImagePicker } from './ImagePicker';

const CATEGORIES = ['news', 'tutorials', 'nodes', 'depin', 'wallet-guides', 'airdrops', 'comparisons', 'security', 'opinion', 'ai-crypto'];

function collectionFromPath(path: string): string {
  const parts = path.split('/');
  return parts[3] || 'news';
}

const DEFAULT_TEMPLATE = `<h2>Introduction</h2>
<p>Replace this with an intro paragraph of at least two sentences. Describe the topic and why it matters to the reader.</p>

<h2>Key Details</h2>
<p>Add the body of the article here. You can paste HTML or write plain paragraphs.</p>

<h3>Subsection</h3>
<p>Use subheadings to break up long sections.</p>

<div class="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 my-4">
  <pre><code>// Example code block
const answer = 42;</code></pre>
</div>

<h2>Conclusion</h2>
<p>Wrap up with a concise takeaway.</p>`;

export interface EditingPost {
  parsed: ParsedPost;
  path: string;
  sha?: string;
}

interface PostEditorProps {
  editing?: EditingPost | null;
  onBack: () => void;
  onChanged: () => void;
}

export function PostEditor({ editing, onBack, onChanged }: PostEditorProps) {
  const initial = editing?.parsed;
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [collection, setCollection] = useState(collectionFromPath(editing?.path || ''));
  const [category, setCategory] = useState(initial?.category || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [author, setAuthor] = useState(initial?.author || 'nodehunt-editorial');
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt || new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState(initial?.draft ?? true);
  const [cover, setCover] = useState(initial?.coverImage || '../../../assets/content/nodehunt-cover.svg');
  const [coverAlt, setCoverAlt] = useState(initial?.coverAlt || 'NodeHunt default cover graphic');
  const [body, setBody] = useState(initial?.body || DEFAULT_TEMPLATE);

  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; url?: string } | null>(null);

  const extraYaml = editing?.parsed.extraYaml || [];
  const currentPath = editing?.path || '';

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugifyTitle(value));
  }

  function onAutoSlug() {
    setSlug(slugifyTitle(title));
    setSlugTouched(true);
  }

  const tagList = useMemo(() => tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6), [tags]);
  const descriptionLen = description.length;

  async function save() {
    setBusy(true);
    setMessage(null);
    const action = currentPath ? 'update' : 'create';
    const payload = {
      action,
      title,
      description,
      slug,
      collection,
      category,
      tags: tagList,
      author,
      publishedAt,
      draft,
      coverImage: cover,
      coverAlt,
      bodyHtml: body,
      ...(currentPath ? { fileSha: editing?.sha, originalPath: currentPath, extraYaml: extraYaml.join('\n') } : {}),
    };
    const res = await adminFetch('/api/publish', { method: 'POST', body: JSON.stringify(payload) });
    setBusy(false);
    if (res.ok && res.data) {
      const d = res.data as any;
      setMessage({
        ok: true,
        text: d.message || 'Saved',
        url: d.url,
      });
      onChanged();
    } else {
      setMessage({ ok: false, text: res.error || 'Save failed' });
    }
  }

  async function remove() {
    if (!currentPath) return;
    if (!window.confirm(`Delete "${title}"?\nThis removes the post file from the repo.`)) return;
    setBusy(true);
    setMessage(null);
    const res = await adminFetch('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', slug, collection }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage({ ok: true, text: `Deleted ${slug}` });
      onChanged();
      onBack();
    } else {
      setMessage({ ok: false, text: res.error || 'Delete failed' });
    }
  }

  return (
    <div className="admin-editor">
      <div className="admin-editor-head">
        <button className="admin-btn" onClick={onBack}>← All posts</button>
        <h2>{currentPath ? `Editing ${currentPath}` : 'New post'}</h2>
      </div>

      <div className="admin-grid">
        <div className="admin-form">
          <label className="admin-label">
            Title <span className="admin-req">10–110 chars</span>
            <input className="admin-input" value={title} onChange={(e) => onTitleChange(e.target.value)} />
          </label>

          <label className="admin-label">
            Slug
            <div className="admin-row">
              <input className="admin-input" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugTouched(true); }} />
              <button type="button" className="admin-btn" onClick={onAutoSlug} title="Generate from title">Auto</button>
            </div>
          </label>

          <div className="admin-row">
            <label className="admin-label">
              Collection (folder)
              <select className="admin-input" value={collection} onChange={(e) => setCollection(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="admin-label">
              Category (taxonomy slug)
              <input className="admin-input" value={category} onChange={(e) => setCategory(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))} placeholder="web3-nodes" />
            </label>
          </div>

          <div className="admin-row">
            <label className="admin-label">
              Author slug
              <input className="admin-input" value={author} onChange={(e) => setAuthor(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))} />
            </label>
            <label className="admin-label">
              Published date
              <input className="admin-input" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            </label>
          </div>

          <label className="admin-label">
            Description <span className="admin-req">50–180 chars · {descriptionLen}</span>
            <textarea className="admin-input admin-textarea-sm" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>

          <div className="admin-row">
            <label className="admin-label">
              Tags <span className="admin-req">1–6, comma separated</span>
              <input className="admin-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nodes, solana, airdrop" />
            </label>
          </div>

          <label className="admin-label admin-checkbox">
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
            Save as draft (hidden from the site)
          </label>

          <div className="admin-fieldset">
            <span className="admin-label">Cover image</span>
            <ImagePicker value={cover} onChange={setCover} />
            <label className="admin-label">
              Cover alt text <span className="admin-req">min 8 chars</span>
              <input className="admin-input" value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="admin-form">
          <div className="admin-tabs">
            <button type="button" className={`admin-tab ${tab === 'write' ? 'admin-tab-active' : ''}`} onClick={() => setTab('write')}>Write HTML</button>
            <button type="button" className={`admin-tab ${tab === 'preview' ? 'admin-tab-active' : ''}`} onClick={() => setTab('preview')}>Preview</button>
          </div>
          {tab === 'write' ? (
            <textarea
              className="admin-input admin-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste or write article HTML here…"
              spellCheck={false}
            />
          ) : (
            <div className="admin-preview" dangerouslySetInnerHTML={{ __html: body }} />
          )}
        </div>
      </div>

      {message && <p className={message.ok ? 'admin-success' : 'admin-error'}>{message.text} {message.url && <a href={message.url} target="_blank" rel="noreferrer">View post ↗</a>}</p>}

      <div className="admin-actions">
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Publishing…' : currentPath ? 'Save changes' : 'Publish post'}
        </button>
        {currentPath && (
          <button className="admin-btn admin-btn-danger" onClick={remove} disabled={busy}>
            Delete
          </button>
        )}
        <span className="admin-hint">Publishing commits the post to GitHub, which triggers a site rebuild (~1–3 min).</span>
      </div>
    </div>
  );
}
