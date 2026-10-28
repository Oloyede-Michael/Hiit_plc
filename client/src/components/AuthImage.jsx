import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Loads an attachment (optionally with the admin token) and renders it as an image.
export default function AuthImage({ path, auth, alt, className }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let url;
    let alive = true;
    api.get(path, { auth, blob: true })
      .then((b) => { if (alive) { url = URL.createObjectURL(b); setSrc(url); } })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [path, auth]);
  if (failed) return <div className="text-xs text-muted">Preview unavailable.</div>;
  if (!src) return <div className={`animate-pulse bg-brand-50 ${className}`} style={{ minHeight: 120 }} />;
  return <img src={src} alt={alt} className={className} />;
}
