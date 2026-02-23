'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  MessageSquare,
  Users,
  X as XIcon,
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
  id: string;
  jurorId: string;
  questionId: string;
  scaledValue: number | null;
  textValue: string | null;
  boolValue: boolean | null;
}

interface Props {
  caseId: string;
  caseName: string;
  questionId?: string;
  jurorId?: string;
  venireSize?: number;
}

export default function ResponseRecorderClient({ caseId, caseName, questionId, jurorId, venireSize = 36 }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedJurorId, setSelectedJurorId] = useState<string | null>(jurorId ?? null);
  const [responses, setResponses] = useState<Map<string, Map<string, ResponseData>>>(new Map());
  const [textInput, setTextInput] = useState('');
  const [scaledInput, setScaledInput] = useState<number | null>(null);
  const [boolInput, setBoolInput] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [struckJurors, setStruckJurors] = useState<Set<string>>(new Set());

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

        const allQuestions = questionsData.questions ?? [];
        setQuestions(allQuestions);

        // Set initial question index if questionId provided
        if (questionId) {
          const idx = allQuestions.findIndex((q: Question) => q.id === questionId);
          if (idx >= 0) setCurrentQuestionIndex(idx);
        }

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

        // Build responses map: questionId -> jurorId -> ResponseData
        const responseMap = new Map<string, Map<string, ResponseData>>();
        for (const resp of responsesData.responses ?? []) {
          if (!responseMap.has(resp.questionId)) {
            responseMap.set(resp.questionId, new Map());
          }
          responseMap.get(resp.questionId)!.set(resp.jurorId, resp);
        }
        setResponses(responseMap);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Load existing response when juror/question changes
  useEffect(() => {
    if (!currentQuestion || !selectedJurorId) {
      setTextInput('');
      setScaledInput(null);
      setBoolInput(null);
      return;
    }
    const existing = responses.get(currentQuestion.id)?.get(selectedJurorId);
    if (existing) {
      setTextInput(existing.textValue ?? '');
      setScaledInput(existing.scaledValue ?? null);
      setBoolInput(existing.boolValue ?? null);
    } else {
      setTextInput('');
      setScaledInput(null);
      setBoolInput(null);
    }
  }, [currentQuestion?.id, selectedJurorId, responses]);

  const handleSave = async () => {
    if (!selectedJurorId || !currentQuestion || saving) return;

    setSaving(true);
    try {
      const body: any = {
        jurorId: selectedJurorId,
        questionId: currentQuestion.id,
      };

      if (currentQuestion.type === 'SCALED' && scaledInput !== null) {
        body.scaledValue = scaledInput;
      }
      if (currentQuestion.type === 'OPEN_ENDED' && textInput.trim()) {
        body.textValue = textInput.trim();
      }
      if (currentQuestion.type === 'YES_NO' && scaledInput !== null) {
        body.boolValue = scaledInput === 1;
      }

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          caseId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponses(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(currentQuestion.id)) {
            newMap.set(currentQuestion.id, new Map());
          }
          newMap.get(currentQuestion.id)!.set(selectedJurorId, data.response);
          return newMap;
        });

        // Auto-advance to next available (non-struck) juror
        const currentIndex = jurors.findIndex(j => j.id === selectedJurorId);
        if (currentIndex >= 0) {
          // Find next non-struck juror starting from current position
          for (let i = currentIndex + 1; i < jurors.length; i++) {
            if (!struckJurors.has(jurors[i].id)) {
              setSelectedJurorId(jurors[i].id);
              return;
            }
          }
          // If no juror found after current, wrap around to beginning
          for (let i = 0; i <= currentIndex; i++) {
            if (!struckJurors.has(jurors[i].id)) {
              setSelectedJurorId(jurors[i].id);
              return;
            }
          }
          // All jurors struck, clear selection
          setSelectedJurorId(null);
        }
      }
    } catch (error) {
      console.error('Failed to save response:', error);
    } finally {
      setSaving(false);
    }
  };

  const getResponseStatus = (qId: string, jId: string): 'answered' | 'unanswered' => {
    const resp = responses.get(qId)?.get(jId);
    if (!resp) return 'unanswered';
    if (resp.scaledValue !== null || (resp.textValue && resp.textValue.trim()) || resp.boolValue !== null) return 'answered';
    return 'unanswered';
  };

  const respondedCount = currentQuestion
    ? jurors.filter(j => getResponseStatus(currentQuestion.id, j.id) === 'answered').length
    : 0;

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">No Questions</h2>
        <p className="dark:text-slate-400 mb-6">Add questions to your question bank first.</p>
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
            <h1 className="text-2xl font-bold dark:text-white text-slate-900">Record Responses</h1>
            <p className="dark:text-slate-400 text-slate-600">{caseName}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-5 h-5" />
            <span className="font-medium">{respondedCount}/{jurors.length} responded</span>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 dark:text-slate-400" />
          </button>

          <div className="flex-1 text-center px-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm dark:text-slate-400 text-slate-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  currentQuestion?.type === 'SCALED'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    : currentQuestion?.type === 'YES_NO'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                }`}
              >
                {currentQuestion?.type === 'SCALED'
                  ? `Scale 1-${currentQuestion?.scaleMax}`
                  : currentQuestion?.type === 'YES_NO'
                  ? 'Yes / No'
                  : 'Open-Ended'}
              </span>
            </div>
            <p className="dark:text-white text-slate-900 font-semibold text-lg">
              {currentQuestion?.text}
            </p>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Juror Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold dark:text-white mb-3">Select Juror</h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {jurors.filter(j => !struckJurors.has(j.id)).map(juror => {
                const status = currentQuestion
                  ? getResponseStatus(currentQuestion.id, juror.id)
                  : 'unanswered';
                const isSelected = selectedJurorId === juror.id;

                return (
                  <div
                    key={juror.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 group transition-all"
                  >
                    <button
                      onClick={() => setSelectedJurorId(isSelected ? null : juror.id)}
                      className={`flex-1 flex items-center gap-3 rounded-lg text-left transition-all touch-manipulation ${
                        isSelected
                          ? 'bg-blue-600 text-white px-2'
                          : ''
                      }`}
                    >
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'dark:text-slate-300 text-slate-700'}`}>
                        #{juror.jurorNumber}
                      </span>
                      {status === 'answered' && (
                        <Check className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-green-500'}`} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStruckJurors(prev => new Set([...prev, juror.id]));
                        if (selectedJurorId === juror.id) setSelectedJurorId(null);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/20 dark:hover:bg-red-500/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                      title="Mark as Struck/Excused"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {struckJurors.size > 0 && (
                <>
                  <div className="my-2 border-t border-slate-300 dark:border-slate-600" />
                  <div className="text-xs font-semibold dark:text-slate-500 text-slate-400 px-3 py-2">
                    Struck/Excused ({struckJurors.size})
                  </div>
                  <div className="space-y-1">
                    {jurors.filter(j => struckJurors.has(j.id)).map(juror => (
                      <div
                        key={juror.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 group hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                      >
                        <span className="flex-1 font-bold text-sm line-through dark:text-red-400 text-red-600">
                          #{juror.jurorNumber}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStruckJurors(prev => {
                              const next = new Set(prev);
                              next.delete(juror.id);
                              return next;
                            });
                          }}
                          className="p-1.5 rounded hover:bg-red-600/20 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                          title="Restore juror"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Response Input */}
        <div className="lg:col-span-2">
          {selectedJurorId ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold dark:text-white mb-4">
                Response for Juror #{jurors.find(j => j.id === selectedJurorId)?.jurorNumber} -{' '}
                {jurors.find(j => j.id === selectedJurorId)?.firstName}{' '}
                {jurors.find(j => j.id === selectedJurorId)?.lastName}
              </h3>

              {currentQuestion?.type === 'SCALED' ? (
                <div className="space-y-4">
                  <p className="text-sm dark:text-slate-400 text-slate-600">
                    Select a score from 1 to {currentQuestion.scaleMax}:
                  </p>
                  <div className="flex gap-3">
                    {Array.from({ length: currentQuestion.scaleMax ?? 5 }, (_, i) => i + 1).map(score => (
                      <button
                        key={score}
                        onClick={() => setScaledInput(score)}
                        className={`w-14 h-14 rounded-lg font-bold text-lg transition-all touch-manipulation ${
                          scaledInput === score
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 dark:text-slate-300 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ) : currentQuestion?.type === 'YES_NO' ? (
                <div className="space-y-4">
                  <p className="text-sm dark:text-slate-400 text-slate-600">
                    Select the juror's answer:
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setScaledInput(1)}
                      className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all touch-manipulation ${
                        scaledInput === 1
                          ? 'bg-green-600 text-white ring-2 ring-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 dark:text-slate-300 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setScaledInput(0)}
                      className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all touch-manipulation ${
                        scaledInput === 0
                          ? 'bg-red-600 text-white ring-2 ring-red-400'
                          : 'bg-slate-100 dark:bg-slate-700 dark:text-slate-300 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm dark:text-slate-400 text-slate-600">
                    Record the juror's response:
                  </p>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type the juror's response..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                    rows={6}
                  />
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || (currentQuestion?.type === 'SCALED' && scaledInput === null) || (currentQuestion?.type === 'YES_NO' && scaledInput === null) || (currentQuestion?.type === 'OPEN_ENDED' && !textInput.trim())}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Response'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-12 text-center">
              <Users className="w-12 h-12 dark:text-slate-600 text-slate-400 mx-auto mb-3" />
              <p className="dark:text-slate-400 text-slate-600 text-lg">
                Select a juror from the list to record their response.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
