import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Inbox, Layers, Settings as Cog, LogOut, ShieldCheck, User } from 'lucide-react';
import { api, clearToken, getToken } from '../lib/api.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/complaints', label: 'Complaints', icon: Inbox },
  { to: '/admin/categories', label: 'Categories', icon: Layers },
  { to: '/admin/settings', label: 'Settings', icon: Cog },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const [admin, setAdmin] = useState(null);
  const authed = !!getToken();
  useEffect(() => { if (authed) api.get('/admin/me', { auth: true }).then((r) => setAdmin(r.admin)).catch(() => {}); }, [authed]);
  if (!authed) return <Navigate to="/admin/login" replace />;
  const logout = () => { clearToken(); nav('/admin/login'); };
  const item = ({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-700' : 'text-ink/80 hover:bg-brand-50'}`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between md:mb-6 md:block">
            <div><div className="text-[15px] font-bold text-brand-700">HiiT PLC</div><span className="chip mt-1 bg-brand-100 text-[10px] text-brand-800">Admin Portal</span></div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-ink/80 md:hidden"><LogOut size={15} /> Logout</button>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Admin">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={item}><n.icon size={16} /> {n.label}</NavLink>)}
          </nav>
          <button onClick={logout} className="mt-auto hidden items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-brand-50 md:flex"><LogOut size={16} /> Logout</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5">
          <div className="text-sm"><b>Administration</b> <span className="text-muted">/ Overview</span></div>
          <div className="flex items-center gap-2">
            <span className="chip hidden border border-brand-200 bg-white font-mono text-[10px] text-brand-800 sm:inline-flex"><ShieldCheck size={11} /> TLS 1.3 Active</span>
            <span className="chip hidden bg-brand-100 text-[11px] text-brand-800 sm:inline-flex">{admin?.role || 'Compliance Officer'}</span>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-700 text-white"><User size={15} /></span>
          </div>
        </header>
        <main className="p-5 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
