import { STATUS_LABEL } from '../lib/format.js';

const STYLE = {
  new: 'bg-slate-100 text-slate-600',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};

export default function StatusBadge({ status, dot }) {
  return (
    <span className={`chip ${STYLE[status]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {STATUS_LABEL[status]}
    </span>
  );
}
