import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST create new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jurorId, content } = body;

    if (!jurorId || !content) {
      return NextResponse.json(
        { error: 'Juror ID and content are required' },
        { status: 400 }
      );
    }

    const newNote = await prisma.note.create({
      data: {
        jurorId,
        content,
      },
    });

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
