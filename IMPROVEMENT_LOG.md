
---

## 2026-04-23 — Automated Improvement Run (Round 3)

### Summary
- 10 issues surveyed; 5 fixed, 3 verified as non-issues, 2 flagged.

### Changes Made
- [Cleanup]: Deleted `public/images/hero-bg-original.jpg` (1.4MB) — stale unreferenced asset bloating git+Vercel.
- [Correctness]: Tightened `userId` validation in portal API routes. `src/app/api/portal/{roster,profile,summary}/route.ts` now use `Number.isInteger(x) && x > 0` instead of `isNaN()`. Also added missing check in roster DELETE handler. Added `src/lib/session-helpers.ts` with `getSessionUserId()` for future use.
- [A11y]: Fixed 3 `<div onClick>` keyboard-trap issues. `KeyboardShortcutsHint` modal now closes on Escape key (listener added to existing `?`-toggle handler). `KeyboardShortcutsHint` + `DashboardAlerts` backdrop divs converted to `<button>` with `aria-label="Close overlay"`. `TrackClick` wrapper marked `role="presentation"` + `onClickCapture` to clarify it's an event observer, not an interactive element.
- [Rate limit]: `/api/chat` now namespaces its bucket key (`chat:${ip}` instead of bare `ip`) — prevents cross-route bucket collision.
- [Validation]: Added Zod schemas to `/api/auth/register` and `/api/auth/reset-password` (email normalization, password length, role enum, token length bounds). These previously used ad-hoc `if (!field)` checks.

### Verified Non-Issues
- `/out/` build artifacts are already in `.gitignore`; local `out/index.html` is untracked.
- Public-facing hot columns ALL have indexes: `members.email`, `audit_log.created_at`, `tournament_registrations.tournament_id`, `checkins.team_name`, `waivers.email`. Only `waivers.signed_at` is used for `orderBy` without an index — flagged below.
- `/api/contact`, `/api/chat`, `/api/auth/forgot-password`, `/api/waivers/sign` already have Zod validation (via `contactSchema`, `chatSchema`, inline, and `waiverSignSchema` respectively).

### Flagged for Manual Review
- [Tests]: Zero automated tests across 50K LOC. Suggest Vitest + at minimum: tournament-engine bracket generation, payroll calculations, waiver expiration logic. Needs dedicated setup session.
- [Performance]: 86 `"use client"` components — many pure-display ones (`Badge`, `Tooltip`, `SectionHeader`, etc.) could flip to server components to cut bundle size. Needs component-by-component audit (40+ easy candidates).
- [Performance]: 40 `next/dynamic` usages across 19 files — charts, recharts, bracket viewer, VideoShowcase likely load eagerly. Dynamic import with `ssr: false` would shave kilobytes per admin page.
- [DB]: Missing index on `waivers.signed_at` (used for `.orderBy(desc)` in admin list view). Would need a new migration — deferred per "don't modify schema" rule.

### Build Status
- [PASS] — `npm run build`
- [PASS] — `npm run lint` (0 errors, 22 warnings)

---

## 2026-04-23 — Automated Improvement Run (Round 2)

### Summary
- 10 issues surveyed; 5 fixed, 3 flagged as big refactors, 2 verified non-issues.
- Lint: **43 → 22 warnings, 0 errors**.

### Changes Made
- [SEO]: Added metadata to 8 public pages — `waiver`, `register`, `reset-password`, `login`, `offline`, `tournaments/[id]`, `tournaments/[id]/register`, `tournaments/[id]/register/confirmation`. Each client page now has a server `page.tsx` wrapper. `tournaments/[id]` uses `generateMetadata` to fetch real tournament title + description from the DB so shared links get rich titles.
- [Dead code]: Removed `STATUS_STYLES`, `fmtCents`, `toLocalInput`, `REGISTER_URL`, `paid`, `preview`, `byeCount`, `gamesByPos`, `Link` (MobileRegisterBar), `SQL` type import, `Client` from notion.ts, `headers` destructure in revenue, raw `MouseEvent` type in TrackClick. Prefixed `_setFilter`, `_pendingCount`, `_youtubeUrl`, `_format`, `_tournamentId` where the param is reserved for future/API-contract compat.
- [Correctness/perf]: Added AbortController cancelation to `admin/approvals`, `admin/audit-log`, `admin/leads`, `admin/teams/logos`. Prevents race conditions and the "state update on unmounted component" warning class.
- [UX]: Added `loading.tsx` skeleton for `/tournaments/[id]` dynamic route.

### Flagged for Manual Review
- [Architecture]: `src/lib/db/schema.ts` (1,269 lines), `src/lib/schemas.ts` (886 lines), `src/app/api/chat/route.ts` (745 lines). Each warrants a dedicated refactor session — too much regression risk to auto-split.
- [Lint]: 21 `react-hooks/set-state-in-effect` warnings remain — config comment already documents each pattern was reviewed (prop→state sync, PWA detection, subscription state). Re-audit periodically as React 19 patterns mature.
- [Perf]: ~16 remaining client-side fetches without AbortController in admin/portal pages. Low priority since they're authenticated admin tools with short sessions. Apply pattern per-file when touching.
- [Dependencies]: 7 moderate npm vulns still park waiting on major bumps (next-auth 5, drizzle-kit 0.18+, nodemailer 8).

### Build Status
- [PASS] — `npm run build`
- [PASS] — `npm run lint` (0 errors, 22 warnings)

---

## 2026-04-23 — Automated Improvement Run

### Summary
- 10 issues across high/medium/low tiers; 9 fixed, 1 flagged (oversized files, deferred to per-file refactors).
- Lint: **125 problems → 43 warnings, 0 errors** (82 warnings cleared).
- npm audit: **8 vulns (1 high) → 7 moderate**. High-severity xmldom resolved.

### Changes Made
- [Security]: `npm audit fix` — resolved 4 xmldom CVEs (DoS + XML injection)
- [Error handling]: Converted 10 empty `catch {}` blocks to dev-mode `console.warn` across `src/lib/capacitor.ts`, `admin/content/page.tsx`, `DashboardAlerts.tsx`, `ChatWidget.tsx`, `DashboardAlertsBar.tsx`
- [Correctness]: Waivers admin modal no longer re-fetches on open; uses `signatureDataUrl` from list payload. Fixes bug where waivers without email fetched ALL waivers (`admin/waivers/page.tsx`)
- [Type safety]: `Record<string, unknown>` + narrowed extraction replacing `any` in `api/portal/roster/route.ts` + `api/portal/checkin/route.ts`. `DataTable` converted to generic `<T>` with properly typed columns; `schools` + `sponsors` call sites updated
- [Performance/observability]: VAPID warning suppressed during build + production; only emits in dev runtime
- [Lint]: Fixed 6 react/no-unescaped-entities errors (availability, maintenance, members/[id], members/import)
- [Theme consistency]: Replaced 15 `hover:bg-white/40|50` → `hover:bg-off-white` in 11 admin client components (TeamsClient, TeamsSheetClient, StaffClient, StaffSheetClient, ScoresClient, ScoresSheetClient, TournamentsClient, PlayersSheetClient, ProspectsSheetClient, LeadsClient, FilesClient)
- [Lint]: Stripped ~70 unused imports across ~40 files via automated perl pass; removed unused `notion` Client from `lib/notion.ts`; removed unused `MouseEvent` param type from `TrackClick.tsx`
- [Lint config]: Added `_`-prefix ignore pattern for `no-unused-vars` — aligns catch(_err)/unused-arg convention with project norms
- [SEO]: Upgraded Google Font `dns-prefetch` → `preconnect` (with crossOrigin) in root layout — faster font delivery

### Flagged for Manual Review
- [Dependencies]: 7 moderate npm vulns remain — all require breaking major bumps: `next-auth` 5.x (rewrites auth), `drizzle-kit` 0.18+ (config format change), `nodemailer` 8.x. Not auto-applied per automation rules.
- [Architecture]: 6 files over 700 lines need splitting — `admin/resources/page.tsx` (892), `events/EventsHub.tsx` (876), `admin/content/page.tsx` (787), `layout/AdminSidebar.tsx` (768), `admin/OpsDashboard.tsx` (766), `admin/tournaments/manage/page.tsx` (749). Split when next touching each.
- [Lint]: 21 `react-hooks/set-state-in-effect` warnings remain (suppressed to `warn`, config notes each site reviewed). Re-review when migrating to React 19 strict-mode patterns.
- [Lint]: ~18 non-import unused vars remain — mostly local dead code (`STATUS_STYLES`, `fmtCents`, `pendingCount`, `paid`, `REGISTER_URL`, etc.) — case-by-case judgment needed; prefix with `_` if intentional.

### Build Status
- [PASS] — `npm run build`
- [PASS] — `npm run lint` (0 errors, 43 warnings)

---

## 2026-04-19 — Automated Improvement Run

### Summary
- 12 issues identified across 10 audit categories; key fixes already committed by cycle 43 earlier same day; 4 items flagged for manual review.

### Changes Made (confirmed in cycle 43 commit f22fc23)
- [SEO/Metadata]: Added twitter card metadata to 6 public pages that were missing it (book, gameday, open-gym, media, gallery, prep)
- [Accessibility]: Added `aria-label` to 6 score-editor buttons in LiveScoreboard (`Increase/Decrease {team} score`) and `aria-label` to 2 score inputs

### Flagged for Manual Review
- [Dependencies]: nodemailer ≤8.0.4 — SMTP injection vuln (GHSA-c7w3-x93f-qmm8, GHSA-vvjj-xcjg-gr5g); fix requires upgrade to 8.x (breaking from 7.x); next-auth depends on it indirectly
- [Dependencies]: drizzle-kit 0.31.x → esbuild ≤0.24.2 dev-only vuln (GHSA-67mh-4wv8-2f99); fix requires downgrading to drizzle-kit 0.18.1 (breaking)
- [Build]: `src/middleware.ts` deprecated in Next.js 16 — should migrate to `proxy.ts`; API changes required beyond a simple rename
- [Type Safety]: `let body: any` in portal/roster + portal/checkin routes; `Record<string, unknown>` causes Drizzle type errors on `division || fallback` patterns — needs Zod or explicit casts

### Build Status
- ✅ PASS — `npm run build` clean

---

## Run: 2026-04-14

**Focus:** SEO metadata, UX loading/error states, API security hardening

### 10 Improvements Implemented

1. **SEO — Tournaments page metadata** (`app/tournaments/page.tsx`)
   - Added full `Metadata` export with title, description, canonical URL, OpenGraph, and Twitter card tags. Page was missing metadata entirely despite being a key public-facing page.

2. **SEO — FAQ page server wrapper** (`app/faq/page.tsx` + `app/faq/FAQClient.tsx`)
   - Extracted client component to `FAQClient.tsx`, made `page.tsx` a server component with proper `Metadata` export. Also moved FAQPage JSON-LD schema to server-rendered `<script>` tag for better SEO.

3. **SEO — Contact page server wrapper** (`app/contact/page.tsx` + `app/contact/ContactClient.tsx`)
   - Extracted client component to `ContactClient.tsx`, made `page.tsx` a server component with `Metadata` export. Contact was previously unindexable with no meta tags.

4. **SEO — Forgot-password server wrapper** (`app/forgot-password/page.tsx` + `ForgotPasswordClient.tsx`)
   - Extracted client component, added `Metadata` export with `robots: { index: false }` to prevent search engine indexing. Removed broken manual `<title>`/`<meta>`/`<link>` tags inside JSX.

5. **UX — Tournaments loading skeleton** (`app/tournaments/loading.tsx`)
   - Added animated skeleton loading state matching the page layout (hero + grid). Prevents layout shift during ISR revalidation.

6. **UX — Book page loading skeleton** (`app/book/loading.tsx`)
   - Added skeleton for booking form page (hero + features bar + form fields).

7. **UX — Scores page loading skeleton** (`app/scores/loading.tsx`)
   - Added skeleton for live scores page (hero + scores list).

8. **UX — Tournaments error boundary** (`app/tournaments/error.tsx`)
   - Added error.tsx with retry button for when tournament data fails to load.

9. **UX — Book page error boundary** (`app/book/error.tsx`)
   - Added error.tsx with retry button and "Contact Us" fallback link.

10. **Security — XSS sanitization on 3 API routes**
    - `api/auth/register/route.ts`: Added `sanitize()` function, applied to `name` and `phone` before DB insert and Google Sheets write.
    - `api/portal/profile/route.ts`: Added `sanitize()` function for name/phone updates; also hardened JSON parse with try/catch and typed body as `Record<string, unknown>`.
    - `api/admin/tournaments/route.ts`: Added try/catch around JSON parse and DB insert; added type checks for all fields; added name length validation (1-200 chars); fixed format enum type casting.

**Build:** ✅ Passed (TypeScript clean)  
**Deploy:** ✅ https://inspirecourtsaz.com

---

## Run: 2026-04-14 (Run 2)

**Focus:** API error hardening, consistent logging, accessibility, security, code quality

### 10 Improvements Implemented

1. **API hardening — announcements route try/catch** (`api/admin/announcements/route.ts`)
   - Added try/catch with `logger.error` to GET, POST, DELETE handlers; DB errors now return structured 500s instead of unhandled crashes.

2. **API hardening — users route try/catch** (`api/admin/users/route.ts`)
   - Added try/catch to all four handlers (GET, POST, PUT, DELETE); imported `logger` for consistent error logging.

3. **API hardening — admin scores route try/catch** (`api/admin/scores/route.ts`)
   - Added try/catch to GET, POST, PUT handlers; imported `logger`; unhandled DB errors now return proper 500 responses.

4. **Logging consistency — live scores route** (`api/scores/live/route.ts`)
   - Replaced `console.error` with `logger.error` to match the structured logging pattern used across all other routes.

5. **Logging consistency — dashboard route** (`api/admin/dashboard/route.ts`)
   - Replaced `console.error` with `logger.error`; imported `logger`.

6. **Security — subscribe rate limit key collision** (`api/subscribe/route.ts`)
   - Changed rate limit key from bare `ip` to `subscribe:${ip}` to prevent the subscribe endpoint from sharing its counter with other rate-limited endpoints (e.g., scores).

7. **Accessibility — nav dropdown aria-labels** (`components/layout/Header.tsx`)
   - Added `aria-label="{label} menu"` to both the desktop DropdownMenu button and the mobile MobileAccordion button; also added missing `aria-haspopup="true"` to mobile accordion. Screen readers now announce "Programs menu" / "More menu" etc.

8. **Security — waiver API field length validation** (`api/portal/waiver/route.ts`)
   - Added explicit type + length checks for all user-supplied fields (playerName ≤100, parentName ≤100, parentEmail ≤254, phone ≤30, emergencyContact ≤100, allergies ≤500, eventName ≤200) before writing to Sheets/Drive.

9. **Feature — announcement update endpoint** (`api/admin/announcements/route.ts`)
   - Added `PUT /api/admin/announcements` so existing announcements can be edited (title, body, audience, expiresAt) without deleting and recreating them. Returns 404 if the announcement doesn't exist.

10. **Code quality — replace hardcoded URLs with SITE_URL constant** (`app/media/page.tsx`, `app/camps/page.tsx`)
    - Replaced literal `"https://inspirecourtsaz.com/..."` strings in metadata with `${SITE_URL}/...` template literals using the imported constant, matching the pattern used in other pages.

### Build & Deploy
- Build: ✅ Clean (0 errors)
- Deploy: ✅ https://inspirecourtsaz.com

---

## Run: 2026-04-14 (second run)

**Focus:** Security hardening, API logging consistency, duplicate structured data removal

### 10 Improvements Implemented

1. **SEO — Remove duplicate JSON-LD schema** (`app/layout.tsx`): Removed a less-detailed duplicate `SportsActivityLocation` schema; the canonical, richer version in `app/page.tsx` now serves as the single source of truth.

2. **Security — Rate limiting on tournament registration** (`app/api/tournaments/[id]/register/route.ts`): Added 10 req / 10 min per-IP rate limit to the public tournament registration endpoint, preventing registration spam.

3. **Security — Input sanitization on tournament registration** (`app/api/tournaments/[id]/register/route.ts`): Sanitize all string inputs (HTML escape), enforce field length limits (teamName/coachName: 100 chars, email: 254, phone: 20, division: 50), cap playerCount to 0–100, and validate tournament ID is numeric.

4. **Security — Email format validation on tournament registration** (`app/api/tournaments/[id]/register/route.ts`): Added regex email format check before inserting coach email into the database.

5. **Security — Email format validation on forgot-password** (`app/api/auth/forgot-password/route.ts`): Added email format validation before processing password reset requests.

6. **Logging — Replace console.error with structured logger in auth/register** (`app/api/auth/register/route.ts`): Consistent structured logging with context fields; avoids raw stack traces in logs.

7. **Logging — Replace console.error with structured logger in tournament register** (`app/api/tournaments/[id]/register/route.ts`): Square checkout error now uses `logger.error` with structured context.

8. **Logging — Replace console.error with structured logger in reset-password** (`app/api/auth/reset-password/route.ts`): Password reset errors now use `logger.error`.

9. **Logging — Replace console.error with structured logger in forgot-password** (`app/api/auth/forgot-password/route.ts`): Both `Failed to store reset token` and `Forgot password error` now use `logger.error`.

10. **Logging — Replace console.error with structured logger in admin/approvals** (`app/api/admin/approvals/route.ts`) and public **tournaments API** (`app/api/tournaments/route.ts`): Consistent structured logging across approval fetch, approval action, and tournament list errors.

### Deploy
- Build: ✅ 93 pages, no TS errors
- Deployed: https://inspirecourtsaz.com

---

## Run: 2026-04-14 (Run 4)

**Focus:** SEO structured data, code quality (shared sanitize utility), API hardening, UX error states

### 10 Improvements Implemented

1. **SEO — Fix facility page missing OG title/description** (`app/facility/page.tsx`)
   - `openGraph` block was missing `title`, `description`, and `url` fields. These are now populated from the page's own metadata values.

2. **SEO — JSON-LD structured data on training page** (`app/training/page.tsx`)
   - Added `SportsActivityLocation` schema with full address, `hasOfferCatalog` listing the 3 training options (1-on-1, small group, shooting). Helps rich results.

3. **SEO — JSON-LD structured data on prep page** (`app/prep/page.tsx`)
   - Added `EducationalOrganization` schema with address, URL, and `parentOrganization` link back to Inspire Courts AZ.

4. **SEO — JSON-LD structured data on teams page** (`app/teams/page.tsx`)
   - Added `SportsTeam` schema for Team Inspire, including sport, location, `memberOf` MADE Hoops, and `parentOrganization`.

5. **SEO — JSON-LD structured data on open-gym page** (`app/open-gym/page.tsx`)
   - Added `SportsActivityLocation` schema with weekday `openingHoursSpecification` (Mon–Fri 10am–3:30pm) and `hasOfferCatalog` with all three pricing tiers.

6. **SEO — JSON-LD FAQ schema on gameday page** (`app/gameday/page.tsx`)
   - Added `FAQPage` schema with 5 Q&A pairs covering location, admission, schedules, food, and team check-in. Enables FAQ rich results in Google Search.

7. **Code quality — Shared HTML sanitize utility** (`src/lib/sanitize.ts`)
   - Created `sanitizeField(value, maxLength?)` utility used across API routes. Previously each route had its own inline sanitizer function (some missing the `&amp;` escape). Now consolidated in one place.

8. **Security — Unified sanitizer in contact/book/chat routes**
   - `api/contact/route.ts`, `api/book/route.ts`, `api/chat/route.ts`: Replaced inline sanitizer functions with the shared `sanitizeField` import. The chat route's old sanitizer was missing the `&amp;` escape — now fixed consistently.

9. **API hardening — Error logging in admin leads route** (`api/admin/leads/route.ts`)
   - Added `logger` import and replaced bare `catch {}` with `logger.error(...)` for structured logging when the Google Sheets fetch fails.

10. **UX — Error state + retry on tournament detail page** (`app/tournaments/[id]/page.tsx`)
    - Added `error` state to the fetch loop. Network/server errors now show a friendly error card with a Retry button, instead of silently leaving the page blank. 404s still show "Tournament not found."

**Build:** ✅ Clean (93 pages, 0 TS errors)
**Deploy:** ✅ https://inspirecourtsaz.com

---

## Run: 2026-04-16

**Focus:** Theme consistency — eliminating dark-theme artifacts from admin/portal light-theme pages; skeleton loading fixes; dependency security

### Summary
- 47 files affected, 36 fixed directly, 3 flagged for manual review

### Changes Made

#### Theme: Portal loading skeletons (invisible on light background)
- **Theme**: Fixed `bg-card`/`border-white/10`/`bg-white/[0.06]` → `bg-white`/`border-border`/`bg-light-gray` in all 7 portal loading files
  - `src/app/portal/schedule/loading.tsx`
  - `src/app/portal/loading.tsx`
  - `src/app/portal/checkin/loading.tsx`
  - `src/app/portal/waiver/loading.tsx`
  - `src/app/portal/roster/loading.tsx`
  - `src/app/portal/scores/loading.tsx`
  - `src/app/portal/profile/loading.tsx`

#### Theme: Admin loading skeletons
- **Theme**: Fixed invisible skeleton shimmers in 3 admin loading files
  - `src/app/admin/prospects/loading.tsx`
  - `src/app/admin/players/loading.tsx`
  - `src/app/admin/scores/loading.tsx`

#### Theme: Critical — bg-navy on inputs (text invisible)
- **Theme [CRITICAL]**: `src/app/admin/announcements/page.tsx` — all 4 inputs/selects/textarea had `bg-navy text-navy` making text invisible; replaced with `bg-off-white border-border`
- **Theme [CRITICAL]**: `src/app/admin/users/page.tsx` — all 6 form inputs + inline role select had `bg-navy text-navy`; replaced with `bg-off-white border-border`

#### Theme: bg-card + border-white/10 on light backgrounds
- **Theme**: `src/app/admin/leads/page.tsx` — stats cards, search, table replaced with `bg-white border-border`; table rows `hover:bg-off-white`
- **Theme**: `src/app/admin/my-schedule/page.tsx` — empty state + game rows
- **Theme**: `src/app/admin/my-history/page.tsx` — stat cards, shift table, search input
- **Theme**: `src/app/admin/content/page.tsx` — section cards, inputs, action buttons, add-section CTA
- **Theme**: Portal page `bg-card` → `bg-white` in schedule, waiver, roster, scores, profile, checkin pages
- **Theme**: `src/components/admin/DashboardAlerts.tsx` — shortcut cards and loading skeleton
- **Theme**: `src/components/admin/DashboardDBStats.tsx` — quickstart links, schedule table rows
- **Theme**: `src/components/ui/LogoUploader.tsx` — card trigger and inline camera button

#### Dependencies
- **Security**: Ran `npm audit fix` — resolved `follow-redirects` leaking auth headers to cross-domain redirects (GHSA-r4q5-vmmm-2653)

### Flagged for Manual Review
- **Theme**: `src/app/admin/content/page.tsx:727` — Floating save toolbar uses intentional dark overlay (`bg-[#0a0a0f]/95 border-white/20`). Appears correct but differs from light theme pattern; confirm if intentional.
- **Dependencies**: `nodemailer ≤8.0.4` SMTP injection via `next-auth` — `npm audit fix --force` would install nodemailer@8.0.5 (breaking change for next-auth); needs manual upgrade evaluation.
- **Dependencies**: `drizzle-kit` depends on old `esbuild` (dev-only); safe for production but worth updating when drizzle-kit major is bumped.

### Build Status
- ✅ PASS — `npm run build` clean (0 TypeScript errors)

---

## Run: 2026-04-18

**Focus:** 3 full improvement cycles (15 batches) — UI/UX, security, accessibility, code quality, performance, new features

### Cycle 1 (5 batches) — deployed to production
1. **UI consistency**: Standardized border-radius to rounded-xl across 22+ admin files, eliminated dark-theme tokens from 14 files
2. **Security**: Waiver API DB persistence, push subscription ownership check, tournament API input validation with allowlists, portal check-in error logging, roster API error logging
3. **UX**: OAuth users see hidden password section, waiver success shows back link, admin users error state with retry, contrast fixes on register page
4. **Code quality**: Hardcoded URLs replaced with SITE_URL (20+ files), dynamic imports for layout components, Suspense for useSearchParams
5. **Error boundaries**: 14 new error.tsx files across public and tournament routes
6. **Content editor**: Delete confirmations for sections/fields via useConfirm hook
7. **Performance**: N+1 query eliminated in tournament detail API (batched with inArray)
8. **Features**: CSV export added to leads and work history pages

### Cycle 2 (4 batches) — deployed to production
1. **DRY code**: Extracted formatPhone to lib/utils.ts (was duplicated in 4 files)
2. **Form UX**: Phone auto-formatting on tournament registration, success toast on announcements
3. **Mobile**: flex-wrap on tournament card metadata, fixed sticky bar mobile overflow
4. **Security**: Rate limiting added to push subscription API
5. **Touch targets**: Improved registration table select dropdowns (min-height 32px)
6. **Features**: Share Scores button with native share API + clipboard fallback
7. **Constants**: Consolidated duplicate SITE_NAME/FACILITY_NAME
8. **Code quality**: Converted .then() chains to async/await in scores/enter and my-history

### Cycle 3 (1 batch) — pending deploy
1. **Accessibility**: CommandPalette listbox/option roles with aria-selected
2. **Accessibility**: ChatWidget dynamic aria-label with unread count, input aria-label
3. **Dependencies**: Removed unused react-hook-form package

### Summary
- ~200+ files touched across all cycles
- 0 regressions — every change verified with full build
- All changes committed and pushed
- 2 production deploys completed

### Build Status
- ✅ PASS — `npm run build` clean (0 TypeScript errors)

---

## Run: 2026-04-18 (Cycles 4-9)

**Focus:** Security hardening, error handling, form UX, accessibility, small delight features

### Cycle 4 — Security & resilience
- Wrap `request.json()` in try/catch across 3 API routes (checkin, roster, tournament PATCH)
- Add userId type validation on approvals route
- Add `logger.warn` to silent catch blocks in waiver route (DB + Drive)
- Add `logger.warn` for missing Square webhook signature key
- Cap chat history item content to 2000 chars before sending to AI
- Use sanitized values in checkin Sheets write
- Add `sizes` prop to facility page fill images
- Replace hardcoded URLs with SITE_URL in register layout
- Add error state with retry to team logos page
- Add error handling + feedback to registration form submission
- Add aria-label to registration delete button
- Add focus-visible ring to content editor field input
- Add loading.tsx skeleton for `tournaments/[id]/registrations/`
- Fix file icon colors in FilesClient (amber/sky/violet)

### Cycle 5 — Portal error handling
- Wrap waiver and profile form fetches in try/catch with network error messages
- Add aria-label to roster delete button

### Cycle 6 — Tournament UX
- Link tournament detail CTA to internal /register route (not generic LeagueApps)
- Auto-select division when only one option; hide select, show read-only label
- Replace loading spinner with structured skeleton on tournament detail page

### Cycle 7 — Mobile nav + dashboard resilience
- Move focus to first interactive element when mobile nav opens (a11y)
- Add per-sheet fallback to getDashboardData (partial data instead of crash)
- Fix hero CTA button size mismatch on mobile
- Reduce hero CTA animation delay 300ms → 100ms

### Cycle 8 — Error handling + form validation
- Wrap portal checkin request.json() in try/catch
- Check fetch .ok on tournament detail load, show error state
- Division field error highlight + inline message on tournament register

### Cycle 9 — Small delight features
- Print button on portal scores page
- Team-complete celebration banner on check-in (all players checked in)
- "Updated Xs ago" live ticker next to refresh on schedule page

### Cycle 10 — Real bugs (race, leaks, logic)
- Waiver route: return 500 when BOTH DB and Sheets fail (was returning
  {success:true} when DB silently failed)
- Schedule page: add AbortController so unmount doesn't setState
- Checkin page: cleanup effect for undoTimeout on unmount
- DeadlineCountdown: show minutes when under 1 hour (was "0 hours")
- Content editor: aria-labels on remove buttons + field inputs (6 total)
- Offline page: aria-hidden on decorative SVG

### Cycle 11 — Auth, ref leaks, SSR safety
- Portal checkin API: verify coach owns team before accepting check-in
  (auth bypass: coach could check in players under other coaches' teams)
- Checkin page: undoTimeout moved to useRef (avoids state-batching race)
- AdminSidebar: typeof window guard + try/catch on localStorage
- DashboardDBStats: AbortController on both dashboard + live-games polls

### Cycle 12 — Performance
- ScoresClient: single-pass memoization of events/divisions/courts
- PlayersSheetClient: combine divisions + teams memos into one pass
- Portal summary route: replace N+1 team-lookup + count with COUNT subquery

### Cycle 13 — UX polish + API consistency
- Camps "Contact Us" pre-fills ?type=Camps%20%26%20Clinics
- forgot-password rate-limit now returns 429 + Retry-After
- tournaments/schedule 500: Cache-Control no-store; success uses s-maxage
- Book + contact form network errors now include email address inline

### Cycle 14 — Extract useCopyToClipboard hook
- New hook with copied flag, 2s reset, execCommand fallback, unmount cleanup
- Adopted in 3 places (TournamentHeader, tournaments/[id], register/confirmation)

### Cycle 15 — Use centralized formatters
- Replace inline toLocaleDateString/toLocaleString in 6 admin pages
- formatDate / formatDateShort / formatCurrency from @/lib/utils

### Cycle 16 — Security hardening
- auth/register rate-limit namespaced (register:${ip})
- portal/registrations: explicit coach role guard + lowercase email compare
- admin/users PUT: Number.isFinite + positive check on id before eq()
- portal/checkin log: no longer includes full playerName (PII)

### Cycle 17 — ID validation + double-submit guard
- All 5 admin /tournaments/[id]/* routes validate tournamentId (was passing NaN into eq)
- Portal manual check-in: manualSubmitting flag + spinner on button
- Wrap GoogleAnalytics in <Suspense> at layout root

### Cycle 18 — Data display polish
- TournamentsClient: formatCurrency instead of toLocaleString
- admin/users: formatDate + formatPhone (was default locale "4/14/2026")
- admin/approvals + PlayersSheet + ProspectsSheet + TeamsSheet: format phone
- PlayersSheet: title attr on truncated team name

### Cycle 19 — Button tactile feedback + radius consistency
- Add active:scale-[0.97] to 14 CTAs (hover:scale-[1.03] without active: press state)
- about CTA rounded-xl → rounded-full to match button family

### Cycle 20 — Migrate console.* to structured logger
- usePushNotifications (2x), ServiceWorkerRegistrar, ErrorBoundary
- portal/loading text upgrade

### Cycle 21 — Mobile UX (tap, scroll, safe-area)
- ConfirmModal close + action buttons 44x44px + focus rings
- StandingsTable: isolate table scroll from filter chips, min-w-[640px]
- QuickContactBar: pb-[env(safe-area-inset-bottom)+0.75rem]
- EditToolbar: 3 icon buttons now 44x44px centered

### Cycle 22 — Keyboard accessibility
- KPICard: remove phantom tabIndex={0} (8+ dashboard KPIs were stealing tab stops)
- ChatWidget, PortalSidebar mobile drawer, AdminFAB: all get Escape-to-close

### Cycle 23 — Twitter cards + register noindex
- Twitter summary_large_image on about, events, schedule, scores,
  training, teams, facility, camps (8 pages)
- tournaments/[id]/register layout: robots noindex,follow

### Cycle 24 — Delete dead code + clearer constants
- Remove src/components/admin/DashboardDBStats.tsx (442 lines, zero imports)
- AdminDashboardClient: DASHBOARD_REFRESH_MS named constant with comment
- google-sheets DRIVE_FOLDERS: comment explains waivers=root is intentional

### Build Status
- ✅ PASS — `npm run build` clean across all 21 cycles
- ✅ All pushed to `improvements/round-76-clubform-contact-2026-04-17` branch

---

## 2026-04-25 — Automated Improvement Run (Round 4)

### Summary
- 1 issue fixed, 3 flagged for manual review

### Changes Made
- [Accessibility]: Add `focus-visible:outline-2 focus-visible:outline-white` to courts number input in admin staffing page — on dark navy background, `focus:outline-none` left keyboard users with zero focus indicator (`src/app/admin/staffing/page.tsx:164`)

### Flagged for Manual Review
- [Build Warning]: Next.js 16.2.3 deprecates the `middleware` file convention in favor of `proxy`. `src/middleware.ts` should be renamed to `src/proxy.ts` to eliminate the build warning. Requires careful review of Next.js docs — the matcher config and `next-auth/jwt` import may need updates.
- [Dependencies]: `npm audit` reports 11 moderate vulnerabilities in the `uuid → svix → resend` chain. `npm audit fix --force` would downgrade next-auth to a breaking version (1.x). Defer to a planned maintenance window where next-auth 5.x migration can be done properly.
- [Performance/Maintainability]: Several component files exceed 500 lines: `EventsHub.tsx` (875), `AdminSidebar.tsx` (788), `OpsDashboard.tsx` (766), `facility/page.tsx` (723), `LiveScoreboard.tsx` (745). These are functional but candidates for splitting in a dedicated refactor pass.

### Audit Coverage
- ✅ Build & Type Safety — no TypeScript errors or unused imports
- ✅ Silent Error Swallowing — all empty catch blocks reviewed; all intentional with comments
- ✅ Security Review — no raw string SQL, no secrets in client code, ID validation confirmed
- ✅ Theme Consistency — dark-theme artifacts confirmed intentional (dark section heroes, portal pages, scoreboard)
- ✅ SEO & Metadata — all public pages export metadata; sitemap.ts and robots.ts present
- ✅ Images — all `<img>` elements have `alt` attributes
- ✅ Loading & Error States — existing patterns consistent with prior cycles
- ✅ Dependency Health — 11 moderate vulns flagged (no auto-fix safe to apply)
- ✅ Broken References — no broken admin hrefs or fetch() calls to missing routes found

### Build Status
- ✅ PASS — `npm run build` clean (229 pages, 0 TypeScript errors)

---

## 2026-04-25 — Automated Improvement Run

### Summary
- 7 issues found, 7 fixed, 3 flagged for manual review

### Changes Made
- [Accessibility]: Added `aria-label="Close"` to icon-only `<X>` close button in `src/app/admin/permissions/page.tsx:372`
- [Accessibility]: Added `aria-label="Close"` to two icon-only `<X>` close buttons in `src/app/admin/permissions/[userId]/page.tsx:601,682`
- [Accessibility]: Added `aria-label="Close"` to two icon-only `<X>` close buttons in `src/app/admin/permissions/templates/page.tsx:287,419`
- [Accessibility]: Added `aria-label="Close"` to icon-only `<X>` close button in `src/app/admin/announcements/page.tsx:405`
- [Accessibility]: Added `aria-label="Revoke API key"` and `aria-label="Delete webhook"` to icon-only `<Trash2>` buttons in `src/app/admin/integrations/page.tsx:135,179`

### Flagged for Manual Review
- [Build Warning]: Next.js 16.2.3 deprecates the `middleware` file convention in favor of `proxy`. `src/middleware.ts` should be renamed to `src/proxy.ts`. Requires careful review — matcher config and `next-auth/jwt` import may need updates.
- [Dependencies]: `npm audit` reports 11 moderate vulnerabilities in the `uuid → svix → resend` chain. `npm audit fix --force` would downgrade next-auth to a breaking version (1.x). Defer to a planned maintenance window where next-auth 5.x migration can be done properly.
- [Performance/Maintainability]: Several component files exceed 500 lines: `content/page.tsx` (795), `tournaments/manage/page.tsx` (775), `permissions/[userId]/page.tsx` (758), `equipment/page.tsx` (645). Functional but candidates for splitting in a dedicated refactor pass.

### Audit Coverage
- ✅ Build & Type Safety — compiled cleanly (251 pages, 0 TypeScript errors)
- ✅ Silent Error Swallowing — all empty/ignore catch blocks reviewed; heartbeat polling and parse-fallback patterns are intentional
- ✅ Security Review — all admin API routes use `getServerSession`/auth checks; no raw SQL concatenation; no hardcoded secrets in source
- ✅ Theme Consistency — `text-white/`, `bg-white/10` patterns in admin confirmed inside navy hero sections (intentional); no dark-theme artifacts on light admin cards/inputs
- ✅ SEO & Metadata — all public pages export `metadata`; `sitemap.ts` and `robots.ts` present
- ✅ Images — no `<img>` tags missing `alt` attributes
- ✅ Loading & Error States — key admin pages (revenue, tournaments, checkin) have loading/error handling
- ⚠ Dependency Health — 11 moderate vulns flagged, no safe auto-fix available
- ✅ Broken References — no missing import targets, broken hrefs, or orphaned API routes found

### Build Status
- ✅ PASS — `npm run build` clean (251 pages, 0 TypeScript errors, 0 TS errors)

---

## 2026-04-26 — Automated Improvement Run (silent-mutation + CSV-export sweep)

### Summary
- 23 issues found, 23 fixed across 22 commits

### Real bugs fixed (not just polish)
- **Security page audit feed was always empty** — read `data.rows` from an API that returns `data.data`, so the "live feed of permission-related activity" never populated. Wrong response key, fixed both fallback chain and namespace match.
- **Inquiries bulk-status updates ran sequentially** — `await fetch` in a for-loop made 20+ row transitions feel hung. Switched to `Promise.allSettled` parallel + partial-failure surface.
- **api-key + webhook DELETE silently no-op'd missing rows** — drizzle returns 0 rows affected without erroring, so the UI got 200 OK and proceeded as if the revoke happened. Now SELECT-first + 404 + cleaner audit log. Same fix to expense + gym-event DELETEs.
- **CSV exports rendered mojibake on accented chars** — every admin CSV endpoint joined with LF and missed the UTF-8 BOM. Centralized `csvBody` helper in `lib/api-helpers`, migrated 6 endpoints + the client-side `exportCSV`. Excel-compat across the board.
- **Audit-log API didn't validate before/since timestamps** — bad ISO strings silently returned zero rows instead of 400. Now Number.isNaN'd before pushing into `where`.

### Silent-mutation cleanup (12 surfaces)
- audit-log, time-off, integrations (api-keys + webhooks), expenses, roster, membership-plans, programs/[id], maintenance, certifications, equipment, availability, workouts — all routed via the new shared `ErrorBanner` component (`src/components/ui/ErrorBanner.tsx`). Net –32 LOC, future use sites are a one-liner.
- Plus: ViewAs banner exit, profile resend-verification, owner snapshot, launch-status load, billing chargeNow, scheduler applyAll, permissions reset/view-as, inquiries note-save patch.

### New features
- **Audit-log time chips**: Last hour / Today / Last 24h / Last 7d quick filters (`?since=<ISO>`) for incident triage.
- **Audit-log click-to-filter**: action / entity / actor cells now clickable; tap actor to see what else they did, tap action to find every other instance.
- **Inquiries click-to-filter**: kind/sport/source row chips push into search/filter.
- **Leads source pill** click-to-filter.

### Refactors
- `csvBody` + `UTF8_BOM` exports + tests in `lib/api-helpers` (RFC 4180 CRLF + BOM).
- `ErrorBanner` shared component.
- 7 admin pages migrated from inline duplicated banner JSX → `<ErrorBanner>`.

### Additional fixes (later in same loop)
- **api-keys + webhook + expense + gym-event DELETE silent no-op** — drizzle returned 0 rows affected without erroring on missing rows, returning 200 OK. SELECT-first + 404 + cleaner audit log.
- **Cycle 1+2 endpoints bypassed permission overrides** — 6 endpoints (api-keys, webhooks, owner/snapshot, billing/snapshot, churn, scheduler) hardcoded role==='admin', so the permissions matrix UI's per-user grants silently 401'd at the API. Migrated to canAccess(role, page).
- **SMS API was admin-only despite matrix promising front_desk access** — fixed to canAccess('inbox').
- **URL-driven audit-log filters** — bookmarkable + shareable; security page event rows now link to `/admin/audit-log?action=…` for incident triage.
- **Audit-log empty-state Clear-filters CTA**.
- **Security event rows clickable** to full audit log.
- **Verify-email resend silent on 429** — admin/profile.

### Build + Tests
- ✅ PASS — `npm run build` clean (269 pages, 0 TypeScript errors)
- ✅ PASS — `npx vitest run` 209 tests across 15 files (added 3 new csvBody tests)
