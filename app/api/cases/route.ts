import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get or create the default demo user
async function getDefaultUserId(): Promise<string> {
  let user = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        password: 'demo',
        name: 'Demo User',
      },
    });
  }

  return user.id;
}

// GET all cases
export async function GET(_request: NextRequest) {
  try {
    const userId = await getDefaultUserId();

    const cases = await prisma.case.findMany({
      where: { userId },
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

    const userId = await getDefaultUserId();

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
