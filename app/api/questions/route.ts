import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
