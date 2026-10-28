import { Link } from 'react-router-dom';

const SECTIONS = [
  ['What we never collect', 'The portal does not record IP addresses, browser fingerprints, user-agent strings, cookies, device identifiers or account details. The server keeps no request log. Narrative text is stripped of hidden Unicode characters, and images are re-encoded on upload so EXIF and GPS metadata are removed.'],
  ['What we store', 'Only what you type into the form: category, optional center and timeline, subject, narrative and any attachments, plus a randomly generated reference code. Nothing in the record is derived from who you are or where you connected from.'],
  ['Protecting yourself', 'Anonymity depends partly on what you write. Avoid names, matric numbers, phone numbers and details only you would know. PDF files can carry their own metadata, so export a fresh copy before attaching one.'],
  ['Your reference code', 'The code is the only way back to your case. It cannot be reissued or recovered by anyone at HiiT. Keep it somewhere private, and do not share it publicly.'],
  ['Non-retaliation', 'HiiT PLC prohibits retaliation against anyone who raises a concern in good faith. Reports are triaged by the Ethics & Compliance Committee, separate from local branch management.'],
  ['Review timeline', 'Initial triage status is posted within 48 business hours. Officers may ask follow-up questions on your tracking page, and you can reply there without revealing your identity.'],
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mono-label mb-2">Privacy &amp; ethics</div>
      <h1 className="text-3xl font-bold tracking-tight">How we protect your anonymity</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">This page explains what the portal does and does not record, and how you can keep a report unlinked from you.</p>
      <div className="mt-8 space-y-4">
        {SECTIONS.map(([t, b]) => (
          <section key={t} className="card p-5"><h2 className="font-semibold">{t}</h2><p className="mt-2 text-[13px] leading-relaxed text-muted">{b}</p></section>
        ))}
      </div>
      <div className="mt-8 flex gap-3"><Link to="/submit" className="btn-primary">File a report</Link><Link to="/track" className="btn-soft">Track a complaint</Link></div>
    </div>
  );
}
