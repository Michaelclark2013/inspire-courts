# Cycle State

**Branch:** `cycle/auto-improvements`
**Current phase:** 2 (Functionality) — next iteration
**Iteration completed:** 1
**Last completed:** 2026-04-25 09:53 — Phase 1 (UI)

## Cadence
- All work on `cycle/auto-improvements`. Never commit to `main`.
- Push to GitHub at most once per full **7-phase** rotation (after phase 7).
- Production deploy via PR review → merge to main, max 1/day.
- Open PR titled `Cycle [N] — [date]` after each rotation, summarizing all 7 phases.

## The 7 phases
1. **UI** — visual design, micro-interactions, a11y (WCAG 2.1 AA), responsive, dark mode, loading/empty/error states, design tokens.
2. **Functionality** — feature completeness, edge cases, error handling, performance (Core Web Vitals, bundle size, caching), reliability, integrations, validation, search, filters, forms.
3. **Admin Panel** — workflow speed, bulk actions, data viz, reporting, RBAC, audit logs, search/filter, keyboard shortcuts, export, undo, optimistic UI, real-time.
4. **Public Site** — conversion, page speed, SEO, schema markup, OG tags, sitemap, internal linking, content quality, CTAs, trust signals, mobile experience.
5. **Customer Acquisition & Marketing** — SEO audit, content strategy, email capture/sequences, retention mechanics, referral loops, social proof, analytics events, A/B infra, retargeting, local SEO, review generation.
6. **Security & Privacy** — OWASP top 10, secrets management, env audit, npm audit, CSP/HSTS, auth hardening, rate limiting, input validation, SQLi/XSS/CSRF, PII, GDPR/CCPA, cookie consent, audit logging.
7. **Code Quality & Engineering Excellence** — architecture, performance, code quality (no `any`, ESLint clean), testing coverage of critical paths, dependencies (outdated/unused/audit), DX (build speed, README), Claude-Code optimization (CLAUDE.md, slash commands, hooks, permission allowlist), observability (Sentry, structured logs), build & CI reliability. Prefer deletions and simplifications over additions.

After phase 7 → loop back to phase 1.

## Phase rotation status
1. UI ✅ (iter 1)
2. Functionality ← **next**
3. Admin Panel
4. Public Site
5. Customer Acquisition & Marketing
6. Security & Privacy
7. Code Quality & Engineering Excellence

## Log

| Iter | Phase | Date | Report | Pushed | PR |
|---|---|---|---|---|---|
| 1 | 1 — UI | 2026-04-25 | [phase-1-2026-04-25-0953.md](cycle-reports/phase-1-2026-04-25-0953.md) | no | — |
