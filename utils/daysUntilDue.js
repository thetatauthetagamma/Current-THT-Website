// Whole days from today to a due date, both read as calendar dates in Detroit time. Replaces moment-timezone
// (about 0.5MB of JS) on the PNM progress page. Returns null when the date is missing/invalid, 0 once it has passed.
export function daysUntilDue(dueDate, now = new Date()) {
  const due = String(dueDate ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Detroit' }).format(now); // YYYY-MM-DD
  const toUtc = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const days = Math.round((toUtc(due) - toUtc(today)) / 86400000);
  return Math.max(days, 0);
}
