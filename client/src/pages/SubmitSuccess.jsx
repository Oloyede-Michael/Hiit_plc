import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Copy, Flag, Home, Hourglass, ShieldCheck, CalendarClock, Workflow, Hash, CheckCircle2 } from 'lucide-react';
import { fmtDate } from '../lib/format.js';

export default function SubmitSuccess() {
  const { state } = useLocation();
  const [copied, setCopied] = useState(false);
  if (!state?.reference) return <Navigate to="/submit" replace />;
  const issued = new Date(state.issuedAt);

  async function copy() {
    try { await navigator.clipboard.writeText(state.reference); } catch { /* clipboard may be blocked */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    { stage: '01', icon: Hourglass, tag: '48h', title: 'Initial Triage & Review', body: 'The Ethics Office verifies documentation scope and redacts accidental identifiers before delegating.', foot: 'Pending officer assignment', dot: 'bg-brand-600' },
    { stage: '02', icon: CalendarClock, tag: '5–7 Days', title: 'Independent Inquiry', body: 'An impartial audit team examines the matter. You may receive anonymous inquiries via your tracking link.', foot: 'Secure 2-way messaging', dot: 'bg-slate-300' },
    { stage: '03', icon: Flag, tag: 'Resolution', title: 'Findings & Remediation', body: 'Official investigation outcomes, systemic corrective measures, and closure memos are published to your token page.', foot: 'Cryptographically signed', dot: 'bg-slate-300' },
  ];
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="card p-6 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-brand-100 text-brand-700"><CheckCircle2 size={26} /></span>
        <span className="chip mx-auto mt-5 bg-brand-100 font-mono text-[10px] text-brand-800"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> ENCRYPTED TRANSMISSION CONFIRMED</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Complaint Submitted Successfully</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">Your report has been securely registered with the HiiT PLC Ethics &amp; Compliance Committee under full cryptographic anonymity.</p>

        <div className="mt-7 rounded-xl bg-brand-50 p-5 text-left">
          <div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] tracking-wider text-muted">UNIQUE INCIDENT REFERENCE KEY</span><span className="chip bg-white font-mono text-[10px] text-brand-700"><Hash size={10} /> 256-bit Hash</span></div>
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-white p-4 sm:flex-row sm:items-center">
            <div>
              <div className="select-all font-mono text-2xl font-semibold tracking-wide text-brand-700" data-testid="reference">{state.reference}</div>
              <div className="mt-1 text-[10px] text-muted">Issued: {fmtDate(issued)} • {issued.toISOString().slice(11, 16)} UTC</div>
            </div>
            <button onClick={copy} className="btn-primary !py-2 text-xs">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Reference Code'}</button>
          </div>
          <div className="mt-3 flex gap-2 rounded-md bg-brand-100/80 p-3 text-xs leading-relaxed text-muted">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-700" />
            <p><b className="text-ink">Save this reference number immediately.</b> You will need it to track your case status. Because this platform utilizes Zero-Knowledge logging, lost keys cannot be reissued or retrieved by IT administrators.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <Link to={`/track/${state.reference}`} className="btn-primary">Track Complaint Status <ArrowRight size={15} /></Link>
          <Link to="/" className="btn-soft"><Home size={15} /> Return Home</Link>
        </div>

        <div className="mt-10 text-left">
          <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Workflow size={15} className="text-brand-700" /> What Happens Next</h2><span className="text-[11px] text-muted">Standard SLA Protocols</span></div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.stage} className="flex flex-col rounded-lg bg-brand-50 p-3.5">
                <div className="flex items-center justify-between text-[10px]"><span className="chip bg-brand-100 font-mono text-brand-800">STAGE {s.stage}</span><span className="flex items-center gap-1 text-muted"><s.icon size={11} /> {s.tag}</span></div>
                <div className="mt-3 text-[13px] font-semibold">{s.title}</div>
                <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-muted">{s.body}</p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2 text-[10px] font-medium text-ink/80"><span className={`h-1.5 w-1.5 rounded-sm ${s.dot}`} />{s.foot}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-100/60 px-4 py-2.5 font-mono text-[10px] text-muted">
        <span className="flex items-center gap-2"><CheckCircle2 size={13} className="text-brand-700" /> Transmission Node: West-Africa-Secure-Relay-04</span>
        <span>Session Disconnected &nbsp; <b className="text-brand-700">IP: [REDACTED/NULL]</b></span>
      </div>
    </div>
  );
}
