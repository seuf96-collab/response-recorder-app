import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'default-user';

// Ensure default user exists
async function ensureDefaultUser() {
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('*')
    .eq('id', DEFAULT_USER_ID)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is expected
    throw fetchError;
  }

  if (!user) {
    const { error: createError } = await supabase
      .from('user')
      .insert([
        {
          id: DEFAULT_USER_ID,
          email: 'default@response-recorder.local',
          name: 'Default User',
          password: '',
        },
      ]);

    if (createError) throw createError;
  }

  return DEFAULT_USER_ID;
}

// GET all cases
export async function GET(_request: NextRequest) {
  try {
    const { data: cases, error } = await supabase
      .from('case')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cases: cases || [] });
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

    const newCase = {
      id: id || crypto.randomUUID(),
      name,
      causeNumber: causeNumber || null,
      defendantName: defendantName || null,
      offenseType: offenseType || null,
      date: date ? new Date(date).toISOString() : null,
      jurySize: jurySize || 12,
      numAlternates: numAlternates || 1,
      stateStrikes: stateStrikes || 10,
      defenseStrikes: defenseStrikes || 10,
      stateAltStrikes: stateAltStrikes || 1,
      defenseAltStrikes: defenseAltStrikes || 1,
      venireSize: venireSize || 36,
      userId,
    };

    const { data: createdCase, error } = await supabase
      .from('case')
      .insert([newCase])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ case: createdCase }, { status: 201 });
  } catch (error) {
    console.error('Failed to create case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
