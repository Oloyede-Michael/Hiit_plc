import { Check, RefreshCw, CircleDashed } from 'lucide-react';
import { fmtStamp } from '../lib/format.js';

const STEPS = [
  ['new', '1. Submitted'],
  ['under_review', '2. Under Review'],
  ['in_progress', '3. In Progress'],
  ['resolved', '4. Resolved'],
];
const ORDER = STEPS.map((s) => s[0]);
const MESSAGE = {
  new: 'Your complaint has been registered and is waiting for initial triage by the Ethics Office.',
  under_review: 'A compliance officer is reviewing your report. Updates will appear below without needing to disclose personal contact information.',
  in_progress: 'Your complaint has been assigned to an authorized technician. Real-time updates will automatically appear below without needing to disclose personal contact information.',
  resolved: 'This case has been resolved and closed. The final findings are shown below.',
};

export default function Lifecycle({ status, events }) {
  const cur = ORDER.indexOf(status);
  const at = (s) => events.filter((e) => e.status === s).at(-1)?.at;
  return (
    <section className="card p-5" aria-label="Investigation lifecycle">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold">Investigation Lifecycle</h2><span className="text-xs text-muted">Step {cur + 1} of 4 {status === 'resolved' ? 'Complete' : 'Active'}</span></div>
      <ol className="grid grid-cols-4">
        {STEPS.map(([key, label], i) => {
          const done = i < cur || status === 'resolved';
          const active = i === cur && status !== 'resolved';
          const ts = at(key);
          return (
            <li key={key} className="relative">
              {i < STEPS.length - 1 && <span className={`absolute left-1/2 top-4 h-0.5 w-full ${i < cur ? 'bg-brand-700' : 'bg-brand-100'}`} aria-hidden />}
              <span className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full ${done ? 'bg-brand-700 text-white' : active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-brand-100 text-brand-300'}`}>
                {done ? <Check size={15} /> : active ? <RefreshCw size={14} /> : <CircleDashed size={14} />}
              </span>
              <div className="mt-2 px-1 text-center">
                <div className={`text-[11px] font-semibold sm:text-xs ${i > cur ? 'text-muted/60' : active ? 'text-brand-700' : 'text-ink'}`}>{label}</div>
                <div className="mt-0.5 text-[10px] text-muted">{ts && i <= cur ? fmtStamp(ts) : 'Pending'}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 flex gap-2 rounded-md bg-brand-50 p-3 text-xs leading-relaxed text-muted"><span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-brand-600 text-center text-[10px] font-bold leading-[14px] text-brand-600">i</span>{MESSAGE[status]}</p>
    </section>
  );
}
