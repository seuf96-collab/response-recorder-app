import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import Groq from 'groq-sdk';
import { buildForCauseStrategyPrompt, parseStrategyResponse } from '@/lib/ai/for-cause-prompt';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strategyModel = () => (prisma as any).forCauseStrategy as any;

// POST — Generate or regenerate for-cause strategy for a juror
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jurorId, regenerate } = await request.json();

    if (!jurorId) {
      return NextResponse.json({ error: 'jurorId is required' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured. Add your API key to .env.local' }, { status: 500 });
    }

    // Fetch juror with full profile
    const juror = await prisma.juror.findUnique({
      where: { id: jurorId },
      include: {
        tags: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
        responses: {
          include: {
            question: true,
          },
        },
        case: true,
      },
    });

    if (!juror) {
      return NextResponse.json({ error: 'Juror not found' }, { status: 404 });
    }

    // Verify case belongs to user
    if (juror.case.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check cache unless regenerating
    if (!regenerate) {
      const cached = await strategyModel().findUnique({
        where: { caseId_jurorId: { caseId: juror.caseId, jurorId: juror.id } },
      });

      if (cached) {
        return NextResponse.json({
          strategy: JSON.parse(cached.strategy),
          outcome: cached.outcome,
          outcomeNotes: cached.outcomeNotes,
          generatedAt: cached.generatedAt,
          cached: true,
        });
      }
    }

    // Build prompt
    const prompt = buildForCauseStrategyPrompt(
      {
        name: juror.case.name,
        causeNumber: juror.case.causeNumber,
        defendantName: juror.case.defendantName,
        offenseType: juror.case.offenseType,
      },
      {
        jurorNumber: juror.jurorNumber,
        firstName: juror.firstName,
        lastName: juror.lastName,
        age: juror.age,
        gender: juror.gender,
        occupation: juror.occupation,
        employer: juror.employer,
        educationLevel: juror.educationLevel,
        maritalStatus: juror.maritalStatus,
        numberOfChildren: juror.numberOfChildren,
        city: juror.city,
        neighborhood: juror.neighborhood,
        overallScore: juror.overallScore,
        attorneyRating: juror.attorneyRating,
        tags: juror.tags,
        notes: juror.notes,
        responses: juror.responses.map(r => ({
          scaledValue: r.scaledValue,
          textValue: r.textValue,
          question: {
            text: r.question.text,
            type: r.question.type,
            category: r.question.category,
            scaleMax: r.question.scaleMax,
            weight: r.question.weight,
          },
        })),
      }
    );

    // Call Groq API — using Llama 3.3 70B for fast, high-quality inference
    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a senior Texas prosecutor\'s jury selection consultant. Always respond with valid JSON only, no markdown or extra text.',
        },
        { role: 'user', content: prompt },
      ],
    });

    // Extract text response
    const responseText = chatCompletion.choices?.[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 });
    }

    // Parse the strategy
    const strategy = parseStrategyResponse(responseText);

    // Upsert cache
    const saved = await strategyModel().upsert({
      where: { caseId_jurorId: { caseId: juror.caseId, jurorId: juror.id } },
      create: {
        caseId: juror.caseId,
        jurorId: juror.id,
        strategy: JSON.stringify(strategy),
      },
      update: {
        strategy: JSON.stringify(strategy),
        generatedAt: new Date(),
        outcome: null,
        outcomeNotes: null,
      },
    });

    return NextResponse.json({
      strategy,
      outcome: null,
      outcomeNotes: null,
      generatedAt: saved.generatedAt,
      cached: false,
    });
  } catch (error: unknown) {
    console.error('For-cause strategy generation failed:', error);

    const err = error as { status?: number; message?: string };

    if (err?.status === 401) {
      return NextResponse.json({ error: 'Invalid GROQ_API_KEY. Check your .env.local file.' }, { status: 401 });
    }

    return NextResponse.json(
      { error: err?.message || 'Failed to generate strategy' },
      { status: 500 }
    );
  }
}

// PUT — Update outcome for a strategy
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jurorId, caseId, outcome, outcomeNotes } = await request.json();

    if (!jurorId || !caseId) {
      return NextResponse.json({ error: 'jurorId and caseId are required' }, { status: 400 });
    }

    const validOutcomes = ['SUCCESS', 'FAILED', 'NOT_ATTEMPTED'];
    if (outcome && !validOutcomes.includes(outcome)) {
      return NextResponse.json({ error: 'Invalid outcome value' }, { status: 400 });
    }

    const updated = await strategyModel().update({
      where: { caseId_jurorId: { caseId, jurorId } },
      data: {
        outcome: outcome || null,
        outcomeNotes: outcomeNotes || null,
      },
    });

    return NextResponse.json({
      strategy: JSON.parse(updated.strategy),
      outcome: updated.outcome,
      outcomeNotes: updated.outcomeNotes,
      generatedAt: updated.generatedAt,
    });
  } catch (error) {
    console.error('Failed to update strategy outcome:', error);
    return NextResponse.json({ error: 'Failed to update outcome' }, { status: 500 });
  }
}

// GET — Fetch all strategies for a case
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId query param is required' }, { status: 400 });
    }

    const strategies = await strategyModel().findMany({
      where: { caseId },
      orderBy: { generatedAt: 'desc' },
    });

    const parsed = (strategies as { jurorId: string; strategy: string; outcome: string | null; outcomeNotes: string | null; generatedAt: Date }[]).map(s => ({
      jurorId: s.jurorId,
      strategy: JSON.parse(s.strategy),
      outcome: s.outcome,
      outcomeNotes: s.outcomeNotes,
      generatedAt: s.generatedAt,
    }));

    return NextResponse.json({ strategies: parsed });
  } catch (error) {
    console.error('Failed to fetch strategies:', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}
