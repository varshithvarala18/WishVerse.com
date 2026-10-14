import { useEffect, useMemo, useState } from 'react';

const DAY = 24 * 60 * 60 * 1000;

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** "2000-10-20" -> { month: 9, day: 20 } (only month/day matter). */
export function parseBirthday(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { month, day };
}

/** Local midnight of the birthday in `year`; Feb 29 -> Feb 28 in non-leap years. */
function occurrence(year, { month, day }) {
  const d = month === 1 && day === 29 && !isLeap(year) ? 28 : day;
  return new Date(year, month, d, 0, 0, 0, 0);
}

/**
 * state: "today"  – it's the birthday
 *        "open"   – birthday passed within the last 7 days
 *        "locked" – birthday is in the future (target = next occurrence)
 *        "invalid"
 */
export function getBirthdayStatus(dateStr, now = new Date()) {
  const bd = parseBirthday(dateStr);
  if (!bd) return { state: 'invalid', target: null };
  const thisYear = occurrence(now.getFullYear(), bd);
  const diff = now.getTime() - thisYear.getTime();
  if (diff >= 0 && diff < DAY) return { state: 'today', target: thisYear };
  if (diff >= DAY && diff < 8 * DAY) return { state: 'open', target: thisYear };
  const target = diff < 0 ? thisYear : occurrence(now.getFullYear() + 1, bd);
  return { state: 'locked', target };
}

export default function useCountdown(dateStr) {
  const [now, setNow] = useState(() => Date.now());
  const status = useMemo(() => getBirthdayStatus(dateStr, new Date(now)), [dateStr, now]);

  useEffect(() => {
    if (status.state !== 'locked') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status.state]);

  const remaining = status.state === 'locked' && status.target ? Math.max(0, status.target.getTime() - now) : 0;
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    ...status,
    remaining,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
