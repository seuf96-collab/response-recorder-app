// ─── For-Cause Strategy Prompt Builder ───────────────────────────────
// Generates structured prompts for Claude to create targeted voir dire
// strategies to strike unfavorable jurors for cause.

interface JurorProfile {
  jurorNumber: number;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  occupation: string | null;
  employer: string | null;
  educationLevel: string | null;
  maritalStatus: string | null;
  numberOfChildren: number | null;
  city: string | null;
  neighborhood: string | null;
  overallScore: number | null;
  attorneyRating: number;
  tags: { tag: string }[];
  notes: { content: string }[];
  responses: {
    scaledValue: number | null;
    textValue: string | null;
    question: {
      text: string;
      type: string;
      category: string | null;
      scaleMax: number | null;
      weight: number;
    };
  }[];
}

interface CaseContext {
  name: string;
  causeNumber: string | null;
  defendantName: string | null;
  offenseType: string | null;
}

// ─── Offense-specific bias areas ────────────────────────────────────
const OFFENSE_BIAS_AREAS: Record<string, string> = {
  'DWI': `
- Beliefs that "everyone drives after a couple drinks" or normalizing impaired driving
- Personal/family history with alcohol or substance abuse creating sympathy
- Distrust of field sobriety tests or breathalyzer accuracy
- Belief that DWI laws are too harsh or that punishment doesn't fit
- "There but for the grace of God" mentality — could happen to anyone
- Opposition to criminalizing conduct they see as victimless (no accident cases)`,

  'ASSAULT': `
- Belief in "mutual combat" or that fights are always two-sided
- Personal history with violence creating excessive sympathy for defendant
- Reluctance to convict on "he said/she said" without physical evidence
- Cultural beliefs that certain physical altercations are acceptable
- Distrust of alleged victims who delayed reporting
- Belief that intent to injure is required even for reckless conduct`,

  'SEXUAL ASSAULT': `
- Belief that delayed reporting means fabrication
- Victim-blaming tendencies (clothing, behavior, intoxication)
- Requirement of physical resistance as proof of non-consent
- Distrust of accusers in acquaintance/date situations
- Belief that false accusations are common
- Inability to convict without physical/forensic evidence
- Personal experiences creating strong emotional reactions that impair impartiality`,

  'MURDER': `
- Moral or religious objections to severe sentences
- Belief that killing can always be justified in self-defense without evidence
- Inability to consider the full range of punishment
- Bias against circumstantial evidence
- Belief that motive must be proven
- Prior negative experiences with law enforcement undermining credibility of investigation`,

  'DRUGS': `
- Belief that drug possession/use should not be criminal
- Personal or family drug use history creating excessive sympathy
- Opposition to the "War on Drugs" on principle
- Inability to follow the law as written regardless of personal opinion
- Belief that addiction is only a medical issue, never criminal
- Distrust of confidential informants or undercover operations`,

  'THEFT': `
- Sympathy for defendants perceived as stealing out of necessity
- Belief that property crimes are victimless
- Expectation of video/forensic evidence for all theft cases
- Bias that retailers/corporations "deserve it" or can absorb losses
- Distrust of loss prevention officers or store employees as witnesses`,

  'DOMESTIC VIOLENCE': `
- Belief that domestic disputes are "private matters"
- Skepticism of recanting victims or those who stay in relationships
- Cultural attitudes minimizing domestic violence
- Belief that both parties are always equally responsible
- Inability to convict when victim does not want prosecution
- Personal history with DV creating excessive sympathy for either side`,
};

function getOffenseBiasAreas(offenseType: string | null): string {
  if (!offenseType) return '- General unwillingness to follow the law as instructed by the judge\n- Inability to be fair and impartial to both sides\n- Fixed opinions that cannot be set aside';

  const normalized = offenseType.toUpperCase().trim();

  // Try exact match first
  for (const [key, value] of Object.entries(OFFENSE_BIAS_AREAS)) {
    if (normalized.includes(key)) return value;
  }

  // Fallback aliases
  if (normalized.includes('INTOX') || normalized.includes('DUI') || normalized.includes('DRUNK'))
    return OFFENSE_BIAS_AREAS['DWI'];
  if (normalized.includes('SEX') || normalized.includes('RAPE') || normalized.includes('INDECEN'))
    return OFFENSE_BIAS_AREAS['SEXUAL ASSAULT'];
  if (normalized.includes('HOMIC') || normalized.includes('MANSLAUGHTER') || normalized.includes('KILL'))
    return OFFENSE_BIAS_AREAS['MURDER'];
  if (normalized.includes('NARC') || normalized.includes('CONTROLLED') || normalized.includes('SUBSTANCE') || normalized.includes('METH') || normalized.includes('COCAINE') || normalized.includes('MARIJUANA'))
    return OFFENSE_BIAS_AREAS['DRUGS'];
  if (normalized.includes('BURG') || normalized.includes('ROB') || normalized.includes('STEAL') || normalized.includes('SHOPLIFT'))
    return OFFENSE_BIAS_AREAS['THEFT'];
  if (normalized.includes('FAMILY') || normalized.includes('DOMESTIC') || normalized.includes('SPOUSE'))
    return OFFENSE_BIAS_AREAS['DOMESTIC VIOLENCE'];
  if (normalized.includes('AGG') && normalized.includes('ASSAULT'))
    return OFFENSE_BIAS_AREAS['ASSAULT'];
  if (normalized.includes('BATTERY') || normalized.includes('ASSAULT'))
    return OFFENSE_BIAS_AREAS['ASSAULT'];

  return '- General unwillingness to follow the law as instructed by the judge\n- Inability to be fair and impartial to both sides\n- Fixed opinions that cannot be set aside';
}

// ─── Build juror profile summary ────────────────────────────────────
function buildJurorSummary(juror: JurorProfile): string {
  const parts: string[] = [];

  const name = [juror.firstName, juror.lastName].filter(Boolean).join(' ') || 'Unknown';
  parts.push(`**Juror #${juror.jurorNumber} — ${name}**`);

  const demo: string[] = [];
  if (juror.age) demo.push(`Age ${juror.age}`);
  if (juror.gender) demo.push(juror.gender);
  if (juror.occupation) demo.push(`Occupation: ${juror.occupation}`);
  if (juror.employer) demo.push(`Employer: ${juror.employer}`);
  if (juror.educationLevel) demo.push(`Education: ${juror.educationLevel}`);
  if (juror.maritalStatus) demo.push(`Marital: ${juror.maritalStatus}`);
  if (juror.numberOfChildren !== null) demo.push(`Children: ${juror.numberOfChildren}`);
  if (juror.city) demo.push(`City: ${juror.city}`);
  if (juror.neighborhood) demo.push(`Area: ${juror.neighborhood}`);
  if (demo.length > 0) parts.push(`Demographics: ${demo.join(', ')}`);

  if (juror.overallScore !== null) {
    const label = juror.overallScore >= 4 ? 'favorable' : juror.overallScore >= 2.5 ? 'neutral' : 'unfavorable';
    parts.push(`Overall Score: ${juror.overallScore}/5 (${label})`);
  }

  if (juror.attorneyRating !== 0) {
    const sign = juror.attorneyRating > 0 ? '+' : '';
    parts.push(`Attorney Impression: ${sign}${juror.attorneyRating} (${juror.attorneyRating < 0 ? 'negative gut feeling' : 'positive gut feeling'})`);
  }

  if (juror.tags.length > 0) {
    parts.push(`Tags: ${juror.tags.map(t => t.tag).join(', ')}`);
  }

  // Scaled responses
  const scaled = juror.responses.filter(r => r.question.type === 'SCALED' && r.scaledValue !== null);
  if (scaled.length > 0) {
    parts.push('Scaled Responses:');
    for (const r of scaled) {
      const max = r.question.scaleMax || 5;
      const wt = r.question.weight > 1 ? ` (weight: ${r.question.weight}x)` : '';
      parts.push(`  - "${r.question.text}": ${r.scaledValue}/${max}${wt}`);
    }
  }

  // Open-ended responses
  const openEnded = juror.responses.filter(r => r.question.type === 'OPEN_ENDED' && r.textValue);
  if (openEnded.length > 0) {
    parts.push('Open-Ended Responses:');
    for (const r of openEnded) {
      parts.push(`  - "${r.question.text}": "${r.textValue}"`);
    }
  }

  // Notes
  if (juror.notes.length > 0) {
    parts.push('Attorney Notes:');
    for (const n of juror.notes) {
      parts.push(`  - ${n.content}`);
    }
  }

  return parts.join('\n');
}

// ─── Main prompt builder ────────────────────────────────────────────
export function buildForCauseStrategyPrompt(
  caseContext: CaseContext,
  juror: JurorProfile
): string {
  const offenseBiases = getOffenseBiasAreas(caseContext.offenseType);
  const jurorSummary = buildJurorSummary(juror);

  return `You are a senior Texas prosecutor's jury selection consultant with 25+ years of trial experience. Your specialty is crafting voir dire questioning strategies that lawfully identify jurors who cannot be fair and impartial, building a record to strike them for cause.

## CASE CONTEXT
- Case: ${caseContext.name}
${caseContext.causeNumber ? `- Cause #: ${caseContext.causeNumber}` : ''}
${caseContext.defendantName ? `- Defendant: ${caseContext.defendantName}` : ''}
- Offense Type: ${caseContext.offenseType || 'General criminal'}

## JUROR PROFILE
${jurorSummary}

## OFFENSE-SPECIFIC BIAS AREAS TO EXPLORE
${offenseBiases}

## YOUR TASK
Analyze this juror's profile and generate a for-cause strike strategy. Focus on identifying this juror's most likely vulnerabilities — areas where their background, responses, or attitudes suggest they may be unable to follow the law as instructed.

## EXPERIENCED TRIAL LAWYER TECHNIQUES TO USE
1. **Looping**: Reference the juror's own prior answers to build deeper commitment to a biased position. ("Earlier you mentioned X. Tell me more about that...")
2. **Commitment & Follow-Through**: Get the juror to commit to a position, then show how it conflicts with their duty. ("So if I understand correctly, you believe X. Would it be fair to say that even if the judge instructed you to do Y, you might have difficulty with that?")
3. **Normalizing Honesty**: Frame questions so jurors feel safe admitting bias. ("Many people feel that way, and there's absolutely nothing wrong with that. I just need to understand — can you set that aside?")
4. **Hypothetical Scenarios**: Use case-specific hypotheticals that expose inability to be impartial without revealing case facts.
5. **The "Can You Be Fair" Trap**: Never ask "can you be fair?" directly (they always say yes). Instead, build the record showing they cannot, then ask the commitment question last.
6. **Rehabilitation Prevention**: Anticipate how defense counsel will try to rehabilitate, and inoculate against it by getting firm commitments before they have a chance.

## REQUIRED OUTPUT FORMAT
Respond with a valid JSON object (no markdown code fences) matching this exact structure:

{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "priorityReasoning": "1-2 sentence explanation of why this juror is a good/poor candidate for a for-cause challenge",
  "vulnerabilities": [
    {
      "area": "Short label for the bias area (e.g. 'Distrust of Law Enforcement')",
      "evidence": "What in the juror's profile suggests this vulnerability",
      "exploitability": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "questionSequences": [
    {
      "label": "Short name for this line of questioning (e.g. 'Burden of Proof Exploration')",
      "technique": "Which technique is used (Looping, Commitment, Normalizing, Hypothetical, etc.)",
      "targetVulnerability": "Which vulnerability this sequence targets",
      "questions": [
        {
          "text": "The exact question to ask, word for word",
          "purpose": "Brief note on what this question accomplishes",
          "followUpIf": "What response to listen for that opens the next question"
        }
      ],
      "closingCommitment": "The final commitment question that locks in the for-cause record"
    }
  ],
  "anticipatedRehabilitation": "How defense counsel will likely try to rehabilitate this juror, and how to preempt it",
  "overallAssessment": "2-3 sentence summary: how likely is a successful for-cause challenge, and what's the key to making it work"
}

Generate 2-4 question sequences targeting the juror's most promising vulnerabilities. Each sequence should have 3-6 questions that build progressively. Be specific and practical — these questions will be asked in a real courtroom.`;
}

// ─── Parse AI response ──────────────────────────────────────────────
export interface ForCauseStrategyResult {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityReasoning: string;
  vulnerabilities: {
    area: string;
    evidence: string;
    exploitability: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  questionSequences: {
    label: string;
    technique: string;
    targetVulnerability: string;
    questions: {
      text: string;
      purpose: string;
      followUpIf: string;
    }[];
    closingCommitment: string;
  }[];
  anticipatedRehabilitation: string;
  overallAssessment: string;
}

export function parseStrategyResponse(raw: string): ForCauseStrategyResult {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Find the JSON object boundaries (first { to last })
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Try parsing directly first
  try {
    const parsed = JSON.parse(cleaned) as ForCauseStrategyResult;
    if (parsed.priority && parsed.questionSequences) return parsed;
  } catch {
    // Fall through to repair attempts
  }

  // Repair common JSON issues from LLMs:
  // 1. Remove trailing commas before } or ]
  let repaired = cleaned.replace(/,\s*([}\]])/g, '$1');
  // 2. Fix unescaped newlines inside strings
  repaired = repaired.replace(/(?<=": ")([\s\S]*?)(?="[,}\]])/g, (match) => {
    return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  });
  // 3. Fix single quotes used as string delimiters
  // (only if double-quote parse still fails)

  try {
    const parsed = JSON.parse(repaired) as ForCauseStrategyResult;
    if (parsed.priority && parsed.questionSequences) return parsed;
  } catch {
    // Fall through
  }

  // Last resort: try to extract JSON more aggressively by fixing unescaped quotes in values
  // Replace internal unescaped double quotes within string values
  let aggressive = cleaned;
  // Fix strings that contain unescaped quotes (match "key": "value with "quotes" inside")
  aggressive = aggressive.replace(
    /("(?:text|purpose|followUpIf|evidence|area|label|technique|targetVulnerability|closingCommitment|anticipatedRehabilitation|overallAssessment|priorityReasoning)":\s*")([\s\S]*?)("(?:\s*[,}\]]))/g,
    (_, prefix, content, suffix) => {
      const fixed = content
        .replace(/(?<!\\)"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
      return prefix + fixed + suffix;
    }
  );

  try {
    const parsed = JSON.parse(aggressive) as ForCauseStrategyResult;
    if (parsed.priority && parsed.questionSequences) return parsed;
  } catch (e) {
    // Nothing worked — throw with details
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('[parseStrategyResponse] All parse attempts failed. Raw length:', raw.length);
    console.error('[parseStrategyResponse] First 500 chars:', cleaned.substring(0, 500));
    throw new Error(`Failed to parse AI response as JSON: ${errMsg}`);
  }

  throw new Error('Invalid strategy response structure');
}
