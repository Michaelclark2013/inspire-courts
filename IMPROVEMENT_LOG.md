
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
