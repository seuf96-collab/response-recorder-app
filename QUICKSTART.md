# Jury App - Quick Start (2 Minutes)

## Run Everything in 4 Steps

### Step 1: Install & Setup
```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Open Browser
Go to: **http://localhost:3000**

### Step 4: Login
- Email: `prosecutor@texas.gov`
- Password: `password123`

---

## What You'll See

1. **Dashboard** with seating chart showing:
   - 12 regular jurors (blue border)
   - 2 alternate jurors (purple border)
   - Color-coded favorability (green/yellow/red)
   - Grayed-out jurors outside strike zone

2. **Click any juror** to see detailed profile

3. **Create a new case** from the case creation form with all strike zone parameters

---

## Key URLs

| Feature | URL |
|---------|-----|
| Dashboard | `/dashboard` |
| Create Case | `/dashboard/cases/new` |
| Juror Detail | `/dashboard/jurors/[id]` |
| API Cases | `/api/cases` |
| API Questions | `/api/questions?caseId=[id]` |
| API Responses | `/api/responses?caseId=[id]` |

---

## Architecture Quick Facts

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes + Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth.js
- **Theme:** Dark mode by default
- **State:** Zustand-ready (not yet implemented)

---

## Strike Zone Math

**Regular Panel:** jury_size + state_strikes + defense_strikes
- Example: 12 + 10 + 10 = 32 (jurors 1-32 matter)

**Alternate Panel:** num_alternates + state_alt_strikes + defense_alt_strikes
- Example: 2 + 2 + 2 = 6 (jurors 33-38 matter)

All jurors outside these ranges appear grayed out (opacity-40) in seating chart.

---

## Database

### Tables
- `users` - Prosecution staff
- `cases` - Trial cases with strike configuration
- `jurors` - Juror demographics & scoring
- `juror_tags` - Favorability classification
- `questions` - Voir dire question bank
- `responses` - Question responses & scores
- `notes` - Juror observations
- `batson_challenges` - Challenge tracking (UI coming soon)

### Queries
View/edit data with Prisma Studio:
```bash
npx prisma studio
```

---

## Development Tips

### Add a New Case Programmatically
```typescript
// Use API endpoint
fetch('/api/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'State v. Defendant',
    jurySize: 12,
    numAlternates: 1,
    stateStrikes: 10,
    defenseStrikes: 10,
    stateAltStrikes: 1,
    defenseAltStrikes: 1,
  })
})
```

### Add a Question
```typescript
fetch('/api/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caseId: 'case-id',
    text: 'Do you have law enforcement bias?',
    type: 'SCALED',
    scaleMax: 5,
    category: 'Bias',
  })
})
```

### Record a Response (Auto-Updates Score)
```typescript
fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jurorId: 'juror-id',
    questionId: 'question-id',
    scaledValue: 4, // or textValue: "text answer"
  })
})
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` and `npx prisma generate` |
| Database connection fails | Check `DATABASE_URL` in `.env.local` |
| Port 3000 in use | Use `npm run dev -- -p 3001` |
| Seed fails | Run `npx prisma db push --force-reset` then seed again |
| Dark mode not working | Clear browser cache, check `/components/providers.tsx` |

---

## Performance Notes

- Seating chart uses CSS grid (not virtual scroll, fine for <100 jurors)
- Scoring is real-time synchronous (no queue)
- No pagination (add if cases get 100+ jurors)
- API responses auto-filter by user_id for security

---

## What's Next?

The app is ready for:
1. **Phase 2:** Scaled Question Mode UI (rapid-fire interface)
2. **Phase 3:** Strike Decision Mode (strike/counter interface)
3. **Phase 4:** Batson Challenge Module
4. **Phase 5:** Claude AI Integration (bias detection, suggestions)
5. **Phase 6:** Multi-user with Supabase sync

See `instructions.md` for full roadmap.

---

**Happy debugging! 🚀**
