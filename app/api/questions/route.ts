import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper function to ensure default case exists
async function ensureDefaultCaseExists() {
  try {
    const existingCase = await prisma.case.findUnique({
      where: { id: 'default-case-1' },
    });

    if (existingCase) {
      return;
    }

    // Create a default user for the case
    let user = await prisma.user.findUnique({
      where: { email: 'demo@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          password: 'demo',
          name: 'Demo User',
        },
      });
    }

    // Create the default case
    await prisma.case.create({
      data: {
        id: 'default-case-1',
        name: 'State v. Johnson',
        causeNumber: '2024-CV-001234',
        defendantName: 'Marcus Johnson',
        offenseType: 'Drug Possession',
        venireSize: 85,
        jurySize: 12,
        numAlternates: 1,
        stateStrikes: 10,
        defenseStrikes: 10,
        stateAltStrikes: 1,
        defenseAltStrikes: 1,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error('Error ensuring default case exists:', error);
    // Don't throw - silently fail if seeding fails
  }
}

// GET all questions for a case
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: { caseId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch questions - Details:', {
      message: errorMessage,
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      error: 'Failed to fetch questions',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// POST create new question
export async function POST(request: NextRequest) {
  try {
    // Ensure default case exists before creating question
    await ensureDefaultCaseExists();

    const body = await request.json();
    const { caseId, text, type, scaleMax, weight, category, sortOrder } = body;

    if (!caseId || !text || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: {
        caseId,
        text,
        type,
        scaleMax: type === 'SCALED' ? (scaleMax || 5) : null,
        weight: type === 'SCALED' ? Math.min(Math.max(weight || 1, 1), 5) : 1,
        category,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to create question - Details:', {
      message: errorMessage,
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      error: 'Failed to create question',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
