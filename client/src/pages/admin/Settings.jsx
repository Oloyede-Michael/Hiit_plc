import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';

export default function Settings() {
  const [admin, setAdmin] = useState(null);
  const [f, setF] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState({ ok: true, text: '' });
  useEffect(() => { api.get('/admin/me', { auth: true }).then((r) => setAdmin(r.admin)); }, []);

  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/admin/password', f, { auth: true });
      setF({ current: '', next: '' }); setMsg({ ok: true, text: 'Password updated.' });
    } catch (e2) { setMsg({ ok: false, text: e2.message }); }
  }
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="mt-1 text-xs text-muted">Your officer account and sign-in credentials.</p></div>
      <section className="card p-5 text-sm"><div className="text-xs text-muted">Signed in as</div><div className="mt-1 font-semibold">{admin?.email}</div><div className="text-xs text-muted">{admin?.role}</div></section>
      <form onSubmit={save} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Change password</h2>
        <div><label className="field-label !text-xs" htmlFor="cur">Current password</label><input id="cur" type="password" autoComplete="current-password" className="input !bg-white" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></div>
        <div><label className="field-label !text-xs" htmlFor="nw">New password</label><input id="nw" type="password" autoComplete="new-password" minLength={10} className="input !bg-white" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required /><p className="field-hint">At least 10 characters.</p></div>
        {msg.text && <p role="status" className={`rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-brand-100 text-brand-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
        <button className="btn-primary text-xs">Update password</button>
      </form>
    </div>
  );
}
