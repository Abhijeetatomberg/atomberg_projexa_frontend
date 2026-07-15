import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const addDaysIso = (iso, n) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  d.setDate(d.getDate() + (parseInt(n, 10) || 0));
  return d.toISOString().slice(0, 10);
};

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const inr = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Compact ₹ lakh/crore formatter for dashboard tiles, e.g. 1250000 → "₹12.5L"
export const lakh = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  return `₹${(v / 1e5).toFixed(1)}L`;
};

// Task status → bucket, mirroring stKey() in the original app
export const taskBucket = (status = '', pct = null) => {
  if (status.startsWith('Completed')) return 'done';
  if (status === 'Delayed') return 'delayed';
  if (status === 'At Risk') return 'atrisk';
  if (status === 'Behind Schedule') return 'behind';
  if (status === 'On Track' || (pct != null && pct > 0)) return 'ontrack';
  return 'ns';
};
