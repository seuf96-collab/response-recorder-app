# _MANIFEST — /lib

Core business logic, database access, authentication, and shared utilities.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `types.ts` | All TypeScript interfaces — Case, Juror, Question, Response, BatsonChallenge, StrikeZone, AIStrategy |
| `db.ts` | Prisma client singleton with dev logging — the single database access point |
| `auth-options.ts` | NextAuth config — credentials provider, JWT strategy, session callbacks |
| `scoring.ts` | Juror scoring engine — weighted score calculation, color/label categories, batch operations |

## Tier 2 — Domain

| File / Path | Domain |
|-------------|--------|
| `strike-zone.ts` | Strike zone math — computes boundaries for regular/alternate panels, juror priority |
| `use-selected-case.ts` | React hook for current case selection via localStorage + API fetch |
| `utils.ts` | Utilities — `cn()` class name merging (clsx + tailwind-merge), duration formatting |
| `supabase.ts` | Supabase HTTP client init (legacy — may be superseded by Prisma/Neon) |
| `/ai/voir-dire-analyzer.ts` | Claude API integration — builds strike-for-cause analysis with AJV schema validation |
| `/ai/for-cause-prompt.ts` | Prompt builder — offense-specific bias areas, juror profiles, targeted questioning strategy |
