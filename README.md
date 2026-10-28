# HiiT PLC · Anonymous Complaint Portal

A full-stack, anonymous whistleblowing and complaint portal for HiiT PLC. Trainees and members of the public can file a complaint without an account, then follow its progress with a one-time reference code. Compliance officers get a private dashboard for triage, responses, SLA tracking and audit exports.

| Layer | Technology |
|---|---|
| Frontend | Vite 8 · React 18 · React Router 7 · Tailwind CSS 3 |
| Backend | Node.js · Express 4 |
| Database | PostgreSQL 16 (`pg`) |
| Auth | JWT (8h expiry) + bcrypt password hashes |
| Files | `multer` + `sharp` (image re-encoding strips EXIF/GPS) |

---

## Features

### Public portal (`/`)
- **Landing page** — service overview, live triage/satisfaction figures, category entry points.
- **Submit a complaint** (`/submit`) — category, campus/center, when it happened, subject, narrative and up to 5 evidence files (PNG/JPG/PDF, 10 MB total).
- **Reference code** (`/submit/success`) — the generated `HII-XXXXXX` code is the only key to the case; it is shown once.
- **Track a complaint** (`/track`) — look up a case by reference code.
- **Case view** (`/track/:ref`) — current status, lifecycle timeline, official responses, SLA countdown, original submission and attachments.
- **Provide additional information** — reporters can append a follow-up message to an existing case without revealing who they are.
- **Privacy & ethics** (`/privacy`) — plain-language explanation of what is and is not recorded.

### Admin portal (`/admin`)
- **Login** — email + password, rate limited to 10 attempts / 15 min per IP.
- **Dashboard** — totals by status, complaints logged this week, category breakdown, first-response SLA donut, average turnaround, priority queue, per-center filter.
- **Complaints** — search by reference/subject, filter by category and status, sort newest/oldest, paginate.
- **Complaint detail** — change status (new → under review → in progress → resolved), set priority, escalate to Legal, and post an official response (with next step + signature) that appears on the reporter's case view.
- **Categories** — per-category totals, open and resolved counts.
- **Settings** — change the signed-in officer's password.
- **Exports** — CSV audit log of all cases and a downloadable weekly compliance report.

---

## Requirements

- **Node.js 18+** (20 LTS or newer recommended)
- **PostgreSQL 13+** running locally or reachable over the network
- npm 9+

---

## Setup

### 1. Create the database

```bash
createdb hiitplc
# or: psql -U postgres -c "CREATE DATABASE hiitplc;"
```

### 2. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs the root, `server/` and `client/` dependencies.

### 3. Configure the API

```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and set your PostgreSQL credentials plus a long random `JWT_SECRET`
(`openssl rand -hex 32`). Every variable is described in the table below.

### 4. Create the tables and seed demo data

```bash
npm run db:seed
```

The seed script applies `server/src/schema.sql` and then **wipes and recreates** all portal data:
125 complaints, 7 categories, 1 compliance officer and one demo case with an attachment.
Re-run it any time you want a clean slate.

### 5. Start the app

```bash
npm run dev
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:4001 |
| Admin login | http://localhost:5173/admin/login |

Vite proxies `/api` to `http://localhost:4001`, so no CORS setup is needed in development.

### Demo credentials

| What | Value |
|---|---|
| Tracking code | `HII-7F42K9` |
| Admin email | `admin.officer@hiitplc.com` |
| Admin password | `ChangeMe123!` |

Change the password via **Admin → Settings**, or change `ADMIN_PASSWORD` in `server/.env` before
seeding.

---

## Configuration

All settings live in `server/.env` (see `server/.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4001` | Port the Express API listens on |
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `hiitplc` | Database name |
| `PGUSER` | `postgres` | Database user |
| `PGPASSWORD` | — | Database password |
| `DATABASE_URL` | — | Optional connection string; **takes precedence** over the `PG*` variables if set |
| `JWT_SECRET` | — | **Required.** Signing key for admin tokens; the API exits without it |
| `ADMIN_EMAIL` | `admin.officer@hiitplc.com` | Email of the officer created by the seed script |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Password of that officer (bcrypt-hashed on seed) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Only needed when the client is served from a different origin in production |

The PostgreSQL client library reads the standard `PG*` variables itself, so a `.env` with only
`PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` is all the database configuration required.

---

## npm scripts

Run from the project root.

| Command | What it does |
|---|---|
| `npm run install:all` | Installs root, server and client dependencies |
| `npm run db:seed` | Applies the schema and reseeds demo data (destructive) |
| `npm run dev` | Runs the API (`:4001`) and Vite dev server (`:5173`) together |
| `npm run build` | Builds the client into `client/dist` |
| `npm start` | Runs the API only; serves `client/dist` if it exists |

Server-only: `npm start --prefix server`, `npm run dev --prefix server`, `npm run db:seed --prefix server`.
Client-only: `npm run dev --prefix client`, `npm run build --prefix client`.

---

## API reference

Public endpoints (no authentication):

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/categories` | Categories, centers and occurrence options |
| `GET` | `/api/public/stats` | Average triage hours and published resolution rate |
| `POST` | `/api/complaints` | Submit a complaint (`multipart/form-data`, `files[]` up to 5) |
| `GET` | `/api/track/:ref` | Full public case view for a reference code |
| `POST` | `/api/track/:ref/followup` | Reporter adds information to a case |
| `GET` | `/api/track/:ref/attachments/:id` | Attachment stream (`?download=1` to download) |

Admin endpoints (send `Authorization: Bearer <token>` from `/api/admin/login`, except `login`):

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Exchange email + password for a JWT |
| `GET` | `/api/admin/me` | Current officer profile |
| `POST` | `/api/admin/password` | Change password (`current`, `next`) |
| `GET` | `/api/admin/stats?center=` | Dashboard metrics, category split, priority queue |
| `GET` | `/api/admin/categories` | Category totals / open / resolved |
| `GET` | `/api/admin/complaints` | Paged list (`page`, `pageSize`, `search`, `category`, `status`, `sort`) |
| `GET` | `/api/admin/complaints/:id` | Case detail with events, responses, attachments |
| `PATCH` | `/api/admin/complaints/:id` | Update `status`, `priority`, `escalated` |
| `POST` | `/api/admin/complaints/:id/responses` | Post an official response |
| `GET` | `/api/admin/attachments/:id` | Attachment stream |
| `GET` | `/api/admin/export` | CSV audit log |
| `GET` | `/api/admin/report` | Weekly compliance report (plain text) |

Rate limits: 20 submissions/hour and 80 lookups/15 min per IP on the public side, 10 login
attempts/15 min on the admin side.

---

## Database schema

`server/src/schema.sql` defines seven tables:

| Table | Purpose |
|---|---|
| `admins` | Officer accounts (bcrypt hashes, role) |
| `categories` | Complaint categories with display order |
| `complaints` | Cases, reference code, status, priority, SLA timestamps |
| `complaint_events` | Status-change history driving the lifecycle timeline |
| `responses` | Official replies (`admin`) and reporter follow-ups (`reporter`) |
| `attachments` | Original filename, MIME, size and randomised storage name |
| `settings` | Published figures such as `public_resolution_rate` |

---

## Project structure

```
.
├── package.json            Root scripts (dev, build, seed, install:all)
├── client/
│   ├── index.html
│   ├── vite.config.js      Dev server + /api proxy to :4001
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx         All routes
│       ├── lib/api.js      Fetch wrapper, token storage
│       ├── components/     Layouts, Lifecycle, Thread, Attachments, Art, …
│       └── pages/          Home, Submit, SubmitSuccess, Track, TrackResult, Privacy
│           └── admin/      Login, Dashboard, Complaints, ComplaintDetail, Categories, Settings
└── server/
    ├── .env.example
    ├── uploads/            Uploaded evidence (git-ignored)
    └── src/
        ├── index.js        Express app: helmet CSP, CORS, rate limits, static client
        ├── config.js       Centers, occurrence options, statuses, SLA hours
        ├── db.js           PostgreSQL pool (PG* variables)
        ├── schema.sql      Table definitions
        ├── seed.js         Demo data generator
        ├── lib/            Text cleaning, reference codes, SLA helpers
        └── routes/         public.js, admin.js
```

---

## How anonymity is handled

- No cookies, no accounts and no reporter identity on the public side. The client sends
  `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`.
- The app deliberately logs no requests: no IP address, user agent, or headers are stored.
  The schema has no columns for them.
- Reference codes (`HII-XXXXXX`) are generated with `crypto.randomInt` from a 32-character
  alphabet and are the only way to reach a case.
- Free text is normalised and stripped of zero-width, bidi-control and Unicode "tag"
  characters that could hide a tracking marker.
- Uploaded images are validated by magic bytes and **re-encoded with `sharp`**, which drops
  EXIF/GPS/camera metadata. **PDFs are stored unchanged**, so their metadata is not scrubbed —
  the privacy page tells reporters this.
- Rate limiting uses in-memory counters keyed by IP; nothing is persisted.

---

## Production

```bash
npm run build     # client → client/dist
npm start         # Express serves the API and client/dist on PORT (default 4001)
```

- Serve behind HTTPS and set `CLIENT_ORIGIN` only if the client is on a different origin.
  Since Express serves the built client itself, the app is same-origin by default.
- If a reverse proxy sits in front, **disable its access logs** for this app — otherwise IPs
  and user agents end up in the proxy log, defeating the anonymity design.
- `server/uploads/` is local disk. Back it with persistent storage (or object storage) and
  include it in backups; the database only stores file names.
- Rotate `JWT_SECRET` to invalidate every admin session.
- The health endpoint `/api/health` returns `{ "ok": true }` for load balancer checks.

## Things to know / adapt

- The landing page "Resolution rate" is a demo value stored in `settings.public_resolution_rate`
  (`94.8`). "Average triage" is computed from real data.
- SLA is **first response within 48 hours**, configured by `SLA_HOURS` in `server/src/config.js`.
- There is no UI to create additional officers; insert rows into `admins` (bcrypt hashes) or
  extend the admin routes.
- Landing-page imagery is vector placeholder art in `client/src/components/Art.jsx`.
- `npm run db:seed` is destructive: it truncates every portal table and clears `server/uploads/`.

## Troubleshooting

- **`JWT_SECRET is not set`** — copy `server/.env.example` to `server/.env` and fill it in.
- **`password authentication failed` / `ECONNREFUSED`** — check `PGHOST`, `PGPORT`, `PGUSER`,
  `PGPASSWORD` and that PostgreSQL is running (`pg_isready`).
- **`relation "complaints" does not exist`** — the schema has not been applied; run
  `npm run db:seed`.
- **Port 4001 already in use** — change `PORT` in `server/.env` and update the proxy target in
  `client/vite.config.js` to match.
- **`Could not load the "sharp" module`** — the installed `sharp` binary is for a different OS
  (e.g. `node_modules` copied from Windows into WSL). Reinstall the server dependencies in the
  environment you run the app from: `npm install --prefix server`.
