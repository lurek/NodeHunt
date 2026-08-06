import { useEffect, useState, type ChangeEvent } from 'react';
import { adminFetch } from '@/lib/admin';

const REF_PREFIX = '../../../assets/content/';

interface ImagePickerProps {
  value: string;
  onChange: (ref: string) => void;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const res = await adminFetch<{ images: string[] }>('/api/content?images=1');
    if (res.ok && res.data) setImages(res.data.images || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
    setUploading(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const res = await adminFetch<{ ref: string }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: name, base64 }),
      });
      if (res.ok && res.data) {
        onChange(res.data.ref);
        setImages((prev) => [...new Set([name, ...prev])].sort());
      } else {
        setError(res.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const current = value.startsWith(REF_PREFIX) ? value.slice(REF_PREFIX.length) : '';

  return (
    <div className="admin-picker">
      <div className="admin-picker-grid">
        <button
          type="button"
          className={`admin-picker-item ${current === '' ? 'admin-picker-selected' : ''}`}
          onClick={() => onChange(REF_PREFIX + 'nodehunt-cover.svg')}
          title="Default cover"
        >
          <span className="admin-picker-placeholder">Default</span>
        </button>
        {images.map((name) => (
          <button
            type="button"
            key={name}
            className={`admin-picker-item ${current === name ? 'admin-picker-selected' : ''}`}
            onClick={() => onChange(REF_PREFIX + name)}
            title={name}
          >
            <img src={`https://raw.githubusercontent.com/lurek/NodeHunt/main/src/assets/content/${encodeURIComponent(name)}`} alt={name} loading="lazy" />
            <span className="admin-picker-name">{name}</span>
          </button>
        ))}
      </div>
      <div className="admin-picker-upload">
        <label className="admin-btn">
          {uploading ? 'Uploading…' : 'Upload new image'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={upload} disabled={uploading} hidden />
        </label>
        <span className="admin-hint">PNG, JPG, WEBP, GIF or SVG up to 6MB. Saved to the repo, then published with the post.</span>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {current && (
        <p className="admin-hint">
          Selected: <code>{current}</code>
        </p>
      )}
    </div>
  );
}
