import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, CircleCheck, Info, KeyRound, Lock, Upload, X, EyeOff, Scale, Clock3, ShieldAlert, FileText, Search } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtBytes } from '../lib/format.js';

const MAX = 10 * 1024 * 1024;
const OK_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

export default function Submit() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [meta, setMeta] = useState({ categories: [], centers: [], occurrence: {} });
  const [form, setForm] = useState({ categoryId: '', occurrence: 'last_24h', center: '', subject: '', narrative: '' });
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => { api.get('/categories').then(setMeta).catch(() => setErr('Could not load form options. Refresh the page.')); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function addFiles(list) {
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!OK_TYPES.includes(f.type)) { setErr(`“${f.name}” is not supported. Use PNG, JPG or PDF.`); continue; }
      next.push(f);
    }
    if (next.length > 5) { setErr('You can attach up to 5 files.'); return; }
    if (next.reduce((n, f) => n + f.size, 0) > MAX) { setErr('Attachments exceed the 10MB total limit.'); return; }
    setErr(''); setFiles(next);
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!form.categoryId) return setErr('Select an incident category.');
    if (form.subject.trim().length < 5) return setErr('Add a subject summary of at least 5 characters.');
    if (form.narrative.trim().length < 20) return setErr('Describe the incident in at least 20 characters.');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append('files', f));
    setBusy(true);
    try {
      const r = await api.post('/complaints', fd);
      nav('/submit/success', { state: r, replace: true });
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-6 pt-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-wider text-muted">PORTAL &gt; COMPLIANCE &gt; <span className="text-brand-700">NEW SUBMISSION</span></div>
        <span className="chip bg-brand-100 font-mono text-brand-800"><Lock size={11} /> SHA-256 ZERO IDENTIFIERS</span>
      </div>
      <div className="mono-label mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" />Direct ombudsman intake</div>
      <h1 className="text-3xl font-bold tracking-tight">Submit an Anonymous Complaint</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Your voice matters. HiiT PLC is committed to uncompromising operational standards, impartial review, and rigorous organizational accountability.</p>

      <div className="mt-6 flex gap-3 rounded-lg border-l-4 border-brand-700 bg-brand-100/70 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-brand-700" />
        <div>
          <div className="text-sm font-semibold">Anonymity Protection Protocol</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">Please <b className="text-red-600">do not include</b> your name, student ID, personal email, telephone numbers, or colleagues' identifiable attributes if you wish to remain strictly unlinked. Submissions are processed without browser fingerprinting, network logging, or account linkage.</p>
        </div>
      </div>

      <form onSubmit={submit} className="card mt-1 space-y-5 rounded-t-none p-6 sm:p-7" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="cat">Incident Category <span className="text-red-600">*</span></label>
            <div className="relative">
              <select id="cat" className="input appearance-none pr-9" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">Select category of incident</option>
                {meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
            <p className="field-hint">Ensures routing directly to the appropriate oversight committee.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="when">Occurrence Timeline <span className="font-normal text-muted">(Optional)</span></label>
            <div className="relative">
              <select id="when" className="input appearance-none pr-9" value={form.occurrence} onChange={set('occurrence')}>
                {Object.entries(meta.occurrence).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <CalendarDays size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
            <p className="field-hint">Helps verify relevant log segments without logging identity.</p>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="center">Training Center <span className="font-normal text-muted">(Optional)</span></label>
          <div className="relative">
            <select id="center" className="input appearance-none pr-9" value={form.center} onChange={set('center')}>
              <option value="">Not sure / Not applicable</option>
              {meta.centers.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="field-label" htmlFor="subject">Subject Summary <span className="text-red-600">*</span></label>
            <span className="font-mono text-[10px] text-muted">{form.subject.length}/120</span>
          </div>
          <input id="subject" className="input" maxLength={120} value={form.subject} onChange={set('subject')} placeholder="Brief summary of the issue or concern (e.g., Unresolved lab internet downtime in Hall B)" />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="field-label" htmlFor="narr">Detailed Incident Narrative <span className="text-red-600">*</span></label>
            <span className="text-[10px] text-muted">Neutral tone recommended</span>
          </div>
          <textarea id="narr" rows={6} maxLength={5000} className="input resize-y" value={form.narrative} onChange={set('narrative')} placeholder="Describe what happened, center/department location, and any relevant circumstances. Do not include personal identifying details such as student matric numbers, personal phone numbers, or private emails." />
          <p className="field-hint flex items-center gap-1.5"><Info size={12} className="text-brand-600" /> All narrative text is automatically stripped of hidden Unicode tracking markers.</p>
        </div>

        <div>
          <div className="field-label">Supporting Evidence <span className="font-normal text-muted">(Optional)</span></div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            className={`rounded-lg border-2 border-dashed px-4 py-7 text-center transition-colors ${drag ? 'border-brand-500 bg-brand-100' : 'border-brand-200 bg-brand-50/60'}`}
          >
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-md bg-brand-100 text-brand-700"><Upload size={17} /></span>
            <p className="mt-3 text-sm"><button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-brand-700 underline-offset-2 hover:underline">Click to browse</button> <span className="font-semibold">or drag and drop files here</span></p>
            <p className="mt-1 text-xs text-muted">Supported formats: PNG, JPG, PDF (Up to 10MB total)</p>
            <span className="chip mt-3 bg-brand-100 font-mono text-[10px] text-brand-800"><CircleCheck size={11} /> Automated EXIF &amp; GPS Metadata Scrubbing Enabled</span>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-brand-50 px-3 py-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-brand-700" /><span className="truncate">{f.name}</span><span className="text-muted">{fmtBytes(f.size)}</span></span>
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted hover:text-red-600"><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3 rounded-lg bg-brand-100/70 p-4">
          <KeyRound size={16} className="mt-0.5 shrink-0 text-brand-700" />
          <div>
            <div className="text-sm font-semibold">Permanent Case Key Generation</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">By submitting, a unique anonymous tracking token will be assigned to this report. Because we store no user contact details, <b className="text-ink">you must record that key</b> to monitor investigations or reply to ombudsman inquiries.</p>
          </div>
        </div>

        {err && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Link to="/track" className="flex items-center gap-2 text-xs text-muted hover:text-ink"><Search size={13} /> Already have a tracking code? Check status</Link>
          <button className="btn-primary w-full sm:w-auto sm:min-w-[260px]" disabled={busy}><Lock size={14} /> {busy ? 'Encrypting & submitting…' : 'Submit Complaint Anonymously'}</button>
        </div>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          [EyeOff, 'Zero Identification', 'No IP addresses, MAC IDs, or geolocation headers are recorded in audit database records.'],
          [Scale, 'Whistleblower Shield', 'Protected under HiiT Governance Charter, strictly forbidding institutional retaliation.'],
          [Clock3, '48-Hour Response SLA', 'Internal Compliance Review board begins triage assessment within two business days.'],
        ].map(([I, t, b]) => (
          <div key={t} className="card p-4"><span className="grid h-8 w-8 place-items-center rounded-md bg-brand-100 text-brand-700"><I size={15} /></span><div className="mt-3 text-sm font-semibold">{t}</div><p className="mt-1 text-xs leading-relaxed text-muted">{b}</p></div>
        ))}
      </div>
    </div>
  );
}
