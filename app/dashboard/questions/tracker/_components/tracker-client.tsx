'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Filter,
  Check,
  X as XIcon,
  MessageSquare,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'SCALED' | 'OPEN_ENDED' | 'YES_NO';
  scaleMax: number | null;
  category: string | null;
  sortOrder: number;
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

export default function TrackerClient({ caseId, caseName, venireSize = 36 }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'SCALED' | 'OPEN_ENDED' | 'YES_NO'>('ALL');
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
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
  };

  // Build response lookup: `${questionId}:${jurorId}` -> ResponseData
  const responseLookup = useMemo(() => {
    const lookup = new Map<string, ResponseData>();
    for (const resp of responses) {
      lookup.set(`${resp.questionId}:${resp.jurorId}`, resp);
    }
    return lookup;
  }, [responses]);

  const filteredQuestions = useMemo(() => {
    let qs = questions;
    if (filterType !== 'ALL') {
      qs = qs.filter(q => q.type === filterType);
    }
    return qs;
  }, [questions, filterType]);

  const isAnswered = (questionId: string, jurorId: string): boolean => {
    const resp = responseLookup.get(`${questionId}:${jurorId}`);
    if (!resp) return false;
    return resp.scaledValue !== null || (resp.textValue !== null && resp.textValue.trim() !== '') || resp.boolValue !== null;
  };

  const getResponseValue = (questionId: string, jurorId: string): string => {
    const resp = responseLookup.get(`${questionId}:${jurorId}`);
    if (!resp) return '';
    if (resp.scaledValue !== null) return resp.scaledValue.toString();
    if (resp.boolValue !== null) return resp.boolValue ? 'Yes' : 'No';
    if (resp.textValue) return resp.textValue.length > 20 ? resp.textValue.substring(0, 20) + '...' : resp.textValue;
    return '';
  };

  // Filter jurors to only those with unanswered questions
  const displayJurors = useMemo(() => {
    if (!showOnlyUnanswered) return jurors;
    return jurors.filter(j =>
      filteredQuestions.some(q => !isAnswered(q.id, j.id))
    );
  }, [jurors, filteredQuestions, showOnlyUnanswered, responseLookup]);

  // Stats
  const totalCells = filteredQuestions.length * jurors.length;
  const answeredCells = filteredQuestions.reduce(
    (count, q) => count + jurors.filter(j => isAnswered(q.id, j.id)).length,
    0
  );
  const completionPct = totalCells > 0 ? Math.round((answeredCells / totalCells) * 100) : 0;

  const handleCellClick = (questionId: string, jurorId: string) => {
    router.push(`/dashboard/questions/responses?caseId=${caseId}&questionId=${questionId}&jurorId=${jurorId}`);
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
            <p className="dark:text-slate-400 text-slate-600">{caseName}</p>
          </div>
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
      <div className="flex items-center gap-4 mb-6">
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
              {filteredQuestions.map((q, i) => (
                <th
                  key={q.id}
                  className="px-3 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-600 border-b border-slate-200 dark:border-slate-700 min-w-[80px]"
                  title={q.text}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Q{i + 1}</span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        q.type === 'SCALED' ? 'bg-amber-400' : q.type === 'YES_NO' ? 'bg-purple-400' : 'bg-blue-400'
                      }`}
                    />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-600 border-b border-l border-slate-200 dark:border-slate-700 min-w-[80px]">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {displayJurors.map(juror => {
              const jurorAnswered = filteredQuestions.filter(q => isAnswered(q.id, juror.id)).length;
              const jurorPct = filteredQuestions.length > 0
                ? Math.round((jurorAnswered / filteredQuestions.length) * 100)
                : 0;

              return (
                <tr key={juror.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium dark:text-slate-300 text-slate-700 border-b border-r border-slate-200 dark:border-slate-700">
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
                              {q.type === 'SCALED' ? value : ''}
                            </span>
                          ) : (
                            <XIcon className="w-3 h-3 mx-auto" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center border-b border-l border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            jurorPct === 100
                              ? 'bg-green-500'
                              : jurorPct > 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${jurorPct}%` }}
                        />
                      </div>
                      <span className="text-xs dark:text-slate-400 text-slate-600 min-w-[32px]">
                        {jurorPct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm dark:text-slate-400 text-slate-600">
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
          <span>Open-Ended</span>
        </div>
      </div>
    </div>
  );
}
