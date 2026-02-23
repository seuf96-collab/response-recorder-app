'use client';

import { useState, useCallback, useEffect } from 'react';
import type { JurorStrategy } from '@/lib/types';

// Flexible juror shape for unfavorable check — works with both
// the dashboard's simplified shape and the strike screen's full shape
interface UnfavorableCheckJuror {
  overallScore?: number | null;
  score?: number;
  attorneyRating?: number;
  tag?: string;
  tags?: { tag: string }[];
}

export function useAiStrategy(caseId: string) {
  const [aiStrategies, setAiStrategies] = useState<Record<string, JurorStrategy>>({});
  const [aiExpandedJuror, setAiExpandedJuror] = useState<string | null>(null);
  const [aiExpandedSeq, setAiExpandedSeq] = useState<number | null>(null);

  // Load cached strategies on mount
  useEffect(() => {
    if (!caseId) return;

    fetch(`/api/ai/for-cause-strategy?caseId=${caseId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.strategies) {
          const cached: Record<string, JurorStrategy> = {};
          for (const s of data.strategies) {
            cached[s.jurorId] = s;
          }
          setAiStrategies(cached);
        }
      })
      .catch(() => {});
  }, [caseId]);

  const isUnfavorableJuror = useCallback((j: UnfavorableCheckJuror): boolean => {
    // Use overallScore if available, fall back to score (dashboard shape)
    const rawScore = j.overallScore ?? j.score ?? null;
    const isLowScore = rawScore !== null && rawScore < 2.5;
    const isNegativeRating = (j.attorneyRating ?? 0) < 0;
    const isTaggedUnfav = j.tags
      ? j.tags.some(t => t.tag.toLowerCase() === 'unfavorable')
      : j.tag?.toLowerCase() === 'unfavorable';
    return isLowScore || isNegativeRating || !!isTaggedUnfav;
  }, []);

  const generateAiStrategy = useCallback(async (jurorId: string, regenerate = false) => {
    setAiStrategies(prev => ({
      ...prev,
      [jurorId]: { ...prev[jurorId], jurorId, loading: true, error: null } as JurorStrategy,
    }));

    try {
      const res = await fetch('/api/ai/for-cause-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurorId, regenerate }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiStrategies(prev => ({
          ...prev,
          [jurorId]: { ...prev[jurorId], jurorId, loading: false, error: data.error } as JurorStrategy,
        }));
        return;
      }

      setAiStrategies(prev => ({
        ...prev,
        [jurorId]: {
          jurorId,
          strategy: data.strategy,
          outcome: data.outcome,
          outcomeNotes: data.outcomeNotes,
          generatedAt: data.generatedAt,
          loading: false,
          error: null,
        },
      }));
    } catch {
      setAiStrategies(prev => ({
        ...prev,
        [jurorId]: { ...prev[jurorId], jurorId, loading: false, error: 'Network error' } as JurorStrategy,
      }));
    }
  }, []);

  const saveAiOutcome = useCallback(async (jurorId: string, outcome: string, notes?: string) => {
    try {
      const res = await fetch('/api/ai/for-cause-strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurorId, caseId, outcome, outcomeNotes: notes || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiStrategies(prev => ({
          ...prev,
          [jurorId]: { ...prev[jurorId], outcome: data.outcome, outcomeNotes: data.outcomeNotes },
        }));
      }
    } catch {
      // Silently fail
    }
  }, [caseId]);

  return {
    aiStrategies,
    aiExpandedJuror,
    aiExpandedSeq,
    setAiExpandedJuror,
    setAiExpandedSeq,
    generateAiStrategy,
    saveAiOutcome,
    isUnfavorableJuror,
  };
}
