'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Filter,
  Check,
  X as XIcon,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'SCALED' | 'OPEN_ENDED' | 'YES_NO';
  scaleMax: number | null;
  category: string | null;
  sortOrder: number;
  side: string;
  reverseValues?: boolean;
  weight?: number;
}

interface Juror {
  id: string;
  jurorNumber: number;
  firstName: string | null;
  lastName: string | null;
  panelType: string;
  isStruck: boolean;
  status: string;
}

interface ResponseData {
  jurorId: string;
  questionId: string;
  scaledValue: number | null;
  textValue: string | null;
  boolValue: boolean | null;
}

interface Props {
  caseId: string;
  caseName: string;
  venireSize?: number;
}

type SideFilter = 'ALL' | 'STATE' | 'DEFENSE';

export default function TrackerClient({ caseId, caseName, venireSize = 36 }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'SCALED' | 'OPEN_ENDED' | 'YES_NO'>('ALL');
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [activeSide, setActiveSide] = useState<SideFilter>('ALL');
  const [struckJurors, setStruckJurors] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [questionsRes, responsesRes] = await Promise.all([
        fetch(`/api/questions?caseId=${caseId}`),
        fetch(`/api/responses?caseId=${caseId}`),
      ]);

      if (questionsRes.ok && responsesRes.ok) {
        const questionsData = await questionsRes.json();
        const responsesData = await responsesRes.json();

        setQuestions(questionsData.questions ?? []);

        // Generate jurors from numbers 1 to venireSize
        const generatedJurors: Juror[] = Array.from(
          { length: venireSize },
          (_, i) => ({
            id: `juror-${i + 1}`,
            jurorNumber: i + 1,
            firstName: null,
            lastName: null,
            panelType: 'regular',
            isStruck: false,
            status: 'ACTIVE',
          })
        );
        setJurors(generatedJurors);
        setResponses(responsesData.responses ?? []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [caseId, venireSize]);

  // Load struck jurors from localStorage
  useEffect(() => {
    try {
      const rawStrikes = localStorage.getItem(`strikes-${caseId}`);
      if (rawStrikes) {
        const obj = JSON.parse(rawStrikes) as Record<string, string>;
        const struckNums = new Set<number>();
        for (const [numStr, strikeType] of Object.entries(obj)) {
          if (strikeType) {
            struckNums.add(parseInt(numStr));
          }
        }
        setStruckJurors(struckNums);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalc = useCallback(async () => {
    setRecalculating(true);
    await loadData();
    setRecalculating(false);
  }, [loadData]);

  // Build response lookup: `${questionId}:${jurorId}` -> ResponseData
  const responseLookup = useMemo(() => {
    const lookup = new Map<string, ResponseData>();
    for (const resp of responses) {
      lookup.set(`${resp.questionId}:${resp.jurorId}`, resp);
    }
    return lookup;
  }, [responses]);

  // Filter and sort questions: STATE first, then DEFENSE, then by sortOrder
  const filteredQuestions = useMemo(() => {
    let qs = [...questions];

    // Filter by side
    if (activeSide !== 'ALL') {
      qs = qs.filter(q => q.side === activeSide);
    }

    // Filter by type
    if (filterType !== 'ALL') {
      qs = qs.filter(q => q.type === filterType);
    }

    // Sort: STATE before DEFENSE, then by sortOrder
    qs.sort((a, b) => {
      if (a.side !== b.side) {
        if (a.side === 'STATE') return -1;
        if (b.side === 'STATE') return 1;
      }
      return a.sortOrder - b.sortOrder;
    });

    return qs;
  }, [questions, filterType, activeSide]);

  // Filter out struck jurors
  const activeJurors = useMemo(() => {
    return jurors.filter(j => !struckJurors.has(j.jurorNumber));
  }, [jurors, struckJurors]);

  const isAnswered = (questionId: string, jurorId: string): boolean => {
    const resp = responseLookup.get(`${questionId}:${jurorId}`);
    if (!resp) return false;
    return resp.scaledValue !== null || (resp.textValue !== null && resp.textValue.trim() !== '') || resp.boolValue !== null;
  };

  const getResponseValue = (questionId: string, jurorId: string): string => {
    const resp = responseLookup.get(`${questionId}:${jurorId}`);
    if (!resp) return '';
    if (resp.scaledValue !== null) return resp.scaledValue.toString();
    if (resp.boolValue !== null) return resp.boolValue ? 'Y' : 'N';
    if (resp.textValue) return resp.textValue.length > 20 ? resp.textValue.substring(0, 20) + '...' : resp.textValue;
    return '';
  };

  // Calculate overall score for a juror by summing numerical response values
  const calculateJurorScore = useCallback((jurorId: string): number | null => {
    let totalScore = 0;
    let hasResponse = false;

    for (const q of filteredQuestions) {
      const resp = responseLookup.get(`${q.id}:${jurorId}`);
      if (!resp) continue;

      // Sum scaled responses
      if (q.type === 'SCALED' && resp.scaledValue !== null) {
        totalScore += resp.scaledValue;
        hasResponse = true;
      }
      // Convert YES_NO to 1 (yes) or 0 (no)
      else if (q.type === 'YES_NO' && resp.boolValue !== null) {
        totalScore += resp.boolValue ? 1 : 0;
        hasResponse = true;
      }
      // OPEN_ENDED has no numerical value, skip
    }

    if (!hasResponse) return null;
    return totalScore;
  }, [filteredQuestions, responseLookup]);

  // Calculate scores for all active jurors and determine top/bottom 15
  const jurorScores = useMemo(() => {
    const scores = new Map<string, number | null>();
    for (const j of activeJurors) {
      scores.set(j.id, calculateJurorScore(j.id));
    }
    return scores;
  }, [activeJurors, calculateJurorScore]);

  const { topJurorIds, bottomJurorIds } = useMemo(() => {
    const scored = activeJurors
      .map(j => ({ id: j.id, score: jurorScores.get(j.id) }))
      .filter(j => j.score !== null) as { id: string; score: number }[];

    scored.sort((a, b) => b.score - a.score);

    const top15 = new Set(scored.slice(0, 15).map(j => j.id));
    const bottom15 = new Set(scored.slice(-15).map(j => j.id));

    // If a juror is in both (fewer than 30 scored), remove from bottom
    for (const id of top15) {
      bottom15.delete(id);
    }

    return { topJurorIds: top15, bottomJurorIds: bottom15 };
  }, [activeJurors, jurorScores]);

  // Filter jurors to only those with unanswered questions
  const displayJurors = useMemo(() => {
    let js = activeJurors;
    if (showOnlyUnanswered) {
      js = js.filter(j =>
        filteredQuestions.some(q => !isAnswered(q.id, j.id))
      );
    }
    return js;
  }, [activeJurors, filteredQuestions, showOnlyUnanswered, responseLookup]);

  // Stats (use activeJurors, not jurors)
  const totalCells = filteredQuestions.length * activeJurors.length;
  const answeredCells = filteredQuestions.reduce(
    (count, q) => count + activeJurors.filter(j => isAnswered(q.id, j.id)).length,
    0
  );
  const completionPct = totalCells > 0 ? Math.round((answeredCells / totalCells) * 100) : 0;

  const handleCellClick = (questionId: string, jurorId: string) => {
    router.push(`/dashboard/questions/responses?caseId=${caseId}&questionId=${questionId}&jurorId=${jurorId}`);
  };

  // Get row background color based on score ranking
  const getRowColor = (jurorId: string): string => {
    if (topJurorIds.has(jurorId)) return 'bg-green-900/20';
    if (bottomJurorIds.has(jurorId)) return 'bg-red-900/20';
    return '';
  };

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">No Questions</h2>
        <p className="dark:text-slate-400 mb-6">Add questions first to track responses.</p>
        <button
          onClick={() => router.push('/dashboard/questions')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go to Question Bank
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/questions')}
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Question Bank
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dark:text-white text-slate-900">Response Tracker</h1>
            <p className="dark:text-slate-400 text-slate-600">
              {caseName}
              {struckJurors.size > 0 && (
                <span className="ml-2 text-amber-400 text-sm">
                  ({struckJurors.size} struck, {activeJurors.length} remaining)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRecalc}
            disabled={recalculating}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalc Scores
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-blue-300 text-blue-700">Completion</p>
          <p className="text-3xl font-bold dark:text-white text-slate-900">{completionPct}%</p>
        </div>
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-green-300 text-green-700">Answered</p>
          <p className="text-3xl font-bold dark:text-white text-slate-900">{answeredCells}</p>
        </div>
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-red-300 text-red-700">Unanswered</p>
          <p className="text-3xl font-bold dark:text-white text-slate-900">{totalCells - answeredCells}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-slate-300 text-slate-700">Total</p>
          <p className="text-3xl font-bold dark:text-white text-slate-900">{totalCells}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Side Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          {(['ALL', 'STATE', 'DEFENSE'] as SideFilter[]).map(side => (
            <button
              key={side}
              onClick={() => setActiveSide(side)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                activeSide === side
                  ? side === 'STATE'
                    ? 'bg-blue-600 text-white'
                    : side === 'DEFENSE'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-600 text-white'
                  : 'dark:text-slate-400 text-slate-600 hover:bg-slate-700/50'
              }`}
            >
              {side}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 dark:text-slate-400 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white text-sm bg-white"
          >
            <option value="ALL">All Questions</option>
            <option value="SCALED">Scaled Only</option>
            <option value="YES_NO">Yes/No Only</option>
            <option value="OPEN_ENDED">Open-Ended Only</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnanswered}
            onChange={(e) => setShowOnlyUnanswered(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm dark:text-slate-400 text-slate-600">
            Show only jurors with unanswered questions
          </span>
        </label>
      </div>

      {/* Matrix */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-900 px-4 py-3 text-left text-sm font-semibold dark:text-slate-300 text-slate-700 border-b border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                Juror
              </th>
              {filteredQuestions.map((q, i) => {
                const sideLabel = q.side === 'DEFENSE' ? 'D' : 'S';
                return (
                  <th
                    key={q.id}
                    className="px-3 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-600 border-b border-slate-200 dark:border-slate-700 min-w-[80px]"
                    title={q.text}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>Q{i + 1}-{sideLabel}</span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          q.type === 'SCALED' ? 'bg-amber-400' : q.type === 'YES_NO' ? 'bg-purple-400' : 'bg-blue-400'
                        }`}
                      />
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-600 border-b border-l border-slate-200 dark:border-slate-700 min-w-[80px]">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {displayJurors.map(juror => {
              const score = jurorScores.get(juror.id);
              const rowColor = getRowColor(juror.id);

              return (
                <tr key={juror.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${rowColor}`}>
                  <td className={`sticky left-0 z-10 ${rowColor || 'bg-white dark:bg-slate-800'} px-4 py-2.5 text-sm font-medium dark:text-slate-300 text-slate-700 border-b border-r border-slate-200 dark:border-slate-700`}>
                    <span className="font-bold">#{juror.jurorNumber}</span>{' '}
                    {juror.firstName} {juror.lastName}
                  </td>
                  {filteredQuestions.map(q => {
                    const answered = isAnswered(q.id, juror.id);
                    const value = getResponseValue(q.id, juror.id);

                    return (
                      <td
                        key={q.id}
                        className="px-2 py-2 text-center border-b border-slate-200 dark:border-slate-700"
                      >
                        <button
                          onClick={() => handleCellClick(q.id, juror.id)}
                          className={`w-full py-1.5 px-1 rounded text-xs font-medium transition-all touch-manipulation ${
                            answered
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                          }`}
                          title={answered ? `Answered: ${value}` : 'Click to record response'}
                        >
                          {answered ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" />
                              {(q.type === 'SCALED' || q.type === 'YES_NO') ? value : ''}
                            </span>
                          ) : (
                            <XIcon className="w-3 h-3 mx-auto" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  {/* Score Column */}
                  <td className="px-3 py-2.5 text-center border-b border-l border-slate-200 dark:border-slate-700">
                    {score !== null && score !== undefined ? (
                      <span className={`text-sm font-bold ${
                        topJurorIds.has(juror.id) ? 'text-green-400' : bottomJurorIds.has(juror.id) ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {Math.round(score)}
                      </span>
                    ) : (
                      <span className="text-xs dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm dark:text-slate-400 text-slate-600 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
          </div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
          </div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Scaled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span>Yes/No</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-900/20" />
          <span>Top 15 (Favorable)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-900/20" />
          <span>Bottom 15 (Unfavorable)</span>
        </div>
      </div>
    </div>
  );
}
