import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET jurors for a case
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const jurors = await prisma.juror.findMany({
      where: { caseId },
      orderBy: { jurorNumber: 'asc' },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        tags: true,
      },
    });

    return NextResponse.json({ jurors });
  } catch (error) {
    console.error('Failed to fetch jurors:', error);
    return NextResponse.json({ error: 'Failed to fetch jurors' }, { status: 500 });
  }
}

// POST create new juror
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      name,
      seatNumber,
      age,
      gender,
      occupation,
      employer,
      educationLevel,
      maritalStatus,
      numberOfChildren,
      childrenAges,
      zipCode,
      neighborhood,
    } = body;

    if (!caseId || !name || !seatNumber) {
      return NextResponse.json(
        { error: 'Case ID, name, and seat number are required' },
        { status: 400 }
      );
    }

    // Parse name into firstName / lastName
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    // Parse seat number as jurorNumber (required Int)
    const jurorNumber = parseInt(seatNumber);
    if (isNaN(jurorNumber)) {
      return NextResponse.json({ error: 'Seat number must be a number' }, { status: 400 });
    }

    const newJuror = await prisma.juror.create({
      data: {
        caseId,
        jurorNumber,
        seatNumber: jurorNumber,
        firstName,
        lastName,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        occupation: occupation || null,
        employer: employer || null,
        educationLevel: educationLevel || null,
        maritalStatus: maritalStatus || null,
        numberOfChildren: numberOfChildren != null ? parseInt(numberOfChildren) : null,
        childrenAges: childrenAges || null,
        zipCode: zipCode || null,
        neighborhood: neighborhood || null,
      },
      include: {
        notes: true,
        tags: true,
      },
    });

    return NextResponse.json({ juror: newJuror }, { status: 201 });
  } catch (error) {
    console.error('Failed to create juror:', error);
    return NextResponse.json({ error: 'Failed to create juror' }, { status: 500 });
  }
}
