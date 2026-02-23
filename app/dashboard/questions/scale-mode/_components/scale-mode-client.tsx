'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
  Users,
  X,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
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

interface Props {
  caseId: string;
  caseName: string;
  venireSize?: number;
}

export default function ScaleModeClient({ caseId, caseName, venireSize = 36 }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedJurorId, setSelectedJurorId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Map<string, Map<string, number>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [struckJurors, setStruckJurors] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkScore, setBulkScore] = useState<number | null>(null);

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

        const scaledQuestions = (questionsData.questions ?? []).filter(
          (q: Question) => q.type === 'SCALED' || q.type === 'YES_NO'
        );
        setQuestions(scaledQuestions);

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

        // Build responses map: questionId -> jurorId -> scaledValue (or 0/1 for YES_NO)
        const responseMap = new Map<string, Map<string, number>>();
        for (const resp of responsesData.responses ?? []) {
          let value: number | null = null;
          if (resp.scaledValue !== null && resp.scaledValue !== undefined) {
            value = resp.scaledValue;
          } else if (resp.boolValue !== null && resp.boolValue !== undefined) {
            value = resp.boolValue ? 1 : 0; // Convert boolean to 0/1
          }

          if (value !== null) {
            if (!responseMap.has(resp.questionId)) {
              responseMap.set(resp.questionId, new Map());
            }
            responseMap.get(resp.questionId)!.set(resp.jurorId, value);
          }
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
  const scaleMax = currentQuestion?.scaleMax ?? 5;

  const getResponseForJuror = (jurorId: string): number | null => {
    if (!currentQuestion) return null;
    return responses.get(currentQuestion.id)?.get(jurorId) ?? null;
  };

  const respondedCount = currentQuestion
    ? (responses.get(currentQuestion.id)?.size ?? 0)
    : 0;

  const handleUndoScore = useCallback(async () => {
    if (!selectedJurorId || !currentQuestion || saving) return;

    setSaving(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurorId: selectedJurorId,
          questionId: currentQuestion.id,
          caseId,
        }),
      });

      if (res.ok) {
        // Update local state to remove the response
        setResponses(prev => {
          const newMap = new Map(prev);
          const questionResponses = newMap.get(currentQuestion.id);
          if (questionResponses) {
            questionResponses.delete(selectedJurorId);
            if (questionResponses.size === 0) {
              newMap.delete(currentQuestion.id);
            }
          }
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to undo response:', error);
    } finally {
      setSaving(false);
    }
  }, [selectedJurorId, currentQuestion, saving]);

  const handleBulkScoreSelect = useCallback(async (score: number) => {
    if (bulkMode) {
      // In bulk mode, set the selected score and wait for juror clicks
      setBulkScore(prev => prev === score ? null : score);
    } else {
      // Normal mode - save response for selected juror
      if (selectedJurorId && currentQuestion && !saving) {
        setSaving(true);
        try {
          const res = await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jurorId: selectedJurorId,
              questionId: currentQuestion.id,
              ...(currentQuestion.type === 'YES_NO'
                ? { boolValue: score === 1 }
                : { scaledValue: score }),
              caseId,
            }),
          });

          if (res.ok) {
            await res.json();
            // Update local state with response from server
            setResponses(prev => {
              const newMap = new Map(prev);
              if (!newMap.has(currentQuestion.id)) {
                newMap.set(currentQuestion.id, new Map());
              }
              newMap.get(currentQuestion.id)!.set(selectedJurorId, score);
              return newMap;
            });

            if (autoAdvance) {
              // Find next non-struck, unscored juror
              const currentJurorIndex = jurors.findIndex(j => j.id === selectedJurorId);
              let nextJuror = null;

              // Check which jurors have responses (including the one we just saved)
              const questionsResponses = responses.get(currentQuestion.id) ?? new Map();
              const allScoredJurors = new Set(questionsResponses.keys());
              allScoredJurors.add(selectedJurorId); // Include the juror we just scored

              // Search forward from current position
              for (let i = currentJurorIndex + 1; i < jurors.length; i++) {
                if (!struckJurors.has(jurors[i].id) && !allScoredJurors.has(jurors[i].id)) {
                  nextJuror = jurors[i];
                  break;
                }
              }

              // If not found after, wrap around to beginning
              if (!nextJuror) {
                for (let i = 0; i <= currentJurorIndex; i++) {
                  if (!struckJurors.has(jurors[i].id) && !allScoredJurors.has(jurors[i].id)) {
                    nextJuror = jurors[i];
                    break;
                  }
                }
              }

              if (nextJuror) {
                setSelectedJurorId(nextJuror.id);
              } else {
                setSelectedJurorId(null);
              }
            }
          }
        } catch (error) {
          console.error('Failed to save response:', error);
        } finally {
          setSaving(false);
        }
      }
    }
  }, [bulkMode, selectedJurorId, currentQuestion, saving, autoAdvance, jurors, responses, struckJurors, caseId]);

  const handleBulkJurorClick = useCallback(async (jurorId: string) => {
    if (!bulkMode || bulkScore === null || !currentQuestion || saving) return;

    // Check if this juror already has a response
    const existingScore = responses.get(currentQuestion.id)?.get(jurorId);
    if (existingScore !== undefined && existingScore !== null) {
      return; // Skip if already scored
    }

    setSaving(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurorId,
          questionId: currentQuestion.id,
          ...(currentQuestion.type === 'YES_NO'
            ? { boolValue: bulkScore === 1 }
            : { scaledValue: bulkScore }),
          caseId,
        }),
      });

      if (res.ok) {
        // Update local state
        setResponses(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(currentQuestion.id)) {
            newMap.set(currentQuestion.id, new Map());
          }
          newMap.get(currentQuestion.id)!.set(jurorId, bulkScore);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Failed to save bulk response:', error);
    } finally {
      setSaving(false);
    }
  }, [bulkMode, bulkScore, currentQuestion, saving, responses, caseId]);

  const clearCurrentQuestionResponses = useCallback(async () => {
    if (!currentQuestion || responses.get(currentQuestion.id)?.size === 0) return;

    if (!window.confirm(`Clear all ${respondedCount} responses for this question?`)) {
      return;
    }

    setSaving(true);
    try {
      const questionResponses = responses.get(currentQuestion.id);
      if (!questionResponses) return;

      // Delete each response for this question
      for (const jurorId of questionResponses.keys()) {
        await fetch('/api/responses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jurorId,
            questionId: currentQuestion.id,
            caseId,
          }),
        });
      }

      // Clear responses from local state
      setResponses(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentQuestion.id);
        return newMap;
      });

      setSelectedJurorId(null);
      setBulkScore(null);
    } catch (error) {
      console.error('Failed to clear responses:', error);
    } finally {
      setSaving(false);
    }
  }, [currentQuestion, responses, caseId, respondedCount]);

  const getScoreButtonColor = (score: number, max: number): string => {
    const ratio = score / max;
    if (ratio >= 0.8) return 'bg-green-600 hover:bg-green-700 text-white';
    if (ratio >= 0.6) return 'bg-green-500/70 hover:bg-green-600 text-white';
    if (ratio >= 0.4) return 'bg-amber-500 hover:bg-amber-600 text-white';
    if (ratio >= 0.2) return 'bg-orange-500 hover:bg-orange-600 text-white';
    return 'bg-red-600 hover:bg-red-700 text-white';
  };

  const getJurorCellColor = (jurorId: string): string => {
    if (!currentQuestion) return 'bg-slate-200 dark:bg-slate-700';
    const score = getResponseForJuror(jurorId);
    if (score === null) return 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';

    // For YES_NO questions, match the Yes/No button colors
    if (currentQuestion.type === 'YES_NO') {
      if (score === 1) return 'bg-green-600 text-white'; // Yes = Green (matches Yes button)
      if (score === 0) return 'bg-red-600 text-white';   // No = Red (matches No button)
    }

    // For SCALED questions, use ratio-based coloring
    const max = scaleMax;
    const ratio = score / max;
    if (ratio >= 0.8) return 'bg-green-500 dark:bg-green-600 text-white';
    if (ratio >= 0.6) return 'bg-green-400/70 dark:bg-green-700 text-white';
    if (ratio >= 0.4) return 'bg-amber-400 dark:bg-amber-600 text-white';
    if (ratio >= 0.2) return 'bg-orange-400 dark:bg-orange-600 text-white';
    return 'bg-red-500 dark:bg-red-600 text-white';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">No Scaled Questions</h2>
        <p className="dark:text-slate-400 mb-6">Add scaled questions to your question bank first.</p>
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
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-40">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors touch-manipulation"
        >
          <X className="w-5 h-5" />
          <span className="font-medium">Exit</span>
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-400">{caseName}</p>
          <p className="text-white font-semibold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer" title="Bulk Mode: Select score first, then tap jurors">
            <input
              type="checkbox"
              checked={bulkMode}
              onChange={(e) => {
                setBulkMode(e.target.checked);
                setBulkScore(null);
                setSelectedJurorId(null);
              }}
              className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            Bulk Mode
          </label>
          {!bulkMode && (
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              Auto-advance
            </label>
          )}
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {respondedCount}/{jurors.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Question Text */}
        <div className="px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {currentQuestion?.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {currentQuestion.category}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              currentQuestion?.type === 'YES_NO'
                ? 'bg-purple-900/50 text-purple-300 border-purple-700/50'
                : 'bg-amber-900/50 text-amber-300 border-amber-700/50'
            }`}>
              {currentQuestion?.type === 'YES_NO' ? 'Yes / No' : `Scale 1-${scaleMax}`}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white max-w-3xl mx-auto leading-relaxed">
            {currentQuestion?.text}
          </h2>
        </div>

        {/* Juror Grid + Score Panel */}
        <div className="flex-1 flex gap-6 px-6 pb-6 overflow-hidden">
          {/* Juror Grid */}
          <div className="flex-1 overflow-auto flex flex-col">
            <p className="text-sm text-slate-400 mb-3">
              {currentQuestion?.type === 'YES_NO'
                ? bulkMode
                  ? bulkScore !== null
                    ? `Tap jurors to assign "${bulkScore ? 'Yes' : 'No'}"`
                    : 'Select Yes or No above to begin bulk mode'
                  : selectedJurorId
                  ? `Select Yes or No for Juror #${jurors.find(j => j.id === selectedJurorId)?.jurorNumber}`
                  : 'Tap a juror to answer Yes/No'
                : bulkMode
                ? bulkScore !== null
                  ? `Tap jurors to assign score ${bulkScore}`
                  : 'Select a score above to begin bulk mode'
                : selectedJurorId
                ? `Select a score for Juror #${jurors.find(j => j.id === selectedJurorId)?.jurorNumber}`
                : 'Tap a juror to score them'}
            </p>
            <div className="flex-1 overflow-auto mb-4">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`,
                }}
              >
                {jurors
                  .filter(j => !struckJurors.has(j.id))
                  .sort((a, b) => a.jurorNumber - b.jurorNumber)
                  .map((juror) => {
                  const score = getResponseForJuror(juror.id);
                  const isSelected = selectedJurorId === juror.id;

                  return (
                    <button
                      key={juror.id}
                      onClick={() => {
                        if (bulkMode && bulkScore !== null) {
                          handleBulkJurorClick(juror.id);
                        } else {
                          setSelectedJurorId(isSelected ? null : juror.id);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setStruckJurors(prev => new Set([...prev, juror.id]));
                        if (selectedJurorId === juror.id) setSelectedJurorId(null);
                      }}
                      title={bulkMode ? "Click to assign this score" : "Click to select, right-click or click X to mark as Struck/Excused"}
                      disabled={bulkMode && bulkScore !== null && score !== undefined && score !== null}
                      className={`relative p-3 rounded-lg text-center font-semibold transition-all touch-manipulation min-h-[70px] flex flex-col items-center justify-center group ${getJurorCellColor(juror.id)} ${
                        isSelected && !bulkMode
                          ? 'ring-3 ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-105'
                          : ''
                      } ${
                        bulkMode && bulkScore !== null && score !== undefined && score !== null
                          ? 'opacity-40 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <div className="text-lg font-bold">{juror.jurorNumber}</div>
                      <div className="text-xs truncate opacity-80">
                        {juror.firstName?.[0]}. {juror.lastName}
                      </div>
                      {/* Strike button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStruckJurors(prev => new Set([...prev, juror.id]));
                          if (selectedJurorId === juror.id) setSelectedJurorId(null);
                        }}
                        className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity group-hover:opacity-100"
                        title="Click to mark as Struck/Excused"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {score !== null && (
                        <div className="absolute top-1 right-1">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {score !== null && (
                        <div className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-80">
                          {score}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Struck/Excused Section */}
            {struckJurors.size > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Struck/Excused ({struckJurors.size})</p>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`,
                  }}
                >
                  {jurors
                    .filter(j => struckJurors.has(j.id))
                    .sort((a, b) => a.jurorNumber - b.jurorNumber)
                    .map((juror) => (
                    <button
                      key={juror.id}
                      onClick={() => {
                        setStruckJurors(prev => {
                          const next = new Set(prev);
                          next.delete(juror.id);
                          return next;
                        });
                      }}
                      title="Click to restore"
                      className="p-3 rounded-lg text-center font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm min-h-[70px] flex flex-col items-center justify-center line-through transition-all"
                    >
                      <div className="font-bold">#{juror.jurorNumber}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Score/Answer Selection Panel */}
          <div className="w-48 flex flex-col gap-3">
            {currentQuestion?.type === 'YES_NO' ? (
              <>
                <p className="text-sm text-slate-400 text-center mb-1">{bulkMode ? 'Choose Answer' : 'Answer'}</p>
                {[
                  { label: 'Yes', value: true, color: 'bg-green-600 hover:bg-green-700' },
                  { label: 'No', value: false, color: 'bg-red-600 hover:bg-red-700' },
                ].map(({ label, value, color }) => {
                  const isCurrentAnswer = bulkMode
                    ? bulkScore === (value ? 1 : 0)
                    : selectedJurorId
                    ? getResponseForJuror(selectedJurorId) === (value ? 1 : 0)
                    : false;

                  return (
                    <button
                      key={label}
                      onClick={() => handleBulkScoreSelect(value ? 1 : 0)}
                      disabled={!bulkMode && (!selectedJurorId || saving)}
                      className={`py-4 rounded-lg font-bold text-xl transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed text-white ${color} ${
                        isCurrentAnswer ? 'ring-3 ring-white' : ''
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {/* Undo Button (Normal Mode) */}
                {!bulkMode && selectedJurorId && getResponseForJuror(selectedJurorId) !== null && (
                  <button
                    onClick={handleUndoScore}
                    disabled={saving}
                    className="mt-2 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed border-2 border-slate-500"
                    title="Remove the answer for this juror"
                  >
                    ↶ Undo
                  </button>
                )}

                {/* Clear Bulk Answer Button */}
                {bulkMode && bulkScore !== null && (
                  <button
                    onClick={() => setBulkScore(null)}
                    className="mt-2 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all touch-manipulation border-2 border-slate-500"
                    title="Clear selected bulk answer"
                  >
                    Clear Answer
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400 text-center mb-1">{bulkMode ? 'Choose Score' : 'Score'}</p>
                {Array.from({ length: scaleMax }, (_, i) => i + 1).map((score) => {
                  const isCurrentScore = bulkMode
                    ? bulkScore === score
                    : selectedJurorId
                    ? getResponseForJuror(selectedJurorId) === score
                    : false;

                  return (
                    <button
                      key={score}
                      onClick={() => handleBulkScoreSelect(score)}
                      disabled={!bulkMode && (!selectedJurorId || saving)}
                      className={`py-4 rounded-lg font-bold text-xl transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed ${
                        isCurrentScore
                          ? 'ring-3 ring-white ' + getScoreButtonColor(score, scaleMax)
                          : getScoreButtonColor(score, scaleMax)
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}

                {/* Undo Button (Normal Mode) */}
                {!bulkMode && selectedJurorId && getResponseForJuror(selectedJurorId) !== null && (
                  <button
                    onClick={handleUndoScore}
                    disabled={saving}
                    className="mt-2 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed border-2 border-slate-500"
                    title="Remove the score for this juror"
                  >
                    ↶ Undo
                  </button>
                )}

                {/* Clear Bulk Score Button */}
                {bulkMode && bulkScore !== null && (
                  <button
                    onClick={() => setBulkScore(null)}
                    className="mt-2 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all touch-manipulation border-2 border-slate-500"
                    title="Clear selected bulk score"
                  >
                    Clear Score
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
              setSelectedJurorId(null);
            }}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-30 touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {respondedCount > 0 && (
            <button
              onClick={clearCurrentQuestionResponses}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors disabled:opacity-30 touch-manipulation"
              title={`Clear all ${respondedCount} responses for this question`}
            >
              <X className="w-4 h-4" />
              Clear ({respondedCount})
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex gap-2">
          {questions.map((q, i) => {
            const qResponded = responses.get(q.id)?.size ?? 0;
            const allScored = qResponded >= jurors.length;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(i);
                  setSelectedJurorId(null);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all touch-manipulation ${
                  i === currentQuestionIndex
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : allScored
                    ? 'bg-green-600 text-white'
                    : qResponded > 0
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1));
            setSelectedJurorId(null);
          }}
          disabled={currentQuestionIndex === questions.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-30 touch-manipulation"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
