import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { pool } from './db.js';
import { CENTERS, UPLOAD_DIR } from './config.js';

// ---------- deterministic PRNG so every seed run looks the same ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20251024);
const rand = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const refGen = () => 'HII-' + Array.from({ length: 6 }, () => ALPHABET[Math.floor(rnd() * ALPHABET.length)]).join('');

// ---------- reference data ----------
const CATEGORIES = [
  { slug: 'facilities', name: 'Facilities & Infrastructure', short: 'Facilities', target: 34, responder: 'Compliance & Estate Management Division' },
  { slug: 'instructor', name: 'Instructor & Pedagogy', short: 'Instructor', target: 26, responder: 'Academic Quality Office' },
  { slug: 'lab-hardware', name: 'Lab Hardware & Technical Systems', short: 'Technical Issue', target: 22, responder: 'ICT Infrastructure Services' },
  { slug: 'learning-portal', name: 'Learning Portal & Cloud Access', short: 'Learning Platform', target: 18, responder: 'Digital Learning Platform Team' },
  { slug: 'training-schedule', name: 'Training Schedule & Cohort Admin', short: 'Training', target: 12, responder: 'Cohort Administration Office' },
  { slug: 'staff-admin', name: 'Staff & Executive Administration', short: 'Administration', target: 8, responder: 'Ethics & Governance Secretariat' },
  { slug: 'other', name: 'Unclassified / Other', short: 'Other', target: 5, responder: 'Ethics & Governance Secretariat' },
];
const STATUS_TARGET = { new: 14, under_review: 22, in_progress: 18, resolved: 71 };

const POOL = {
  facilities: [
    ['Leaking roof above Hall C', 'Water drips from the ceiling above the back rows of Hall C whenever it rains, soaking floor cables and forcing learners to relocate.'],
    ['Broken classroom chairs in Hall B', 'Several ergonomic chairs have snapped back supports. Safety hazard noted on chairs in the second row.'],
    ['Generator exhaust odor in West Wing', 'Ventilation ducts pull auxiliary generator fumes into the West Wing corridor during outages, giving learners headaches.'],
    ['Washrooms without running water', 'The ground-floor washrooms have had no running water for three days and no notice was given.'],
    ['Faulty air conditioning in Training Lab', 'The AC unit leaks and fails during afternoon lectures, making it difficult to concentrate.'],
  ],
  instructor: [
    ['Late arrival of weekday instructor', 'The Python Core batch has been delayed by over 45 minutes repeatedly, cutting into the practical session time.'],
    ['Inadequate pacing on Advanced React', 'Pacing skipped intermediate hooks and rushed state management topics, leaving many learners behind.'],
    ['Instructor absent without notice', 'The scheduled instructor did not attend two consecutive sessions and no cover was arranged.'],
    ['Unclear grading criteria', 'Assessment rubrics were never shared, and scores differ widely between learners with similar submissions.'],
    ['Discrepancy in course syllabus notes', 'Data Analytics Module 4 slides are missing sample dataset links referenced in the syllabus.'],
  ],
  'lab-hardware': [
    ['LAN switch failure in Room 12', 'Workstations are losing DHCP lease during the network lab exam, interrupting assessments.'],
    ['Projector bulb flickering in Seminar Hall', 'The display blanks out every 10 minutes during the morning lecture.'],
    ['Workstations with failing SSDs', 'Four lab PCs freeze when opening IDEs, and unsaved work has been lost on two occasions.'],
    ['Missing routers for networking practicals', 'The lab kit lacks the dual-band routers listed in the course outline, so groups share a single device.'],
    ['Faulty keyboards in Lab 2', 'Multiple keys are unresponsive on at least eight keyboards, slowing hands-on exercises.'],
  ],
  'learning-portal': [
    ['Cloud portal 504 errors during test', 'The LMS portal timed out on SQL assignment submissions during the live test window.'],
    ['SSO login loop', 'After signing in, the portal returns to the login screen. Clearing cookies did not help.'],
    ['Recorded sessions not loading', 'Recordings from last week stall at 0% for all learners on the evening cohort.'],
    ['Assignment upload fails silently', 'Uploading files over 5MB shows success but nothing appears in the submissions list.'],
  ],
  'training-schedule': [
    ['Cohort timetable clash', 'Two mandatory sessions were scheduled at the same time for the Thursday cohort.'],
    ['Weekend class cancelled without notice', 'Learners travelled to the center before learning the Saturday class had been cancelled.'],
    ['Duplicate cohort assignment', 'Some learners appear in two cohorts, producing conflicting attendance records.'],
    ['Certificate date discrepancy', 'Completion certificates list a start date that does not match the actual cohort start.'],
  ],
  'staff-admin': [
    ['Unclear payment receipt issuance', 'Delay in issuing verified tax receipts for sponsored corporate training.'],
    ['Unannounced fee surcharge', 'An additional materials fee was added at checkout with no prior disclosure in the contract.'],
    ['Refund delayed beyond policy window', 'A refund approved six weeks ago has not been paid and queries go unanswered.'],
    ['Possible favoritism in sponsorship awards', 'Sponsorship slots appear to be allocated to learners with personal ties to administrative staff.'],
  ],
  other: [
    ['Noise from adjacent construction', 'Drilling next door makes the morning sessions hard to follow.'],
    ['Suggestion: add a quiet study room', 'Learners need a quiet space for self-study between sessions.'],
    ['Unclear security gate procedure', 'Visitors and learners are treated inconsistently at the main gate.'],
  ],
};

const ACK = 'Your complaint has been received and logged with the Ethics & Compliance Committee. A reviewing officer will assess the details and update this record.';
const PROGRESS = {
  facilities: 'The matter has been assigned to our estate management team. A technician has been scheduled and we will post confirmation once the work is completed.',
  instructor: 'The Academic Quality Office has opened a review with the relevant program lead. Corrective feedback will be shared with the instructor.',
  'lab-hardware': 'ICT Infrastructure Services has logged a repair ticket and is sourcing replacement parts. Interim workarounds have been arranged.',
  'learning-portal': 'The platform team has reproduced the issue and a fix is in testing. We will confirm here when it is deployed.',
  'training-schedule': 'Cohort administration is reconciling the schedule and will publish a corrected timetable to affected learners.',
  'staff-admin': 'The Ethics Office has requested supporting records from the relevant department and is reviewing them independently.',
  other: 'The Secretariat has forwarded your note to the responsible unit for consideration.',
};
const RESOLVED = {
  facilities: 'The repair has been completed and verified on site. Thank you for raising it.',
  instructor: 'The review is complete. Coaching and a revised delivery plan have been put in place for the affected cohort.',
  'lab-hardware': 'Faulty equipment has been replaced and tested. No further action is required unless the problem recurs.',
  'learning-portal': 'The fix has been deployed and monitored for 48 hours with no further errors.',
  'training-schedule': 'Schedules have been corrected and learners notified. Attendance records were adjusted accordingly.',
  'staff-admin': 'The review is complete and corrective measures have been recorded. A closure memo has been filed.',
  other: 'Your feedback has been recorded and shared with the relevant team. This case is now closed.',
};

// ---------- hand-crafted records matching the design screens ----------
const H = [
  { ref: 'HII-7F42K9', cat: 'facilities', center: 'Ikeja Centre', subject: 'Faulty Air Conditioning and Projector in Training Lab 3',
    narrative: 'The air conditioning unit in Training Lab 3 has been leaking and failing during afternoon lectures, making it difficult to concentrate. In addition, the HDMI ceiling projector flickers intermittently, disrupting hands-on code walkthroughs and student presentations.',
    status: 'in_progress', ago: 96, reviewH: 4.75, progressH: 24.5, ackH: 4.75, demo: true },
  { ref: 'HII-8Q2M4N', cat: 'instructor', center: 'Lagos Central Campus', subject: 'Examination Discrepancy', status: 'new', ago: 6,
    narrative: 'Question 14 of the Module 3 exam covers material that was never taught. Several learners in the cohort have raised the same concern.' },
  { ref: 'HII-3K7P9X', cat: 'facilities', center: 'Abuja Federal Hub', subject: 'Power Failure in Network Lab 3', status: 'under_review', ago: 22, noResponse: true,
    narrative: 'Power drops in Network Lab 3 several times a day and the backup supply does not switch over, shutting down running equipment.' },
  { ref: 'HII-5T6V2B', cat: 'learning-portal', center: 'Ibadan Training Center', subject: 'Portal Token Lockout / SSO Crash', status: 'in_progress', ago: 30,
    narrative: 'Learners are locked out after the SSO token refresh and cannot reach course material.' },
  { ref: 'HII-9W4C8D', cat: 'staff-admin', center: 'Port Harcourt Zone', subject: 'Unsanctioned Material Fee Surcharge', status: 'under_review', ago: 120, escalated: true, priority: 'high',
    narrative: 'A material fee surcharge was applied that is not in the signed training agreement and was not approved by the sponsor.' },
  { ref: 'HII-2R5H7J', cat: 'lab-hardware', center: 'Kano Regional Center', subject: 'Missing Dual-Band Routers for CCNA', status: 'resolved', ago: 300, resolveDays: 2.1,
    narrative: 'The CCNA lab is missing the dual-band routers listed in the course outline, so groups of six share one device.' },
  { ref: 'HII-9K21L4', cat: 'instructor', center: 'Ikeja Centre', subject: 'Late arrival of weekday instructor', status: 'under_review', ago: 70,
    narrative: 'Python Core batch delayed by over 45 minutes repeatedly, reducing practical time.' },
  { ref: 'HII-3M88X1', cat: 'learning-portal', center: 'Lagos Central Campus', subject: 'Cloud portal 504 errors during test', status: 'in_progress', ago: 150,
    narrative: 'LMS portal timed out on SQL assignment submissions during the live test.' },
  { ref: 'HII-5B12P7', cat: 'facilities', center: 'Abuja Federal Hub', subject: 'Broken classroom chairs Hall B', status: 'resolved', ago: 240,
    narrative: 'Safety hazard noted on ergonomic chairs in the second row of Hall B.' },
  { ref: 'HII-8D34W2', cat: 'training-schedule', center: 'Ibadan Training Center', subject: 'Discrepancy in course syllabus notes', status: 'in_progress', ago: 200,
    narrative: 'Data Analytics Module 4 slides are missing sample dataset links.' },
  { ref: 'HII-2Y98Q6', cat: 'lab-hardware', center: 'Ikeja Centre', subject: 'LAN switch failure in Room 12', status: 'under_review', ago: 36, noResponse: true,
    narrative: 'Workstations are losing DHCP lease during the network lab exam.' },
  { ref: 'HII-11M4R8', cat: 'staff-admin', center: 'Port Harcourt Zone', subject: 'Unclear payment receipt issuance', status: 'new', ago: 40,
    narrative: 'Delay in issuing verified tax receipts for sponsored corporate training.' },
  { ref: 'HII-4A77K3', cat: 'instructor', center: 'Kano Regional Center', subject: 'Inadequate pacing on Advanced React', status: 'resolved', ago: 360,
    narrative: 'Pacing skipped intermediate hooks and rushed state management topics.' },
  { ref: 'HII-6T99Z0', cat: 'facilities', center: 'Lagos Central Campus', subject: 'Generator exhaust odor in West Wing', status: 'resolved', ago: 420,
    narrative: 'Ventilation duct draft pulling auxiliary generator fumes into the corridor.' },
  { ref: 'HII-0P33V5', cat: 'lab-hardware', center: 'Abuja Federal Hub', subject: 'Projector bulb flickering in Seminar Hall', status: 'in_progress', ago: 180,
    narrative: 'Display blanks out every 10 minutes during the morning lecture.' },
];

function buildRecords() {
  const left = { ...STATUS_TARGET };
  const catLeft = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.target]));
  H.forEach((h) => { left[h.status]--; catLeft[h.cat]--; });

  const statuses = shuffle(Object.entries(left).flatMap(([s, n]) => Array(n).fill(s)));
  const cats = shuffle(Object.entries(catLeft).flatMap(([s, n]) => Array(n).fill(s)));
  const used = new Set(H.map((h) => h.ref));
  const out = [...H];
  let recentLeft = 0;

  statuses.forEach((status, i) => {
    const cat = cats[i];
    const [subject, narrative] = pick(POOL[cat]);
    let ref; do { ref = refGen(); } while (used.has(ref)); used.add(ref);
    const r = { ref, cat, status, subject, narrative, center: pick(CENTERS) };
    if (status === 'new') r.ago = rand(1, 46);
    else if (status === 'under_review') {
      if (rnd() < 0.3) { r.noResponse = true; r.ago = rand(4, 44); } else r.ago = rand(60, 320);
    } else if (status === 'in_progress') r.ago = rand(72, 600);
    else { r.resolveDays = rand(1.2, 5.2); r.ago = r.resolveDays * 24 + rand(24, 1900); }
    if (rnd() < 0.04 && status !== 'resolved' && status !== 'new') { r.escalated = true; r.priority = 'high'; }
    else if (rnd() < 0.05) r.priority = 'high';
    out.push(r);
  });
  return out;
}

const hoursAgo = (h) => new Date(Date.now() - h * 36e5);
const addH = (d, h) => new Date(d.getTime() + h * 36e5);

async function main() {
  const client = await pool.connect();
  try {
    await client.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    await client.query('BEGIN');
    await client.query('TRUNCATE responses, attachments, complaint_events, complaints, categories, admins, settings RESTART IDENTITY CASCADE');

    // clear old uploads
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.readdirSync(UPLOAD_DIR).filter((f) => f !== '.gitkeep').forEach((f) => fs.unlinkSync(path.join(UPLOAD_DIR, f)));

    const email = (process.env.ADMIN_EMAIL || 'admin.officer@hiitplc.com').toLowerCase();
    const pw = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    await client.query(`INSERT INTO admins (email, password_hash, name, role) VALUES ($1,$2,'Compliance Officer','Compliance Officer')`, [email, await bcrypt.hash(pw, 12)]);
    await client.query(`INSERT INTO settings (key, value) VALUES ('public_resolution_rate','94.8')`);

    const catId = {};
    for (const [i, c] of CATEGORIES.entries()) {
      const r = await client.query('INSERT INTO categories (slug,name,short_name,sort_order) VALUES ($1,$2,$3,$4) RETURNING id', [c.slug, c.name, c.short, i]);
      catId[c.slug] = r.rows[0].id;
    }
    const responderOf = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.responder]));

    const records = buildRecords();
    // Make sure a handful of records fall inside the last 7 days so "logged this week" is non-zero
    for (const rec of records) {
      const submitted = hoursAgo(rec.ago);
      let review = null, progress = null, resolved = null, first = null;
      if (rec.status !== 'new') {
        const respH = rnd() < 0.94 ? rand(6, 46) : rand(50, 80);
        const reviewH = rec.reviewH ?? Math.min(respH, Math.max(0.5, rec.ago - 1));
        review = addH(submitted, reviewH);
        if (!rec.noResponse) first = addH(submitted, rec.ackH ?? reviewH);
        else review = addH(submitted, Math.min(reviewH, rec.ago * 0.5));
        const resolveH = rec.status === 'resolved' ? (rec.resolveDays ?? rand(1.5, 4)) * 24 : null;
        if (rec.status === 'in_progress' || rec.status === 'resolved') {
          const pH = rec.progressH ?? reviewH + rand(2, 30);
          const cap = resolveH ? resolveH - 1 : rec.ago - 0.5;
          progress = addH(submitted, Math.max(reviewH + 0.5, Math.min(pH, cap)));
        }
        if (resolveH) resolved = addH(submitted, resolveH);
      }
      const updated = resolved || progress || first || review || submitted;

      const ins = await client.query(
        `INSERT INTO complaints (reference, category_id, center, occurrence, subject, narrative, status, escalated, priority,
                                 submitted_at, first_response_at, resolved_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [rec.ref, catId[rec.cat], rec.center, 'last_24h', rec.subject, rec.narrative, rec.status, !!rec.escalated, rec.priority || 'standard',
         submitted, first, resolved, updated]
      );
      const id = ins.rows[0].id;
      const ev = (status, at) => client.query('INSERT INTO complaint_events (complaint_id,status,created_at) VALUES ($1,$2,$3)', [id, status, at]);
      await ev('new', submitted);
      if (review) await ev('under_review', review);
      if (progress) await ev('in_progress', progress);
      if (resolved) await ev('resolved', resolved);

      const sig = () => `EMD-AUTH-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const respond = (at, body, next) =>
        client.query(`INSERT INTO responses (complaint_id,author_type,responder,body,next_step,signature,created_at) VALUES ($1,'admin',$2,$3,$4,$5,$6)`,
          [id, responderOf[rec.cat], body, next || null, sig(), at]);

      if (first) await respond(first, ACK);
      if (progress) {
        if (rec.demo) {
          await client.query(`INSERT INTO responses (complaint_id,author_type,responder,body,next_step,signature,created_at) VALUES ($1,'admin','HiiT Facility Operations',$2,$3,'EMD-AUTH-7739',$4)`,
            [id, 'Thank you for bringing this to our attention. An external HVAC technician has been dispatched today to service the AC unit in Lab 3. Simultaneously, our IT team has ordered a replacement HDMI cable and projector ballast. Expected completion is Friday morning.',
             `Next inspection scheduled for ${addH(progress, 24).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`, progress]);
        } else {
          await respond(progress, PROGRESS[rec.cat]);
        }
      }
      if (resolved) await respond(resolved, RESOLVED[rec.cat]);

      if (rec.demo) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6fb"/><stop offset="1" stop-color="#dfe4ee"/></linearGradient></defs><rect width="1200" height="800" fill="url(#w)"/><rect x="0" y="560" width="1200" height="240" fill="#e9ecf3"/><rect x="180" y="150" width="260" height="70" rx="10" fill="#fff" stroke="#c3cad8" stroke-width="4"/><rect x="520" y="60" width="150" height="70" rx="8" fill="#b9c0cf"/><circle cx="595" cy="95" r="22" fill="#6b7488"/><rect x="760" y="200" width="300" height="90" rx="12" fill="#fff" stroke="#c3cad8" stroke-width="4"/><rect x="780" y="260" width="260" height="10" fill="#9aa3b8"/><rect x="250" y="420" width="700" height="12" fill="#cfd5e2"/></svg>`;
        const name = crypto.randomBytes(16).toString('hex') + '.jpg';
        const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
        fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
        await client.query(`INSERT INTO attachments (complaint_id, filename, mime, size_bytes, storage_name) VALUES ($1,'lab3_projector_issue.jpg','image/jpeg',$2,$3)`, [id, buf.length, name]);
      }
    }
    await client.query('COMMIT');
    console.log(`Seeded ${records.length} complaints, ${CATEGORIES.length} categories.`);
    console.log(`Admin login -> ${email} / ${pw}`);
    console.log('Demo tracking code -> HII-7F42K9');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seed failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
main();
