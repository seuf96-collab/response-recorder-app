# Vercel Postgres Setup Instructions

The Response Recorder App requires a database for production deployment. This guide walks through setting up Vercel Postgres (the recommended serverless PostgreSQL solution for Vercel deployments).

## Problem Being Solved

- **SQLite on Vercel**: Doesn't work because Vercel's serverless filesystem is ephemeral (resets on each request)
- **PostgreSQL with TCP (port 5432/6543)**: Doesn't work because Vercel blocks outbound TCP connections to external databases
- **Solution**: Use Vercel Postgres, which provides HTTP-based access to PostgreSQL, optimized for serverless functions

## Setup Steps

### 1. Go to Vercel Dashboard

Visit: https://vercel.com/dashboard

### 2. Select the Project

Click on "response-recorder-app" project.

### 3. Navigate to Storage Tab

- Click on the "Storage" tab at the top
- Click "+ Add New" and select "Postgres"

### 4. Create Postgres Database

- Choose "Create New Postgres Database"
- Give it a name like "response-recorder"
- Select your region (closest to your users is best)
- Click "Create Postgres Database"

### 5. Vercel Auto-Configures Environment Variables

Vercel will automatically:
- Create the database
- Set `DATABASE_URL` environment variable in your project
- This happens automatically - no manual config needed!

### 6. Run Database Migrations

Once the database is created and `DATABASE_URL` is set, run migrations:

**Option A: Via Vercel CLI (if you have it installed locally)**
```bash
vercel env pull  # Pull the DATABASE_URL from Vercel
npx prisma migrate deploy  # Run migrations
```

**Option B: Via Vercel Deployments Tab**
1. Go to your project in Vercel dashboard
2. Go to "Deployments" tab
3. Find the latest deployment
4. Click the "..." menu and select "View Functions"
5. Monitor the function logs to see if migrations run

### 7. Verify It Works

1. Go to https://response-recorder-app.vercel.app/dashboard/questions
2. Click "+ Add Question"
3. Fill in question details and click "Create Question"
4. The question should now be created and displayed in the list

## If Something Goes Wrong

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click on the latest deployment
5. Check "Functions" tab for any error messages

### Test DATABASE_URL Locally

```bash
# Pull environment from Vercel
vercel env pull

# Try to connect
npx prisma db execute --stdin < /dev/null
```

### Common Issues

**"P1001: Can't reach database server"**
- DATABASE_URL environment variable is not set correctly
- Wait a few minutes after creating the database
- Redeploy the project after database is ready

**"Authentication failed for user 'postgres'"**
- The Vercel Postgres credentials are incorrect
- Try removing and recreating the Postgres database

**"Permission denied" on functions**
- Make sure you're logged into the correct Vercel account
- Check that the project is in your team/workspace

## Architecture

```
Request Flow:
1. Browser → HTTPS → Vercel Function (Next.js API route)
2. Function → HTTP (via @vercel/postgres) → Vercel Postgres
3. Vercel Postgres → PostgreSQL database
4. Response flows back through the chain
```

This HTTP-based architecture works perfectly on Vercel's serverless functions, unlike TCP connections which are blocked.

## More Information

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Vercel Postgres Guide](https://www.prisma.io/docs/guides/database/using-prisma-with-vercel)
- [@vercel/postgres Package](https://github.com/vercel/storage/tree/main/packages/postgres)
