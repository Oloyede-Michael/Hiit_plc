import { SLA_HOURS } from '../config.js';

export function slaInfo(c, now = new Date()) {
  const sub = new Date(c.submitted_at);
  if (c.status === 'resolved') {
    const days = (new Date(c.resolved_at || c.updated_at) - sub) / 864e5;
    return { tone: 'closed', label: `Closed (${days.toFixed(1)} days)` };
  }
  if (c.escalated) return { tone: 'escalated', label: 'Escalated to Legal' };
  if (!c.first_response_at) {
    const rem = Math.ceil((sub.getTime() + SLA_HOURS * 36e5 - now.getTime()) / 36e5);
    if (rem <= 0) return { tone: 'overdue', label: `Overdue by ${-rem}h` };
    return { tone: rem <= 12 ? 'urgent' : 'normal', label: `${rem}h remaining` };
  }
  const day = Math.floor((now - sub) / 864e5) + 1;
  return { tone: 'ok', label: `Within SLA (Day ${day})` };
}

export function listItem(c) {
  return {
    id: c.id,
    reference: c.reference,
    subject: c.subject,
    snippet: c.narrative.length > 90 ? c.narrative.slice(0, 90).trimEnd() + '…' : c.narrative,
    category: c.category_name,
    categoryShort: c.short_name,
    center: c.center,
    status: c.status,
    escalated: c.escalated,
    priority: c.priority,
    submittedAt: c.submitted_at,
    sla: slaInfo(c),
  };
}
