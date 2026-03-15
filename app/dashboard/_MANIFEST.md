# _MANIFEST — /app/dashboard

Authenticated workspace. All jury selection tools live here behind NextAuth session checks.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `layout.tsx` | Dashboard shell — persistent nav bar with links to Questions, Cases, Dashboard |
| `page.tsx` | Dashboard home — selected case details, quick-action buttons to all tools |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/_components/dashboard-header-client.tsx` | Reusable case header with inline edit (name, defendant, venire size) |
| `/_components/create-juror-modal.tsx` | Modal for adding a juror by seat number |
| `/cases` | Case listing and selection |
| `/cases/new` | New case creation form (name, cause number, offense, jury size, strikes) |
| `/questions` | Question bank management — create, edit, reorder, weight, categorize |
| `/questions/responses` | Question-by-question response recorder (scaled, yes/no, open-ended) |
| `/questions/scale-mode` | Full-screen rapid-scoring mode with keyboard shortcuts (1–9, arrows) |
| `/questions/tracker` | Response matrix — questions × jurors grid with completion stats |
| `/strikes` | Strike recorder — mark jurors For Cause or Excused with keyboard shortcuts |
| `/jurors/[id]` | Juror detail profile — demographics, notes, tags, favorability score |
| `/voir-dire` | AI-powered strike-for-cause analyzer using Claude for Texas law (Art. 35.16) |
