import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch Batson challenges for a case
 * Query: ?caseId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Verify case ownership
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, userId: session.user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const challenges = await prisma.batsonChallenge.findMany({
      where: { caseId },
      include: {
        juror: {
          include: { tags: true },
        },
      },
      orderBy: { raisedAt: 'desc' },
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Failed to fetch Batson challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch Batson challenges' }, { status: 500 });
  }
}

/**
 * POST - Create a Batson challenge record
 * Body: { caseId, jurorId, raceNeutralReasons, explanation, comparisonJurorIds }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { caseId, jurorId, raceNeutralReasons, explanation, comparisonJurorIds } = body;

    if (!caseId || !jurorId) {
      return NextResponse.json({ error: 'caseId and jurorId are required' }, { status: 400 });
    }

    // Verify case ownership
    const caseData = await prisma.case.findFirst({
      where: { id: caseId, userId: session.user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const challenge = await prisma.batsonChallenge.create({
      data: {
        caseId,
        jurorId,
        raceNeutralReasons: raceNeutralReasons || null,
        explanation: explanation || null,
        comparisonJurorIds: comparisonJurorIds ? JSON.stringify(comparisonJurorIds) : null,
      },
      include: {
        juror: {
          include: { tags: true },
        },
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Failed to create Batson challenge:', error);
    return NextResponse.json({ error: 'Failed to create Batson challenge' }, { status: 500 });
  }
}
