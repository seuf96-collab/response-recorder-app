'use client';

import Link from 'next/link';
import { Edit2, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [caseData, setCaseData] = useState({
    id: 'default-case-1',
    name: 'State v. Johnson',
    defendantName: 'Marcus Johnson',
    venireSize: 85,
  });
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('85');

  useEffect(() => {
    // Seed database on mount
    const seedDatabase = async () => {
      try {
        await fetch('/api/seed', { method: 'POST' });
      } catch (error) {
        console.error('Failed to seed database:', error);
      }
    };

    seedDatabase();

    // Load from localStorage on mount
    const saved = localStorage.getItem('venireSize');
    if (saved) {
      const size = parseInt(saved);
      setCaseData(prev => ({ ...prev, venireSize: size }));
      setEditValue(saved);
    }
  }, []);

  const handleSave = () => {
    const newSize = parseInt(editValue) || 85;
    localStorage.setItem('venireSize', newSize.toString());
    setCaseData(prev => ({ ...prev, venireSize: newSize }));
    setEditing(false);
  };

  const handleReset = () => {
    if (window.confirm('This will reset everything. Are you sure?')) {
      localStorage.setItem('venireSize', '85');
      setCaseData(prev => ({ ...prev, venireSize: 85 }));
      setEditValue('85');
    }
  };

  return (
    <div className="p-6 space-y-8 dark:bg-slate-950 min-h-screen">
      {/* Case Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        {editing ? (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium dark:text-slate-300 mb-2">Size of Venire</label>
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-lg"
              />
              <p className="text-xs dark:text-slate-500 mt-1">Number of jurors in venire</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditValue(caseData.venireSize.toString());
                }}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold dark:text-white mb-2">{caseData.name}</h1>
              <p className="text-lg dark:text-slate-300">State v. {caseData.defendantName}</p>
              <p className="text-sm dark:text-slate-400 mt-2">
                Venire Size: <span className="font-semibold">{caseData.venireSize}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(true);
                  setEditValue(caseData.venireSize.toString());
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Case
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear & Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title and Actions */}
      <div>
        <h2 className="text-3xl font-bold dark:text-white mb-2">Response Recorder</h2>
        <p className="text-lg dark:text-slate-400">Record and track juror responses</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/dashboard/questions"
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Questions
        </Link>
        <Link
          href="/dashboard/questions/scale-mode"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Scale Mode
        </Link>
        <Link
          href="/dashboard/questions/responses"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Record Responses
        </Link>
        <Link
          href="/dashboard/questions/tracker"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Response Tracker
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Current Case</h3>
          <p className="text-xl font-bold dark:text-white">{caseData.name}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Defendant</h3>
          <p className="text-xl font-bold dark:text-white">{caseData.defendantName}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Venire Size</h3>
          <p className="text-xl font-bold dark:text-white">{caseData.venireSize} jurors</p>
        </div>
      </div>
    </div>
  );
}
