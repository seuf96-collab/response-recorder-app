'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Gavel,
  Send,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Scale,
  BookOpen,
  Shield,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

interface CaseData {
  id: string;
  name: string;
  causeNumber: string | null;
  defendantName: string | null;
  offenseType: string | null;
}

interface JurorOption {
  id: string;
  jurorNumber: number;
  name: string;
  tag: string;
}

interface QuestionItem {
  step: string;
  text: string;
  style: string;
  expected_signal: string;
  if_yes?: string;
  if_no?: string;
  if_hedge?: string;
}

interface AnalysisItem {
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
    questions: QuestionItem[];
    stop_conditions?: string[];
    anti_commitment_check?: string;
  };
  motion_language?: { short_form: string; expanded_form: string };
  alternatives?: { approach: string; questions: { step: string; text: string }[] }[];
  confidence: string;
  confidence_reasons: string[];
  source_turn_refs: string[];
}

interface AnalysisResponse {
  request_id: string;
  model: string;
  version: string;
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
  };
}

interface TranscriptTurn {
  turn_id: string;
  speaker_role: string;
  juror_ref: string;
  content: string;
  nonverbal: string;
}

interface Props {
  caseData: CaseData;
  jurors: JurorOption[];
}

// ─── Constants ────────────────────────────────────────────────────

const STAGES = [
  { value: 'group_screen', label: 'Group Screen' },
  { value: 'individual_followup', label: 'Individual Follow-Up' },
  { value: 'individual_lock_in', label: 'Individual Lock-In' },
  { value: 'cause_motion', label: 'Cause Motion' },
  { value: 'denied_cause_preservation', label: 'Denied Cause — Preservation' },
];

const FOCUS_OPTIONS = [
  { value: 'full_range_punishment', label: 'Full Range Punishment' },
  { value: 'probation_refusal', label: 'Probation Refusal' },
  { value: 'anti_police_bias', label: 'Anti-Police Bias' },
  { value: 'pro_police_bias', label: 'Pro-Police Bias' },
  { value: 'defendant_silence_bias', label: 'Defendant Silence' },
  { value: 'burden_shifting', label: 'Burden Shifting' },
  { value: 'evidence_type_requirement', label: 'Evidence Type Requirement' },
  { value: 'formed_conclusion', label: 'Formed Conclusion' },
  { value: 'victim_credibility', label: 'Victim Credibility' },
  { value: 'witness_credibility_absolute', label: 'Credibility Absolutes' },
  { value: 'circumstantial_evidence_bias', label: 'Circumstantial Evidence' },
  { value: 'general_fairness', label: 'General Fairness' },
  { value: 'hardship', label: 'Hardship (Not Cause)' },
];

const SPEAKER_ROLES = [
  { value: 'prosecutor', label: 'Prosecutor' },
  { value: 'juror', label: 'Juror' },
  { value: 'defense_counsel', label: 'Defense Counsel' },
  { value: 'judge', label: 'Judge' },
];

// ─── Helpers ──────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  normalize: 'Normalize',
  define_rule: 'Define Rule',
  confirm_understanding: 'Confirm Understanding',
  elicit_conflict: 'Elicit Conflict',
  lock_in_override: 'Lock-In / Override',
  binary_clarifier: 'Binary Clarifier',
  cause_motion_line: 'Cause Motion',
  preservation_line: 'Preservation',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  strong_cause_candidate: { label: 'Strong Cause Candidate', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  possible_cause_needs_lock_in: { label: 'Needs Lock-In', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  insufficient_for_cause_peremptory_only: { label: 'Peremptory Only', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  hardship_excuse_path: { label: 'Hardship / Excuse', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  disqualification_admin_path: { label: 'Disqualification', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: 'bg-green-600',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-red-500',
};

// ─── Component ────────────────────────────────────────────────────

export default function VoirDireClient({ caseData, jurors }: Props) {
  // Input state
  const [targetJuror, setTargetJuror] = useState(jurors[0]?.jurorNumber?.toString() ?? '');
  const [stage, setStage] = useState('individual_followup');
  const [analysisFocus, setAnalysisFocus] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([
    { turn_id: 'T1', speaker_role: 'prosecutor', juror_ref: '', content: '', nonverbal: '' },
  ]);

  // Output state
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─── Transcript Management ──────────────────────────────────────

  const addTranscriptTurn = useCallback(() => {
    setTranscript((prev) => [
      ...prev,
      {
        turn_id: `T${prev.length + 1}`,
        speaker_role: 'juror',
        juror_ref: targetJuror ? `Juror #${targetJuror}` : '',
        content: '',
        nonverbal: '',
      },
    ]);
  }, [targetJuror]);

  const removeTranscriptTurn = useCallback((index: number) => {
    setTranscript((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTranscriptTurn = useCallback(
    (index: number, field: keyof TranscriptTurn, value: string) => {
      setTranscript((prev) =>
        prev.map((turn, i) => (i === index ? { ...turn, [field]: value } : turn))
      );
    },
    []
  );

  // ─── Copy to Clipboard ─────────────────────────────────────────

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for iPad
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // ─── Focus Toggle ──────────────────────────────────────────────

  const toggleFocus = useCallback((value: string) => {
    setAnalysisFocus((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  }, []);

  // ─── Submit ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validTranscript = transcript.filter((t) => t.content.trim());
    if (validTranscript.length === 0) {
      setError('Add at least one transcript turn with content.');
      return;
    }
    if (!targetJuror) {
      setError('Select a target juror.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const jurorRef = `Juror #${targetJuror}`;

    // Build transcript with juror_ref defaulting to target
    const cleanedTranscript = validTranscript.map((t) => {
      const turn: Record<string, string> = {
        turn_id: t.turn_id,
        speaker_role: t.speaker_role,
        content: t.content.trim(),
      };
      if (t.juror_ref) turn.juror_ref = t.juror_ref;
      else if (t.speaker_role === 'juror') turn.juror_ref = jurorRef;
      if (t.nonverbal.trim()) turn.nonverbal = t.nonverbal.trim();
      return turn;
    });

    const payload = {
      jurisdiction: { state: 'TX' },
      matter: {
        case_type: caseData.offenseType ?? 'criminal',
      },
      stage,
      transcript: cleanedTranscript,
      target_juror: {
        juror_ref: jurorRef,
      },
      ...(analysisFocus.length > 0 ? { analysis_focus: analysisFocus } : {}),
      output_preferences: {
        include_motion_language: true,
        include_preservation_script: true,
        response_format: 'structured_json' as const,
        verbosity: 'standard' as const,
      },
      privacy: {
        redact_juror_identifiers: true,
        allow_storage_for_training: false as const,
      },
    };

    try {
      const res = await fetch('/api/voir-dire/strike-for-cause/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed');
        return;
      }

      setResult(data);
      // Auto-expand first analysis
      if (data.analyses?.length > 0) {
        setExpandedAnalysis(data.analyses[0].issue_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  const inputClasses =
    'w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400';
  const selectClasses =
    'px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white';
  const labelClasses = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2';

  return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
            <Gavel className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">
              Strike-For-Cause Voir Dire Analyzer
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {caseData.name} &mdash; Texas Art. 35.16 Record-Building Tool
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT: Input Panel ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Target Juror + Stage */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Analysis Setup
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Target Juror</label>
                <select
                  value={targetJuror}
                  onChange={(e) => setTargetJuror(e.target.value)}
                  className={selectClasses + ' w-full'}
                >
                  {jurors.map((j) => (
                    <option key={j.id} value={j.jurorNumber}>
                      #{j.jurorNumber} — {j.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className={selectClasses + ' w-full'}
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Analysis Focus */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Issue Focus (Optional)
            </h2>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleFocus(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors touch-manipulation ${
                    analysisFocus.includes(opt.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Input */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                Transcript / Juror Statements
              </h2>
              <button
                onClick={addTranscriptTurn}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                Add Turn
              </button>
            </div>

            <div className="space-y-4">
              {transcript.map((turn, idx) => (
                <div
                  key={turn.turn_id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 min-w-[2rem]">
                      {turn.turn_id}
                    </span>
                    <select
                      value={turn.speaker_role}
                      onChange={(e) => updateTranscriptTurn(idx, 'speaker_role', e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-500 rounded text-sm bg-white dark:bg-slate-600 text-slate-900 dark:text-white"
                    >
                      {SPEAKER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {turn.speaker_role === 'juror' && (
                      <input
                        type="text"
                        value={turn.juror_ref}
                        onChange={(e) => updateTranscriptTurn(idx, 'juror_ref', e.target.value)}
                        placeholder={`Juror #${targetJuror}`}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-500 rounded text-sm w-32 bg-white dark:bg-slate-600 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    )}
                    {transcript.length > 1 && (
                      <button
                        onClick={() => removeTranscriptTurn(idx)}
                        className="ml-auto text-red-500 hover:text-red-700 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={turn.content}
                    onChange={(e) => updateTranscriptTurn(idx, 'content', e.target.value)}
                    placeholder="What was said..."
                    rows={2}
                    className={inputClasses + ' resize-none text-sm'}
                  />
                  <input
                    type="text"
                    value={turn.nonverbal}
                    onChange={(e) => updateTranscriptTurn(idx, 'nonverbal', e.target.value)}
                    placeholder="Nonverbal observation (optional)"
                    className="mt-2 w-full px-3 py-1.5 border border-slate-200 dark:border-slate-500 rounded text-xs bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-300 placeholder-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-colors touch-manipulation ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing for Cause...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                Analyze for Cause
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Results Panel ──────────────────────────────── */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
              <Gavel className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Analysis Yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Enter transcript turns and click &ldquo;Analyze for Cause&rdquo; to get a structured
                record-building plan.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
              <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold dark:text-white mb-2">
                Analyzing Transcript...
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Building record strategy under Texas Art. 35.16
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Summary
                </h2>

                {result.summary.likely_cause_candidates.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">
                      Likely Cause Candidates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.summary.likely_cause_candidates.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.summary.likely_peremptory_only.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase mb-1">
                      Peremptory Only
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.summary.likely_peremptory_only.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.summary.immediate_actions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-1">
                      Immediate Actions
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                      {result.summary.immediate_actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.summary.notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-2">
                    {result.summary.notes}
                  </p>
                )}
              </div>

              {/* Analyses */}
              {result.analyses.map((analysis) => {
                const isExpanded = expandedAnalysis === analysis.issue_id;
                const statusInfo = STATUS_LABELS[analysis.status] ?? {
                  label: analysis.status,
                  color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
                };

                return (
                  <div
                    key={analysis.issue_id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Analysis Header */}
                    <button
                      onClick={() =>
                        setExpandedAnalysis(isExpanded ? null : analysis.issue_id)
                      }
                      className="w-full p-6 text-left flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors touch-manipulation"
                    >
                      <div className="mt-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-bold dark:text-white">
                            {analysis.juror_ref}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS[analysis.confidence] ?? 'bg-slate-400'}`}
                            title={`Confidence: ${analysis.confidence}`}
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {analysis.confidence} confidence
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {analysis.issue_type}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {analysis.evidence_summary}
                        </p>
                      </div>
                    </button>

                    {/* Expanded Analysis */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-6 space-y-5">
                        {/* Legal Hooks */}
                        {analysis.legal_hooks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                              <Scale className="w-4 h-4 text-amber-600" />
                              Legal Hooks
                            </h4>
                            <div className="space-y-2">
                              {analysis.legal_hooks.map((hook, i) => (
                                <div
                                  key={i}
                                  className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
                                >
                                  <p className="text-sm font-mono font-bold text-amber-800 dark:text-amber-300">
                                    {hook.code}
                                  </p>
                                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                    {hook.rationale}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Admissions */}
                        {analysis.key_admissions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                              Key Admissions
                            </h4>
                            <ul className="space-y-1">
                              {analysis.key_admissions.map((adm, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"
                                >
                                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 min-w-[2rem]">
                                    [{adm.source_turn_id}]
                                  </span>
                                  &ldquo;{adm.admission}&rdquo;
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Question Plan */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            Question Plan &mdash; {analysis.question_plan.purpose}
                          </h4>
                          <div className="space-y-3">
                            {analysis.question_plan.questions.map((q, i) => {
                              const copyId = `${analysis.issue_id}-q-${i}`;
                              return (
                                <div
                                  key={i}
                                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                        {i + 1}
                                      </span>
                                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                        {STEP_LABELS[q.step] ?? q.step}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        [{q.style}]
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(q.text, copyId)}
                                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
                                      title="Copy question"
                                    >
                                      {copiedId === copyId ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                                    &ldquo;{q.text}&rdquo;
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    <span className="font-semibold">Expected:</span>{' '}
                                    {q.expected_signal}
                                  </p>
                                  {q.if_yes && (
                                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                      If yes: {q.if_yes}
                                    </p>
                                  )}
                                  {q.if_no && (
                                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                      If no: {q.if_no}
                                    </p>
                                  )}
                                  {q.if_hedge && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                      If hedge: {q.if_hedge}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {analysis.question_plan.anti_commitment_check && (
                            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                                Anti-Commitment Check: {analysis.question_plan.anti_commitment_check}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Motion Language */}
                        {analysis.motion_language && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                              <Gavel className="w-4 h-4 text-red-600" />
                              Motion Language
                            </h4>
                            <div className="space-y-2">
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
                                    Short Form
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        analysis.motion_language!.short_form,
                                        `${analysis.issue_id}-motion-short`
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 touch-manipulation"
                                  >
                                    {copiedId === `${analysis.issue_id}-motion-short` ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                                  {analysis.motion_language.short_form}
                                </p>
                              </div>
                              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
                                    Expanded Form
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        analysis.motion_language!.expanded_form,
                                        `${analysis.issue_id}-motion-expanded`
                                      )
                                    }
                                    className="text-red-400 hover:text-red-600 touch-manipulation"
                                  >
                                    {copiedId === `${analysis.issue_id}-motion-expanded` ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-sm text-red-900 dark:text-red-200">
                                  {analysis.motion_language.expanded_form}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ambiguity Flags */}
                        {analysis.ambiguity_flags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                              Ambiguity Flags
                            </h4>
                            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                              {analysis.ambiguity_flags.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Confidence Reasons */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                            Confidence: {analysis.confidence}
                          </h4>
                          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            {analysis.confidence_reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Preservation Block */}
              {result.preservation.recommended && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    Preservation (If Cause Denied)
                  </h2>
                  <div className="space-y-2">
                    {result.preservation.lines.map((line, i) => {
                      const copyId = `preservation-${i}`;
                      return (
                        <div
                          key={i}
                          className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3"
                        >
                          <p className="text-sm text-red-900 dark:text-red-200 flex-1">
                            {line}
                          </p>
                          <button
                            onClick={() => copyToClipboard(line, copyId)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0 touch-manipulation"
                          >
                            {copiedId === copyId ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {result.preservation.conditions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Conditions:
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        {result.preservation.conditions.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings
                  </h2>
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-mono font-bold text-yellow-700 dark:text-yellow-400 min-w-[6rem]">
                          {w.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-yellow-800 dark:text-yellow-300">
                          {w.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit */}
              {result.audit && (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
                  {result.audit.input_tokens + result.audit.output_tokens} tokens &middot;{' '}
                  {(result.audit.latency_ms / 1000).toFixed(1)}s &middot; {result.model}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
