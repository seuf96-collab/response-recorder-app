# Jury Selection App - Setup & Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jury_app"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"

# OAuth (optional)
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
```

### 3. Set Up the Database
```bash
# Run Prisma migrations to create all tables
npx prisma migrate dev --name init

# Seed the database with test data
npx prisma db seed
```

### 4. Start the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Test Credentials

After seeding, use these credentials to log in:

- **Email:** `prosecutor@texas.gov`
- **Password:** `password123`

---

## Test Data Overview

### Case: State v. Johnson
- **Cause Number:** 2024-CV-001234
- **Defendant:** Marcus Johnson
- **Offense:** Aggravated Assault
- **Trial Date:** March 15, 2026
- **Jury Configuration:**
  - Regular Panel: 12 jurors
  - Alternate Panel: 2 jurors
  - State Strikes: 10 (regular) + 2 (alternate)
  - Defense Strikes: 10 (regular) + 2 (alternate)

### 14 Sample Jurors
Each juror has:
- Full demographics (name, age, gender, race, occupation, etc.)
- Favorability tag (Favorable, Neutral, or Unfavorable)
- Notes for 3 jurors (Sarah Martinez, Lisa Rodriguez, Robert Anderson)
- Random overall score (2-4 range)

### 5 Sample Questions
- 2 Scaled questions (1-5 rating)
- 3 Open-ended questions
- Organized by categories: Background, Bias, Evidence

---

## Features Overview

### ✅ Phase 1-5 Complete

#### Dashboard
- **Seating Chart:** Visual grid of jurors organized by regular/alternate panels
  - Color-coded: Green (favorable), Yellow (neutral), Red (unfavorable)
  - Strike zone boundaries clearly marked
  - Reduced opacity for jurors outside strike zone
  - Click any juror to view detailed profile

#### Case Management
- Create new cases with full strike zone configuration
- View case details and defendant information
- Update case settings

#### Juror Profiles
- Full demographics tracking
- Notes and observations
- Overall scoring from responses
- Tags for quick classification

#### Questions & Scoring
- Question bank management (scaled + open-ended)
- Automatic overall score calculation from responses
- Response tracking by juror and question

#### API Endpoints
- `/api/cases` - Case CRUD
- `/api/cases/[id]` - Case details and updates
- `/api/jurors` - Juror CRUD
- `/api/jurors/[id]` - Juror details
- `/api/questions` - Question management
- `/api/questions/[id]` - Question details
- `/api/responses` - Response tracking
- `/api/notes` - Juror notes

---

## Dark Mode

The app defaults to dark mode. The seating chart and all UI components are optimized for dark theme with:
- Slate-950 background
- Clear text contrast
- Tailwind dark: prefix utilities
- Touch-friendly tap targets (minimum 44px)

---

## Database Schema

### Core Tables
- **users** - Authentication and case ownership
- **cases** - Case management with strike zone configuration
- **jurors** - Juror demographics, scoring, and status
- **juror_tags** - Flexible tagging system
- **questions** - Voir dire question bank
- **responses** - Question responses with scoring
- **notes** - Juror observation notes
- **batson_challenges** - Batson challenge tracking (ready for Phase 4)

---

## Next Steps (Future Phases)

### Phase 2: Questions & Scoring UI
- Full-screen Scaled Question Mode
- Rapid-fire question interface
- Unanswered Question Tracker matrix

### Phase 3: Strike Decision Mode
- Strike Decision interface
- Strike counter and warnings
- Over-allocation prevention

### Phase 4: Batson Defense
- Batson challenge module
- Race-neutral reason checklist
- Comparison tool for similar jurors

### Phase 5: AI Features
- Bias pattern detection
- Suggested follow-up questions
- Inconsistency flagging
- Batson risk scoring

### Phase 6: Multi-User & Sync
- Real-time subscriptions
- Offline-first with IndexedDB
- Team collaboration
- Role-based access

---

## Troubleshooting

### Database Connection Issues
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Reset database (careful - deletes all data!)
npx prisma migrate reset
```

### Prisma Client Generation
```bash
# Regenerate Prisma client
npx prisma generate
```

### Port Already in Use
```bash
# Kill process on port 3000 and restart
npm run dev -- -p 3001
```

### Seed Issues
```bash
# Clear and reseed
npx prisma db push --force-reset
npx prisma db seed
```

---

## Development Commands

```bash
# Start dev server
npm run dev

# Run Prisma Studio (visual database browser)
npx prisma studio

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start

# Format code
npm run format

# Lint code
npm run lint
```

---

## File Structure

```
K:/
├── app/
│   ├── api/
│   │   ├── cases/
│   │   ├── jurors/
│   │   ├── questions/
│   │   ├── responses/
│   │   └── notes/
│   ├── dashboard/
│   │   ├── _components/
│   │   │   ├── seating-chart.tsx
│   │   │   └── juror-list-client.tsx
│   │   ├── cases/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth-options.ts
│   ├── db.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── strike-zone.ts
│   └── scoring.ts
├── components/
│   ├── providers.tsx
│   ├── theme-provider.tsx
│   └── ui/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── seed.ts
└── public/
```

---

## Notes

- All routes are protected by NextAuth authentication
- Database operations use Prisma with row-level security via user_id
- Strike zone calculations use: panel_size + state_strikes + defense_strikes
- Scores are weighted by question category
- All UI is optimized for iPad Pro landscape (1280x800 and up)

---

## Support

For issues or questions:
1. Check the instructions.md for project spec details
2. Review the plan file at `C:\Users\Talino\.claude\plans\functional-juggling-conway.md`
3. Consult the database schema in `prisma/schema.prisma`
4. Check API route implementations for endpoint details
