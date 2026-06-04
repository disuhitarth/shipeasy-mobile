const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

const cache = new Map<string, Intl.RelativeTimeFormat>();

function getFormatter(): Intl.RelativeTimeFormat {
  const key = 'en-US';
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
    cache.set(key, fmt);
  }
  return fmt;
}

export function formatRelativeTime(
  target: number | Date | string | null | undefined,
  now: number = Date.now(),
): string {
  if (target == null) return '';
  const t = typeof target === 'number' ? target : new Date(target).getTime();
  if (Number.isNaN(t)) return '';
  const diffSeconds = Math.round((t - now) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 5) return 'just now';
  for (const { unit, seconds } of UNITS) {
    if (abs >= seconds || unit === 'second') {
      const value = Math.round(diffSeconds / seconds);
      return getFormatter().format(value, unit);
    }
  }
  return 'just now';
}

export function formatTimeAgo(target: number | Date | string | null | undefined): string {
  return formatRelativeTime(target, Date.now());
}
