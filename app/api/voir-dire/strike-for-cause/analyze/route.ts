import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  analyzeStrikeForCause,
  ValidationError,
  AnalyzerError,
} from '@/lib/ai/voir-dire-analyzer';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', request_id: requestId },
        { status: 400 }
      );
    }

    // 3. Log request metadata (no transcript content, no juror names)
    const payload = body as Record<string, unknown>;
    const targetJuror = payload?.target_juror as Record<string, unknown> | undefined;
    console.log(
      `[voir-dire] request=${requestId} juror_ref=${targetJuror?.juror_ref ?? 'unknown'} stage=${payload?.stage ?? 'unknown'}`
    );

    // 4. Run analysis
    const result = await analyzeStrikeForCause(
      body as Parameters<typeof analyzeStrikeForCause>[0],
      requestId
    );

    // 5. Return result
    return NextResponse.json(result);
  } catch (error) {
    // Validation error → 400
    if (error instanceof ValidationError) {
      console.warn(
        `[voir-dire] validation_error request=${requestId}`,
        error.errors
      );
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors,
          request_id: requestId,
        },
        { status: 400 }
      );
    }

    // Analyzer error (schema validation of model output, missing tool call) → 500
    if (error instanceof AnalyzerError) {
      console.error(
        `[voir-dire] analyzer_error request=${requestId}`,
        error.message,
        error.details
      );
      return NextResponse.json(
        {
          error: 'Analysis failed. The model returned an invalid response. Please try again.',
          request_id: requestId,
        },
        { status: 500 }
      );
    }

    // API key errors
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      console.error(`[voir-dire] missing_api_key request=${requestId}`);
      return NextResponse.json(
        {
          error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to .env.local',
          request_id: requestId,
        },
        { status: 500 }
      );
    }

    // Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as Error & { status: number };
      console.error(
        `[voir-dire] api_error request=${requestId} status=${apiError.status}`,
        apiError.message
      );
      return NextResponse.json(
        {
          error: 'AI service error. Please try again later.',
          request_id: requestId,
        },
        { status: 502 }
      );
    }

    // Generic error
    console.error(`[voir-dire] unexpected_error request=${requestId}`, error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}
