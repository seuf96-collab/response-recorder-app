// ─── Voir Dire Strike-For-Cause Analyzer ──────────────────────────
// Backend-only service that calls Anthropic to produce structured
// Texas voir dire analysis with AJV validation on both request and response.

import Anthropic from '@anthropic-ai/sdk';
import Ajv2020 from 'ajv/dist/2020';
import fs from 'fs';
import path from 'path';

import requestSchema from '@/schemas/strike_for_cause_request.schema.json';
import responseSchema from '@/schemas/strike_for_cause_response.schema.json';

// ─── Types ────────────────────────────────────────────────────────

export interface TranscriptTurn {
  turn_id: string;
  speaker_role: 'prosecutor' | 'defense_counsel' | 'judge' | 'juror' | 'observer';
  juror_ref?: string;
  content: string;
  timestamp?: string;
  source?: string;
  nonverbal?: string;
  confidence?: 'verbatim' | 'paraphrase' | 'summary';
}

export interface StrikeForCauseRequest {
  jurisdiction: {
    state: 'TX';
    county?: string;
    court?: string;
    judge_profile?: string;
  };
  matter: {
    case_type: string;
    offense_level?: string;
    punishment_range_text?: string;
    key_legal_rules_in_play?: string[];
    prohibited_case_facts?: string[];
  };
  stage: 'group_screen' | 'individual_followup' | 'individual_lock_in' | 'cause_motion' | 'denied_cause_preservation';
  transcript: TranscriptTurn[];
  target_juror: {
    juror_ref: string;
    panel_position?: number;
  };
  analysis_focus?: string[];
  output_preferences?: {
    question_count?: number;
    include_alternatives?: boolean;
    include_motion_language?: boolean;
    include_preservation_script?: boolean;
    include_panel_safe_version?: boolean;
    response_format?: 'structured_json';
    verbosity?: 'concise' | 'standard' | 'detailed';
  };
  privacy?: {
    redact_juror_identifiers?: boolean;
    allow_storage_for_training?: false;
    retention_days?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface QuestionPlanItem {
  step: string;
  text: string;
  style: 'panel_safe' | 'individual' | 'bench';
  expected_signal: string;
  if_yes?: string;
  if_no?: string;
  if_hedge?: string;
}

export interface AnalysisItem {
  issue_id: string;
  juror_ref: string;
  issue_type: string;
  status: string;
  evidence_summary: string;
  key_admissions: { admission: string; source_turn_id: string }[];
  legal_hooks: { code: string; rationale: string }[];
  ambiguity_flags: string[];
  question_plan: {
    sequence_type: string;
    purpose: string;
    questions: QuestionPlanItem[];
    stop_conditions?: string[];
    anti_commitment_check?: string;
  };
  motion_language?: {
    short_form: string;
    expanded_form: string;
  };
  alternatives?: { approach: string; questions: { step: string; text: string }[] }[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_reasons: string[];
  source_turn_refs: string[];
}

export interface StrikeForCauseResponse {
  request_id: string;
  model: string;
  version: '1.0.0';
  jurisdiction: string;
  summary: {
    likely_cause_candidates: string[];
    likely_peremptory_only: string[];
    immediate_actions: string[];
    notes: string;
  };
  analyses: AnalysisItem[];
  preservation: {
    recommended: boolean;
    lines: string[];
    conditions: string[];
  };
  warnings: { type: string; message: string }[];
  audit?: {
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
    model_version: string;
  };
}

// ─── Schema Validators ────────────────────────────────────────────

const ajv = new Ajv2020({ allErrors: true, strict: false });

const validateRequest = ajv.compile(requestSchema);
const validateResponse = ajv.compile(responseSchema);

export function validateStrikeForCauseRequest(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateRequest(data);
  if (valid) return { valid: true, errors: [] };
  const errors = (validateRequest.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'unknown error'}`
  );
  return { valid: false, errors };
}

export function validateStrikeForCauseResponse(data: unknown): { valid: boolean; errors: string[] } {
  const valid = validateResponse(data);
  if (valid) return { valid: true, errors: [] };
  const errors = (validateResponse.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'unknown error'}`
  );
  return { valid: false, errors };
}

// ─── System Prompt Loader ─────────────────────────────────────────

let _cachedPrompt: string | null = null;

function loadSystemPrompt(): string {
  if (_cachedPrompt) return _cachedPrompt;
  const promptPath = path.join(process.cwd(), 'prompts', 'strike_for_cause_system.txt');
  _cachedPrompt = fs.readFileSync(promptPath, 'utf-8');
  return _cachedPrompt;
}

// ─── Anthropic API Key Loader ─────────────────────────────────────

function getAnthropicApiKey(): string {
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return apiKey;

  // Fallback: read from .env.local (handles Next.js env loading edge cases)
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf-8');
      const match = envContent.match(/^ANTHROPIC_API_KEY=["']?(.+?)["']?\s*$/m);
      if (match) {
        apiKey = match[1];
        process.env.ANTHROPIC_API_KEY = apiKey;
        return apiKey;
      }
    }
  } catch {
    // ignore
  }

  throw new Error('ANTHROPIC_API_KEY not found in environment or .env.local');
}

// ─── Build User Message ───────────────────────────────────────────

function buildUserMessage(req: StrikeForCauseRequest): string {
  const parts: string[] = [];

  // Jurisdiction
  parts.push(`## JURISDICTION\nState: ${req.jurisdiction.state}`);
  if (req.jurisdiction.county) parts.push(`County: ${req.jurisdiction.county}`);
  if (req.jurisdiction.court) parts.push(`Court: ${req.jurisdiction.court}`);
  if (req.jurisdiction.judge_profile) parts.push(`Judge Profile: ${req.jurisdiction.judge_profile}`);

  // Matter
  parts.push(`\n## MATTER\nCase Type: ${req.matter.case_type}`);
  if (req.matter.offense_level) parts.push(`Offense Level: ${req.matter.offense_level}`);
  if (req.matter.punishment_range_text) parts.push(`Punishment Range: ${req.matter.punishment_range_text}`);
  if (req.matter.key_legal_rules_in_play?.length) {
    parts.push(`Key Legal Rules: ${req.matter.key_legal_rules_in_play.join('; ')}`);
  }
  if (req.matter.prohibited_case_facts?.length) {
    parts.push(`PROHIBITED FACTS (do NOT reference): ${req.matter.prohibited_case_facts.join('; ')}`);
  }

  // Stage
  parts.push(`\n## STAGE\n${req.stage}`);

  // Target Juror
  parts.push(`\n## TARGET JUROR\nJuror Ref: ${req.target_juror.juror_ref}`);
  if (req.target_juror.panel_position != null) {
    parts.push(`Panel Position: ${req.target_juror.panel_position}`);
  }

  // Analysis Focus
  if (req.analysis_focus?.length) {
    parts.push(`\n## ANALYSIS FOCUS\n${req.analysis_focus.join(', ')}`);
  }

  // Transcript
  parts.push('\n## TRANSCRIPT');
  for (const turn of req.transcript) {
    let line = `[${turn.turn_id}] ${turn.speaker_role}`;
    if (turn.juror_ref) line += ` (${turn.juror_ref})`;
    line += `: ${turn.content}`;
    if (turn.nonverbal) line += ` [nonverbal: ${turn.nonverbal}]`;
    if (turn.confidence && turn.confidence !== 'verbatim') line += ` [${turn.confidence}]`;
    parts.push(line);
  }

  // Output Preferences
  const prefs = req.output_preferences ?? {};
  parts.push(`\n## OUTPUT PREFERENCES`);
  parts.push(`Question count target: ${prefs.question_count ?? 8}`);
  parts.push(`Include motion language: ${prefs.include_motion_language !== false}`);
  parts.push(`Include preservation script: ${prefs.include_preservation_script !== false}`);
  if (prefs.include_alternatives) parts.push('Include alternative approaches');
  if (prefs.include_panel_safe_version) parts.push('Include panel-safe versions of individual questions');
  parts.push(`Verbosity: ${prefs.verbosity ?? 'standard'}`);

  return parts.join('\n');
}

// ─── Define Tool Schema for Structured Output ─────────────────────

function getToolDefinition(): Anthropic.Tool {
  return {
    name: 'submit_strike_for_cause_analysis',
    description: 'Submit the complete strike-for-cause voir dire analysis as structured JSON.',
    input_schema: {
      type: 'object' as const,
      required: ['summary', 'analyses', 'preservation', 'warnings'],
      properties: {
        summary: {
          type: 'object' as const,
          required: ['likely_cause_candidates', 'likely_peremptory_only', 'immediate_actions', 'notes'],
          properties: {
            likely_cause_candidates: { type: 'array' as const, items: { type: 'string' as const } },
            likely_peremptory_only: { type: 'array' as const, items: { type: 'string' as const } },
            immediate_actions: { type: 'array' as const, items: { type: 'string' as const } },
            notes: { type: 'string' as const }
          }
        },
        analyses: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            required: ['issue_id', 'juror_ref', 'issue_type', 'status', 'evidence_summary', 'key_admissions', 'legal_hooks', 'ambiguity_flags', 'question_plan', 'confidence', 'confidence_reasons', 'source_turn_refs'],
            properties: {
              issue_id: { type: 'string' as const },
              juror_ref: { type: 'string' as const },
              issue_type: { type: 'string' as const },
              status: { type: 'string' as const, enum: ['strong_cause_candidate', 'possible_cause_needs_lock_in', 'insufficient_for_cause_peremptory_only', 'hardship_excuse_path', 'disqualification_admin_path'] },
              evidence_summary: { type: 'string' as const },
              key_admissions: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  required: ['admission', 'source_turn_id'],
                  properties: {
                    admission: { type: 'string' as const },
                    source_turn_id: { type: 'string' as const }
                  }
                }
              },
              legal_hooks: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  required: ['code', 'rationale'],
                  properties: {
                    code: { type: 'string' as const },
                    rationale: { type: 'string' as const }
                  }
                }
              },
              ambiguity_flags: { type: 'array' as const, items: { type: 'string' as const } },
              question_plan: {
                type: 'object' as const,
                required: ['sequence_type', 'purpose', 'questions'],
                properties: {
                  sequence_type: { type: 'string' as const },
                  purpose: { type: 'string' as const },
                  questions: {
                    type: 'array' as const,
                    items: {
                      type: 'object' as const,
                      required: ['step', 'text', 'style', 'expected_signal'],
                      properties: {
                        step: { type: 'string' as const, enum: ['normalize', 'define_rule', 'confirm_understanding', 'elicit_conflict', 'lock_in_override', 'binary_clarifier', 'cause_motion_line', 'preservation_line'] },
                        text: { type: 'string' as const },
                        style: { type: 'string' as const, enum: ['panel_safe', 'individual', 'bench'] },
                        expected_signal: { type: 'string' as const },
                        if_yes: { type: 'string' as const },
                        if_no: { type: 'string' as const },
                        if_hedge: { type: 'string' as const }
                      }
                    }
                  },
                  stop_conditions: { type: 'array' as const, items: { type: 'string' as const } },
                  anti_commitment_check: { type: 'string' as const }
                }
              },
              motion_language: {
                type: 'object' as const,
                properties: {
                  short_form: { type: 'string' as const },
                  expanded_form: { type: 'string' as const }
                }
              },
              alternatives: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  properties: {
                    approach: { type: 'string' as const },
                    questions: {
                      type: 'array' as const,
                      items: {
                        type: 'object' as const,
                        required: ['step', 'text'],
                        properties: {
                          step: { type: 'string' as const },
                          text: { type: 'string' as const }
                        }
                      }
                    }
                  }
                }
              },
              confidence: { type: 'string' as const, enum: ['HIGH', 'MEDIUM', 'LOW'] },
              confidence_reasons: { type: 'array' as const, items: { type: 'string' as const } },
              source_turn_refs: { type: 'array' as const, items: { type: 'string' as const } }
            }
          }
        },
        preservation: {
          type: 'object' as const,
          required: ['recommended', 'lines', 'conditions'],
          properties: {
            recommended: { type: 'boolean' as const },
            lines: { type: 'array' as const, items: { type: 'string' as const } },
            conditions: { type: 'array' as const, items: { type: 'string' as const } }
          }
        },
        warnings: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            required: ['type', 'message'],
            properties: {
              type: { type: 'string' as const, enum: ['commitment_question_risk', 'insufficient_record', 'hardship_not_cause', 'confirmatory_fairness_question', 'batson_risk', 'rehabilitation_vulnerability', 'missing_lock_in', 'nonverbal_only'] },
              message: { type: 'string' as const }
            }
          }
        }
      }
    }
  };
}

// ─── Main Analyze Function ────────────────────────────────────────

export async function analyzeStrikeForCause(
  requestPayload: StrikeForCauseRequest,
  requestId: string
): Promise<StrikeForCauseResponse> {
  // 1. Validate request
  const reqValidation = validateStrikeForCauseRequest(requestPayload);
  if (!reqValidation.valid) {
    throw new ValidationError('Request validation failed', reqValidation.errors);
  }

  // 2. Load system prompt
  const systemPrompt = loadSystemPrompt();

  // 3. Build user message
  const userMessage = buildUserMessage(requestPayload);

  // 4. Get API key and init client
  const apiKey = getAnthropicApiKey();
  const client = new Anthropic({ apiKey });

  // 5. Call Anthropic with tool-based structured output
  const startTime = Date.now();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0,
    system: systemPrompt,
    tools: [getToolDefinition()],
    tool_choice: { type: 'tool', name: 'submit_strike_for_cause_analysis' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const latencyMs = Date.now() - startTime;

  // 6. Extract tool call result
  const toolBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolBlock || !toolBlock.input) {
    throw new AnalyzerError('Model did not return a tool call result');
  }

  const rawAnalysis = toolBlock.input as Record<string, unknown>;

  // 7. Assemble full response
  const fullResponse: StrikeForCauseResponse = {
    request_id: requestId,
    model: message.model,
    version: '1.0.0',
    jurisdiction: 'TX',
    summary: rawAnalysis.summary as StrikeForCauseResponse['summary'],
    analyses: rawAnalysis.analyses as AnalysisItem[],
    preservation: rawAnalysis.preservation as StrikeForCauseResponse['preservation'],
    warnings: rawAnalysis.warnings as StrikeForCauseResponse['warnings'],
    audit: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      latency_ms: latencyMs,
      model_version: message.model,
    },
  };

  // 8. Validate response against schema
  const resValidation = validateStrikeForCauseResponse(fullResponse);
  if (!resValidation.valid) {
    console.error(
      `[voir-dire-analyzer] Response validation failed for request ${requestId}:`,
      resValidation.errors
    );
    throw new AnalyzerError(
      'Model output did not pass schema validation',
      resValidation.errors
    );
  }

  return fullResponse;
}

// ─── Custom Error Classes ─────────────────────────────────────────

export class ValidationError extends Error {
  public readonly errors: string[];
  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AnalyzerError extends Error {
  public readonly details?: string[];
  constructor(message: string, details?: string[]) {
    super(message);
    this.name = 'AnalyzerError';
    this.details = details;
  }
}
