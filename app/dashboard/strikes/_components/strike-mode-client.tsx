'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type StrikeType = 'STATE' | 'DEFENSE' | 'CAUSE' | 'EXCUSED';

interface Props {
  caseId: string;
  caseName: string;
  venireSize: number;
}

const STRIKE_ACTIONS: { type: StrikeType; label: string; shortLabel: string; key: string; buttonClass: string; cellClass: string }[] = [
  {
    type: 'STATE',
    label: 'State Strike',
    shortLabel: 'STATE',
    key: 'S',
    buttonClass: 'bg-red-600 hover:bg-red-700',
    cellClass: 'bg-red-700 text-white',
  },
  {
    type: 'DEFENSE',
    label: 'Defense Strike',
    shortLabel: 'DEF',
    key: 'D',
    buttonClass: 'bg-orange-500 hover:bg-orange-600',
    cellClass: 'bg-orange-600 text-white',
  },
  {
    type: 'CAUSE',
    label: 'For Cause',
    shortLabel: 'CAUSE',
    key: 'C',
    buttonClass: 'bg-purple-600 hover:bg-purple-700',
    cellClass: 'bg-purple-700 text-white',
  },
  {
    type: 'EXCUSED',
    label: 'Excused',
    shortLabel: 'EXC',
    key: 'E',
    buttonClass: 'bg-slate-500 hover:bg-slate-600',
    cellClass: 'bg-slate-600 text-slate-300',
  },
];

function getStorageKey(caseId: string) {
  return `strikes-${caseId}`;
}

function loadStrikes(caseId: string): Map<number, StrikeType> {
  try {
    const raw = localStorage.getItem(getStorageKey(caseId));
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, StrikeType>;
    const map = new Map<number, StrikeType>();
    for (const [k, v] of Object.entries(obj)) {
      map.set(parseInt(k), v);
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveStrikes(caseId: string, map: Map<number, StrikeType>) {
  const obj: Record<string, StrikeType> = {};
  for (const [k, v] of map.entries()) {
    obj[String(k)] = v;
  }
  localStorage.setItem(getStorageKey(caseId), JSON.stringify(obj));
}

export default function StrikeModeClient({ caseId, caseName, venireSize }: Props) {
  const router = useRouter();
  const [strikes, setStrikes] = useState<Map<number, StrikeType>>(new Map());
  const [selectedJurorNum, setSelectedJurorNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStrikes(loadStrikes(caseId));
    setLoading(false);
  }, [caseId]);

  const applyStrike = useCallback((jurorNum: number, type: StrikeType) => {
    setStrikes(prev => {
      const next = new Map(prev);
      if (next.get(jurorNum) === type) {
        next.delete(jurorNum); // toggle off
      } else {
        next.set(jurorNum, type);
      }
      saveStrikes(caseId, next);
      return next;
    });
  }, [caseId]);

  const removeStrike = useCallback((jurorNum: number) => {
    setStrikes(prev => {
      const next = new Map(prev);
      next.delete(jurorNum);
      saveStrikes(caseId, next);
      return next;
    });
  }, [caseId]);

  const handleStrikeButton = useCallback((type: StrikeType) => {
    if (selectedJurorNum === null) return;
    applyStrike(selectedJurorNum, type);
  }, [selectedJurorNum, applyStrike]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case 's': handleStrikeButton('STATE'); break;
        case 'd': handleStrikeButton('DEFENSE'); break;
        case 'c': handleStrikeButton('CAUSE'); break;
        case 'e': handleStrikeButton('EXCUSED'); break;
        case 'u':
        case 'backspace':
        case 'delete':
          if (selectedJurorNum !== null) removeStrike(selectedJurorNum);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStrikeButton, removeStrike, selectedJurorNum]);

  const jurors = Array.from({ length: venireSize }, (_, i) => i + 1);

  const counts = {
    STATE: 0, DEFENSE: 0, CAUSE: 0, EXCUSED: 0,
  };
  for (const v of strikes.values()) counts[v]++;
  const activeCount = venireSize - strikes.size;

  const getJurorCellClass = (jurorNum: number) => {
    const strike = strikes.get(jurorNum);
    const isSelected = selectedJurorNum === jurorNum;
    const action = STRIKE_ACTIONS.find(a => a.type === strike);
    const base = action ? action.cellClass : 'bg-slate-700 hover:bg-slate-600 text-white';
    return `${base}${isSelected ? ' ring-[3px] ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const selectedStrike = selectedJurorNum !== null ? strikes.get(selectedJurorNum) : undefined;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-40">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-red-950 border-red-900">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors touch-manipulation"
        >
          <X className="w-5 h-5" />
          <span className="font-medium">Exit</span>
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-400">{caseName}</p>
          <p className="text-white font-semibold">Strike Recorder</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-300">
            <span className="font-bold text-white">{activeCount}</span> active
          </span>
          <span className="text-red-300">
            <span className="font-bold">{counts.STATE}</span> state
          </span>
          <span className="text-orange-300">
            <span className="font-bold">{counts.DEFENSE}</span> def
          </span>
          <span className="text-purple-300">
            <span className="font-bold">{counts.CAUSE}</span> cause
          </span>
          <span className="text-slate-400">
            <span className="font-bold">{counts.EXCUSED}</span> exc
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 px-6 py-5 overflow-hidden">
        {/* Juror Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <p className="text-sm text-slate-400 mb-3">
            {selectedJurorNum
              ? `Juror #${selectedJurorNum} selected${selectedStrike ? ` — ${selectedStrike}` : ' — choose strike type'}`
              : 'Tap a juror, then choose a strike type on the right'}
          </p>
          <div className="flex-1 overflow-auto">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}
            >
              {jurors.map((jurorNum) => {
                const strike = strikes.get(jurorNum);
                const action = STRIKE_ACTIONS.find(a => a.type === strike);
                return (
                  <button
                    key={jurorNum}
                    onClick={() => setSelectedJurorNum(selectedJurorNum === jurorNum ? null : jurorNum)}
                    className={`p-3 rounded-lg text-center font-semibold transition-all touch-manipulation min-h-[70px] flex flex-col items-center justify-center ${getJurorCellClass(jurorNum)}`}
                  >
                    <div className="text-lg font-bold">{jurorNum}</div>
                    {action && (
                      <div className="text-[10px] font-semibold opacity-80 mt-0.5">
                        {action.shortLabel}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Strike Type Panel */}
        <div className="w-48 flex flex-col gap-3">
          <p className="text-sm text-slate-400 text-center mb-1">Strike Type</p>

          {STRIKE_ACTIONS.map(({ type, label, key, buttonClass }) => {
            const isActive = selectedStrike === type;
            return (
              <button
                key={type}
                onClick={() => handleStrikeButton(type)}
                disabled={selectedJurorNum === null}
                className={`py-4 rounded-lg font-bold text-base transition-all touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed text-white ${buttonClass}${
                  isActive ? ' ring-[3px] ring-white' : ''
                }`}
              >
                <span className="text-xs opacity-70 mr-1">[{key}]</span>{label}
              </button>
            );
          })}

          {selectedJurorNum !== null && selectedStrike && (
            <button
              onClick={() => removeStrike(selectedJurorNum)}
              className="mt-1 py-3 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all touch-manipulation border-2 border-slate-500"
            >
              ↶ Undo [U]
            </button>
          )}

          {/* Keyboard legend */}
          <div className="mt-auto pt-4 border-t border-slate-700 space-y-1.5">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Keyboard</p>
            <p className="text-xs text-slate-500">S = State Strike</p>
            <p className="text-xs text-slate-500">D = Defense Strike</p>
            <p className="text-xs text-slate-500">C = For Cause</p>
            <p className="text-xs text-slate-500">E = Excused</p>
            <p className="text-xs text-slate-500">U / ⌫ = Undo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
