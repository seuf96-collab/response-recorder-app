# _MANIFEST — /components

Shared React components. App-level components at root, Radix/shadcn primitives in `/ui`.

---

## Tier 1 — Canonical

| File | Purpose |
|------|---------|
| `providers.tsx` | Root provider wrapper — NextAuth SessionProvider + ThemeProvider |
| `theme-provider.tsx` | next-themes wrapper for dark/light mode switching |
| `ai-strategy-panel.tsx` | AI for-cause strategy display — expandable questions, vulnerability indicators, outcomes |

## Tier 2 — Domain

| Path | Domain |
|------|--------|
| `/ui` | 50+ shadcn/ui component primitives — see `/ui/_MANIFEST.md` |
