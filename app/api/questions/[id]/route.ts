import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET single question
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: question, error } = await supabase
      .from('question')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !question) {
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

    const { data: updatedQuestion, error } = await supabase
      .from('question')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

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
    const { error } = await supabase
      .from('question')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
