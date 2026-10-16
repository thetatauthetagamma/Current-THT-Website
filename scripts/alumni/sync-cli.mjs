// CLI. Usage: node scripts/alumni/sync-cli.mjs [--limit N] [--userid a,b] [--yes]
// Dry run (no Bright Data call, no writes) unless --yes. Start with --limit 3.
// Exits 1 on any error, or when more than 25% of lookups fail (provider/key problem).
import { loadDotenv } from './env.mjs';
import { createRestClient, runSync, formatReport, shouldFail } from './sync.mjs';

loadDotenv();
const args = process.argv.slice(2);
const val = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const limit = val('--limit') != null ? Number(val('--limit')) : null;
if (limit != null && !(limit > 0)) { console.error('--limit must be a positive number'); process.exit(2); }
const userids = val('--userid')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
const live = args.includes('--yes');

try {
  const db = createRestClient({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY });
  const report = await runSync({ db, userids, limit, live, enrichOptions: { onBatch: ({ done, total }) => console.log(`  ${done}/${total}`) } });
  console.log(formatReport(report));
  if (shouldFail(report)) {
    console.error(`SYNC FAILED: ${report.failed.length}/${report.urls} lookups failed (limit 25%). Check the Bright Data key and account.`);
    process.exitCode = 1;
  }
} catch (e) {
  console.error(`SYNC FAILED: ${e.message}`);
  process.exit(1);
}
