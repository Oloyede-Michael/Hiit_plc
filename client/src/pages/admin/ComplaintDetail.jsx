import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Check, CheckCircle2, Clock3, Download, Flag, History,
  LockKeyhole, MessageSquareText, Paperclip, Send, ShieldCheck,
} from 'lucide-react';
import { api, downloadBlob } from '../../lib/api.js';
import { fmtFull } from '../../lib/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import Thread from '../../components/Thread.jsx';
import Attachments from '../../components/Attachments.jsx';

const STATUS_LABEL = {
  new: 'New',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const PRIORITY_LABEL = {
  standard: 'Standard',
  high: 'High',
  critical: 'Critical',
};

const EVENT_STYLE = {
  new: 'bg-blue-600',
  under_review: 'bg-amber-600',
  in_progress: 'bg-brand-700',
  resolved: 'bg-emerald-600',
};

const STATUS_OPTIONS = [
  ['new', 'New'],
  ['under_review', 'Under Review'],
  ['in_progress', 'In Progress'],
  ['resolved', 'Resolved'],
];

const PRIORITY_OPTIONS = [
  ['standard', 'Standard'],
  ['high', 'High'],
  ['critical', 'Critical'],
];

export default function ComplaintDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState({ body: '', responder: 'Ethics & Governance Secretariat', nextStep: '' });
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/admin/complaints/${id}`, { auth: true }).then(setC).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]);

  async function patch(body, ok) {
    setMsg('');
    try {
      await api.patch(`/admin/complaints/${id}`, body, { auth: true });
      setMsg(ok);
      await load();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api.post(`/admin/complaints/${id}/responses`, reply, { auth: true });
      setReply({ ...reply, body: '', nextStep: '' });
      setMsg('Response published to the reporter’s tracking page.');
      await load();
    } catch (e2) {
      setMsg(e2.message);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p role="alert" className="text-sm text-red-600">{err}</p>;
  if (!c) return <div className="h-64 animate-pulse rounded-xl bg-brand-100" />;

  const eventDescription = (status) => ({
    new: 'Complaint received through the anonymous reporting portal.',
    under_review: 'Initial review recorded for this complaint.',
    in_progress: 'Complaint marked as in progress.',
    resolved: 'Complaint marked as resolved.',
  })[status] || 'Complaint status updated.';

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
            <ArrowLeft size={13} /> Back to Complaints Table
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-muted">Complaints</span>
            <span className="text-muted">/</span>
            <span className="chip bg-brand-100 font-mono text-brand-800">{c.reference}</span>
            <StatusBadge status={c.status} dot />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn-soft !py-2 text-xs">
            <Download size={13} /> Export Case File
          </button>
          <Link to={`/track/${encodeURIComponent(c.reference)}`} target="_blank" rel="noreferrer" className="btn-soft !py-2 text-xs">
            <ArrowUpRight size={13} /> Reporter Tracking Link
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3 sm:flex-row sm:items-center">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-100 text-brand-700"><ShieldCheck size={18} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold">Anonymous Submission Integrity</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            Reporter identity is not collected or stored. Reference tokens are used to access the tracking page.
          </p>
        </div>
        <div className="rounded-md border border-brand-200 bg-white px-3 py-1.5 font-mono text-[10px] text-brand-700">
          REFERENCE <span className="ml-1 font-bold">{c.reference}</span>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
        <div className="space-y-4">
          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="mono-label !text-[10px]">Incident Overview</span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted"><Clock3 size={12} /> Logged {fmtFull(c.submittedAt)}</span>
            </div>
            <h1 className="mt-2 text-lg font-bold leading-snug sm:text-xl">{c.subject}</h1>
            <p className="mt-1 text-xs leading-relaxed text-muted">{c.category}{c.center ? ` · ${c.center}` : ''}</p>
            <div className="mt-4 grid gap-3 rounded-md bg-brand-50 p-3 sm:grid-cols-4">
              <div>
                <div className="text-[10px] text-muted">Category</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-brand-600" />{c.category}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Training Center</div>
                <div className="mt-0.5 text-xs font-semibold">{c.center || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Priority Rating</div>
                <div className={`mt-0.5 text-xs font-semibold ${c.priority === 'critical' ? 'text-red-700' : c.priority === 'high' ? 'text-rose-700' : 'text-ink'}`}>
                  {PRIORITY_LABEL[c.priority] || 'Standard'}{c.escalated ? ' · Escalated' : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted">Current State</div>
                <div className="mt-0.5"><StatusBadge status={c.status} /></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span className="font-semibold text-ink">First-response target:</span>
              <span>{c.sla.label}</span>
              {c.escalated && <span className="chip bg-rose-100 text-rose-800"><Flag size={10} /> Escalated</span>}
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><MessageSquareText size={14} className="text-brand-700" /> Anonymous Submission Narrative</h2>
              <span className="chip bg-brand-100 font-mono text-[10px] text-brand-800"><LockKeyhole size={10} /> Private</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-brand-50 p-3 text-[13px] leading-relaxed text-ink/90 sm:p-4">{c.narrative}</p>
            <p className="mt-2 flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-[10px] leading-relaxed text-emerald-900">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-700" />
              Reporter identity is not stored with this submission.
            </p>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Paperclip size={14} className="text-brand-700" /> Attached Evidence ({c.attachments.length} {c.attachments.length === 1 ? 'File' : 'Files'})</h2>
              <span className="text-[10px] text-muted">Uploaded with complaint</span>
            </div>
            {!c.attachments.length && (
              <p className="mt-3 rounded-md bg-brand-50 p-3 text-xs text-muted">No evidence files were attached.</p>
            )}
            <Attachments items={c.attachments} base="/admin/attachments" auth compact />
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><History size={14} className="text-brand-700" /> Chain of Custody &amp; Audit Trail</h2>
              <span className="text-[10px] text-muted">Status history</span>
            </div>
            {c.events.length ? (
              <ol className="space-y-2.5">
                {[...c.events].reverse().map((event, index) => (
                  <li key={`${event.status}-${event.at}`} className="relative flex gap-3">
                    <span className="relative flex w-3 shrink-0 justify-center">
                      {index < c.events.length - 1 && <span className="absolute top-3 h-full w-px bg-brand-200" />}
                      <span className={`relative mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${EVENT_STYLE[event.status] || 'bg-slate-400'}`} />
                    </span>
                    <div className="min-w-0 flex-1 rounded-md bg-brand-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold">Status transitioned to “{STATUS_LABEL[event.status] || event.status}”</span>
                        <time className="font-mono text-[10px] text-muted">{fmtFull(event.at)}</time>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{eventDescription(event.status)}</p>
                      {index === c.events.length - 1 && <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-brand-700"><Check size={11} /> Recorded in audit history</div>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted">No status history is available.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Manage &amp; Respond</h2>
              <span className={`h-2 w-2 rounded-full ${c.status === 'resolved' ? 'bg-emerald-500' : 'bg-brand-600'}`} />
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold" htmlFor="complaint-status">Lifecycle Status
                <select
                  id="complaint-status"
                  className="mt-1.5 block w-full rounded-md border border-line bg-white px-3 py-2 text-xs font-normal"
                  value={c.status}
                  onChange={(e) => patch({ status: e.target.value }, 'Status updated.')}
                >
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <span className="mt-1.5 block text-[10px] font-normal leading-relaxed text-muted">Status changes are saved and added to the complaint history.</span>
              </label>

              <label className="block text-xs font-semibold" htmlFor="complaint-priority">Priority Rating
                <select
                  id="complaint-priority"
                  className="mt-1.5 block w-full rounded-md border border-line bg-white px-3 py-2 text-xs font-normal"
                  value={c.priority}
                  onChange={(e) => patch({ priority: e.target.value }, 'Priority updated.')}
                >
                  {PRIORITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <div className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">Legal escalation</span>
                  <span className="text-[10px] text-muted">Internal only</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">Escalation is visible to administrators and is not published to the reporter.</p>
                <button
                  type="button"
                  onClick={() => patch({ escalated: !c.escalated }, c.escalated ? 'Escalation removed.' : 'Escalated to Legal.')}
                  className={`mt-2 w-full rounded-md border px-3 py-2 text-left text-xs font-medium ${c.escalated ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-line bg-white hover:bg-brand-50'}`}
                >
                  <span className="flex items-center gap-2"><Flag size={13} />{c.escalated ? 'Escalated — click to remove' : 'Escalate to Legal'}</span>
                </button>
              </div>
            </div>

            {msg && <p role="status" className="mt-3 rounded-md bg-brand-100 px-3 py-2 text-xs text-brand-800">{msg}</p>}

            <form onSubmit={send} className="mt-4 border-t border-line pt-4">
              <h3 className="text-xs font-semibold">Public Administrator Response</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">This response will be visible on the reporter’s tracking page.</p>
              <label className="mt-3 block text-[10px] font-semibold" htmlFor="response-responder">Responder
                <input
                  id="response-responder"
                  className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-xs font-normal"
                  value={reply.responder}
                  onChange={(e) => setReply({ ...reply, responder: e.target.value })}
                  maxLength={120}
                />
              </label>
              <label className="mt-3 block text-[10px] font-semibold" htmlFor="response-body">Response
                <textarea
                  id="response-body"
                  rows={5}
                  className="mt-1 block w-full resize-y rounded-md border border-line bg-brand-50/60 px-3 py-2 text-xs font-normal leading-relaxed placeholder:text-slate-400"
                  required
                  minLength={5}
                  maxLength={3000}
                  placeholder="Write the official response…"
                  value={reply.body}
                  onChange={(e) => setReply({ ...reply, body: e.target.value })}
                />
              </label>
              <label className="mt-3 block text-[10px] font-semibold" htmlFor="response-next-step">Next step <span className="font-normal text-muted">(optional)</span>
                <input
                  id="response-next-step"
                  className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-xs font-normal placeholder:text-slate-400"
                  placeholder="e.g., An inspection has been scheduled."
                  value={reply.nextStep}
                  onChange={(e) => setReply({ ...reply, nextStep: e.target.value })}
                  maxLength={200}
                />
              </label>
              <div className="mt-1 flex justify-end text-[10px] text-muted">{reply.body.length} / 3000 characters</div>
              <button className="btn-primary mt-2 w-full text-xs" disabled={busy}>
                <Send size={13} /> {busy ? 'Publishing…' : 'Publish Response'}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-brand-200 bg-brand-50 p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold"><ShieldCheck size={14} className="text-emerald-700" /> Institutional Handling Standards</h2>
            <ul className="mt-2 space-y-2 text-[10px] leading-relaxed text-muted">
              <li className="flex gap-1.5"><Check size={12} className="shrink-0 text-emerald-700" /> Reporter identity is not collected or stored.</li>
              <li className="flex gap-1.5"><Check size={12} className="shrink-0 text-emerald-700" /> Public responses are shared through the reference-based tracking page.</li>
              <li className="flex gap-1.5"><Check size={12} className="shrink-0 text-emerald-700" /> Status changes are retained in the complaint history.</li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold"><MessageSquareText size={14} className="text-brand-700" /> Response History</h2>
        <Thread responses={c.responses} />
      </section>
    </div>
  );
}
