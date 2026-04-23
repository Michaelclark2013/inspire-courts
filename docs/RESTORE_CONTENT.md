# Site Content Restore Runbook

## What happened (2026-04-23)

Symptom: public pages (home, about, facility, etc.) were rendering
only hard-coded fallback copy — "most of the details were missing."

Root cause: two compounding issues —
1. The `site_content` table (migration 0009) never existed in the
   production Turso database. All earlier `npx drizzle-kit push`
   commands during the session had been silently writing to a
   local `local.db` SQLite file because `TURSO_DATABASE_URL`
   wasn't set in the shell (drizzle.config.ts falls back to
   `file:local.db`).
2. `getContent()` caught the "no such table" error and fell
   through to `DEFAULT_CONTENT`, which has sparse placeholder
   copy instead of the full marketing text the site needs.

## Fix applied

1. Applied every pending migration (0000-0017) directly to
   production Turso via a Node script that reads each
   `drizzle/*.sql` and executes its statements, tolerating
   "already exists" errors. Took prod from 7 tables → 36.
2. Seeded `site_content` with the DEFAULT_CONTENT from
   `src/lib/content.ts` so every page has a row.

## To prevent recurrence

Always run drizzle-kit with the env file explicitly loaded:

```bash
# Good — env is injected into the subprocess
node --env-file=.env.local -e "..."
set -a && source .env.local && set +a && npx drizzle-kit push

# Bad — silently falls back to file:local.db
npx drizzle-kit push
```

## Sanity checks

```bash
# Count tables
node --env-file=.env.local --input-type=module -e "
  import { createClient } from '@libsql/client';
  const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const r = await c.execute(\"SELECT count(*) as c FROM sqlite_master WHERE type='table'\");
  console.log('tables:', r.rows[0].c);
"
# Expected: 36 (or more after future migrations).

# Verify public pages have content
curl -s https://inspirecourtsaz.com | grep -c "OFF SZN HOOPS"
# Expected: several hits.
```
