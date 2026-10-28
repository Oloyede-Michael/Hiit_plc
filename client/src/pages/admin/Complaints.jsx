import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, KeyRound, Lock, RefreshCw, Search, Archive, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api.js';
import { fmtDate } from '../../lib/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';

const TILES = [
  ['new', 'New Filings', 'Action Req.', 'bg-amber-100 text-amber-800', 'bg-slate-300'],
  ['under_review', 'Under Review', 'Assigned', 'bg-amber-100 text-amber-800', 'bg-amber-400'],
  ['in_progress', 'In Progress', 'Investigating', 'bg-blue-100 text-blue-800', 'bg-blue-400'],
  ['resolved', 'Resolved', 'Closed', 'bg-emerald-100 text-emerald-800', 'bg-emerald-500'],
];
const DOT = { Facilities: '#1F3FB0', Instructor: '#1F3FB0', 'Learning Platform': '#2F55D8', Training: '#27324A', 'Technical Issue': '#27324A', Administration: '#4B5565', Other: '#8B93A3' };

export default function Complaints() {
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ search: '', category: '', status: '', sort: 'newest', page: 1 });
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/categories').then((r) => setCats(r.categories)); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page: f.page, pageSize: 10, sort: f.sort });
      ['search', 'category', 'status'].forEach((k) => f[k] && p.set(k, f[k]));
      api.get(`/admin/complaints?${p}`, { auth: true }).then(setData).catch((e) => setErr(e.message));
    }, f.search ? 250 : 0);
    return () => clearTimeout(t);
  }, [f]);
  const upd = (patch) => setF((x) => ({ ...x, page: 1, ...patch }));
  const sel = 'rounded-md border border-line bg-white px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-brand-700"><ShieldCheck size={12} /> ETHICS &amp; OVERSIGHT</div>
          <h1 className="mt-1 text-2xl font-bold">All Complaints Management</h1>
          <p className="mt-1 text-xs text-muted">Browse, filter, and review anonymous submissions across training centers.</p>
        </div>
        <div className="card flex items-center gap-4 px-4 py-2.5">
          <div><div className="text-[10px] text-muted">Total Volume</div><div className="text-sm font-bold text-brand-700">{data?.totalAll ?? '—'} Records</div></div>
          <button aria-label="Refresh" onClick={() => setF({ ...f })} className="grid h-8 w-8 place-items-center rounded-md bg-brand-100 text-brand-700"><RefreshCw size={14} /></button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map(([k, label, tag, tagCls, dot]) => (
          <button key={k} onClick={() => upd({ status: f.status === k ? '' : k })} className={`card p-4 text-left ${f.status === k ? 'ring-2 ring-brand-500' : ''}`} aria-pressed={f.status === k}>
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-ink/80">{label}</span><span className={`h-2 w-2 rounded-full ${dot}`} /></div>
            <div className="mt-2 flex items-end justify-between"><span className="text-3xl font-bold">{data?.counts[k] ?? '—'}</span><span className={`chip text-[10px] ${tagCls}`}>{tag}</span></div>
          </button>
        ))}
      </section>

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Search" className="input !bg-white !pl-9" placeholder="Search by Reference (e.g. HII-...) or keyword" value={f.search} onChange={(e) => upd({ search: e.target.value })} /></div>
          <select aria-label="Category" className={sel} value={f.category} onChange={(e) => upd({ category: e.target.value })}><option value="">All Categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select aria-label="Status" className={sel} value={f.status} onChange={(e) => upd({ status: e.target.value })}><option value="">All Statuses</option><option value="new">New</option><option value="under_review">Under Review</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select>
          <select aria-label="Sort by date" className={sel} value={f.sort} onChange={(e) => upd({ sort: e.target.value })}><option value="newest">Date: Newest</option><option value="oldest">Date: Oldest</option></select>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted"><b className="text-brand-700">{data?.items.length ?? 0}</b> complaints displayed in current view</span><button className="flex items-center gap-1.5 font-medium text-brand-700 hover:underline" onClick={() => setF({ search: '', category: '', status: '', sort: 'newest', page: 1 })}><RefreshCw size={11} /> Reset Filters</button></div>
      </section>

      {err && <p className="text-red-600">{err}</p>}
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-brand-100/70 font-mono text-[10px] tracking-wider text-ink/70"><tr>{['REFERENCE', 'CATEGORY', 'SUBJECT', 'SUBMITTED DATE', 'STATUS', 'ACTION'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/60">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono font-semibold text-brand-700"><span className="flex items-center gap-1.5"><KeyRound size={12} className="text-muted" />{r.reference}</span></td>
                  <td className="px-4 py-3.5"><span className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full" style={{ background: DOT[r.categoryShort] }} />{r.categoryShort}</span></td>
                  <td className="max-w-xs px-4 py-3.5"><div className="font-semibold">{r.subject}</div><div className="truncate text-[11px] text-muted">{r.center ? `${r.center} - ` : ''}{r.snippet}</div></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted">{fmtDate(r.submittedAt)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3.5"><Link to={`/admin/complaints/${r.id}`} className="btn-primary !px-3 !py-1.5 text-[11px]"><Eye size={12} /> View</Link></td>
                </tr>
              ))}
              {data && !data.items.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No complaints match these filters. Try resetting them.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-brand-50/60 px-4 py-3 text-xs text-muted">
          <span>Showing <b className="text-ink">{data && data.total ? (data.page - 1) * data.pageSize + 1 : 0}</b> to <b className="text-ink">{data ? Math.min(data.page * data.pageSize, data.total) : 0}</b> of <b className="text-ink">{data?.total ?? 0}</b> complaints</span>
          <div className="flex items-center gap-1">
            <button disabled={!data || data.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })} className="flex items-center rounded px-2 py-1 hover:bg-white disabled:opacity-40"><ChevronLeft size={14} /> Prev</button>
            {data && pageList(data.page, data.pages).map((p, i) => p === '…' ? <span key={i} className="px-1">…</span> : <button key={i} onClick={() => setF({ ...f, page: p })} aria-current={p === data.page} className={`h-7 min-w-7 rounded px-2 font-semibold ${p === data.page ? 'bg-brand-700 text-white' : 'hover:bg-white'}`}>{p}</button>)}
            <button disabled={!data || data.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })} className="flex items-center rounded px-2 py-1 hover:bg-white disabled:opacity-40">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </section>

      <section className="card flex gap-3 border-l-4 border-l-brand-700 p-4"><Lock size={16} className="mt-0.5 shrink-0 text-brand-700" /><div className="text-[11px] leading-relaxed text-muted"><b className="text-sm text-ink">Anonymous Intake Integrity</b> <span className="chip ml-1 bg-brand-100 font-mono text-[10px] text-brand-800">SHA-256 Validated</span><br />Submissions are stripped of personal identifiers, network endpoints, and hardware metadata upon receipt. Reference tokens serve as the sole verification index for complainants.</div></section>
    </div>
  );
}

function pageList(cur, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, 2, cur - 1, cur, cur + 1, total]);
  const arr = [...s].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return arr.flatMap((n, i) => (i && n - arr[i - 1] > 1 ? ['…', n] : [n]));
}
