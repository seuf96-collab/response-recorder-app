import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single juror
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const juror = await prisma.juror.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        case: true,
      },
    });

    if (!juror) {
      return NextResponse.json({ error: 'Juror not found' }, { status: 404 });
    }

    return NextResponse.json({ juror });
  } catch (error) {
    console.error('Failed to fetch juror:', error);
    return NextResponse.json({ error: 'Failed to fetch juror' }, { status: 500 });
  }
}

// PUT update juror
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

    const updatedJuror = await prisma.juror.update({
      where: { id: params.id },
      data: body,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ juror: updatedJuror });
  } catch (error) {
    console.error('Failed to update juror:', error);
    return NextResponse.json({ error: 'Failed to update juror' }, { status: 500 });
  }
}

// PATCH - Update juror tag
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
    }

    // Get the juror to find existing tags
    const juror = await prisma.juror.findUnique({
      where: { id: params.id },
      include: { tags: true },
    });

    if (!juror) {
      return NextResponse.json({ error: 'Juror not found' }, { status: 404 });
    }

    // Delete all existing tags
    await prisma.jurorTag.deleteMany({
      where: { jurorId: params.id },
    });

    // Create new tag
    await prisma.jurorTag.create({
      data: {
        jurorId: params.id,
        tag,
      },
    });

    const updatedJuror = await prisma.juror.findUnique({
      where: { id: params.id },
      include: {
        tags: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ juror: updatedJuror });
  } catch (error) {
    console.error('Failed to tag juror:', error);
    return NextResponse.json({ error: 'Failed to tag juror' }, { status: 500 });
  }
}

// DELETE juror
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.juror.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Juror deleted' });
  } catch (error) {
    console.error('Failed to delete juror:', error);
    return NextResponse.json({ error: 'Failed to delete juror' }, { status: 500 });
  }
}
