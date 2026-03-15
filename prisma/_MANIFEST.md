# _MANIFEST — /prisma

Database schema and migration history. PostgreSQL via Neon in production.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `schema.prisma` | **Single source of truth for all data models** — User, Case, Juror, Note, JurorTag, Question, Response, BatsonChallenge, ForCauseStrategy with relationships and indexes |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/migrations/migration_lock.toml` | Provider lock — PostgreSQL |
| `/migrations/20260306_add_question_side/migration.sql` | Latest migration — adds `side` column (STATE/DEFENSE) to questions |

## Tier 3 — Archival

| Path | Why archived |
|------|-------------|
| `/migrations/20260217230045_init/migration.sql` | Historical: original SQLite schema creation |
| `/migrations/20260223_init_postgresql/migration.sql` | Historical: PostgreSQL migration replicating SQLite schema with timestamps and ForCauseStrategy |
