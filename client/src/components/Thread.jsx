import { Building2, CalendarCheck, Lock, UserRound } from 'lucide-react';
import { fmtFull, fmtDate } from '../lib/format.js';

// Shows official responses and anonymous reporter follow-ups, newest first.
export default function Thread({ responses }) {
  if (!responses.length) {
    return <div className="card p-6 text-center text-sm text-muted">No responses yet. A compliance officer will reply here after initial triage.</div>;
  }
  return (
    <div className="space-y-4">
      {responses.map((r) =>
        r.authorType === 'admin' ? (
          <article key={r.id} className="card overflow-hidden border-l-4 border-l-brand-700 p-5">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Building2 size={16} className="text-brand-700" /> Official Response from {r.responder}</h3>
              <time className="font-mono text-[11px] text-muted">{fmtFull(r.createdAt)}</time>
            </header>
            <p className="mt-3 rounded-md bg-brand-50 p-4 text-[13px] italic leading-relaxed">“{r.body}”</p>
            <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-medium text-ink/80">{r.nextStep && (<><CalendarCheck size={13} className="text-brand-700" /> {r.nextStep}</>)}</span>
              {r.signature && <span className="flex items-center gap-1.5 font-mono"><Lock size={11} /> Signed: {r.signature}</span>}
            </footer>
          </article>
        ) : (
          <article key={r.id} className="card ml-6 p-4">
            <header className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold"><UserRound size={14} className="text-muted" /> Your follow-up</span><time className="font-mono text-[11px] text-muted">{fmtDate(r.createdAt)}</time></header>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{r.body}</p>
          </article>
        )
      )}
    </div>
  );
}
