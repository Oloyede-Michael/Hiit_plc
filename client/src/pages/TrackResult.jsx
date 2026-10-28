import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Gauge, LockKeyhole, MessageSquarePlus, ShieldCheck, UserRoundCheck, BadgeCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtFull } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Lifecycle from '../components/Lifecycle.jsx';
import Thread from '../components/Thread.jsx';
import Attachments from '../components/Attachments.jsx';

const PRIORITY = { standard: 'Standard Operational', high: 'High Priority', critical: 'Critical' };

export default function TrackResult() {
  const { ref } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = () => api.get(`/track/${ref}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { setData(null); setErr(''); load(); }, [ref]);

  async function send(e) {
    e.preventDefault();
    setBusy(true); setNote('');
    try {
      await api.post(`/track/${ref}/followup`, { body: text });
      setText(''); setOpen(false); setNote('Your information was added to the case.'); await load();
    } catch (e2) { setNote(e2.message); }
    finally { setBusy(false); }
  }

  if (err) return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <h1 className="text-2xl font-bold">Record not found</h1>
      <p className="mt-3 text-sm text-muted">{err}</p>
      <Link to="/track" className="btn-primary mt-6">Check another reference code</Link>
    </div>
  );
  if (!data) return <div className="mx-auto max-w-3xl animate-pulse px-5 py-10"><div className="h-40 rounded-xl bg-brand-100" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-5 pb-4 pt-6">
      <div className="flex items-center justify-between">
        <Link to="/track" className="flex items-center gap-2 text-xs font-semibold text-brand-700 hover:underline"><ArrowLeft size={14} /> Check another reference code</Link>
        <span className="chip bg-brand-100 py-1 text-[10px] text-brand-800"><BadgeCheck size={12} /> Cryptographically Verified Record</span>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-brand-100 font-mono text-brand-800">REF: {data.reference}</span>
            <span className="chip bg-slate-100 text-slate-600">{data.category}</span>
          </div>
          <StatusBadge status={data.status} dot />
        </div>
        <h1 className="mt-4 text-2xl font-bold leading-tight">{data.subject}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><Clock size={12} /> Submitted: {fmtFull(data.submittedAt)}</span>
          <span className="flex items-center gap-1.5"><UserRoundCheck size={12} /> 100% Anonymous Reporter</span>
          <span className="flex items-center gap-1.5"><Gauge size={12} /> Priority: {PRIORITY[data.priority]}</span>
        </div>
      </section>

      <Lifecycle status={data.status} events={data.events} />
      {note && <p role="status" className="rounded-md bg-brand-100 px-3 py-2 text-xs text-brand-800">{note}</p>}
      <Thread responses={data.responses} />

      <section className="card p-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Original Incident Submission</h2><span className="font-mono text-[10px] text-muted">Encrypted SHA-256</span></div>
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-brand-50 p-4 text-[13px] leading-relaxed text-ink/90">{data.narrative}</p>
        <Attachments items={data.attachments} base={`/track/${data.reference}/attachments`} auth={false} />
        <div className="mt-5 flex gap-3 rounded-md bg-brand-50 p-4">
          <LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand-700" />
          <div className="text-[11px] leading-relaxed text-muted"><b className="text-ink">Confidentiality Guarantee</b><br />This complaint reference ID (<code className="font-mono text-brand-700">{data.reference}</code>) is your sole access credential. Never disclose this token publicly. All responses and follow-ups are decoupled from any corporate employee identity or system ID.</div>
        </div>
      </section>

      <section className="rounded-lg bg-brand-100/60 p-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-xs text-muted"><ShieldCheck size={15} /> Need to supply additional evidence or dispute this response?</span>
          <button onClick={() => setOpen(!open)} className="btn-primary !py-2 text-xs"><MessageSquarePlus size={14} /> Provide Additional Info</button>
        </div>
        {open && (
          <form onSubmit={send} className="mt-4 space-y-3">
            <label htmlFor="fu" className="sr-only">Additional information</label>
            <textarea id="fu" rows={4} className="input !bg-white" required minLength={5} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add details or reply to the review team. Do not include personal identifiers." />
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost text-xs" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary text-xs" disabled={busy}>{busy ? 'Sending…' : 'Send anonymously'}</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
