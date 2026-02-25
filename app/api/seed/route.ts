import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Seed the database with default data if it doesn't exist
 * This endpoint is called on app startup to ensure the demo case exists
 */
export async function POST(request: NextRequest) {
  try {
    // Check if default case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: 'default-case-1' },
    });

    if (existingCase) {
      return NextResponse.json({
        message: 'Default case already exists',
        caseId: 'default-case-1',
      });
    }

    // Create a default user for the case
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

    // Create the default case
    const defaultCase = await prisma.case.create({
      data: {
        id: 'default-case-1',
        name: 'State v. Johnson',
        causeNumber: '2024-CV-001234',
        defendantName: 'Marcus Johnson',
        offenseType: 'Drug Possession',
        venireSize: 85,
        jurySize: 12,
        numAlternates: 1,
        stateStrikes: 10,
        defenseStrikes: 10,
        stateAltStrikes: 1,
        defenseAltStrikes: 1,
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: 'Database seeded successfully',
      case: defaultCase,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Seed failed - Details:', {
      message: errorMessage,
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      error: 'Seed failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
