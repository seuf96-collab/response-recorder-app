import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT - Update a Batson challenge
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const challenge = await prisma.batsonChallenge.findUnique({
      where: { id: params.id },
      include: { case: true },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.case.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updated = await prisma.batsonChallenge.update({
      where: { id: params.id },
      data: {
        raceNeutralReasons: body.raceNeutralReasons ?? challenge.raceNeutralReasons,
        explanation: body.explanation ?? challenge.explanation,
        comparisonJurorIds: body.comparisonJurorIds
          ? JSON.stringify(body.comparisonJurorIds)
          : challenge.comparisonJurorIds,
      },
      include: {
        juror: {
          include: { tags: true },
        },
      },
    });

    return NextResponse.json({ challenge: updated });
  } catch (error) {
    console.error('Failed to update Batson challenge:', error);
    return NextResponse.json({ error: 'Failed to update Batson challenge' }, { status: 500 });
  }
}

/**
 * DELETE - Remove a Batson challenge
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challenge = await prisma.batsonChallenge.findUnique({
      where: { id: params.id },
      include: { case: true },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.case.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.batsonChallenge.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Batson challenge deleted' });
  } catch (error) {
    console.error('Failed to delete Batson challenge:', error);
    return NextResponse.json({ error: 'Failed to delete Batson challenge' }, { status: 500 });
  }
}
