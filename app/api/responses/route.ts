import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateOverallScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// GET responses for a juror or case
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jurorId = searchParams.get('jurorId');
    const caseId = searchParams.get('caseId');
    const questionId = searchParams.get('questionId');

    let whereClause: any = {};

    if (jurorId) {
      whereClause.jurorId = jurorId;
    }

    if (questionId) {
      whereClause.questionId = questionId;
    }

    if (caseId) {
      // Get all jurors in this case
      const jurors = await prisma.juror.findMany({
        where: { caseId },
        select: { id: true },
      });

      whereClause.jurorId = {
        in: jurors.map(j => j.id),
      };
    }

    const responses = await prisma.response.findMany({
      where: whereClause,
      include: {
        question: true,
        juror: true,
      },
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

// POST create or update response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jurorId, questionId, scaledValue, textValue, boolValue, caseId } = body;

    if (!jurorId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure juror exists (create if not found)
    let juror = await prisma.juror.findUnique({
      where: { id: jurorId },
    });

    if (!juror && caseId) {
      // Extract juror number from ID (e.g., "juror-5" -> 5)
      const jurorNum = parseInt(jurorId.split('-')[1] || '0');
      juror = await prisma.juror.create({
        data: {
          id: jurorId,
          caseId,
          jurorNumber: jurorNum,
          seatNumber: jurorNum,
        },
      });
    }

    // Check if response already exists
    const existingResponse = await prisma.response.findFirst({
      where: {
        jurorId,
        questionId,
      },
    });

    let response;

    if (existingResponse) {
      // Update existing response
      response = await prisma.response.update({
        where: { id: existingResponse.id },
        data: {
          scaledValue: scaledValue !== undefined ? scaledValue : existingResponse.scaledValue,
          textValue: textValue !== undefined ? textValue : existingResponse.textValue,
          boolValue: boolValue !== undefined ? boolValue : existingResponse.boolValue,
          answeredAt: new Date(),
        },
        include: {
          question: true,
        },
      });
    } else {
      // Create new response
      response = await prisma.response.create({
        data: {
          jurorId,
          questionId,
          scaledValue: scaledValue !== undefined ? scaledValue : null,
          textValue: textValue !== undefined ? textValue : null,
          boolValue: boolValue !== undefined ? boolValue : null,
          answeredAt: new Date(),
        },
        include: {
          question: true,
        },
      });
    }

    // Update juror's overall score if this is a scaled question
    if (scaledValue !== undefined) {
      const allResponses = await prisma.response.findMany({
        where: { jurorId },
        include: { question: true },
      });

      const overallScore = calculateOverallScore(allResponses as any);

      if (overallScore !== null) {
        await prisma.juror.update({
          where: { id: jurorId },
          data: { overallScore: Math.round(overallScore * 10) / 10 },
        });
      }
    }

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Failed to create response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}

// DELETE remove a response
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { jurorId, questionId } = body;

    if (!jurorId || !questionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find and delete the response
    const existingResponse = await prisma.response.findFirst({
      where: {
        jurorId,
        questionId,
      },
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    await prisma.response.delete({
      where: { id: existingResponse.id },
    });

    // Recalculate juror's overall score after deleting response
    const allResponses = await prisma.response.findMany({
      where: { jurorId },
      include: { question: true },
    });

    const overallScore = calculateOverallScore(allResponses as any);

    if (overallScore !== null) {
      await prisma.juror.update({
        where: { id: jurorId },
        data: { overallScore: Math.round(overallScore * 10) / 10 },
      });
    } else {
      // If no responses left, set overallScore to null
      await prisma.juror.update({
        where: { id: jurorId },
        data: { overallScore: null },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete response:', error);
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
  }
}
