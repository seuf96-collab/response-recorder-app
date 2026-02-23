import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single case
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseData = await prisma.case.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        jurors: {
          include: {
            notes: true,
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ case: caseData });
  } catch (error) {
    console.error('Failed to fetch case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

// PUT update case
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

    const updatedCase = await prisma.case.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error('Failed to update case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

// DELETE case
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.case.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Case deleted' });
  } catch (error) {
    console.error('Failed to delete case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
