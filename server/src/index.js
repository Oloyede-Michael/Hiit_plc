import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { __dirname, UPLOAD_DIR } from './config.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env first.');
  process.exit(1);
}
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', false);

app.use(
  helmet({
    referrerPolicy: { policy: 'no-referrer' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        frameSrc: ["'self'", 'blob:'],
        objectSrc: ["'self'", 'blob:'],
      },
    },
  })
);
if (process.env.CLIENT_ORIGIN) app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
// Deliberately no request logger: we never record IPs, headers or user agents.

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built client in production
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  if (status >= 500) console.error('Server error:', err.message);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : err.message,
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`HiiT complaint API listening on :${port}`));
