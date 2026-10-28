import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Download, FileBarChart, FolderOpen, Info, Lock, Search, ShieldCheck, TrendingUp, Gauge } from 'lucide-react';
import { api, downloadBlob } from '../../lib/api.js';
import { fmtRecent } from '../../lib/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';

const BAR = ['#0B2C9F', '#2F55D8', '#1F3FB0', '#3A4559', '#27324A', '#6B7280', '#A8AEBB'];
const SLA_TONE = { urgent: 'text-red-600', overdue: 'text-red-600', escalated: 'text-brand-600', ok: 'text-ink', normal: 'text-ink', closed: 'text-muted' };

function Stat({ label, value, tag, tagCls = 'bg-brand-100 text-brand-800', sub, pct, valueCls = '', icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between"><span className="font-mono text-[10px] tracking-wider text-muted">{label}</span>{icon || (tag && <span className={`chip text-[10px] ${tagCls}`}>{tag}</span>)}</div>
      <div className={`mt-3 text-3xl font-bold ${valueCls}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{sub}</div>
      <div className="mt-3 h-1.5 rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-700" style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </div>
  );
}

function Donut({ stats }) {
  const parts = [
    ['Resolved', stats.byStatus.resolved, '#0B2C9F'],
    ['Review', stats.byStatus.under_review, '#4B5565'],
    ['In Progress', stats.byStatus.in_progress, '#1F5FE0'],
    ['New Triage', stats.byStatus.new, '#8B93A3'],
  ];
  const R = 52, C = 2 * Math.PI * R, total = stats.total || 1;
  let off = 0;
  return (
    <>
      <div className="relative mx-auto mt-5 h-44 w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label={`${stats.sla.percent}% SLA target met`}>
          {parts.map(([n, v, c]) => { const len = (v / total) * C; const el = <circle key={n} cx="70" cy="70" r={R} fill="none" stroke={c} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />; off += len; return el; })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-3xl font-bold">{stats.sla.percent}%</div><div className="font-mono text-[10px] tracking-wider text-muted">SLA TARGET</div></div></div>
      </div>
      <ul className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
        {parts.map(([n, v, c]) => <li key={n} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{n} ({v})</li>)}
      </ul>
    </>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [center, setCenter] = useState('');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { api.get(`/admin/stats${center ? `?center=${encodeURIComponent(center)}` : ''}`, { auth: true }).then(setS).catch((e) => setErr(e.message)); }, [center]);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!s) return <div className="h-64 animate-pulse rounded-xl bg-brand-100" />;
  const b = s.byStatus;
  const pct = (n) => (s.total ? (n / s.total) * 100 : 0);
  const queue = s.queue.filter((r) => r.reference.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="card flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-brand-700"><ShieldCheck size={12} /> HIIT-ETHICS-COMPLIANCE-PORTAL</div>
          <h1 className="mt-2 text-2xl font-bold">Compliance Overview &amp; Analytics</h1>
          <p className="mt-1 max-w-md text-xs text-muted">Real-time institutional summary of anonymous whistleblowing, incident logs, and resolution health across all regional HiiT training centers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn bg-white text-xs text-ink ring-1 ring-line hover:bg-brand-50" onClick={() => downloadBlob('/admin/export', 'hiit-audit-log.csv')}><Download size={14} /> Export Audit Log (CSV)</button>
          <button className="btn-primary text-xs" onClick={() => downloadBlob('/admin/report', 'hiit-weekly-report.txt')}><FileBarChart size={14} /> Generate Weekly Report</button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border-l-4 border-brand-700 bg-brand-100/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><Lock size={18} className="mt-0.5 text-brand-700" /><div><div className="text-sm font-semibold">Cryptographic Salted Hash Protocol v4.2</div><p className="text-[11px] text-muted">All submission origin data, machine signatures, and IP logs are completely unlinked from intake records.</p></div></div>
        <span className="rounded bg-white px-2.5 py-1 font-mono text-[10px] text-brand-800">ACTIVE KEY: #HT-2025-SEC-AUDIT</span>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="TOTAL FILED" value={s.total} icon={<FolderOpen size={14} className="text-muted" />} sub={<span className="flex items-center gap-1"><TrendingUp size={11} /> +{s.loggedThisWeek} logged this week</span>} pct={100} />
        <Stat label="NEW" tag="Triage" value={b.new} sub="Requires initial review" pct={pct(b.new)} />
        <Stat label="UNDER REVIEW" tag="In Audit" value={b.under_review} sub="Assigned to committees" pct={pct(b.under_review)} />
        <Stat label="IN PROGRESS" tag="Action" value={b.in_progress} valueCls="text-brand-600" sub="Remediation underway" pct={pct(b.in_progress)} />
        <Stat label="RESOLVED" tag={`${s.resolvedPct}%`} value={b.resolved} sub="Closed with formal sign-off" pct={pct(b.resolved)} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-sm font-semibold">Incident Intake by Category</h2><p className="mt-1 text-[11px] text-muted">Classified distribution across corporate and academic centers</p></div>
            <label className="sr-only" htmlFor="ctr">Filter by center</label>
            <select id="ctr" value={center} onChange={(e) => setCenter(e.target.value)} className="rounded bg-brand-100 px-2 py-1 text-[11px] font-medium text-brand-800">
              <option value="">Filter: All Centers</option>
              {s.centers.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <ul className="mt-5 space-y-3.5">
            {s.categories.map((c, i) => (
              <li key={c.id}>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-sm" style={{ background: BAR[i] }} />{c.name}</span><span className="text-muted">{c.count} cases <b className="ml-1 text-ink">{c.pct}%</b></span></div>
                <div className="mt-1.5 h-2 rounded-full bg-brand-100"><div className="h-full rounded-full" style={{ width: `${c.pct * (100 / Math.max(1, s.categories[0].pct))}%`, background: BAR[i] }} /></div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted"><span className="flex items-center gap-1.5"><Info size={12} /> Total categorized records: {s.total} entries</span><Link to="/admin/categories" className="flex items-center gap-1 font-semibold text-brand-700 hover:underline">View category breakdown <ChevronRight size={12} /></Link></div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Lifecycle &amp; SLA Health</h2><span className="chip bg-brand-100 font-mono text-[10px] text-brand-800">Q{Math.ceil((new Date().getMonth() + 1) / 3)}-{new Date().getFullYear()}</span></div>
          <p className="mt-1 text-[11px] text-muted">Resolution tracking against organizational turnaround deadlines</p>
          <Donut stats={s} />
          <div className="mt-4 rounded-md bg-brand-100/70 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><Gauge size={14} className="text-brand-700" /> Avg. Turnaround: {s.sla.avgTurnaroundDays} Days</div><p className="mt-1 text-[11px] leading-relaxed text-muted">{s.sla.percent}% of intake complaints acknowledge receipt and begin investigation within the mandatory 48-hour institutional SLA window.</p></div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
          <div><h2 className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-red-600" /> Priority &amp; Urgent Case Queue</h2><p className="mt-1 text-[11px] text-muted">Incidents flagged for escalated oversight or nearing SLA threshold</p></div>
          <div className="flex items-center gap-2">
            <div className="relative"><Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><input aria-label="Search tracking ID" className="input !w-44 !py-1.5 !pl-8 text-xs" placeholder="Search tracking ID..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Link to="/admin/complaints" className="btn-primary !py-1.5 text-xs">View All ({s.total}) →</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-brand-50 font-mono text-[10px] tracking-wider text-muted"><tr>{['TRACKING CODE', 'INCIDENT CATEGORY', 'TARGET CENTER', 'FILED DATE', 'STATUS', 'SLA CLOCK', 'ACTION'].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {queue.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-brand-50/60" onClick={() => nav(`/admin/complaints/${r.id}`)}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-brand-700">#{r.reference}</td>
                  <td className="px-5 py-3.5"><div className="font-semibold">{r.subject}</div><div className="text-[10px] text-muted">{r.category}</div></td>
                  <td className="px-5 py-3.5">{r.center || '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-[11px]">{fmtRecent(r.submittedAt)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status} dot /></td>
                  <td className={`px-5 py-3.5 font-medium ${SLA_TONE[r.sla.tone]}`}>{r.sla.label}</td>
                  <td className="px-5 py-3.5"><Link to={`/admin/complaints/${r.id}`} aria-label={`Open ${r.reference}`}><ChevronRight size={15} /></Link></td>
                </tr>
              ))}
              {!queue.length && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted">No open cases match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line bg-brand-50/60 px-5 py-2.5 text-[11px] text-muted"><span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Anonymous encryption layer active: Discloser identifiers stripped prior to committee assignment.</span><span>Showing {queue.length} of {s.total - b.resolved} open cases</span></div>
      </section>
    </div>
  );
}
