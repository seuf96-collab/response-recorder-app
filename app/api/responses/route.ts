import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateOverallScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

// GET responses for a juror or case
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jurorId = searchParams.get('jurorId');
    const caseId = searchParams.get('caseId');
    const questionId = searchParams.get('questionId');

    let query = supabase.from('response').select('*');

    if (jurorId) {
      query = query.eq('jurorId', jurorId);
    }

    if (questionId) {
      query = query.eq('questionId', questionId);
    }

    if (caseId) {
      // Get all jurors in this case
      const { data: jurors, error: jurorError } = await supabase
        .from('juror')
        .select('id')
        .eq('caseId', caseId);

      if (jurorError) throw jurorError;

      const jurorIds = (jurors || []).map(j => j.id);
      if (jurorIds.length > 0) {
        query = query.in('jurorId', jurorIds);
      } else {
        return NextResponse.json({ responses: [] });
      }
    }

    const { data: responses, error } = await query;

    if (error) throw error;

    return NextResponse.json({ responses: responses || [] });
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
    const { data: existingJuror, error: jurorFetchError } = await supabase
      .from('juror')
      .select('*')
      .eq('id', jurorId)
      .single();

    if (jurorFetchError && jurorFetchError.code !== 'PGRST116' && !existingJuror) {
      // If caseId provided, create the juror
      if (caseId) {
        const jurorNum = parseInt(jurorId.split('-')[1] || '0');
        const { error: createError } = await supabase
          .from('juror')
          .insert([
            {
              id: jurorId,
              caseId,
              jurorNumber: jurorNum,
              seatNumber: jurorNum,
            },
          ]);

        if (createError) throw createError;
      }
    }

    // Check if response already exists
    const { data: existingResponse, error: fetchError } = await supabase
      .from('response')
      .select('*')
      .eq('jurorId', jurorId)
      .eq('questionId', questionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let response;

    if (existingResponse) {
      // Update existing response
      const { data: updatedResponse, error: updateError } = await supabase
        .from('response')
        .update({
          scaledValue: scaledValue !== undefined ? scaledValue : existingResponse.scaledValue,
          textValue: textValue !== undefined ? textValue : existingResponse.textValue,
          boolValue: boolValue !== undefined ? boolValue : existingResponse.boolValue,
          answeredAt: new Date().toISOString(),
        })
        .eq('id', existingResponse.id)
        .select()
        .single();

      if (updateError) throw updateError;
      response = updatedResponse;
    } else {
      // Create new response
      const { data: newResponse, error: createError } = await supabase
        .from('response')
        .insert([
          {
            jurorId,
            questionId,
            scaledValue: scaledValue !== undefined ? scaledValue : null,
            textValue: textValue !== undefined ? textValue : null,
            boolValue: boolValue !== undefined ? boolValue : null,
            answeredAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      response = newResponse;
    }

    // Update juror's overall score if this is a scaled question
    if (scaledValue !== undefined) {
      const { data: allResponses, error: responseFetchError } = await supabase
        .from('response')
        .select('*, question(*)')
        .eq('jurorId', jurorId);

      if (responseFetchError) throw responseFetchError;

      const overallScore = calculateOverallScore(allResponses as any);

      if (overallScore !== null) {
        const { error: updateScoreError } = await supabase
          .from('juror')
          .update({ overallScore: Math.round(overallScore * 10) / 10 })
          .eq('id', jurorId);

        if (updateScoreError) throw updateScoreError;
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

    // Find the response
    const { data: existingResponse, error: fetchError } = await supabase
      .from('response')
      .select('*')
      .eq('jurorId', jurorId)
      .eq('questionId', questionId)
      .single();

    if (fetchError || !existingResponse) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Delete the response
    const { error: deleteError } = await supabase
      .from('response')
      .delete()
      .eq('id', existingResponse.id);

    if (deleteError) throw deleteError;

    // Recalculate juror's overall score after deleting response
    const { data: allResponses, error: responseFetchError } = await supabase
      .from('response')
      .select('*, question(*)')
      .eq('jurorId', jurorId);

    if (responseFetchError) throw responseFetchError;

    const overallScore = calculateOverallScore(allResponses as any);

    if (overallScore !== null) {
      const { error: updateScoreError } = await supabase
        .from('juror')
        .update({ overallScore: Math.round(overallScore * 10) / 10 })
        .eq('id', jurorId);

      if (updateScoreError) throw updateScoreError;
    } else {
      // If no responses left, set overallScore to null
      const { error: nullScoreError } = await supabase
        .from('juror')
        .update({ overallScore: null })
        .eq('id', jurorId);

      if (nullScoreError) throw nullScoreError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete response:', error);
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
  }
}
