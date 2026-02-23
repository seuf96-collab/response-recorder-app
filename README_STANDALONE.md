# Response Recorder App

A standalone Next.js application for recording and tracking juror responses to scaled and open-ended questions.

## Features

- **Question Bank Management**: Create, edit, and delete scaled and open-ended questions
- **Scale Mode**: Rapid-fire scoring interface for quickly rating jurors on questions (1-5 scale)
- **Response Recording**: Record both scaled responses and open-ended text responses
- **Response Tracker**: Matrix view showing juror x question completion status and response data
- **Case Management**: Organize questions and responses by case

## Getting Started

### Prerequisites
- Node.js 18+
- SQLite3 (for local development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables by creating a `.env.local` file:
```bash
# Copy from .env or configure:
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

3. Initialize the database:
```bash
npx prisma migrate dev
```

4. (Optional) Seed test data:
```bash
npm run seed
```

### Running the App

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Main Features

### 1. Question Bank (`/dashboard/questions`)
- View all questions for the current case
- Create new questions (scaled with 1-5 scale, or open-ended)
- Edit question text and type
- Delete questions
- Reorder questions by dragging

### 2. Scale Mode (`/dashboard/questions/scale-mode`)
- Full-screen, rapid-fire interface for scoring jurors
- Display one question at a time
- Rate each juror on a 1-5 scale
- Navigate between questions quickly
- Auto-saves responses as you score

### 3. Record Responses (`/dashboard/questions/responses`)
- Select a specific juror and question
- Input scaled responses (1-5)
- Input open-ended text responses
- View response history
- Edit previously recorded responses

### 4. Response Tracker (`/dashboard/questions/tracker`)
- Matrix view: rows are jurors, columns are questions
- Shows completion percentage for each juror
- Displays response values in cells
- Click cells to view/edit individual responses
- Summary statistics at the bottom

## Architecture

### Database Schema
- **Cases**: Container for jurors and questions
- **Questions**: Scaled or open-ended questions
- **Jurors**: Panel participants
- **Responses**: Recorded answers to questions
- **Users**: Authentication and ownership

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM + SQLite
- **UI**: React + Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js
- **Icons**: lucide-react

## API Endpoints

### Questions
- `GET /api/questions?caseId=xxx` - List questions
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `PATCH /api/questions/reorder` - Reorder questions

### Responses
- `GET /api/responses?caseId=xxx` - List responses
- `POST /api/responses` - Record response
- `PUT /api/responses/:id` - Update response
- `DELETE /api/responses/:id` - Delete response

### Cases
- `GET /api/cases` - List user's cases
- `POST /api/cases` - Create case

### Jurors
- `GET /api/jurors?caseId=xxx` - List jurors for case

## Development Notes

### Adding New Questions
When creating a new question, specify:
- `type`: Either "SCALED" or "OPEN_ENDED"
- `text`: The question text
- `scaleMax`: For scaled questions, max value (usually 5)
- `caseId`: The case this question belongs to

### Response Scoring
Scaled responses are automatically scored:
- 1 = Very Unfavorable
- 2 = Unfavorable
- 3 = Neutral
- 4 = Favorable
- 5 = Very Favorable

These responses contribute to an overall juror favorability score.

## Building for Production

```bash
npm run build
npm start
```

## License

This app is part of the Jury Selection Management System.

## Support

For issues or questions, refer to the project documentation.
