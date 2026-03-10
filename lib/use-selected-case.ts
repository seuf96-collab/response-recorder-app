'use client';

import { useState, useEffect, useCallback } from 'react';

interface CaseData {
  id: string;
  name: string;
  defendantName: string | null;
  venireSize: number;
}

const STORAGE_KEY = 'selectedCaseId';

/**
 * Hook to manage the currently selected case.
 * Reads/writes the selected case ID from localStorage,
 * then fetches the full case data from the API.
 */
export function useSelectedCase() {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCase = useCallback(async () => {
    try {
      const selectedId = localStorage.getItem(STORAGE_KEY);

      if (!selectedId) {
        // No case selected — check if there are any cases at all
        const res = await fetch('/api/cases');
        if (res.ok) {
          const data = await res.json();
          const cases = data.cases ?? [];
          if (cases.length > 0) {
            // Auto-select the first case
            const first = cases[0];
            localStorage.setItem(STORAGE_KEY, first.id);
            setCaseData({
              id: first.id,
              name: first.name,
              defendantName: first.defendantName,
              venireSize: first.venireSize,
            });
          } else {
            setCaseData(null);
          }
        }
        setLoading(false);
        return;
      }

      // Fetch the specific case
      const res = await fetch(`/api/cases/${selectedId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.case;
        setCaseData({
          id: c.id,
          name: c.name,
          defendantName: c.defendantName,
          venireSize: c.venireSize,
        });
      } else {
        // Case not found — clear selection and retry
        localStorage.removeItem(STORAGE_KEY);
        setError('Selected case not found');
        setCaseData(null);
      }
    } catch (err) {
      console.error('Failed to load case:', err);
      setError('Failed to load case');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const selectCase = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    // Reload the case data
    setLoading(true);
    loadCase();
  }, [loadCase]);

  return { caseData, loading, error, selectCase, reload: loadCase };
}

/**
 * Set the selected case ID in localStorage (for use outside the hook)
 */
export function setSelectedCaseId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

/**
 * Get the selected case ID from localStorage
 */
export function getSelectedCaseId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}
