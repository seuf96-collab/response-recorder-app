// ─── Test Fixtures for Strike-For-Cause Voir Dire Analyzer ────────

import type { StrikeForCauseRequest, StrikeForCauseResponse } from '@/lib/ai/voir-dire-analyzer';

// ─── 1. Burden / One-Witness / Proof Sufficiency ──────────────────

export const burdenFixture: StrikeForCauseRequest = {
  jurisdiction: { state: 'TX', county: 'Harris' },
  matter: {
    case_type: 'Sexual Assault',
    offense_level: 'second_degree_felony',
    punishment_range_text: '2 to 20 years TDC',
    key_legal_rules_in_play: ['burden of proof', 'sufficiency of evidence'],
  },
  stage: 'individual_followup',
  transcript: [
    {
      turn_id: 'T1',
      speaker_role: 'prosecutor',
      content: 'Is there any particular type of evidence you would need to see before you could find someone guilty?',
    },
    {
      turn_id: 'T2',
      speaker_role: 'juror',
      juror_ref: 'Juror #7',
      content: 'I would need DNA or video evidence. I just don\'t think I could convict someone based on one person\'s word alone.',
      nonverbal: 'Arms crossed, shaking head',
    },
    {
      turn_id: 'T3',
      speaker_role: 'prosecutor',
      content: 'And if the judge instructed you that the law does not require any specific type of evidence?',
    },
    {
      turn_id: 'T4',
      speaker_role: 'juror',
      juror_ref: 'Juror #7',
      content: 'I hear you, but I just don\'t think I could do it. I\'d need something more than just testimony.',
    },
  ],
  target_juror: { juror_ref: 'Juror #7', panel_position: 7 },
  analysis_focus: ['evidence_type_requirement', 'burden_shifting'],
  output_preferences: {
    include_motion_language: true,
    include_preservation_script: true,
    response_format: 'structured_json',
    verbosity: 'standard',
  },
  privacy: {
    redact_juror_identifiers: true,
    allow_storage_for_training: false,
  },
};

// ─── 2. Full-Range Punishment / Probation Refusal ─────────────────

export const probationRefusalFixture: StrikeForCauseRequest = {
  jurisdiction: { state: 'TX', county: 'Dallas' },
  matter: {
    case_type: 'DWI',
    offense_level: 'misdemeanor_a',
    punishment_range_text: 'Up to 1 year in county jail and/or up to $4,000 fine; probation eligible',
    key_legal_rules_in_play: ['full range of punishment', 'probation eligibility'],
  },
  stage: 'individual_followup',
  transcript: [
    {
      turn_id: 'T1',
      speaker_role: 'prosecutor',
      content: 'If you found the defendant guilty, could you consider the full range of punishment, including probation?',
    },
    {
      turn_id: 'T2',
      speaker_role: 'juror',
      juror_ref: 'Juror #3',
      content: 'No. I could never give probation for a DWI. Someone could get killed. They need to go to jail, period.',
    },
  ],
  target_juror: { juror_ref: 'Juror #3', panel_position: 3 },
  analysis_focus: ['full_range_punishment', 'probation_refusal'],
  output_preferences: {
    include_motion_language: true,
    include_preservation_script: true,
    response_format: 'structured_json',
    verbosity: 'standard',
  },
  privacy: {
    redact_juror_identifiers: true,
    allow_storage_for_training: false,
  },
};

// ─── 3. Defendant Silence ─────────────────────────────────────────

export const defendantSilenceFixture: StrikeForCauseRequest = {
  jurisdiction: { state: 'TX', county: 'Bexar' },
  matter: {
    case_type: 'Aggravated Assault',
    offense_level: 'second_degree_felony',
    punishment_range_text: '2 to 20 years TDC',
    key_legal_rules_in_play: ['Fifth Amendment', 'presumption of innocence'],
  },
  stage: 'individual_followup',
  transcript: [
    {
      turn_id: 'T1',
      speaker_role: 'prosecutor',
      content: 'The defendant has an absolute right not to testify. How do you feel about that?',
    },
    {
      turn_id: 'T2',
      speaker_role: 'juror',
      juror_ref: 'Juror #11',
      content: 'If the defendant doesn\'t testify, that would affect me. I\'d think they have something to hide. If you\'re innocent, why wouldn\'t you say so?',
    },
  ],
  target_juror: { juror_ref: 'Juror #11', panel_position: 11 },
  analysis_focus: ['defendant_silence_bias'],
  output_preferences: {
    include_motion_language: true,
    include_preservation_script: true,
    response_format: 'structured_json',
    verbosity: 'standard',
  },
  privacy: {
    redact_juror_identifiers: true,
    allow_storage_for_training: false,
  },
};

// ─── 4. Formed Conclusion ─────────────────────────────────────────

export const formedConclusionFixture: StrikeForCauseRequest = {
  jurisdiction: { state: 'TX', county: 'Tarrant' },
  matter: {
    case_type: 'Murder',
    offense_level: 'first_degree_felony',
    punishment_range_text: '5 to 99 years or life TDC',
    key_legal_rules_in_play: ['presumption of innocence', 'formed conclusion'],
  },
  stage: 'individual_followup',
  transcript: [
    {
      turn_id: 'T1',
      speaker_role: 'prosecutor',
      content: 'Have you heard anything about this case in the news?',
    },
    {
      turn_id: 'T2',
      speaker_role: 'juror',
      juror_ref: 'Juror #5',
      content: 'Yes, I saw it on the news. I already think he\'s guilty based on what I saw.',
    },
    {
      turn_id: 'T3',
      speaker_role: 'prosecutor',
      content: 'Is that something you could set aside and decide the case only on the evidence presented in court?',
    },
    {
      turn_id: 'T4',
      speaker_role: 'juror',
      juror_ref: 'Juror #5',
      content: 'I don\'t think so. I\'ve already made up my mind about it.',
    },
  ],
  target_juror: { juror_ref: 'Juror #5', panel_position: 5 },
  analysis_focus: ['formed_conclusion'],
  output_preferences: {
    include_motion_language: true,
    include_preservation_script: true,
    response_format: 'structured_json',
    verbosity: 'standard',
  },
  privacy: {
    redact_juror_identifiers: true,
    allow_storage_for_training: false,
  },
};

// ─── Malformed Requests ───────────────────────────────────────────

export const malformedRequest_missingTranscript = {
  jurisdiction: { state: 'TX' },
  matter: { case_type: 'DWI' },
  stage: 'individual_followup',
  // transcript is missing
  target_juror: { juror_ref: 'Juror #1' },
};

export const malformedRequest_invalidStage = {
  jurisdiction: { state: 'TX' },
  matter: { case_type: 'DWI' },
  stage: 'not_a_real_stage',
  transcript: [{ turn_id: 'T1', speaker_role: 'juror', content: 'test' }],
  target_juror: { juror_ref: 'Juror #1' },
};

export const malformedRequest_invalidJurisdiction = {
  jurisdiction: { state: 'CA' },
  matter: { case_type: 'DWI' },
  stage: 'individual_followup',
  transcript: [{ turn_id: 'T1', speaker_role: 'juror', content: 'test' }],
  target_juror: { juror_ref: 'Juror #1' },
};

// ─── Valid Response Fixture ───────────────────────────────────────

export const validResponseFixture: StrikeForCauseResponse = {
  request_id: 'test-uuid-1234',
  model: 'claude-sonnet-4-20250514',
  version: '1.0.0',
  jurisdiction: 'TX',
  summary: {
    likely_cause_candidates: ['Juror #7'],
    likely_peremptory_only: [],
    immediate_actions: ['Complete lock-in questioning for Juror #7 on evidence requirements'],
    notes: 'Juror has made strong statements about requiring DNA/video evidence that likely support an (a)(9) challenge.',
  },
  analyses: [
    {
      issue_id: 'issue-1',
      juror_ref: 'Juror #7',
      issue_type: 'Evidence Type Requirement / Burden Shifting',
      status: 'possible_cause_needs_lock_in',
      evidence_summary: 'Juror stated they would need DNA or video evidence and could not convict based on testimony alone, even after being told the law does not require specific evidence types.',
      key_admissions: [
        { admission: 'I would need DNA or video evidence.', source_turn_id: 'T2' },
        { admission: 'I just don\'t think I could do it. I\'d need something more than just testimony.', source_turn_id: 'T4' },
      ],
      legal_hooks: [
        {
          code: 'Art. 35.16(a)(9)',
          rationale: 'Juror exhibits bias against the law allowing conviction on testimony alone, which is a phase of law upon which the State is entitled to rely.',
        },
      ],
      ambiguity_flags: [
        'Juror used "I don\'t think" rather than a definitive "I cannot" — binary clarifier needed.',
      ],
      question_plan: {
        sequence_type: 'record_building',
        purpose: 'Lock in the juror\'s inability to follow the law on evidence sufficiency',
        questions: [
          {
            step: 'normalize',
            text: 'A lot of people feel more comfortable when there is scientific evidence. There is nothing wrong with that feeling.',
            style: 'individual',
            expected_signal: 'Juror relaxes and agrees',
          },
          {
            step: 'define_rule',
            text: 'The law in Texas says that the testimony of one witness is sufficient to support a conviction. The State is never required to present DNA, video, or any other specific type of evidence. Do you understand that rule?',
            style: 'individual',
            expected_signal: 'Juror acknowledges understanding the rule',
          },
          {
            step: 'confirm_understanding',
            text: 'So you understand that legally, a jury can convict based solely on the testimony of one witness?',
            style: 'individual',
            expected_signal: 'Yes, acknowledges understanding',
          },
          {
            step: 'elicit_conflict',
            text: 'Knowing that rule, would you still personally require the State to present DNA or video evidence before you could vote to convict?',
            style: 'individual',
            expected_signal: 'Juror reaffirms personal requirement for physical evidence',
          },
          {
            step: 'lock_in_override',
            text: 'Even if the judge instructs you that you must follow the law and that testimony alone can be sufficient, would you still hold the State to your personal standard of needing DNA or video?',
            style: 'individual',
            expected_signal: 'Juror confirms they would hold State to higher standard despite instruction',
          },
          {
            step: 'binary_clarifier',
            text: 'I want to make sure the record is clear. Is your answer yes — you would still require DNA or video evidence even if the judge instructs you otherwise?',
            style: 'individual',
            expected_signal: 'Clear yes or no',
          },
          {
            step: 'cause_motion_line',
            text: 'Your Honor, we challenge Juror No. 7 for cause under Article 35.16(a)(9), Texas Code of Criminal Procedure. The juror has stated clearly and repeatedly that they would require DNA or video evidence to convict, even after being instructed that the law does not require any particular type of evidence. This constitutes a bias against a phase of law upon which the State is entitled to rely.',
            style: 'bench',
            expected_signal: 'Court rules on challenge',
          },
          {
            step: 'preservation_line',
            text: 'Your Honor, we respectfully object to the denial of our challenge for cause and request that our objection be noted on the record. We will be required to use a peremptory strike on this juror, which will prevent us from striking other objectionable jurors.',
            style: 'bench',
            expected_signal: 'Court notes objection',
          },
        ],
        stop_conditions: [
          'If juror clearly states they CAN follow the law and convict on testimony alone, abandon cause path.',
          'If juror equivocates, use binary clarifier before stopping.',
        ],
        anti_commitment_check: 'None of the proposed questions ask the juror to commit to a specific verdict based on specific facts. They test the juror\'s ability to follow a general legal principle.',
      },
      motion_language: {
        short_form: 'Challenge Juror #7 for cause under Art. 35.16(a)(9) — bias against sufficiency of testimonial evidence.',
        expanded_form: 'Your Honor, the State challenges Juror Number 7 for cause pursuant to Article 35.16(a)(9) of the Texas Code of Criminal Procedure. This juror has stated on the record that they would require DNA or video evidence before they could return a guilty verdict, and that they could not convict based on the testimony of a single witness. When asked whether they could follow the Court\'s instruction that the law does not require any specific type of evidence, the juror confirmed they would still hold the State to their personal standard. This constitutes a bias or prejudice against a phase of the law upon which the State is entitled to rely for conviction.',
      },
      confidence: 'MEDIUM',
      confidence_reasons: [
        'Juror made strong statements about requiring DNA/video evidence in T2.',
        'Juror reaffirmed position in T4 after being told the law does not require it.',
        'However, juror used hedging language ("I don\'t think I could") rather than definitive "I cannot" — additional lock-in may strengthen the record.',
      ],
      source_turn_refs: ['T2', 'T4'],
    },
  ],
  preservation: {
    recommended: true,
    lines: [
      'Your Honor, we object to the Court\'s denial of our cause challenge to Juror No. 7 and request that our objection be preserved for the record.',
      'We will be required to exercise a peremptory challenge on Juror No. 7, which will prevent us from striking Juror No. ___ who we find objectionable.',
      'We request the Court grant additional peremptory strikes.',
    ],
    conditions: [
      'Use these preservation lines only if the cause challenge is denied.',
      'Fill in the blank with the specific juror the State cannot strike due to exhausting a peremptory on Juror #7.',
    ],
  },
  warnings: [
    {
      type: 'missing_lock_in',
      message: 'The juror used hedging language. A binary clarifier is recommended before moving for cause to ensure the record clearly shows the juror cannot follow the law.',
    },
  ],
  audit: {
    input_tokens: 1200,
    output_tokens: 800,
    latency_ms: 3500,
    model_version: 'claude-sonnet-4-20250514',
  },
};

// ─── Malformed Response (missing required fields) ─────────────────

export const malformedResponseFixture = {
  request_id: 'test-uuid-bad',
  model: 'claude-sonnet-4-20250514',
  // missing version, jurisdiction, summary, analyses, preservation, warnings
};
