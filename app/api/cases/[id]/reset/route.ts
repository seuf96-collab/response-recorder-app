import { prisma } from '@/lib/db';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;

    // Delete all related data
    await prisma.response.deleteMany({
      where: {
        question: {
          caseId,
        },
      },
    });

    await prisma.question.deleteMany({
      where: { caseId },
    });

    await prisma.juror.deleteMany({
      where: { caseId },
    });

    await prisma.batsonChallenge.deleteMany({
      where: { caseId },
    });

    await prisma.forCauseStrategy.deleteMany({
      where: { caseId },
    });

    // Delete the case itself
    await prisma.case.delete({
      where: { id: caseId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Reset failed:', error);
    return Response.json(
      { error: 'Failed to reset case' },
      { status: 500 }
    );
  }
}
