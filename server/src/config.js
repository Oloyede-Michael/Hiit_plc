import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../uploads');

export const CENTERS = [
  'Lagos Central Campus',
  'Abuja Federal Hub',
  'Ibadan Training Center',
  'Port Harcourt Zone',
  'Kano Regional Center',
  'Ikeja Centre',
];

export const OCCURRENCE = {
  last_24h: 'Today / Past 24 Hours',
  this_week: 'Within the past week',
  this_month: 'Within the past month',
  earlier: 'More than a month ago',
};

export const STATUSES = ['new', 'under_review', 'in_progress', 'resolved'];
export const PRIORITIES = ['standard', 'high', 'critical'];
export const SLA_HOURS = 48;
