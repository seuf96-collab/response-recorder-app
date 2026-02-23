import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateOverallScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

/**
 * POST - Recalculate all juror scores for a case
 * Used after changing question weights so scores reflect the new weighting
 * Body: { caseId }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Verify user owns this case
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, userId: session.user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get all jurors for this case
    const jurors = await prisma.juror.findMany({
      where: { caseId },
      include: {
        responses: {
          include: { question: true },
        },
      },
    });

    let updatedCount = 0;

    for (const juror of jurors) {
      const newScore = calculateOverallScore(juror.responses as any);
      const roundedScore = newScore !== null ? Math.round(newScore * 10) / 10 : null;

      // Only update if score changed
      if (roundedScore !== juror.overallScore) {
        await prisma.juror.update({
          where: { id: juror.id },
          data: { overallScore: roundedScore },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Recalculated scores for ${jurors.length} jurors. ${updatedCount} scores updated.`,
      totalJurors: jurors.length,
      updatedCount,
    });
  } catch (error) {
    console.error('Failed to recalculate scores:', error);
    return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
  }
}
