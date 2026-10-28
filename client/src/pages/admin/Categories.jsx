import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function Categories() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/categories', { auth: true }).then((r) => setRows(r.categories)); }, []);
  const max = Math.max(1, ...(rows || []).map((r) => r.total));
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div><h1 className="text-2xl font-bold">Categories</h1><p className="mt-1 text-xs text-muted">Volume and resolution progress for each incident category.</p></div>
      <section className="card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-100/70 font-mono text-[10px] tracking-wider text-ink/70"><tr><th className="px-4 py-3">CATEGORY</th><th className="px-4 py-3">TOTAL</th><th className="px-4 py-3">OPEN</th><th className="px-4 py-3">RESOLVED</th><th className="hidden w-48 px-4 py-3 sm:table-cell">SHARE</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows?.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3.5 font-semibold">{r.name}</td>
                <td className="px-4 py-3.5">{r.total}</td><td className="px-4 py-3.5">{r.open}</td><td className="px-4 py-3.5">{r.resolved}</td>
                <td className="hidden px-4 py-3.5 sm:table-cell"><div className="h-2 rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-700" style={{ width: `${(r.total / max) * 100}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Link to="/admin/complaints" className="btn-soft text-xs">Browse complaints</Link>
    </div>
  );
}
