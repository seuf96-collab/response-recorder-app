import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single question
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findFirst({
      where: {
        id: params.id,
      },
      include: {
        responses: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Failed to fetch question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}

// PATCH update question
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { text, type, scaleMax, weight, reverseValues, category, sortOrder } = body;

    // Build update data, only including fields that were provided
    const updateData: Record<string, any> = {};
    if (text !== undefined) updateData.text = text;
    if (type !== undefined) updateData.type = type;
    if (scaleMax !== undefined) updateData.scaleMax = type === 'SCALED' ? scaleMax : null;
    if (weight !== undefined) updateData.weight = type === 'SCALED' ? Math.min(Math.max(weight || 1, 1), 5) : 1;
    if (reverseValues !== undefined) updateData.reverseValues = (type === 'SCALED' || type === 'YES_NO') ? reverseValues : false;
    if (category !== undefined) updateData.category = category;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedQuestion = await prisma.question.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE question
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
