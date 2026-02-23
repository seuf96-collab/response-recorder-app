// ─── Tests for Strike-For-Cause Voir Dire Analyzer ─────────────────
// Tests request/response validation, malformed input rejection, and
// ensures no client-side Anthropic usage exists in the codebase.

import {
  validateStrikeForCauseRequest,
  validateStrikeForCauseResponse,
  ValidationError,
  AnalyzerError,
} from '@/lib/ai/voir-dire-analyzer';

import {
  burdenFixture,
  probationRefusalFixture,
  defendantSilenceFixture,
  formedConclusionFixture,
  malformedRequest_missingTranscript,
  malformedRequest_invalidStage,
  malformedRequest_invalidJurisdiction,
  validResponseFixture,
  malformedResponseFixture,
} from './fixtures/voir-dire-fixtures';

import fs from 'fs';
import path from 'path';

// ─── Request Validation ──────────────────────────────────────────────

describe('Request Validation', () => {
  test('burdenFixture passes request validation', () => {
    const result = validateStrikeForCauseRequest(burdenFixture);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('probationRefusalFixture passes request validation', () => {
    const result = validateStrikeForCauseRequest(probationRefusalFixture);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('defendantSilenceFixture passes request validation', () => {
    const result = validateStrikeForCauseRequest(defendantSilenceFixture);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('formedConclusionFixture passes request validation', () => {
    const result = validateStrikeForCauseRequest(formedConclusionFixture);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects request missing transcript', () => {
    const result = validateStrikeForCauseRequest(malformedRequest_missingTranscript);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('transcript'))).toBe(true);
  });

  test('rejects request with invalid stage', () => {
    const result = validateStrikeForCauseRequest(malformedRequest_invalidStage);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects request with non-TX jurisdiction', () => {
    const result = validateStrikeForCauseRequest(malformedRequest_invalidJurisdiction);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects completely empty object', () => {
    const result = validateStrikeForCauseRequest({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects null input', () => {
    const result = validateStrikeForCauseRequest(null);
    expect(result.valid).toBe(false);
  });

  test('rejects string input', () => {
    const result = validateStrikeForCauseRequest('not an object');
    expect(result.valid).toBe(false);
  });
});

// ─── Response Validation ─────────────────────────────────────────────

describe('Response Validation', () => {
  test('validResponseFixture passes response validation', () => {
    const result = validateStrikeForCauseResponse(validResponseFixture);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects malformed response missing required fields', () => {
    const result = validateStrikeForCauseResponse(malformedResponseFixture);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects empty object response', () => {
    const result = validateStrikeForCauseResponse({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('rejects response with invalid confidence value', () => {
    const badResponse = JSON.parse(JSON.stringify(validResponseFixture));
    badResponse.analyses[0].confidence = 'MAYBE';
    const result = validateStrikeForCauseResponse(badResponse);
    expect(result.valid).toBe(false);
  });

  test('rejects response with invalid warning type', () => {
    const badResponse = JSON.parse(JSON.stringify(validResponseFixture));
    badResponse.warnings = [{ type: 'not_a_real_warning_type', message: 'test' }];
    const result = validateStrikeForCauseResponse(badResponse);
    expect(result.valid).toBe(false);
  });

  test('rejects response with missing analyses array', () => {
    const badResponse = JSON.parse(JSON.stringify(validResponseFixture));
    delete badResponse.analyses;
    const result = validateStrikeForCauseResponse(badResponse);
    expect(result.valid).toBe(false);
  });

  test('rejects response with missing preservation block', () => {
    const badResponse = JSON.parse(JSON.stringify(validResponseFixture));
    delete badResponse.preservation;
    const result = validateStrikeForCauseResponse(badResponse);
    expect(result.valid).toBe(false);
  });
});

// ─── Custom Error Classes ────────────────────────────────────────────

describe('Custom Error Classes', () => {
  test('ValidationError contains error messages', () => {
    const errors = ['field required', 'invalid type'];
    const err = new ValidationError('Test validation', errors);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.name).toBe('ValidationError');
    expect(err.message).toBe('Test validation');
    expect(err.errors).toEqual(errors);
  });

  test('AnalyzerError contains optional details', () => {
    const details = ['schema mismatch'];
    const err = new AnalyzerError('Test analyzer', details);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AnalyzerError);
    expect(err.name).toBe('AnalyzerError');
    expect(err.message).toBe('Test analyzer');
    expect(err.details).toEqual(details);
  });

  test('AnalyzerError works without details', () => {
    const err = new AnalyzerError('No details');
    expect(err.details).toBeUndefined();
  });
});

// ─── Fixture Content Correctness ─────────────────────────────────────

describe('Fixture Content Correctness', () => {
  test('burdenFixture targets correct juror', () => {
    expect(burdenFixture.target_juror.juror_ref).toBe('Juror #7');
    expect(burdenFixture.jurisdiction.state).toBe('TX');
  });

  test('probationRefusalFixture targets correct juror', () => {
    expect(probationRefusalFixture.target_juror.juror_ref).toBe('Juror #3');
    expect(probationRefusalFixture.matter.case_type).toBe('DWI');
  });

  test('defendantSilenceFixture has correct analysis focus', () => {
    expect(defendantSilenceFixture.analysis_focus).toContain('defendant_silence_bias');
  });

  test('formedConclusionFixture has multi-turn transcript', () => {
    expect(formedConclusionFixture.transcript.length).toBeGreaterThanOrEqual(2);
    expect(formedConclusionFixture.analysis_focus).toContain('formed_conclusion');
  });

  test('validResponseFixture has correct structure', () => {
    expect(validResponseFixture.version).toBe('1.0.0');
    expect(validResponseFixture.jurisdiction).toBe('TX');
    expect(validResponseFixture.analyses.length).toBeGreaterThan(0);
    expect(validResponseFixture.analyses[0].question_plan.questions.length).toBeGreaterThan(0);
    expect(validResponseFixture.preservation.recommended).toBe(true);
  });

  test('validResponseFixture analyses have question plans with all workflow steps', () => {
    const analysis = validResponseFixture.analyses[0];
    const steps = analysis.question_plan.questions.map((q) => q.step);
    // Should have record-building workflow steps
    expect(steps).toContain('normalize');
    expect(steps).toContain('define_rule');
    expect(steps).toContain('binary_clarifier');
    expect(steps).toContain('cause_motion_line');
    expect(steps).toContain('preservation_line');
  });

  test('validResponseFixture analyses reference source turns', () => {
    const analysis = validResponseFixture.analyses[0];
    expect(analysis.source_turn_refs.length).toBeGreaterThan(0);
    // All source_turn_refs should match transcript turn IDs
    const validTurnIds = burdenFixture.transcript.map((t) => t.turn_id);
    for (const ref of analysis.source_turn_refs) {
      expect(validTurnIds).toContain(ref);
    }
  });
});

// ─── System Prompt File ──────────────────────────────────────────────

describe('System Prompt File', () => {
  const promptPath = path.join(process.cwd(), 'prompts', 'strike_for_cause_system.txt');

  test('system prompt file exists', () => {
    expect(fs.existsSync(promptPath)).toBe(true);
  });

  test('system prompt is non-empty', () => {
    const content = fs.readFileSync(promptPath, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  test('system prompt references Texas Code of Criminal Procedure', () => {
    const content = fs.readFileSync(promptPath, 'utf-8');
    expect(content).toContain('35.16');
  });

  test('system prompt includes record-building workflow', () => {
    const content = fs.readFileSync(promptPath, 'utf-8');
    expect(content.toLowerCase()).toContain('normalize');
    expect(content.toLowerCase()).toContain('binary_clarifier');
    expect(content.toLowerCase()).toContain('lock_in');
  });
});

// ─── JSON Schemas Exist ──────────────────────────────────────────────

describe('JSON Schemas', () => {
  test('request schema file exists and is valid JSON', () => {
    const schemaPath = path.join(process.cwd(), 'schemas', 'strike_for_cause_request.schema.json');
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    expect(content.type).toBe('object');
    expect(content.required).toContain('jurisdiction');
    expect(content.required).toContain('transcript');
  });

  test('response schema file exists and is valid JSON', () => {
    const schemaPath = path.join(process.cwd(), 'schemas', 'strike_for_cause_response.schema.json');
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    expect(content.type).toBe('object');
    expect(content.required).toContain('analyses');
    expect(content.required).toContain('preservation');
  });
});

// ─── Security: No Client-Side Anthropic Calls ────────────────────────

describe('Security: No Client-Side Anthropic Usage', () => {
  test('no Anthropic imports in client components', () => {
    const clientDir = path.join(process.cwd(), 'app', 'dashboard', 'voir-dire', '_components');
    if (!fs.existsSync(clientDir)) return; // Skip if dir doesn't exist yet

    const files = fs.readdirSync(clientDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(clientDir, file), 'utf-8');
      expect(content).not.toContain("from '@anthropic-ai/sdk'");
      expect(content).not.toContain('from "@anthropic-ai/sdk"');
      expect(content).not.toContain("require('@anthropic-ai/sdk')");
      expect(content).not.toContain('require("@anthropic-ai/sdk")');
    }
  });

  test('no ANTHROPIC_API_KEY exposed in client components', () => {
    const clientDir = path.join(process.cwd(), 'app', 'dashboard', 'voir-dire', '_components');
    if (!fs.existsSync(clientDir)) return;

    const files = fs.readdirSync(clientDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(clientDir, file), 'utf-8');
      expect(content).not.toContain('ANTHROPIC_API_KEY');
      expect(content).not.toContain('process.env.ANTHROPIC');
    }
  });

  test('voir-dire client component calls API route, not Anthropic directly', () => {
    const clientFile = path.join(
      process.cwd(),
      'app',
      'dashboard',
      'voir-dire',
      '_components',
      'voir-dire-client.tsx'
    );
    if (!fs.existsSync(clientFile)) return;

    const content = fs.readFileSync(clientFile, 'utf-8');
    // Should call the API route
    expect(content).toContain('/api/voir-dire/strike-for-cause/analyze');
    // Should NOT import Anthropic
    expect(content).not.toContain('Anthropic');
  });
});

// ─── API Route File ──────────────────────────────────────────────────

describe('API Route', () => {
  test('API route file exists', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'voir-dire',
      'strike-for-cause',
      'analyze',
      'route.ts'
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  test('API route checks authentication', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'voir-dire',
      'strike-for-cause',
      'analyze',
      'route.ts'
    );
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('getServerSession');
    expect(content).toContain('Unauthorized');
  });

  test('API route uses dynamic = force-dynamic', () => {
    const routePath = path.join(
      process.cwd(),
      'app',
      'api',
      'voir-dire',
      'strike-for-cause',
      'analyze',
      'route.ts'
    );
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("export const dynamic = 'force-dynamic'");
  });
});
