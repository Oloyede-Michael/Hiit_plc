import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, CircleHelp, ExternalLink, EyeOff, FileKey, FilePlus2, History, MessagesSquare, Search, ShieldCheck, KeyRound } from 'lucide-react';

const FAQ = [
  ['How often is the complaint status updated?', 'Status changes appear on your tracking page as soon as a compliance officer records them. Initial triage is posted within 48 business hours of submission.'],
  ['How will I see administrator replies?', 'Enter your reference code on this page. Official responses and any questions from the review team are shown in a thread under your case. You can reply from the same page, without an account.'],
  ['What happens if I lose my Reference Code?', 'Reference codes cannot be reissued or recovered. The portal stores no contact details and no one at HiiT can link a report back to you. If you lose your code, submit a new complaint and mention the earlier one in the narrative.'],
];

export default function Track() {
  const nav = useNavigate();
  const [ref, setRef] = useState('');
  const [open, setOpen] = useState(-1);
  const [err, setErr] = useState('');

  function go(e) {
    e.preventDefault();
    const code = ref.trim().toUpperCase();
    if (!/^HII-[A-Z0-9]{6}$/.test(code)) return setErr('Reference codes look like HII-7F42K9 (10 characters).');
    nav(`/track/${code}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-6 pt-10">
      <div className="text-center">
        <span className="chip bg-brand-100 font-mono text-[10px] text-brand-800"><EyeOff size={11} /> Zero-Knowledge Query Protocol</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Track Your Complaint</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">Enter the unique reference code provided when you submitted your complaint to view real-time status and official administrator responses.</p>
      </div>

      <form onSubmit={go} className="card mt-8 p-6" noValidate>
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="ref" className="flex items-center gap-1.5 text-sm font-semibold"><span className="text-brand-700">#</span> Complaint Reference Number</label>
          <span className="rounded bg-brand-100 px-2 py-0.5 font-mono text-[10px] text-brand-800">FORMAT: HII-XXXXXX</span>
        </div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input id="ref" className="input !py-3 !pl-10 font-mono" placeholder="e.g., HII-7F42K9" value={ref} onChange={(e) => { setRef(e.target.value); setErr(''); }} maxLength={14} autoComplete="off" spellCheck={false} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Case-sensitive 10-character code provided upon submission.</span>
          <button type="button" className="font-medium text-brand-600 hover:underline" onClick={() => { setRef('HII-7F42K9'); setErr(''); }}>Paste demo code</button>
        </div>
        {err && <p role="alert" className="mt-3 text-xs text-red-600">{err}</p>}
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          <button className="btn-primary !py-3">Check Status <ArrowRight size={15} /></button>
          <button type="button" className="btn-soft !py-3" onClick={() => { setRef(''); setErr(''); }}>Reset</button>
        </div>
      </form>

      <div className="mt-5 flex items-start justify-between gap-4 rounded-lg bg-brand-100/70 p-4">
        <div className="flex gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-700" />
          <div><div className="text-sm font-semibold">Anonymous Lookup Safeguard</div><p className="mt-1 text-xs text-muted">Checking your complaint status does not log your IP address or request any identifying details.</p></div>
        </div>
        <Link to="/privacy" className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline">Lost your code? Policy <ExternalLink size={11} /></Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          [History, '1. Instant Status Check', 'Status tags update automatically as complaints transition from Intake to Investigation.'],
          [MessagesSquare, '2. Bilateral Anonymity', 'Compliance officers can leave status updates and clarifications without discovering your IP or identity.'],
          [KeyRound, '3. One-Way Reference', 'Your reference code is the only key to your case; store it carefully as forgotten keys cannot be recovered.'],
        ].map(([I, t, b]) => (
          <div key={t} className="card p-4"><span className="grid h-8 w-8 place-items-center rounded-md bg-brand-100 text-brand-700"><I size={15} /></span><div className="mt-3 text-sm font-semibold">{t}</div><p className="mt-1 text-xs leading-relaxed text-muted">{b}</p></div>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="faq">
        <h2 id="faq" className="text-lg font-bold">Frequently Asked Questions</h2>
        <p className="mt-1 text-xs text-muted">Clear procedural guidelines on the case tracking and response workflow.</p>
        <div className="mt-4 space-y-2">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="card">
              <button className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {q}<ChevronDown size={16} className={`shrink-0 text-muted transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="card mt-8 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-100 text-brand-700"><FileKey size={16} /></span>
          <div><div className="text-sm font-semibold">Need to file a new report?</div><p className="mt-0.5 text-xs text-muted">If you have additional disclosures or separate incident details, launch a new encrypted ticket.</p></div>
        </div>
        <Link to="/submit" className="btn-soft shrink-0 text-xs"><FilePlus2 size={14} /> Submit Another Complaint</Link>
      </div>
    </div>
  );
}
