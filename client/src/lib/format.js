const mo = { month: 'short', day: 'numeric' };
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { ...mo, year: 'numeric' });
export const fmtShort = (d) => new Date(d).toLocaleDateString('en-US', mo);
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtStamp = (d) => `${fmtShort(d)}, ${fmtTime(d)}`;
export const fmtFull = (d) => `${fmtDate(d)} • ${new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
export function fmtRecent(d) {
  const dt = new Date(d); const now = new Date();
  const same = dt.toDateString() === now.toDateString();
  const y = new Date(now.getTime() - 864e5).toDateString() === dt.toDateString();
  if (same) return `Today, ${fmtTime(dt)}`;
  if (y) return `Yesterday, ${fmtTime(dt)}`;
  return fmtStamp(dt);
}
export function timeAgo(d) {
  const h = Math.floor((Date.now() - new Date(d)) / 36e5);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
export const fmtBytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const STATUS_LABEL = { new: 'New', under_review: 'Under Review', in_progress: 'In Progress', resolved: 'Resolved' };
