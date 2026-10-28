import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, User, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/submit', label: 'Submit Complaint' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/privacy', label: 'Privacy & Ethics' },
];

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  const link = ({ isActive }) =>
    `rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${isActive || false ? 'bg-brand-100 text-brand-700' : 'text-ink hover:bg-brand-50'}`;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="leading-tight">
          <div className="text-[15px] font-bold text-ink">HiiT PLC</div>
          <div className="text-[11px] font-semibold text-muted">Anonymous Complaint Portal</div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/admin/login" className="btn-soft hidden !px-3 !py-1.5 text-xs sm:inline-flex">Admin Portal</Link>
          <Link to="/admin/login" aria-label="Officer sign in" className="grid h-8 w-8 place-items-center rounded-md bg-brand-700 text-white"><User size={15} /></Link>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-line md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line bg-white px-5 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={link}>{n.label}</NavLink>)}
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-brand-50/60">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-brand-700" size={20} />
            <div>
              <div className="text-sm font-semibold">100% Anonymous &amp; Encrypted Protocol</div>
              <div className="text-xs text-muted">No IP logging, zero fingerprinting, or identity telemetry recorded.</div>
            </div>
          </div>
          <span className="chip bg-brand-100 text-brand-700"><Lock size={12} /> End-to-End Secure</span>
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-2 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} HiiT PLC Ethics &amp; Compliance Office. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-ink">Ethics Policy</Link>
            <Link to="/track" className="hover:text-ink">Status Lookup</Link>
            <Link to="/admin/login" className="hover:text-ink">Officer Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
