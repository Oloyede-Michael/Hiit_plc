import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, IdCard, KeyRound, ShieldCheck, ShieldHalf } from 'lucide-react';
import { api, getToken, setToken } from '../../lib/api.js';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (getToken()) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.post('/admin/login', { email, password: pw });
      setToken(r.token); nav('/admin', { replace: true });
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-brand-700 text-white"><ShieldCheck size={22} /></span>
          <div className="mt-3 font-mono text-[10px] tracking-wider text-muted">HIIT PLC</div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="mt-1 text-xs text-muted">Authorized Compliance &amp; Ethics Officers Only</p>
        </div>
        <form onSubmit={submit} className="card mt-6 border-t-2 border-t-brand-600 p-6">
          <label htmlFor="em" className="field-label !text-xs">Staff ID / Corporate Email</label>
          <div className="relative">
            <IdCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="em" className="input !pl-9" type="email" autoComplete="username" placeholder="e.g., admin.officer@hiitplc.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-1.5 mt-4 flex items-center justify-between"><label htmlFor="pw" className="text-xs font-semibold">Master Token / Password</label><span className="text-[11px] font-semibold text-brand-600">Reset credentials</span></div>
          <div className="relative">
            <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="pw" className="input !pl-9 !pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <label className="flex items-center gap-2"><input type="checkbox" className="rounded border-line" /> Remember this workstation</label>
            <span className="flex items-center gap-1.5 font-mono text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-brand-700" /> TLS 1.3 / E2EE</span>
          </div>
          {err && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
          <button className="btn-primary mt-5 w-full !py-3" disabled={busy}>{busy ? 'Verifying…' : 'Log In to Compliance Portal'} {!busy && <ArrowRight size={15} />}</button>
          <div className="mt-5 flex gap-3 rounded-md bg-brand-50 p-3">
            <ShieldHalf size={16} className="mt-0.5 shrink-0 text-brand-700" />
            <div className="text-[11px] leading-relaxed text-muted"><b className="text-ink">ZERO-KNOWLEDGE ARCHITECTURE</b><br />All complaint tracking is hardware-key encrypted. Unauthorized access attempts are cryptographically timestamped and forwarded to HiiT Information Security.</div>
          </div>
        </form>
        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink"><ArrowLeft size={13} /> Return to Public Submission Portal</Link>
          <div className="mt-4 font-mono text-[10px] text-muted/80">SESSION GATEWAY: SEC-NG-9042 • AUDIT MODE: STRICT<br />© {new Date().getFullYear()} HiiT PLC Governance, Risk &amp; Compliance Directorate.</div>
        </div>
      </div>
    </div>
  );
}
