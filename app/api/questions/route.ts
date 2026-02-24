import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET all questions for a case
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 });
    }

    const { data: questions, error } = await supabase
      .from('question')
      .select('*')
      .eq('caseId', caseId)
      .order('sortOrder', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch questions - Details:', {
      message: errorMessage,
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      error: 'Failed to fetch questions',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// POST create new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, text, type, scaleMax, weight, category, sortOrder } = body;

    if (!caseId || !text || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newQuestion = {
      caseId,
      text,
      type,
      scaleMax: type === 'SCALED' ? (scaleMax || 5) : null,
      weight: type === 'SCALED' ? Math.min(Math.max(weight || 1, 1), 5) : 1,
      category: category || null,
      sortOrder: sortOrder || 0,
    };

    const { data: createdQuestion, error } = await supabase
      .from('question')
      .insert([newQuestion])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ question: createdQuestion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to create question - Details:', {
      message: errorMessage,
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      error: 'Failed to create question',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
