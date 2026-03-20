# _MANIFEST — /app/dashboard/questions

Question management hub. Four distinct modes for working with voir dire questions and juror responses.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `page.tsx` | Entry page — loads selected case, renders question bank |
| `_components/question-bank-client.tsx` | Full question CRUD — State/Defense tabs, reorder, weight, scale config, categories |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/responses` | **Response Recorder** — question-by-question capture with juror picker, auto-advance |
| `/responses/_components/response-recorder-client.tsx` | Client component for scaled/yes-no/open-ended response entry |
| `/scale-mode` | **Scale Mode** — full-screen keyboard-optimized rapid scoring (1–9 keys, arrow nav) |
| `/scale-mode/_components/scale-mode-client.tsx` | Core scale mode UI with juror grid, bulk/individual toggle, color-coded scores |
| `/scale-mode/_components/scale-mode-wrapper.tsx` | URL param extraction and case data loader for scale mode |
| `/tracker` | **Response Tracker** — matrix view of questions × jurors with completion stats |
| `/tracker/_components/tracker-client.tsx` | Matrix grid with filtering, top/bottom 15 jurors, clickable cells for edits |
