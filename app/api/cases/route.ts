import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'default-user';

// Ensure default user exists
async function ensureDefaultUser() {
  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'default@response-recorder.local',
        name: 'Default User',
        password: '',
      },
    });
  }

  return DEFAULT_USER_ID;
}

// GET all cases
export async function GET(_request: NextRequest) {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jurors: true },
        },
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Failed to fetch cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

// POST create new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      causeNumber,
      defendantName,
      offenseType,
      date,
      jurySize,
      numAlternates,
      stateStrikes,
      defenseStrikes,
      stateAltStrikes,
      defenseAltStrikes,
      venireSize,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Case name is required' }, { status: 400 });
    }

    // Ensure default user exists
    const userId = await ensureDefaultUser();

    const newCase = await prisma.case.create({
      data: {
        id: id || undefined,
        name,
        causeNumber,
        defendantName,
        offenseType,
        date: date ? new Date(date) : null,
        jurySize: jurySize || 12,
        numAlternates: numAlternates || 1,
        stateStrikes: stateStrikes || 10,
        defenseStrikes: defenseStrikes || 10,
        stateAltStrikes: stateAltStrikes || 1,
        defenseAltStrikes: defenseAltStrikes || 1,
        venireSize: venireSize || 36,
        userId,
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Failed to create case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
