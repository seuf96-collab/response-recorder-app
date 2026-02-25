# Create Question Functionality - Debugging Plan

**Status**: Question creation dialog opens but API call fails with `{"error":"Failed to create question"}`
**Last Verified**: February 25, 2026 - Vercel deployment
**Environment**: Production (Vercel) | No DATABASE_URL configured yet

---

## PROBLEM STATEMENT

When a user:
1. ✅ Navigates to `/dashboard/questions`
2. ✅ Clicks "+ Add Question" button
3. ✅ Fills in the form (text, type, scale max, weight, category)
4. ❌ Clicks "Create Question" button

The result:
- Dialog remains open (no close)
- No visual error message shown
- Browser silently receives `{"error":"Failed to create question"}` from API
- Question is NOT created (database remains empty)

**Root Cause Analysis**: The API route `/api/questions` POST endpoint is failing, likely due to missing DATABASE_URL environment variable on Vercel.

---

## 10 MOST LIKELY CAUSES (Ranked by Probability)

### 1. **DATABASE_URL Environment Variable Not Set on Vercel** ⚠️ MOST LIKELY
**Probability**: 95%
**Severity**: Critical

**Explanation**:
- `.env` file has `DATABASE_URL=""` (empty)
- Vercel Postgres has NOT been provisioned in Vercel dashboard yet
- Prisma client cannot connect to database
- Connection fails silently, API returns generic error

**Evidence**:
- `app/api/questions/route.ts` lines 46: `prisma.question.create()` would fail without DATABASE_URL
- `lib/db.ts` line 23: Logs "DATABASE_URL set: true/false" - likely FALSE on Vercel
- Postinstall hook in package.json tries multiple fallbacks but no actual database available
- VERCEL_POSTGRES_SETUP.md documents this as the next step

**Resolution**:
1. Go to https://vercel.com/dashboard
2. Select "response-recorder-app" project
3. Click "Storage" tab → "+ Add New" → "Create Postgres"
4. Wait for DATABASE_URL to auto-populate in project environment variables
5. Redeploy or wait for auto-redeploy

---

### 2. **Prisma Client Not Initialized Properly**
**Probability**: 15%
**Severity**: Critical

**Explanation**:
- Prisma client singleton in `lib/db.ts` fails to instantiate
- Network error or missing @vercel/postgres package
- Postinstall hook `prisma generate` fails silently

**Evidence**:
- `lib/db.ts` lines 7-17: Creates PrismaClient with logging, but no error handling
- If @prisma/client fails to initialize, all database queries fail
- `package.json` shows @vercel/postgres is installed, but marked as deprecated
- Postinstall hook has `|| true` which swallows errors

**Check Points**:
```bash
# Verify Prisma client generated
ls -la .next/server/lib/db.js
# Check if Prisma exists in node_modules
ls -la node_modules/@prisma/client/
```

**Resolution**:
1. Check Vercel deployment logs for Prisma generate failures
2. Force Prisma regeneration: `npx prisma generate`
3. Consider migrating from deprecated @vercel/postgres to @neondatabase/serverless

---

### 3. **Prisma Schema Mismatch - Migration Not Applied**
**Probability**: 15%
**Severity**: Critical

**Explanation**:
- Prisma schema uses PostgreSQL provider but migrations assume different schema
- `migration_lock.toml` says "postgresql" but migrations are old format
- Database exists but table structure doesn't match schema
- INSERT query fails with schema mismatch error

**Evidence**:
- `prisma/migrations/` has TWO migrations:
  - `20260217230045_init/` (SQLite-era)
  - `20260223_init_postgresql/` (PostgreSQL)
- `migration_lock.toml` was edited to change providers multiple times (last change: Feb 25)
- If migrations weren't run: `questions` table doesn't exist
- Postinstall tries `prisma migrate deploy` but may fail silently

**Check Points**:
```bash
# Check if table exists
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='questions');
# Verify schema
\d questions;
```

**Resolution**:
1. Verify Vercel Postgres database is accessible
2. Run: `npx prisma migrate deploy`
3. If that fails, run: `npx prisma db push --force-reset` (destructive!)
4. Verify questions table exists: `SELECT count(*) FROM questions;`

---

### 4. **API Error Not Being Logged to Console**
**Probability**: 10%
**Severity**: Medium

**Explanation**:
- The error IS being caught (`catch (error)` on line 59), but console.error() output is hidden
- Vercel function logs aren't being captured/displayed
- User sees `{"error":"Failed to create question"}` but no details about WHY

**Evidence**:
- `app/api/questions/route.ts` lines 59-69:
  ```typescript
  } catch (error) {
    console.error('Failed to create question - Details:', { ... });
    return NextResponse.json({
      error: 'Failed to create question',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
  ```
- The console.error() IS there, but Vercel logs might not show it
- No error details returned in response (production mode)

**Check Points**:
- Check Vercel deployment "Functions" tab for error logs
- Check if NODE_ENV is actually "development" on Vercel

**Resolution**:
1. Go to Vercel dashboard → Deployments → Latest → Functions tab
2. Click on a request and view the "Logs" section
3. Look for "Failed to create question - Details" message with stack trace

---

### 5. **Front-End Dialog Not Showing Error Message**
**Probability**: 8%
**Severity**: Low-Medium

**Explanation**:
- API returns error correctly, but frontend doesn't display it
- Dialog closes on success (line 115) but doesn't show error or keep dialog open
- User thinks nothing happened because dialog just closes or displays nothing

**Evidence**:
- `app/dashboard/questions/_components/question-bank-client.tsx` lines 114-118:
  ```typescript
  if (res.ok) {
    setShowCreateDialog(false);
    resetForm();
    fetchQuestions();
  }
  ```
- If `res.ok` is false, the code does NOTHING
- No error state to display failure message
- No toast or alert notification

**Check Points**:
```typescript
// In browser console, manually call:
fetch('/api/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caseId: 'test', text: 'Test', type: 'SCALED',
    scaleMax: 5, weight: 1, sortOrder: 0
  })
}).then(r => r.json()).then(console.log);
```

**Resolution**:
1. Update `handleCreate` to check `!res.ok`:
   ```typescript
   } else {
     const error = await res.json();
     console.error('Failed:', error);
     alert(`Error: ${error.error || 'Unknown error'}`);
   }
   ```
2. Or add error state and display toast with error message
3. Keep dialog open on failure so user can retry

---

### 6. **Request Not Reaching API (Network Error)**
**Probability**: 5%
**Severity**: Medium

**Explanation**:
- Fetch request fails at network level before API receives it
- CORS issue or network timeout
- Fetch is rejected, but error is caught and generic error shown

**Evidence**:
- `handleCreate` has try-catch (line 95) but no explicit catch logging
- If fetch throws error (not HTTP error), it catches it silently
- No Network tab examination in debugging
- Could be timeout: Prisma might be slow to initialize

**Check Points**:
1. Open browser DevTools → Network tab
2. Try creating a question again
3. Check if POST request to `/api/questions` appears
4. Check if it gets a response or times out

**Resolution**:
1. Add detailed error logging:
   ```typescript
   } catch (error) {
     console.error('Create question error:', error);
     alert(`Network error: ${error.message}`);
   }
   ```
2. Add request timeout: `const controller = new AbortController()`
3. Check Vercel function cold start time

---

### 7. **caseId Parameter Issue**
**Probability**: 5%
**Severity**: Low

**Explanation**:
- The form sends caseId correctly, but it's hardcoded as 'default-case-1'
- API requires caseId in request body, but it's not being sent or sent as wrong value
- Form validation passes (text is not empty), but database INSERT fails due to foreign key

**Evidence**:
- `app/dashboard/questions/page.tsx` line 9: Hard-coded `caseId = 'default-case-1'`
- `app/dashboard/questions/_components/question-bank-client.tsx` line 104: Sends `{ caseId, ... }`
- Assumption: This case exists in database
- But if no Case with id='default-case-1' exists, foreign key constraint fails
- API validation (line 42) only checks if caseId is provided, not if it exists

**Check Points**:
```bash
# Verify case exists
SELECT * FROM cases WHERE id = 'default-case-1' LIMIT 1;
```

**Resolution**:
1. Create a case first: POST to `/api/cases` with:
   ```json
   {
     "name": "State v. Johnson",
     "venireSize": 85
   }
   ```
2. Or auto-create case if it doesn't exist (check `/api/cases` route)
3. Or use a different caseId that definitely exists

---

### 8. **Question Type or scaleMax Validation Error**
**Probability**: 3%
**Severity**: Low

**Explanation**:
- Frontend sends type='SCALED' but the API doesn't recognize it
- scaleMax is sent as string instead of number
- Weight or scaleMax is outside valid range
- Prisma validation rejects the type enum value

**Evidence**:
- Frontend form uses `type: 'SCALED' | 'YES_NO' | 'OPEN_ENDED'` (line 64)
- API expects same enum in database
- But Prisma schema (prisma/schema.prisma) defines type as @db.Text enum
- If enum values don't match exactly, Prisma will reject

**Check Points**:
```bash
# Check Prisma schema for Question.type
grep -A 2 "type.*enum" prisma/schema.prisma
# Verify type values match
SELECT DISTINCT type FROM questions;
```

**Resolution**:
1. Verify Prisma schema enum values:
   ```prisma
   type QuestionType @db.VarChar(20)  // or change to exact enum
   ```
2. Add logging to see what's actually being sent:
   ```typescript
   console.log('Creating question:', { caseId, text, type, scaleMax, weight });
   ```

---

### 9. **Vercel Postgres Connection String Format Wrong**
**Probability**: 3%
**Severity**: Medium

**Explanation**:
- DATABASE_URL is set but in wrong format for Prisma
- Missing `postgresql://` prefix
- Missing SSL parameters (required for some hosted databases)
- Port mismatch

**Evidence**:
- Vercel Postgres provides a connection string, but Prisma expects specific format
- Expected: `postgresql://user:password@host:5432/dbname?sslmode=require`
- If missing `?sslmode=require`, SSL handshake fails
- `.env` comment shows `postgresql://` format

**Check Points**:
```bash
# Print actual DATABASE_URL
echo $DATABASE_URL
# Verify it starts with postgresql://
# Verify it has required SSL parameters
```

**Resolution**:
1. Go to Vercel project → Settings → Environment Variables
2. Copy the DATABASE_URL from Vercel Postgres
3. Verify it has SSL parameters (check box when creating database)
4. Restart Vercel deployment

---

### 10. **Postinstall Hook Failing Silently During Build**
**Probability**: 2%
**Severity**: Medium

**Explanation**:
- `package.json` postinstall hook has fallback chain with `|| true`
- Even if all steps fail, build continues successfully
- Vercel build succeeds but Prisma client is broken
- Runtime queries fail when they try to use uninitialized client

**Evidence**:
- `package.json` postinstall:
  ```json
  "postinstall": "prisma generate && prisma migrate deploy || prisma db push --skip-generate || true"
  ```
- All three steps can fail, but `|| true` means build succeeds anyway
- No way to know from build logs that Prisma setup failed
- Runtime errors in function calls only

**Check Points**:
1. Go to Vercel deployment → Logs (Build tab)
2. Look for "prisma" related output
3. Check if "prisma generate" succeeded or failed
4. Check if "prisma migrate deploy" or "prisma db push" ran

**Resolution**:
1. Remove `|| true` temporarily to see actual errors:
   ```json
   "postinstall": "prisma generate && (prisma migrate deploy || prisma db push --skip-generate)"
   ```
2. Or explicitly handle each step:
   ```json
   "postinstall": "npm run prisma:setup",
   "prisma:setup": "prisma generate && prisma migrate deploy 2>&1 || prisma db push --skip-generate 2>&1"
   ```

---

## DIAGNOSTIC CHECKLIST

### ✅ Essential Diagnostics (Do These First)

- [ ] **1. Verify DATABASE_URL exists on Vercel**
  - Go to Vercel dashboard → Project Settings → Environment Variables
  - Check if DATABASE_URL is set and has a value
  - If empty, provision Vercel Postgres per VERCEL_POSTGRES_SETUP.md

- [ ] **2. Check Vercel Deployment Logs**
  - Go to Deployments tab → Latest deployment → Functions
  - Search for "Failed to create question" in logs
  - Look for Prisma errors or connection errors

- [ ] **3. Test API Directly**
  - Use curl or Postman to POST to https://response-recorder-app.vercel.app/api/questions
  - Include proper JSON body with caseId, text, type, scaleMax, weight
  - Check response and any error details

- [ ] **4. Verify Database Connection**
  - Go to https://response-recorder-app.vercel.app/api/health
  - Should return database health status and connection info
  - If unhealthy, database connection is definitely the issue

- [ ] **5. Check Browser Network Tab**
  - Open DevTools → Network tab
  - Click "Add Question" and submit
  - Verify POST request reaches /api/questions
  - Check response status and body

### 🔍 Intermediate Diagnostics (If Essential Fails)

- [ ] **6. Examine Build Logs**
  - Vercel Deployments → Latest → Logs (Build tab)
  - Search for "prisma" and "migrate"
  - Look for any error output

- [ ] **7. Add Enhanced Error Logging**
  - Modify `app/api/questions/route.ts` lines 59-69 to return full error details
  - Push change and redeploy
  - Check if error details appear in response

- [ ] **8. Test Prisma Connection Locally**
  - Set DATABASE_URL to local SQLite: `file:./dev.db`
  - Run: `npm run dev`
  - Try creating question locally
  - If it works locally, issue is Vercel-specific

- [ ] **9. Check Prisma Schema Migration**
  - Run: `npx prisma migrate status`
  - Verify all migrations are applied
  - Check if `questions` table exists: `npx prisma studio`

### 🛠️ Advanced Diagnostics (Deep Dive)

- [ ] **10. Database Query Logging**
  - Add Prisma logging to production: `log: ['query', 'error']`
  - This logs all SQL queries, useful for seeing actual errors
  - Check Vercel function logs for SQL error details

- [ ] **11. Frontend Error Capture**
  - Add Sentry or similar error tracking
  - Capture fetch errors and timeouts
  - Get full stack traces of failures

- [ ] **12. Monitor Cold Start Performance**
  - Check if function timeout (usually 30-60 seconds on Vercel)
  - Cold start Prisma initialization might exceed timeout
  - Look for "Function execution timeout" errors

---

## MOST LIKELY RESOLUTION PATH

Based on the evidence and analysis, follow this path:

1. **Immediately**: Go to Vercel Dashboard and provision Vercel Postgres
   - Project → Storage → Create Postgres Database
   - Wait for DATABASE_URL to populate environment variables
   - Trigger redeploy

2. **Monitor**: Check deployment build logs for Prisma errors
   - Should see "prisma generate" succeed
   - Should see "prisma migrate deploy" succeed

3. **Test**: Try creating a question on https://response-recorder-app.vercel.app/dashboard/questions
   - If it works → Issue resolved! ✅
   - If it still fails → Check API logs for detailed error

4. **If Still Failing**: Add error details to API response
   - Edit `app/api/questions/route.ts` to include error.message in response
   - Redeploy and try again
   - Check what actual error is being returned

5. **Last Resort**: Migrate to Neon (non-deprecated alternative)
   - @vercel/postgres is deprecated
   - Migrate to @neondatabase/serverless for long-term stability

---

## SUCCESS CRITERIA

The "Create Question" functionality is working correctly when:

1. ✅ POST to `/api/questions` returns HTTP 201 with created question
2. ✅ Question appears immediately in the questions list
3. ✅ Question is persisted in database (survives page refresh)
4. ✅ sortOrder is correct (auto-incremented)
5. ✅ Type is correctly set (SCALED, YES_NO, or OPEN_ENDED)
6. ✅ Weight is within 1-5 range for SCALED questions
7. ✅ scaleMax is set to 5 if not specified for SCALED questions
8. ✅ Category is stored if provided, null otherwise
9. ✅ Dialog closes on successful creation
10. ✅ Form resets for next question creation

---

## APPENDIX: DATABASE SCHEMA

The `questions` table structure (from migration):

```sql
CREATE TABLE "questions" (
  id TEXT NOT NULL PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  "scaleMax" INTEGER,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1,
  category TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questions_caseId_fkey" FOREIGN KEY ("caseId")
    REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "questions_caseId_idx" ON "questions"("caseId");
CREATE INDEX "questions_sortOrder_idx" ON "questions"("sortOrder");
```

Key constraints:
- Foreign key to `cases` table (must exist)
- No constraints on type enum (could cause issues)
- sortOrder defaults to 0 (potential for duplicates)

