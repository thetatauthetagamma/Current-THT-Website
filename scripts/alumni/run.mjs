// CLI. Usage:
//   node scripts/alumni/run.mjs validate <alumni.csv>
//   node scripts/alumni/run.mjs enrich <alumni.csv> [--limit N] [--yes]
// `enrich` is a dry run (no API call, no cost) unless you pass --yes. Always start with --limit 3.
import { readFileSync } from 'node:fs';
import { parseCsv, validateRows } from './csv.mjs';
import { enrich } from './enrich.mjs';
import { loadDotenv } from './env.mjs';

const [cmd, file, ...flags] = process.argv.slice(2);
if (!['validate', 'enrich'].includes(cmd) || !file) {
  console.error('Usage: node scripts/alumni/run.mjs <validate|enrich> <alumni.csv> [--limit N] [--yes]');
  process.exit(2);
}
loadDotenv();
const { valid, skipped, missingColumns } = validateRows(parseCsv(readFileSync(file, 'utf8')));
if (missingColumns.length) {
  console.error(`Missing required column(s): ${missingColumns.join(', ')}`);
  process.exit(1);
}
console.log(`${valid.length} rows ready, ${skipped.length} skipped.`);
for (const s of skipped) console.log(`  line ${s.line}${s.name ? ` (${s.name})` : ''}: ${s.reason}`);
if (cmd === 'validate') process.exit(0);

const limitIdx = flags.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(flags[limitIdx + 1]) : valid.length;
const rows = valid.slice(0, limit);
const live = flags.includes('--yes');
const out = await enrich(rows.map((r) => r.linkedin_url), {
  dryRun: !live,
  onBatch: ({ done, total }) => console.log(`  ${done}/${total}`),
});
console.log(`Records: ${out.records}. Free tier: ${out.freeTierRecords}/month (${out.withinFreeTier ? 'within' : 'OVER'}). ` +
  `Pay-as-you-go would be $${out.payAsYouGoUsd}.`);
if (out.dryRun) {
  console.log('DRY RUN: no API call made. Re-run with --yes to spend credits.');
} else {
  for (const r of out.results.values()) {
    console.log(`${r.status.padEnd(7)} ${r.linkedin_url} | ${r.name ?? '-'} | ${r.company ?? '-'} | ` +
      `${r.title ?? '-'} (fresh: ${r.title_fresh}) | ${r.location ?? '-'}${r.error ? ` | ${r.error}` : ''}`);
  }
}
