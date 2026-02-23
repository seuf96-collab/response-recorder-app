import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST - Apply a strike to a juror (atomic: updates juror status + case strike count)
 * Body: { jurorId, strikeType: 'STATE' | 'DEFENSE' | 'CAUSE' | 'EXCUSED' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jurorId, strikeType } = body;

    if (!jurorId || !strikeType) {
      return NextResponse.json({ error: 'jurorId and strikeType are required' }, { status: 400 });
    }

    // Fetch juror with case to verify ownership
    const juror = await prisma.juror.findUnique({
      where: { id: jurorId },
      include: { case: true },
    });

    if (!juror) {
      return NextResponse.json({ error: 'Juror not found' }, { status: 404 });
    }

    if (juror.case.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Determine new status
    let newStatus: string;
    let strikeField: string | null = null;

    switch (strikeType) {
      case 'STATE':
        newStatus = 'STRUCK_BY_STATE';
        strikeField = 'stateStrikesUsed';
        break;
      case 'DEFENSE':
        newStatus = 'STRUCK_BY_DEFENSE';
        strikeField = 'defenseStrikesUsed';
        break;
      case 'CAUSE':
        newStatus = 'STRUCK_FOR_CAUSE';
        strikeField = null; // For-cause strikes don't count against peremptory limits
        break;
      case 'EXCUSED':
        newStatus = 'EXCUSED';
        strikeField = null;
        break;
      default:
        return NextResponse.json({ error: 'Invalid strikeType. Use STATE, DEFENSE, CAUSE, or EXCUSED' }, { status: 400 });
    }

    // Check peremptory strike limits
    if (strikeField) {
      const caseData = juror.case;
      if (strikeType === 'STATE') {
        const limit = juror.panelType === 'ALTERNATE' ? caseData.stateAltStrikes : caseData.stateStrikes;
        // Count current state strikes for this panel type
        const currentCount = await prisma.juror.count({
          where: {
            caseId: caseData.id,
            panelType: juror.panelType,
            status: 'STRUCK_BY_STATE',
          },
        });
        if (currentCount >= limit) {
          return NextResponse.json({
            error: `State has used all ${limit} peremptory strikes for ${juror.panelType.toLowerCase()} panel`,
          }, { status: 400 });
        }
      } else if (strikeType === 'DEFENSE') {
        const limit = juror.panelType === 'ALTERNATE' ? caseData.defenseAltStrikes : caseData.defenseStrikes;
        const currentCount = await prisma.juror.count({
          where: {
            caseId: caseData.id,
            panelType: juror.panelType,
            status: 'STRUCK_BY_DEFENSE',
          },
        });
        if (currentCount >= limit) {
          return NextResponse.json({
            error: `Defense has used all ${limit} peremptory strikes for ${juror.panelType.toLowerCase()} panel`,
          }, { status: 400 });
        }
      }
    }

    // Update juror status and isStruck flag
    const updatedJuror = await prisma.juror.update({
      where: { id: jurorId },
      data: {
        status: newStatus,
        isStruck: true,
        forCause: strikeType === 'CAUSE',
      },
      include: {
        tags: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Update case strike counters
    if (strikeField) {
      await prisma.case.update({
        where: { id: juror.caseId },
        data: {
          [strikeField]: { increment: 1 },
        },
      });
    }

    // Fetch updated case data
    const updatedCase = await prisma.case.findUnique({
      where: { id: juror.caseId },
    });

    return NextResponse.json({ juror: updatedJuror, case: updatedCase });
  } catch (error) {
    console.error('Failed to apply strike:', error);
    return NextResponse.json({ error: 'Failed to apply strike' }, { status: 500 });
  }
}

/**
 * DELETE - Undo a strike (restore juror to ACTIVE)
 * Body: { jurorId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jurorId } = body;

    if (!jurorId) {
      return NextResponse.json({ error: 'jurorId is required' }, { status: 400 });
    }

    // Fetch juror with case to verify ownership
    const juror = await prisma.juror.findUnique({
      where: { id: jurorId },
      include: { case: true },
    });

    if (!juror) {
      return NextResponse.json({ error: 'Juror not found' }, { status: 404 });
    }

    if (juror.case.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Determine which counter to decrement
    let strikeField: string | null = null;
    if (juror.status === 'STRUCK_BY_STATE') {
      strikeField = 'stateStrikesUsed';
    } else if (juror.status === 'STRUCK_BY_DEFENSE') {
      strikeField = 'defenseStrikesUsed';
    }

    // Restore juror to active
    const updatedJuror = await prisma.juror.update({
      where: { id: jurorId },
      data: {
        status: 'ACTIVE',
        isStruck: false,
        forCause: false,
      },
      include: {
        tags: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Decrement case strike counter if it was a peremptory strike
    if (strikeField) {
      await prisma.case.update({
        where: { id: juror.caseId },
        data: {
          [strikeField]: { decrement: 1 },
        },
      });
    }

    // Fetch updated case data
    const updatedCase = await prisma.case.findUnique({
      where: { id: juror.caseId },
    });

    return NextResponse.json({ juror: updatedJuror, case: updatedCase });
  } catch (error) {
    console.error('Failed to undo strike:', error);
    return NextResponse.json({ error: 'Failed to undo strike' }, { status: 500 });
  }
}
