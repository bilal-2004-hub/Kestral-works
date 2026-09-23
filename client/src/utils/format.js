export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-GB', options).format(new Date(value)) : '—';

export const formatDateTime = (value) =>
  formatDate(value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function timeAgo(value) {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(seconds) >= secondsInUnit) return rtf.format(-Math.round(seconds / secondsInUnit), unit);
  }
  return 'just now';
}

export const readableStatus = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');

export const fileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
