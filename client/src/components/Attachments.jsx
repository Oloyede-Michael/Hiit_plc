import { Download, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import { api, downloadBlob } from '../lib/api.js';
import { fmtBytes } from '../lib/format.js';
import AuthImage from './AuthImage.jsx';

// `base` is the API path prefix: /track/REF/attachments or /admin/attachments
export default function Attachments({ items, base, auth, compact = false }) {
  if (!items.length) return null;
  async function view(a) {
    const blob = await api.get(`${base}/${a.id}`, { auth, blob: true });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  }
  if (compact) {
    return (
      <div className="mt-3 divide-y divide-line rounded-md border border-line">
        {items.map((a) => (
          <div key={a.id} className="flex min-w-0 items-center gap-3 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-brand-100 text-brand-700">
              {a.mime === 'application/pdf' ? <FileText size={15} /> : <ImageIcon size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{a.filename}</div>
              <div className="mt-0.5 text-[10px] text-muted">{a.mime.split('/')[1].toUpperCase()} · {fmtBytes(a.size)}</div>
            </div>
            <button type="button" onClick={() => view(a)} className="btn-soft shrink-0 !gap-1.5 !px-2.5 !py-1.5 text-[10px]">
              <Eye size={12} /> View
            </button>
            <button
              type="button"
              onClick={() => downloadBlob(`${base}/${a.id}?download=1`, a.filename, auth)}
              aria-label={`Download ${a.filename}`}
              className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted hover:bg-brand-100 hover:text-brand-700"
            >
              <Download size={13} />
            </button>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="mono-label !text-muted">Submitted attachments ({items.length})</div>
      <div className="mt-2 space-y-3">
        {items.map((a) => (
          <div key={a.id}>
            <div className="inline-flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-brand-700">{a.mime === 'application/pdf' ? <FileText size={15} /> : <ImageIcon size={15} />}</span>
              <div className="min-w-0"><div className="truncate text-xs font-semibold">{a.filename}</div><div className="text-[10px] text-muted">{a.mime.split('/')[1].toUpperCase()} • {fmtBytes(a.size)}</div></div>
              <button onClick={() => view(a)} aria-label={`Open ${a.filename}`} className="ml-2 text-muted hover:text-brand-700"><Eye size={15} /></button>
              <button onClick={() => downloadBlob(`${base}/${a.id}?download=1`, a.filename, auth)} aria-label={`Download ${a.filename}`} className="text-muted hover:text-brand-700"><Download size={15} /></button>
            </div>
            {a.mime.startsWith('image/') && <AuthImage path={`${base}/${a.id}`} auth={auth} alt={a.filename} className="mt-3 max-h-64 rounded-md border border-line" />}
          </div>
        ))}
      </div>
    </div>
  );
}
