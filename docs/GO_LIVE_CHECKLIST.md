# Inspire Courts AZ — Go-Live Checklist

Practical checklist to flip the site from soft-launch to public launch.
Work through each item in order. "Blocker" items must be done before
announcing publicly; "Should-do" items can follow within a week.

---

## 🔴 Blockers (must-do before public launch)

### 1. DNS + SSL

- [ ] `inspirecourtsaz.com` CNAME → Vercel (check `www` subdomain too)
- [ ] SSL cert issued by Vercel (automatic once DNS propagates — check in Vercel Dashboard → Domains)
- [ ] Test by hitting `https://inspirecourtsaz.com/` and getting the live home page

### 2. Production environment variables (Vercel → Settings → Env Vars)

**Required — site won't work without these:**

- [ ] `TURSO_DATABASE_URL` — production libsql URL
- [ ] `TURSO_AUTH_TOKEN` — Turso auth token with read+write
- [ ] `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL=https://inspirecourtsaz.com`
- [ ] `ADMIN_EMAIL` — the bootstrap admin email
- [ ] `ADMIN_PASSWORD_HASH` — bcrypt-hash of admin password (`bcrypt.hash(pw, 12)`)

**For Google sign-in + Drive/Sheets integration:**

- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (OAuth consent screen approved)
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (service account with access to the Sheets/Drive)

**For payments — blocker if you want to take money:**

- [ ] `SQUARE_ACCESS_TOKEN` — **production** token (not sandbox)
- [ ] `SQUARE_LOCATION_ID` — the production location
- [ ] `SQUARE_ENVIRONMENT=production`
- [ ] `SQUARE_WEBHOOK_SIGNATURE_KEY` — from Square Dashboard → Webhooks

### 3. Legal pages

- [x] `/privacy` live (committed 2026-11-24)
- [x] `/terms` live (committed 2026-11-24)
- [ ] Have a lawyer review and replace the placeholder `LAST_UPDATED` date
- [ ] Update refund-policy specifics in `/terms` §3 if they differ from the defaults

### 4. Regenerate any existing 8-team+ brackets

If any single-elim tournaments were generated before commit `4d4aebb`
(2026-11-24) and have no live/final games yet, they need regeneration
because the old pairing algorithm placed every team as "1 vs 2":

- [ ] List affected tournaments (admin → tournaments with format = single_elim, status = published)
- [ ] For each: admin → tournament detail → **Reset Bracket** → **Generate Bracket**
- [ ] Tournaments with already-played games need a manual migration — email the on-call developer

---

## 🟡 Should-do (within launch week)

### 5. Email deliverability

- [ ] `GMAIL_USER` + `GMAIL_APP_PASSWORD` set
- [ ] Submit a test `/contact` → confirm email lands, not in spam
- [ ] Submit `/forgot-password` for a real account → reset link arrives
- [ ] Check SPF/DKIM/DMARC on the sending domain

### 6. Analytics + ad retargeting

- [ ] `NEXT_PUBLIC_GA_ID` — GA4 property set up, Search Console linked
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — verified in Search Console
- [ ] Submit sitemap at Search Console: `https://inspirecourtsaz.com/sitemap.xml`
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` if running Facebook/Instagram ads

### 7. Content review

- [ ] Home page hero, Jalen Williams feature, video showcase all render
- [ ] About, Facility, Training, Camps, Prep, Gameday — real copy, no lorem
- [ ] FAQ populated with real answers
- [ ] At least one real upcoming tournament in the DB (admin → tournaments → create)
- [ ] Footer copyright year is current

### 8. Vercel Cron job for member-daily

Our `/api/admin/cron/member-daily` route auto-sends renewal reminders
and unpauses members whose `pausedUntil` has passed. Wire it up in
Vercel → Settings → Cron Jobs:

- [ ] Daily 08:00 America/Phoenix → `GET /api/admin/cron/member-daily`
- [ ] Set `CRON_SECRET` env var (shared between Vercel Cron auth header and the route)
- [ ] Verify it runs by checking Vercel Functions logs the next morning

### 9. Push notifications (optional but improves engagement)

- [ ] Generate VAPID keys at https://vapidkeys.com
- [ ] Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` in Vercel
- [ ] Test from admin → announcements → send notification

### 10. Notion + Mailchimp (optional)

- [ ] `NOTION_API_KEY` + `CHAT_LEADS_DB_ID` — chat widget leads sync to Notion
- [ ] `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` — newsletter subscribers auto-sync

---

## 🟢 Post-launch (within first month)

### 11. Fix the remaining 7 moderate npm CVEs

Requires breaking major bumps:

- [ ] `next-auth` v4 → v5 (biggest refactor — auth config format changes)
- [ ] `drizzle-kit` → 0.18+ (config format change, re-run migrations)
- [ ] `nodemailer` → 8.x (SMTP injection fix, low real risk but clean up)

### 12. Expand test coverage

Current: 181 unit tests on pure functions (tournament engine, rate
limit, session helpers, permissions, standings, csv, sanitize,
calendar, idempotency, JSON helpers, TZ helper).

Worth adding:

- [ ] Square webhook signature verification
- [ ] Member visit quota enforcement (max per month / week)
- [ ] Waiver expiration math
- [ ] Tournament registration payment flow end-to-end (MSW mocks + vitest)

### 13. Error monitoring

- [ ] Sign up for Sentry or similar
- [ ] Wrap `global-error.tsx` to forward uncaught errors
- [ ] Add alert for 5xx rate > 1% over 5 min

### 14. Backups

- [ ] Turso backups — check if auto-snapshots are enabled in Turso Dashboard
- [ ] Schedule a weekly manual `sqlite3 .dump` to an S3 bucket (belt + suspenders)

---

## Smoke test (run after every blocker is checked)

Do these in order on production:

1. Hit `https://inspirecourtsaz.com/` → home renders, no console errors
2. `/tournaments` → real events list renders
3. `/contact` form → submits successfully, you get the notification email
4. `/register` → create a test account
5. Admin → `/admin` → dashboard loads (log in with admin credentials)
6. Admin → Tournaments → create tournament → add teams → generate bracket → verify 1-vs-N pairings are correct
7. `/tournaments/[id]/register` → submit a team → Square checkout opens (or waived path)
8. `/waiver` → sign waiver → admin → Waivers → signed waiver appears
9. `/scores` → live scores render
10. Admin → Waivers → Export CSV → opens in Excel without errors, no formula cells execute

If everything passes, you're public-ready.

---

**Questions / blockers?** Email the dev team and don't ship until
every blocker is green.
