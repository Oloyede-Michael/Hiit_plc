import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool, query } from '../db.js';
import { CENTERS, STATUSES, PRIORITIES, SLA_HOURS } from '../config.js';
import { cleanText, sigFor } from '../lib/util.js';
import { listItem, slaInfo } from '../lib/sla.js';
import { sendAttachment } from './public.js';

const router = Router();
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const r = await query('SELECT * FROM admins WHERE lower(email)=$1', [email]);
    const a = r.rows[0];
    const ok = a && (await bcrypt.compare(password, a.password_hash));
    if (!ok) throw bad('Invalid staff ID or password.', 401);
    const token = jwt.sign({ sub: a.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: a.id, name: a.name, email: a.email, role: a.role } });
  } catch (e) { next(e); }
});

// ---- everything below requires a valid token ----
router.use(async (req, _res, next) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) throw bad('Authentication required.', 401);
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const r = await query('SELECT id, name, email, role FROM admins WHERE id=$1', [sub]);
    if (!r.rowCount) throw bad('Authentication required.', 401);
    req.admin = r.rows[0];
    next();
  } catch (e) {
    next(e.status ? e : bad('Session expired. Please sign in again.', 401));
  }
});

router.get('/me', (req, res) => res.json({ admin: req.admin }));

router.post('/password', async (req, res, next) => {
  try {
    const { current, next: nextPw } = req.body;
    if (typeof nextPw !== 'string' || nextPw.length < 10) throw bad('New password must be at least 10 characters.');
    const r = await query('SELECT password_hash FROM admins WHERE id=$1', [req.admin.id]);
    if (!(await bcrypt.compare(String(current || ''), r.rows[0].password_hash))) throw bad('Current password is incorrect.');
    await query('UPDATE admins SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(nextPw, 12), req.admin.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

const centerParam = (v) => (CENTERS.includes(v) ? v : null);

router.get('/stats', async (req, res, next) => {
  try {
    const center = centerParam(req.query.center);
    const W = `($1::text IS NULL OR center = $1)`;
    const [counts, cats, week, sla, turn, queue] = await Promise.all([
      query(`SELECT status, COUNT(*)::int n FROM complaints WHERE ${W} GROUP BY status`, [center]),
      query(
        `SELECT cat.id, cat.name, cat.short_name, COUNT(c.id)::int n
           FROM categories cat LEFT JOIN complaints c ON c.category_id = cat.id AND ($1::text IS NULL OR c.center = $1)
          GROUP BY cat.id ORDER BY n DESC, cat.sort_order`, [center]),
      query(`SELECT COUNT(*)::int n FROM complaints WHERE submitted_at > now() - interval '7 days' AND ${W}`, [center]),
      query(
        `SELECT COUNT(*) FILTER (WHERE first_response_at - submitted_at <= make_interval(hours => ${SLA_HOURS}))::int ok,
                COUNT(*) FILTER (WHERE first_response_at IS NOT NULL)::int total
           FROM complaints WHERE ${W}`, [center]),
      query(`SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - submitted_at))/86400) d FROM complaints WHERE status='resolved' AND ${W}`, [center]),
      query(
        `SELECT c.*, cat.name AS category_name, cat.short_name FROM complaints c JOIN categories cat ON cat.id=c.category_id
          WHERE c.status <> 'resolved' AND ($1::text IS NULL OR c.center = $1)
          ORDER BY (c.first_response_at IS NULL) DESC, c.escalated DESC, c.submitted_at ASC LIMIT 5`, [center]),
    ]);
    const by = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    counts.rows.forEach((r) => (by[r.status] = r.n));
    const total = Object.values(by).reduce((a, b) => a + b, 0);
    res.json({
      total, loggedThisWeek: week.rows[0].n, byStatus: by,
      resolvedPct: total ? Math.round((by.resolved / total) * 1000) / 10 : 0,
      categories: cats.rows.map((c) => ({ id: c.id, name: c.name, shortName: c.short_name, count: c.n, pct: total ? Math.round((c.n / total) * 100) : 0 })),
      sla: {
        percent: sla.rows[0].total ? Math.round((sla.rows[0].ok / sla.rows[0].total) * 100) : 0,
        avgTurnaroundDays: Math.round((Number(turn.rows[0].d) || 0) * 10) / 10,
      },
      queue: queue.rows.map(listItem),
      centers: CENTERS,
      activeCenter: center,
    });
  } catch (e) { next(e); }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT cat.id, cat.slug, cat.name, cat.short_name,
              COUNT(c.id)::int total,
              COUNT(c.id) FILTER (WHERE c.status <> 'resolved')::int open,
              COUNT(c.id) FILTER (WHERE c.status = 'resolved')::int resolved
         FROM categories cat LEFT JOIN complaints c ON c.category_id = cat.id
        GROUP BY cat.id ORDER BY cat.sort_order`
    );
    res.json({ categories: r.rows });
  } catch (e) { next(e); }
});

router.get('/complaints', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const where = [];
    const params = [];
    const add = (sql, v) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)); };

    const search = cleanText(req.query.search || '');
    if (search) add(`(c.reference ILIKE ? OR c.subject ILIKE ?)`, `%${search.replace(/[%_]/g, '')}%`);
    if (parseInt(req.query.category, 10)) add('c.category_id = ?', parseInt(req.query.category, 10));
    if (STATUSES.includes(req.query.status)) add('c.status = ?', req.query.status);
    const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const order = req.query.sort === 'oldest' ? 'ASC' : 'DESC';

    const [rows, total, counts, all] = await Promise.all([
      query(
        `SELECT c.*, cat.name AS category_name, cat.short_name FROM complaints c JOIN categories cat ON cat.id=c.category_id
          ${sqlWhere} ORDER BY c.submitted_at ${order}, c.id ${order} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params),
      query(`SELECT COUNT(*)::int n FROM complaints c ${sqlWhere}`, params),
      query(`SELECT status, COUNT(*)::int n FROM complaints GROUP BY status`),
      query(`SELECT COUNT(*)::int n FROM complaints`),
    ]);
    const by = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    counts.rows.forEach((r) => (by[r.status] = r.n));
    res.json({
      items: rows.rows.map(listItem),
      total: total.rows[0].n,
      page, pageSize,
      pages: Math.max(1, Math.ceil(total.rows[0].n / pageSize)),
      counts: by,
      totalAll: all.rows[0].n,
    });
  } catch (e) { next(e); }
});

router.get('/complaints/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10) || 0;
    const r = await query(
      `SELECT c.*, cat.name AS category_name, cat.short_name FROM complaints c JOIN categories cat ON cat.id=c.category_id WHERE c.id=$1`, [id]);
    if (!r.rowCount) throw bad('Complaint not found.', 404);
    const c = r.rows[0];
    const [events, responses, atts] = await Promise.all([
      query('SELECT status, created_at FROM complaint_events WHERE complaint_id=$1 ORDER BY created_at, id', [id]),
      query('SELECT * FROM responses WHERE complaint_id=$1 ORDER BY created_at DESC, id DESC', [id]),
      query('SELECT id, filename, mime, size_bytes FROM attachments WHERE complaint_id=$1 ORDER BY id', [id]),
    ]);
    res.json({
      ...listItem(c),
      narrative: c.narrative,
      occurrence: c.occurrence,
      updatedAt: c.updated_at,
      events: events.rows.map((e) => ({ status: e.status, at: e.created_at })),
      responses: responses.rows.map((x) => ({
        id: x.id, authorType: x.author_type, responder: x.responder, body: x.body,
        nextStep: x.next_step, signature: x.signature, createdAt: x.created_at,
      })),
      attachments: atts.rows.map((a) => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size_bytes })),
    });
  } catch (e) { next(e); }
});

router.patch('/complaints/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10) || 0;
    const { status, escalated, priority } = req.body;
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM complaints WHERE id=$1 FOR UPDATE', [id]);
    if (!cur.rowCount) throw bad('Complaint not found.', 404);
    const c = cur.rows[0];
    const sets = [];
    const vals = [];
    const set = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

    if (status !== undefined) {
      if (!STATUSES.includes(status)) throw bad('Invalid status.');
      if (status !== c.status) {
        set('status', status);
        set('resolved_at', status === 'resolved' ? new Date() : null);
        await client.query('INSERT INTO complaint_events (complaint_id, status) VALUES ($1,$2)', [id, status]);
        if (status !== 'new' && !c.first_response_at) set('first_response_at', new Date());
      }
    }
    if (escalated !== undefined) {
      set('escalated', !!escalated);
      if (escalated && c.priority === 'standard') set('priority', 'high');
    }
    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) throw bad('Invalid priority.');
      set('priority', priority);
    }
    if (sets.length) {
      sets.push('updated_at = now()');
      await client.query(`UPDATE complaints SET ${sets.join(', ')} WHERE id = ${id}`, vals);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
});

router.post('/complaints/:id/responses', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10) || 0;
    const body = cleanText(req.body.body);
    const responder = cleanText(req.body.responder) || 'Ethics & Governance Secretariat';
    const nextStep = cleanText(req.body.nextStep) || null;
    if (body.length < 5 || body.length > 3000) throw bad('Response must be 5–3,000 characters.');
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM complaints WHERE id=$1 FOR UPDATE', [id]);
    if (!cur.rowCount) throw bad('Complaint not found.', 404);
    const c = cur.rows[0];
    await client.query(
      `INSERT INTO responses (complaint_id, author_type, responder, body, next_step, signature) VALUES ($1,'admin',$2,$3,$4,$5)`,
      [id, responder.slice(0, 120), body, nextStep && nextStep.slice(0, 200), sigFor()]
    );
    if (c.status === 'new') {
      await client.query('INSERT INTO complaint_events (complaint_id, status) VALUES ($1,$2)', [id, 'under_review']);
      await client.query(`UPDATE complaints SET status='under_review' WHERE id=$1`, [id]);
    }
    await client.query(`UPDATE complaints SET first_response_at = COALESCE(first_response_at, now()), updated_at = now() WHERE id=$1`, [id]);
    await client.query('COMMIT');
    res.status(201).json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
});

router.get('/attachments/:id', async (req, res, next) => {
  try {
    const a = await query('SELECT * FROM attachments WHERE id=$1', [parseInt(req.params.id, 10) || 0]);
    if (!a.rowCount) throw bad('Not found.', 404);
    sendAttachment(res, a.rows[0], req.query.download === '1');
  } catch (e) { next(e); }
});

router.get('/export', async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT c.reference, cat.name AS category, c.center, c.status, c.escalated, c.priority, c.subject, c.submitted_at, c.first_response_at, c.resolved_at
         FROM complaints c JOIN categories cat ON cat.id=c.category_id ORDER BY c.submitted_at DESC`);
    const esc = (v) => (v == null ? '' : `"${(v instanceof Date ? v.toISOString() : String(v)).replace(/"/g, '""')}"`);
    const head = ['reference','category','center','status','escalated','priority','subject','submitted_at','first_response_at','resolved_at'];
    const csv = [head.join(','), ...r.rows.map((row) => head.map((h) => esc(row[h])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hiit-audit-log.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

router.get('/report', async (_req, res, next) => {
  try {
    const [s, c, o] = await Promise.all([
      query(`SELECT status, COUNT(*)::int n FROM complaints WHERE submitted_at > now() - interval '7 days' GROUP BY status`),
      query(`SELECT cat.name, COUNT(*)::int n FROM complaints c JOIN categories cat ON cat.id=c.category_id
              WHERE c.submitted_at > now() - interval '7 days' GROUP BY cat.name ORDER BY n DESC`),
      query(`SELECT COUNT(*)::int n FROM complaints WHERE status <> 'resolved' AND first_response_at IS NULL AND submitted_at < now() - make_interval(hours => ${SLA_HOURS})`),
    ]);
    const week = s.rows.reduce((a, r) => a + r.n, 0);
    const lines = [
      'HiiT PLC - Weekly Compliance Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Complaints logged in the last 7 days: ${week}`,
      ...s.rows.map((r) => `  - ${r.status}: ${r.n}`),
      '',
      'By category (last 7 days):',
      ...c.rows.map((r) => `  - ${r.name}: ${r.n}`),
      '',
      `Open complaints past the ${SLA_HOURS}h first-response window: ${o.rows[0].n}`,
    ];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hiit-weekly-report.txt"');
    res.send(lines.join('\n'));
  } catch (e) { next(e); }
});

export default router;
