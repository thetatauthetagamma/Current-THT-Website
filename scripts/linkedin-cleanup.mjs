// Normalizes stored LinkedIn values in Brothers and Pledges using the same rules as the profile forms.
// DRY RUN by default (prints counts only, no names/urls). Writes only with --apply.
// Usage: node scripts/linkedin-cleanup.mjs [--apply]     (reads .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { loadDotenv } from './alumni/env.mjs'
import { validateLinkedInUrl } from '../utils/alumni.js'

loadDotenv()
const apply = process.argv.includes('--apply')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const log = []
for (const [table, key] of [['Brothers', 'userid'], ['Pledges', 'uniqname']]) {
  const { data, error } = await sb.from(table).select(`${key}, linkedin`)
  if (error) throw new Error(`${table}: ${error.message}`)
  const fixes = [], unfixable = []
  for (const r of data) {
    const raw = r.linkedin ?? ''
    if (!raw.trim()) continue
    const v = validateLinkedInUrl(raw)
    if (!v.ok) unfixable.push({ table, id: r[key], before: raw })
    else if (v.value !== raw) fixes.push({ table, id: r[key], before: raw, after: v.value })
  }
  console.log(`${table}: ${fixes.length} to normalize, ${unfixable.length} need a human`)
  log.push(...fixes, ...unfixable.map(u => ({ ...u, after: null })))
  if (apply) for (const f of fixes) {
    const { error: e } = await sb.from(table).update({ linkedin: f.after }).eq(key, f.id)
    if (e) console.error(`  failed ${f.id}: ${e.message}`)
  }
}
const file = `linkedin-cleanup-${apply ? 'applied' : 'dryrun'}.json` // gitignored, contains real data
writeFileSync(file, JSON.stringify(log, null, 2))
console.log(`${apply ? 'APPLIED' : 'Dry run, nothing written'}. Change log (before/after): ${file}`)
