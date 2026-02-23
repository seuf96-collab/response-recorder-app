'use client';

import { useState } from 'react';
import { X, Hash } from 'lucide-react';

interface Props {
  caseId: string;
  venireSize: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateJurorModal({ caseId, venireSize, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [jurorNumber, setJurorNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const num = parseInt(jurorNumber);
    if (isNaN(num) || num < 1 || num > venireSize) {
      setError(`Juror number must be between 1 and ${venireSize}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/jurors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          name: `Juror ${jurorNumber}`,
          seatNumber: num,
        }),
      });

      if (res.ok) {
        setJurorNumber('');
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add juror');
      }
    } catch (error) {
      console.error('Failed to create juror:', error);
      setError('Failed to add juror');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 text-lg";
  const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2";
  const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Juror by Number</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className={labelClasses}>
              Juror Number (1-{venireSize}) *
            </label>
            <div className="relative">
              <Hash className={iconClasses} />
              <input
                type="number"
                min="1"
                max={venireSize}
                value={jurorNumber}
                onChange={(e) => {
                  setJurorNumber(e.target.value);
                  setError('');
                }}
                className={inputClasses}
                placeholder={`Enter 1-${venireSize}`}
                autoFocus
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Jurors are identified by number only for quick response recording
            </p>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Juror'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
