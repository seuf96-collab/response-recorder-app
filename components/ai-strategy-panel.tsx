'use client';

import {
  Brain,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Gavel,
  ShieldAlert,
} from 'lucide-react';
import type { JurorStrategy } from '@/lib/types';

interface AiStrategyPanelProps {
  jurorId: string;
  strategy: JurorStrategy | undefined;
  isExpanded: boolean;
  expandedSeq: number | null;
  onToggleExpand: () => void;
  onToggleSeq: (idx: number | null) => void;
  onGenerate: (jurorId: string, regenerate?: boolean) => void;
  onSaveOutcome: (jurorId: string, outcome: string, notes?: string) => void;
}

const getPriorityColor = (p: string) => {
  if (p === 'HIGH') return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-100 border-red-400 dark:border-red-500';
  if (p === 'MEDIUM') return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100 border-amber-400 dark:border-amber-500';
  return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-100 border-green-400 dark:border-green-500';
};

export default function AiStrategyPanel({
  jurorId,
  strategy: strat,
  isExpanded,
  expandedSeq,
  onToggleExpand,
  onToggleSeq,
  onGenerate,
  onSaveOutcome,
}: AiStrategyPanelProps) {
  return (
    <div className="mb-4">
      {/* Strategy header bar */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
          <Brain className="w-3 h-3" /> For-Cause AI Strategy
        </p>
        {strat?.strategy && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(strat.strategy.priority)}`}>
            {strat.strategy.priority} priority
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {strat?.strategy && !strat.loading && (
            <button
              onClick={() => onGenerate(jurorId, true)}
              className="p-1.5 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded transition-colors touch-manipulation"
              title="Regenerate strategy"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {!strat?.strategy && !strat?.loading && (
            <button
              onClick={() => onGenerate(jurorId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs transition-colors touch-manipulation"
            >
              <Brain className="w-3.5 h-3.5" />
              Generate
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {strat?.loading && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-600 rounded-lg">
          <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-300 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Analyzing juror profile...</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Generating targeted voir dire questions</p>
          </div>
        </div>
      )}

      {/* Error */}
      {strat?.error && !strat.loading && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-600 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-800 dark:text-red-200 flex-1">{strat.error}</p>
          <button onClick={() => onGenerate(jurorId, true)} className="text-xs text-red-700 dark:text-red-300 font-semibold hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Strategy content */}
      {strat?.strategy && !strat.loading && (
        <div className="space-y-2">
          {/* Assessment summary - always visible */}
          <div className={`p-3 rounded-lg border ${getPriorityColor(strat.strategy.priority)}`}>
            <p className="text-xs font-medium">{strat.strategy.overallAssessment}</p>
          </div>

          {/* Toggle to expand full strategy */}
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between p-2 text-xs font-semibold text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Question Sequences ({strat.strategy.questionSequences.length})</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Expanded: Question Sequences */}
          {isExpanded && (
            <div className="space-y-2">
              {/* Vulnerabilities */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {strat.strategy.vulnerabilities.map((v, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityColor(v.exploitability)}`} title={v.evidence}>
                    {v.area}
                  </span>
                ))}
              </div>

              {/* Question Sequences */}
              {strat.strategy.questionSequences.map((seq, seqIdx) => (
                <div key={seqIdx} className="border border-slate-300 dark:border-slate-500 rounded-lg overflow-hidden">
                  <button
                    onClick={() => onToggleSeq(expandedSeq === seqIdx ? null : seqIdx)}
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{seq.label}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100">
                        {seq.technique}
                      </span>
                    </div>
                    {expandedSeq === seqIdx ? <ChevronUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                  </button>

                  {expandedSeq === seqIdx && (
                    <div className="border-t border-slate-300 dark:border-slate-500 p-3 bg-slate-50 dark:bg-slate-800 space-y-3">
                      {seq.questions.map((q, qIdx) => (
                        <div key={qIdx} className="relative pl-5">
                          <div className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-700 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-purple-800 dark:text-purple-100">{qIdx + 1}</span>
                          </div>
                          <p className="text-xs text-slate-900 dark:text-white font-medium leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5 font-medium">{q.purpose}</p>
                          {q.followUpIf && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">&darr; If: {q.followUpIf}</p>
                          )}
                        </div>
                      ))}
                      {/* Closing commitment */}
                      <div className="p-2.5 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-500 rounded-lg">
                        <p className="text-[10px] font-bold text-red-800 dark:text-red-200 mb-1 flex items-center gap-1">
                          <Gavel className="w-3 h-3" /> Close for Record
                        </p>
                        <p className="text-xs text-red-900 dark:text-red-100 font-medium">&ldquo;{seq.closingCommitment}&rdquo;</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Anticipated rehabilitation */}
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-500 rounded-lg">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Watch For (Defense Rehabilitation)
                </p>
                <p className="text-xs text-amber-900 dark:text-amber-100">{strat.strategy.anticipatedRehabilitation}</p>
              </div>

              {/* Outcome buttons */}
              {!strat.outcome && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Result:</span>
                  <button onClick={() => onSaveOutcome(jurorId, 'SUCCESS')} className="px-2.5 py-1 text-[10px] font-bold bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 rounded hover:bg-green-300 dark:hover:bg-green-700 transition-colors touch-manipulation">
                    Struck
                  </button>
                  <button onClick={() => onSaveOutcome(jurorId, 'FAILED')} className="px-2.5 py-1 text-[10px] font-bold bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors touch-manipulation">
                    Denied
                  </button>
                  <button onClick={() => onSaveOutcome(jurorId, 'NOT_ATTEMPTED')} className="px-2.5 py-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors touch-manipulation">
                    Skipped
                  </button>
                </div>
              )}
              {strat.outcome && (
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  Outcome: <span className={strat.outcome === 'SUCCESS' ? 'text-green-700 dark:text-green-300' : strat.outcome === 'FAILED' ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}>{strat.outcome}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
