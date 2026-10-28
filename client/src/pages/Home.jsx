import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FilePenLine, KeyRound, Eye, EyeOff, Scale, Clock3, CheckCircle2, Search, ClipboardCheck, BookOpenText,
  UserRoundSearch, IdCard, BadgeCheck, Lock,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { BoardroomArt, HQArt } from '../components/Art.jsx';

function SecureStrip() {
  return (
    <div className="border-b border-line bg-brand-100/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 font-mono text-[11px] text-brand-800">
        <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-600" />SECURE CHANNEL // ZERO TELEMETRY LOGGED</span>
        <span className="flex items-center gap-4 font-sans text-[11px] text-ink/80">
          <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> 256-Bit Cryptographic Vault</span>
          <span className="hidden sm:inline">Independent Whistleblower Protocol §4.12</span>
        </span>
      </div>
    </div>
  );
}

function IntakeSimulator() {
  return (
    <aside className="card overflow-hidden bg-brand-50 p-4" aria-label="Example of a case record">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono-label flex items-center gap-2 !text-ink/80"><span className="h-2 w-2 rounded-full bg-brand-600" />Case intake simulator</span>
        <span className="chip bg-white font-mono text-brand-700">LIVE TOKEN</span>
      </div>
      <div className="card space-y-2.5 p-4 text-xs">
        <Row k="System Token" v={<span className="chip bg-brand-100 font-mono text-brand-700">HII-7F42K9</span>} />
        <Row k="Identity Shield" v={<span className="chip bg-brand-100 text-brand-700"><EyeOff size={11} /> Zero PII Retained</span>} />
        <Row k="Investigation Status" v={<span className="chip bg-brand-100 text-brand-700">Under Review</span>} />
        <div className="pt-1">
          <div className="mb-1 flex justify-between text-muted"><span>Protocol Verification</span><span className="font-mono font-semibold text-brand-700">Stage 2 of 3</span></div>
          <div className="h-1.5 rounded-full bg-brand-100"><div className="h-full w-2/3 rounded-full bg-brand-700" /></div>
        </div>
      </div>
      <div className="relative mt-4 overflow-hidden rounded-lg">
        <BoardroomArt className="block w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[11px] font-medium text-white">HiiT PLC Ethics Oversight &amp; Compliance Secretariat</div>
      </div>
    </aside>
  );
}
const Row = ({ k, v }) => (
  <div className="flex items-center justify-between border-b border-line/70 pb-2.5 last:border-0 last:pb-0">
    <span className="text-muted">{k}</span>{v}
  </div>
);

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-12 pt-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <div>
        <span className="chip mb-6 border border-brand-200 bg-brand-100 py-1 text-brand-800"><ShieldCheck size={12} /> Official HiiT PLC Governance Gateway</span>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Have a concern?
          <span className="block text-brand-600">Let HiiT know.</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          Submit your feedback or concerns completely anonymously. Track investigation progress anytime using your unique generated reference number.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/submit" className="btn-primary"><FilePenLine size={16} /> Submit a Complaint</Link>
          <Link to="/track" className="btn bg-white text-brand-700 hover:bg-brand-50"><UserRoundSearch size={16} /> Track a Complaint</Link>
        </div>
        <div className="mt-8 flex max-w-lg gap-3 rounded-lg bg-brand-100/70 p-4">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-brand-700"><IdCard size={16} /></span>
          <div>
            <div className="text-[11px] font-bold tracking-wide text-ink">ABSOLUTE ANONYMITY GUARANTEED</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">No name, student ID, email address, or phone number is required to submit a complaint. Submissions are strictly confidential and untraceable.</p>
          </div>
        </div>
      </div>
      <IntakeSimulator />
    </section>
  );
}

const STEPS = [
  { icon: FilePenLine, stage: '01', title: '1. Submit', body: 'Fill out our simple anonymous form with clear details about your concern or incident. Select category, campus, and provide narrative facts.', k: 'Required Inputs:', v: 'Incident Details · Optional Media' },
  { icon: KeyRound, stage: '02', title: '2. Get Reference', body: <>Receive an instant, secure alphanumeric reference code (e.g. <code className="rounded bg-brand-100 px-1 font-mono text-[11px] text-brand-700">HII-7F42K9</code>). Save it safely—this is your only lookup key.</>, k: 'Security Layer:', v: 'Decoupled Token Generator' },
  { icon: Eye, stage: '03', title: '3. Track', body: 'Check ongoing review status and read direct administrative responses anytime without an account, password, or verification email.', k: 'Access Credential:', v: 'Reference Token Only' },
];

function HowItWorks() {
  return (
    <section className="bg-brand-50/60 py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div><div className="mono-label mb-1">Process architecture</div><h2 className="text-2xl font-bold">How It Works</h2></div>
          <p className="max-w-sm text-sm text-muted">A seamless, triple-tier interaction pathway engineered to ensure total identity separation from report submission to resolution.</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.stage} className="card flex flex-col p-5">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-100 text-brand-700"><s.icon size={17} /></span>
              <div className="mono-label mt-4">Stage {s.stage}</div>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
              <div className="mt-4 rounded-md bg-brand-50 p-3 text-[11px] text-muted"><div>{s.k}</div><div className="mt-1 font-mono text-ink">{s.v}</div></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function QuickLookup() {
  const nav = useNavigate();
  const [ref, setRef] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function find(e) {
    e.preventDefault();
    setErr(''); setRes(null);
    const code = ref.trim().toUpperCase();
    if (!code) return setErr('Enter your reference code.');
    setBusy(true);
    try { setRes(await api.get(`/track/${encodeURIComponent(code)}`)); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }
  const latest = res?.responses.find((r) => r.authorType === 'admin');
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="card grid gap-6 p-6 md:grid-cols-[1fr_1.7fr] md:items-center">
        <div>
          <div className="mono-label !text-muted">Quick tracking lookup</div>
          <h2 className="mt-2 text-lg font-bold">Already filed an incident?</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">Enter the 10-character reference key below to immediately check investigative updates or submit follow-up documentation.</p>
        </div>
        <div>
          <form onSubmit={find} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <IdCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input !pl-9 font-mono" placeholder="HII-7F42K9" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Reference code" maxLength={14} />
            </div>
            <button className="btn-primary" disabled={busy}><Search size={15} /> {busy ? 'Searching…' : 'Find Record'}</button>
          </form>
          {err && <p role="alert" className="mt-3 text-xs text-red-600">{err}</p>}
          {res && (
            <button onClick={() => nav(`/track/${res.reference}`)} className="mt-3 block w-full rounded-md bg-brand-50 p-3 text-left hover:bg-brand-100">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 font-mono font-semibold text-brand-700">CASE #{res.reference} <StatusBadge status={res.status} /></span>
                <span className="text-muted">Updated {timeAgo(res.updatedAt)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] text-muted">{latest ? latest.body : 'Your report is registered and awaiting initial assessment.'}</p>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  { icon: EyeOff, title: 'Zero Identity Tracking', body: 'No cookies, no IP retention, no credentials required. Web requests are scrubbed of HTTP headers and user-agent metadata before landing in our database.', checks: ['Raw IP Addresses Stripped at Ingress', 'Sessionless Storage Architecture'] },
  { icon: Scale, title: 'Impartial Corporate Review', body: 'Submissions are triaged directly by an independent compliance and ethics committee, completely isolated from local branch hierarchies or managers.', checks: ['Direct Secretariat Oversight', 'Non-Retaliation Policy Enforced'] },
  { icon: Clock3, title: 'Timely Resolution Protocol', body: 'Guaranteed review timeline and clear progress updates. Initial inquiry status is posted to your reference portal within 48 business hours.', checks: ['48-Hour Triage Benchmark', 'Transparent Escalation Milestones'] },
];

function Integrity() {
  return (
    <section className="bg-brand-50/60 py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 text-center">
          <div className="mono-label mb-1">Guaranteed protections</div>
          <h2 className="text-2xl font-bold">Institutional Integrity Standards</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">HiiT PLC operates under an uncompromising framework of corporate governance ensuring every report receives objective scrutiny without repercussions.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-100 text-brand-700"><p.icon size={17} /></span>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{p.body}</p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
                {p.checks.map((c) => <li key={c} className="flex items-center gap-2 text-[11px] font-medium"><CheckCircle2 size={13} className="text-brand-600" />{c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Transparency() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/public/stats').then(setS).catch(() => {}); }, []);
  return (
    <section className="bg-brand-100/60 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-2">
        <div>
          <div className="mono-label mb-1">Transparency in action</div>
          <h2 className="text-2xl font-bold">Auditability Without Exposure</h2>
          <p className="mt-2 max-w-md text-sm text-muted">HiiT PLC upholds the highest benchmark of operational probity across all national training centers and business units. Your voice keeps our standards intact.</p>
          <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
            <div className="card p-4"><div className="font-mono text-[10px] tracking-wider text-muted">AVERAGE TRIAGE</div><div className="mt-1 text-2xl font-bold text-brand-700">{s ? `${s.avgTriageHours} hrs` : '—'}</div><div className="text-[11px] text-muted">To initial officer inquiry</div></div>
            <div className="card p-4"><div className="font-mono text-[10px] tracking-wider text-muted">RESOLUTION RATE</div><div className="mt-1 text-2xl font-bold text-brand-700">{s ? `${s.resolutionRate}%` : '—'}</div><div className="text-[11px] text-muted">Reported cases remediated</div></div>
          </div>
          <div className="mt-3 flex max-w-md items-center gap-2 rounded-lg bg-white/70 p-3 text-xs"><BadgeCheck size={16} className="shrink-0 text-brand-700" /> Certified under the ISO 37002 Whistleblowing Management Systems Guidelines.</div>
        </div>
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">HiiT Corporate Headquarters</span><span className="font-mono text-[11px] font-semibold text-brand-700">LAGOS • ABUJA • PH</span></div>
          <HQArt className="w-full rounded-md" />
          <div className="mt-3 text-xs"><div className="font-semibold">Ethics &amp; Governance Secretariat</div><div className="mt-1 text-muted">HiiT PLC Central Compliance Operations, Victoria Island, Lagos, Nigeria.</div><div className="mt-1 text-[11px] text-muted/80">Direct Secure Hotlines: Active 24/7 internal routed routing.</div></div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-12">
      <div className="relative overflow-hidden rounded-xl bg-brand-600 p-8 text-white md:p-10">
        <div className="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rotate-12 bg-white/10 [clip-path:polygon(25%_5%,75%_5%,100%_50%,75%_95%,25%_95%,0_50%)]" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="font-mono text-[11px] tracking-wider text-white/70">YOUR VOICE PROTECTS OUR COMMUNITY</div>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Speak up safely. Zero fear. Zero repercussions.</h2>
            <p className="mt-3 max-w-md text-sm text-white/75">Whether it involves academic misconduct, harassment, fraud, or procedural violations, your notification initiates an independent investigation with full legal and policy safeguards.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link to="/submit" className="btn bg-white text-brand-700 hover:bg-brand-50"><ClipboardCheck size={16} /> File Anonymous Report</Link>
            <Link to="/privacy" className="btn bg-brand-800/60 text-white hover:bg-brand-800"><BookOpenText size={16} /> Read Policy</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SecureStrip />
      <Hero />
      <HowItWorks />
      <QuickLookup />
      <Integrity />
      <Transparency />
      <CTA />
    </>
  );
}
