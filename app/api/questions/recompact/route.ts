import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/questions/recompact?caseId=xxx
 * Recompacts sortOrder values to be sequential (0, 1, 2, 3...) for a given caseId
 * Useful for fixing duplicate or gapped sortOrder values
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Fetch all questions for this caseId, ordered by current sortOrder
    const questions = await prisma.question.findMany({
      where: { caseId },
      orderBy: { sortOrder: 'asc' },
    });

    if (questions.length === 0) {
      return NextResponse.json({ message: 'No questions found for this caseId' });
    }

    // Recompact sortOrder to be sequential
    const updates = questions.map((q, index) =>
      prisma.question.update({
        where: { id: q.id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({
      message: `Recompacted ${questions.length} questions`,
      recompactedQuestions: questions.length,
    });
  } catch (error) {
    console.error('Failed to recompact questions:', error);
    return NextResponse.json({ error: 'Failed to recompact questions' }, { status: 500 });
  }
}
