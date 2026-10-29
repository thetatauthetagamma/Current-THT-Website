// Helpers for the alumni directory. Brothers.year is free text ("2026", "2026(", "202", null),
// so everything here is defensive and never writes back to Brothers.

// First four digits as a number, or null if the value is not a usable year.
export function gradYear(year) {
  const match = /^\s*(\d{4})/.exec(year ?? '')
  return match ? Number(match[1]) : null
}

// Spring commencement is in early May, so from June on the class of this year counts as alumni.
// (Fall graduates are shown as alumni a few months early; Brothers.year has no term.)
const GRADUATION_MONTH = 5 // June, zero-based

// 'current' = still in school, 'alumni' = graduated, 'unknown' = no usable year.
export function classStatus(year, now = new Date()) {
  const y = gradYear(year)
  if (y === null) return 'unknown'
  const graduated = y < now.getFullYear() || (y === now.getFullYear() && now.getMonth() >= GRADUATION_MONTH)
  return graduated ? 'alumni' : 'current'
}

// Only http(s) links are rendered; adds https:// to bare LinkedIn URLs.
export function safeLinkedInUrl(raw) {
  const value = (raw ?? '').trim()
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

// ---- Display standardization. Never written back to Brothers: only how the directory shows and filters values. ----

// Majors are shown spelled out. Keys are lowercase letters/digits only ("Mech E", "MechE" -> "meche").
const MAJOR_ALIASES = {
  'Mechanical Engineering': ['meche', 'me', 'mechanical', 'mechanicalengineering'],
  'Computer Science': ['cs', 'cse', 'comps', 'compsci', 'computerscience'],
  'Computer Engineering': ['ce', 'compe', 'computerengineering'],
  'Electrical Engineering': ['ee', 'electrical', 'electricalengineering'],
  'Civil and Environmental Engineering': ['cee', 'civil', 'civilengineering', 'civilandenvironmentalengineering'],
  'Chemical Engineering': ['cheme', 'che', 'chemical', 'chemicalengineering'],
  'Aerospace Engineering': ['aero', 'areo', 'ae', 'aerospace', 'aerospaceengineering'],
  Mathematics: ['math', 'mathematics', 'honorsmath'],
  'Industrial and Operations Engineering': ['ioe', 'industrial', 'industrialandoperationsengineering'],
  'Naval Architecture and Marine Engineering': ['name', 'navalarchitecture', 'navalarchitectureandmarineengineering'],
  'Materials Science and Engineering': ['mse', 'matscie', 'matsci', 'materialsscience', 'materialsscienceandengineering'],
  'Nuclear Engineering and Radiological Sciences': ['ners', 'nuclear', 'nuclearengineering', 'nuclearengineeringandradiologicalsciences'],
  Robotics: ['rob', 'robotics'],
  'Biomedical Engineering': ['bme', 'biomed', 'biomedicalengineering', 'biomedicalengineer'],
  'Engineering Physics': ['ep', 'engineeringphysics'],
  'Data Science': ['datasci', 'datascience'],
  'Undeclared Engineering': ['undeclaredengineering', 'engineeringundeclared']
}

const MAJOR_LOOKUP = Object.fromEntries(
  Object.entries(MAJOR_ALIASES).flatMap(([label, aliases]) => aliases.map((a) => [a, label]))
)

// "and" inside these full names must not be read as "two majors".
const KEEP_AND = /\b(civil|industrial|naval architecture|materials science|nuclear engineering)\s+and\b/gi
// Split on , / & + and "and", but not inside parentheses.
const MAJOR_SPLIT = /\s*(?:[,/&+]|\band\b)\s*(?![^(]*\))/i

export function cleanText(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

// "mech e / cs" -> ['Mechanical Engineering', 'Computer Science']. Unknown majors are kept (trimmed,
// capitalized if all lowercase).
export function majorsOf(major) {
  return cleanText(major)
    .replace(KEEP_AND, '$1 \u0001')
    .split(MAJOR_SPLIT)
    .map((part) => cleanText(part.replace(/\u0001/g, 'and')))
    .filter(Boolean)
    .map((part) => {
      const known = MAJOR_LOOKUP[part.toLowerCase().replace(/[^a-z0-9]/g, '')]
      if (known) return known
      return part === part.toLowerCase() ? part.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : part
    })
    .filter((m, i, all) => all.indexOf(m) === i)
}

// US numbers become (734) 555-1234; anything else is shown as typed. `tel` is dial-ready.
export function formatPhone(raw) {
  const text = cleanText(raw)
  if (!text) return { display: '', tel: '' }
  const [main, ext] = text.split(/\s*(?:ext\.?|x)\s*/i)
  let digits = main.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10) return { display: text, tel: text.replace(/[^\d+]/g, '') }
  const display = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}${ext ? ` x${ext.replace(/\D/g, '')}` : ''}`
  return { display, tel: `+1${digits}` }
}

// Case-insensitive de-duplication for dropdown values ("Google", "google ", "GOOGLE" -> one entry).
export function uniqueCaseInsensitive(values) {
  const seen = new Map()
  for (const v of values.map(cleanText).filter(Boolean)) {
    const key = v.toLowerCase()
    if (!seen.has(key)) seen.set(key, v)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}
