# _MANIFEST — /app

Next.js App Router root. All pages, layouts, and API routes live here.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout — metadata, Providers wrapper (auth + theme), global fonts |
| `globals.css` | Global styles — Tailwind base, HSL theme variables, print styles, scrollbar, focus states |
| `page.tsx` | Landing page — hero section with link to dashboard |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/api` | All REST API route handlers (auth, CRUD, AI analysis) |
| `/dashboard` | Authenticated app — all jury selection tools |
| `/login` | Login page and form component |
| `/signup` | Signup page and form component |

## Tier 3 — Archival

| File | Why archived |
|------|-------------|
| `global-error.tsx` | Error boundary — rarely touched, only for unrecoverable crashes |
