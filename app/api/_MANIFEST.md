# _MANIFEST — /app/api

REST API layer. All routes return JSON and require NextAuth session (except health and signup).

---

## Tier 1 — Canonical

| Path | Purpose |
|------|---------|
| `/cases/route.ts` | Case list + create — central entity all other data hangs off |
| `/jurors/route.ts` | Juror list + create — core domain object |
| `/questions/route.ts` | Question list + create — drives scoring and response recording |
| `/responses/route.ts` | Response CRUD — the primary data capture endpoint |
| `/auth/[...nextauth]/route.ts` | NextAuth handler — session and credential authentication |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/cases/[id]/route.ts` | Single case read/update |
| `/cases/[id]/reset/route.ts` | Case reset — clears all responses, questions, jurors |
| `/jurors/[id]/route.ts` | Single juror read/update/delete |
| `/questions/[id]/route.ts` | Single question read/update/delete |
| `/questions/recompact/route.ts` | Reorder question sort positions |
| `/notes/route.ts` | Create notes on jurors |
| `/notes/[id]/route.ts` | Delete individual notes |
| `/scores/recalculate/route.ts` | Batch recalculate all juror scores from current weights |
| `/strikes/route.ts` | Record peremptory strikes |
| `/batson/route.ts` | Create Batson challenge records |
| `/batson/[id]/route.ts` | Batson challenge read/update/delete |
| `/ai/for-cause-strategy/route.ts` | AI strategy generation for for-cause strikes |
| `/voir-dire/strike-for-cause/analyze/route.ts` | AI voir dire transcript analysis (Claude API) |
| `/signup/route.ts` | User registration (no auth required) |

## Tier 3 — Archival

| Path | Why archived |
|------|-------------|
| `/health/route.ts` | Infrastructure probe — returns status, rarely modified |
| `/seed/route.ts` | Dev-only database seeding endpoint |
