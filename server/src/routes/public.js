import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { pool, query } from '../db.js';
import { UPLOAD_DIR, OCCURRENCE, CENTERS } from '../config.js';
import { cleanText, genReference, normRef, REF_RE } from '../lib/util.js';
import { slaInfo } from '../lib/sla.js';

const router = Router();
const MAX_TOTAL = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TOTAL, files: 5 },
});

const submitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: true, legacyHeaders: false });

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

function detectType(buf) {
  if (buf.length > 8 && buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 4 && buf.slice(0, 4).toString() === '%PDF') return 'application/pdf';
  return null;
}

// ---------- reference data ----------
router.get('/categories', async (_req, res, next) => {
  try {
    const r = await query('SELECT id, slug, name FROM categories ORDER BY sort_order');
    res.json({ categories: r.rows, centers: CENTERS, occurrence: OCCURRENCE });
  } catch (e) { next(e); }
});

router.get('/public/stats', async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (first_response_at - submitted_at))/3600) AS triage
         FROM complaints WHERE first_response_at IS NOT NULL`
    );
    const s = await query(`SELECT value FROM settings WHERE key='public_resolution_rate'`);
    res.json({
      avgTriageHours: Math.round(Number(r.rows[0].triage) || 0),
      resolutionRate: Number(s.rows[0]?.value ?? 0),
    });
  } catch (e) { next(e); }
});

// ---------- submit ----------
router.post('/complaints', submitLimiter, upload.array('files', 5), async (req, res, next) => {
  const written = [];
  try {
    const categoryId = parseInt(req.body.categoryId, 10);
    const subject = cleanText(req.body.subject);
    const narrative = cleanText(req.body.narrative);
    const occurrence = OCCURRENCE[req.body.occurrence] ? req.body.occurrence : null;
    const center = CENTERS.includes(req.body.center) ? req.body.center : null;

    if (!Number.isInteger(categoryId)) throw bad('Select an incident category.');
    if (subject.length < 5 || subject.length > 120) throw bad('Subject summary must be 5–120 characters.');
    if (narrative.length < 20 || narrative.length > 5000) throw bad('Incident narrative must be 20–5,000 characters.');

    const cat = await query('SELECT id FROM categories WHERE id=$1', [categoryId]);
    if (!cat.rowCount) throw bad('Unknown category.');

    const files = req.files || [];
    if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL) throw bad('Attachments exceed the 10MB total limit.');

    // Validate by magic bytes; re-encode images so EXIF / GPS / camera metadata is dropped.
    const prepared = [];
    for (const f of files) {
      const mime = detectType(f.buffer);
      if (!mime) throw bad('Only PNG, JPG and PDF files are supported.');
      let buf = f.buffer;
      if (mime !== 'application/pdf') {
        try {
          buf = await sharp(f.buffer).rotate().toFormat(mime === 'image/png' ? 'png' : 'jpeg').toBuffer();
        } catch {
          throw bad('One of the images could not be processed.');
        }
      }
      const original = Buffer.from(f.originalname, 'latin1').toString('utf8');
      const name = path.basename(cleanText(original)).slice(0, 120) || 'attachment';
      const ext = mime === 'application/pdf' ? '.pdf' : mime === 'image/png' ? '.png' : '.jpg';
      prepared.push({ buf, mime, name, storage: crypto.randomBytes(16).toString('hex') + ext });
    }
    for (const p of prepared) {
      await fs.writeFile(path.join(UPLOAD_DIR, p.storage), p.buf);
      written.push(p.storage);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let row = null;
      for (let i = 0; i < 8 && !row; i++) {
        const ins = await client.query(
          `INSERT INTO complaints (reference, category_id, center, occurrence, subject, narrative)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (reference) DO NOTHING
           RETURNING id, reference, submitted_at`,
          [genReference(), categoryId, center, occurrence, subject, narrative]
        );
        row = ins.rows[0];
      }
      if (!row) throw new Error('Could not allocate reference');
      await client.query(`INSERT INTO complaint_events (complaint_id, status, created_at) VALUES ($1,'new',$2)`, [row.id, row.submitted_at]);
      for (const p of prepared) {
        await client.query(
          `INSERT INTO attachments (complaint_id, filename, mime, size_bytes, storage_name) VALUES ($1,$2,$3,$4,$5)`,
          [row.id, p.name, p.mime, p.buf.length, p.storage]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ reference: row.reference, issuedAt: row.submitted_at });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    await Promise.all(written.map((w) => fs.unlink(path.join(UPLOAD_DIR, w)).catch(() => {})));
    next(e);
  }
});

// ---------- tracking ----------
async function loadByRef(refRaw) {
  const ref = normRef(refRaw);
  if (!REF_RE.test(ref)) return null;
  const r = await query(
    `SELECT c.*, cat.name AS category_name FROM complaints c
       JOIN categories cat ON cat.id = c.category_id WHERE c.reference = $1`,
    [ref]
  );
  return r.rows[0] || null;
}

router.get('/track/:ref', lookupLimiter, async (req, res, next) => {
  try {
    const c = await loadByRef(req.params.ref);
    if (!c) return res.status(404).json({ error: 'No complaint matches that reference code. Check the code and try again.' });
    const [events, responses, atts] = await Promise.all([
      query('SELECT status, created_at FROM complaint_events WHERE complaint_id=$1 ORDER BY created_at, id', [c.id]),
      query(
        `SELECT id, author_type, responder, body, next_step, signature, created_at
           FROM responses WHERE complaint_id=$1 ORDER BY created_at DESC, id DESC`, [c.id]),
      query('SELECT id, filename, mime, size_bytes FROM attachments WHERE complaint_id=$1 ORDER BY id', [c.id]),
    ]);
    res.json({
      reference: c.reference,
      category: c.category_name,
      subject: c.subject,
      narrative: c.narrative,
      status: c.status,
      escalated: c.escalated,
      priority: c.priority,
      submittedAt: c.submitted_at,
      updatedAt: c.updated_at,
      sla: slaInfo(c),
      events: events.rows.map((e) => ({ status: e.status, at: e.created_at })),
      responses: responses.rows.map((r) => ({
        id: r.id, authorType: r.author_type, responder: r.responder, body: r.body,
        nextStep: r.next_step, signature: r.signature, createdAt: r.created_at,
      })),
      attachments: atts.rows.map((a) => ({ id: a.id, filename: a.filename, mime: a.mime, size: a.size_bytes })),
    });
  } catch (e) { next(e); }
});

router.post('/track/:ref/followup', lookupLimiter, async (req, res, next) => {
  try {
    const c = await loadByRef(req.params.ref);
    if (!c) return res.status(404).json({ error: 'No complaint matches that reference code.' });
    const body = cleanText(req.body.body);
    if (body.length < 5 || body.length > 3000) throw bad('Additional information must be 5–3,000 characters.');
    await query(`INSERT INTO responses (complaint_id, author_type, responder, body) VALUES ($1,'reporter','Anonymous reporter',$2)`, [c.id, body]);
    await query('UPDATE complaints SET updated_at = now() WHERE id=$1', [c.id]);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/track/:ref/attachments/:id', lookupLimiter, async (req, res, next) => {
  try {
    const c = await loadByRef(req.params.ref);
    if (!c) return res.status(404).json({ error: 'Not found' });
    const a = await query('SELECT * FROM attachments WHERE id=$1 AND complaint_id=$2', [parseInt(req.params.id, 10) || 0, c.id]);
    if (!a.rowCount) return res.status(404).json({ error: 'Not found' });
    sendAttachment(res, a.rows[0], req.query.download === '1');
  } catch (e) { next(e); }
});

export function sendAttachment(res, a, download) {
  res.setHeader('Content-Type', a.mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(a.filename)}`);
  res.sendFile(path.join(UPLOAD_DIR, a.storage_name));
}

export default router;
