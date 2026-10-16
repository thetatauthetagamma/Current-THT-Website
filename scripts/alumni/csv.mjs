// CSV parsing and row validation for the alumni import. No dependencies.

// RFC 4180 style parser: quoted fields, escaped quotes (""), CRLF or LF, embedded newlines.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const HEADER_ALIASES = {
  roll: 'roll_number', roll_number: 'roll_number', roll_no: 'roll_number', rollnumber: 'roll_number',
  name: 'name', full_name: 'name',
  email: 'email', email_address: 'email',
  linkedin: 'linkedin_url', linkedin_url: 'linkedin_url', linkedin_link: 'linkedin_url',
  major: 'major',
};

export function normalizeHeader(h) {
  const key = h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return HEADER_ALIASES[key] ?? key;
}

// Canonical form so the same profile always compares equal: https://www.linkedin.com/in/<slug>
export function normalizeLinkedInUrl(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/(^|\.)linkedin\.com$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/^\/in\/([^/]+)/i);
  if (!m) return null;
  let slug;
  try { slug = decodeURIComponent(m[1]); } catch { slug = m[1]; }
  return `https://www.linkedin.com/in/${slug.toLowerCase()}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { valid: [...], skipped: [{ line, reason, name }], missingColumns: [...] }.
// Only rows with linkedin_url, email AND major are processed (per PLAN.md).
export function validateRows(table) {
  const result = { valid: [], skipped: [], missingColumns: [] };
  if (table.length === 0) { result.missingColumns = ['(empty file)']; return result; }
  const headers = table[0].map(normalizeHeader);
  const required = ['linkedin_url', 'email', 'major'];
  result.missingColumns = required.filter((c) => !headers.includes(c));
  if (result.missingColumns.length > 0) return result;

  const seenUrls = new Map();
  const seenEmails = new Map();
  table.slice(1).forEach((cells, idx) => {
    const line = idx + 2;
    const rec = {};
    headers.forEach((h, i) => { rec[h] = (cells[i] ?? '').trim(); });
    const skip = (reason) => result.skipped.push({ line, reason, name: rec.name || '' });

    const missing = required.filter((c) => !rec[c]);
    if (missing.length > 0) return skip(`missing ${missing.join(', ')}`);
    if (!EMAIL_RE.test(rec.email)) return skip('invalid email');
    const url = normalizeLinkedInUrl(rec.linkedin_url);
    if (!url) return skip('invalid LinkedIn profile URL (expected linkedin.com/in/...)');
    const email = rec.email.toLowerCase();
    if (seenUrls.has(url)) return skip(`duplicate LinkedIn URL (same as line ${seenUrls.get(url)})`);
    if (seenEmails.has(email)) return skip(`duplicate email (same as line ${seenEmails.get(email)})`);
    seenUrls.set(url, line);
    seenEmails.set(email, line);
    result.valid.push({ ...rec, email, linkedin_url: url, line });
  });
  return result;
}
