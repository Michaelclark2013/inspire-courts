# Cycle State

**Branch:** `cycle/auto-improvements` — never push to main, never merge own PRs.
**Mode:** Continuous 6-phase loop (1→2→3→4→5→6→1→…). Stop only when Mike types "stop".
**Current cycle:** 5 — rotation complete, push to GitHub + open PR.
**Next:** Cycle 6 Phase 1 (UI).

## The 6 phases
1. UI — Visual design, component polish, accessibility, responsive, loading/error states, brand consistency
2. Functionality — Feature completeness, edge cases, performance, Core Web Vitals, integrations, validation
3. Admin Panel — Workflow speed, bulk actions, data viz, reporting, role-based access, keyboard shortcuts
4. Public Site — Conversion optimization, page speed, SEO, schema markup, CTAs, mobile experience
5. Customer Acquisition & Marketing — SEO audit, content strategy, email capture, analytics, local SEO
6. Security & Privacy — OWASP top 10, secrets, dependencies, CSP, auth hardening, rate limiting, PII

## Per-iteration loop
- **A. DISCOVER** — Run deep discovery for the phase. Write findings to `cycle-reports/phase-{N}-{date}.md` with current state, gaps, ranked P0/P1/P2.
- **B. CHOOSE** — Pick 3–5 highest-impact tasks completable this iteration.
- **C. ACT** — Implement. Commit each logical change.
- **D. RECORD & ADVANCE** — Update cycle report and this file. Continue immediately.

## Cadence
- Push to GitHub at most once per full 6-phase rotation (after phase 6).
- Open PR titled `Cycle [N]` after rotation; never self-merge.
- Pre-existing local edits = parallel agent work-in-progress; commit them into appropriate phase commits.

## Cycle 5 status

| Phase | Status | Report |
|---|---|---|
| 1 — UI | done | [phase-1-2026-04-25-1907.md](cycle-reports/phase-1-2026-04-25-1907.md) |
| 2 — Functionality | done | [phase-2-2026-04-25-1907.md](cycle-reports/phase-2-2026-04-25-1907.md) |
| 3 — Admin | done | [phase-3-2026-04-25-1907.md](cycle-reports/phase-3-2026-04-25-1907.md) |
| 4 — Public | done | [phase-4-2026-04-25-1907.md](cycle-reports/phase-4-2026-04-25-1907.md) |
| 5 — Marketing | done | [phase-5-2026-04-25-1907.md](cycle-reports/phase-5-2026-04-25-1907.md) |
| 6 — Security | done | [phase-6-2026-04-25-1907.md](cycle-reports/phase-6-2026-04-25-1907.md) |

## Open items needing Mike (BLOCKED)
- `NEXT_PUBLIC_GOOGLE_REVIEW_URL` env var (still placeholder).
- Square live keys (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT`, `SQUARE_WEBHOOK_SIGNATURE_KEY`) on Vercel for live payments.

## Log (Cycle 5+)

| Cycle | Phase | Date | Report | Pushed |
|---|---|---|---|---|

## History
Cycles 1–4 ran a 7-phase variant with direct-to-main commits under
Mike's earlier authorization. Phase reports under `cycle-reports/`
prefixed `phase-1-2026-04-25-*.md` through `phase-7-*.md`. The
2026-04-25 directive switched to the 6-phase, branch-only regime
above; numbering restarts at Cycle 5.
