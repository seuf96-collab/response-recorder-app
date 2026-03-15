# _MANIFEST — Response Recorder App (Root)

Jury selection tool for Texas prosecutors. Records voir dire responses, scores jurors, tracks strikes, and provides AI-powered strike-for-cause analysis using Claude.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Prisma ORM · NextAuth.js · PostgreSQL (Neon)

---

## Tier 1 — Canonical (read first)

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, project metadata |
| `prisma/schema.prisma` | Database schema — single source of truth for all data models |
| `lib/types.ts` | TypeScript interfaces for all domain objects |
| `next.config.js` | Next.js build and runtime configuration |
| `tsconfig.json` | TypeScript compiler settings and path aliases (`@/*`) |
| `tailwind.config.ts` | Theme tokens, HSL color system, dark mode config |

## Tier 2 — Domain (load when task touches this area)

| Path | Domain |
|------|--------|
| `/app` | Next.js App Router — pages, layouts, API routes |
| `/app/api` | REST API endpoints for all CRUD and AI operations |
| `/app/dashboard` | All authenticated UI — recording, scoring, strikes, voir dire |
| `/components` | Shared React components and Radix-based UI primitives |
| `/components/ui` | 50+ shadcn/ui component library (button, card, dialog, etc.) |
| `/lib` | Core business logic — auth, scoring, strike zones, DB client |
| `/lib/ai` | AI prompt engineering and Claude API integration for voir dire |
| `/hooks` | React hooks — toast notifications, AI strategy state |
| `/prisma` | Database schema and migration history |
| `/prisma/migrations` | PostgreSQL migration SQL files |
| `/schemas` | JSON Schema definitions for strike-for-cause request/response |
| `/prompts` | System prompts for Claude AI voir dire analysis |
| `/scripts` | Database seeding and dev utility scripts |
| `/__tests__` | Jest test suite and fixtures |
| `/types` | TypeScript declaration augmentations (NextAuth) |
| `/public` | Static assets — favicon, OG image, robots.txt |

## Tier 3 — Archival (ignore unless explicitly asked)

| File | Why archived |
|------|-------------|
| `ANALYSIS_SUMMARY.md` | Historical: root cause analysis of a resolved Vercel DB issue |
| `DEBUGGING_PLAN.md` | Historical: debugging checklist for the same resolved issue |
| `SOLUTION_SUMMARY.md` | Historical: conclusion documenting the DB URL fix |
| `IMPLEMENTATION_SUMMARY.md` | Historical: build log of Phases 1–5 foundation work |
| `SPINOFF_SUMMARY.md` | Historical: notes on splitting this app from a parent project |
| `VERCEL_POSTGRES_SETUP.md` | Historical: migration guide from SQLite to Vercel Postgres |
| `QUICK_DATABASE_SETUP.md` | Historical: early DB setup instructions (now superseded) |
| `QUICKSTART.md` | Stale: quick-start guide with old test credentials |
| `README_STANDALONE.md` | Stale: feature docs from standalone spinoff era |
| `SETUP.md` | Partially stale: setup guide — environment vars section still useful |
| `Dockerfile` | Reference: Docker build for Railway deployment |
| `Procfile` | Reference: Heroku/Railway process definition |
| `.railway` | Reference: Railway deployment trigger timestamp |
| `abacus.donotdelete` | Placeholder file — do not remove |
| `app.log` | Transient: application startup log |
| `seed-output.log` | Transient: seed script error output |
| `tsconfig.tsbuildinfo` | Auto-generated: TypeScript incremental build cache |
| `package-lock.json` | Auto-generated: locked dependency tree — never edit manually |
| `next-env.d.ts` | Auto-generated: Next.js type definitions — never edit |
