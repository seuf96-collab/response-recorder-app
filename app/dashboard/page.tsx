'use client';

import Link from 'next/link';
import { Edit2, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelectedCase } from '@/lib/use-selected-case';

export default function DashboardPage() {
  const { caseData, loading, reload } = useSelectedCase();
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    defendantName: '',
    venireSize: 85,
  });

  useEffect(() => {
    if (caseData) {
      setEditFormData({
        name: caseData.name,
        defendantName: caseData.defendantName || '',
        venireSize: caseData.venireSize,
      });
      // Keep venireSize in localStorage for Scale Mode and other components
      localStorage.setItem('venireSize', caseData.venireSize.toString());
    }
  }, [caseData]);

  const handleSave = async () => {
    if (!caseData) return;
    if (!editFormData.name.trim()) {
      alert('Case name cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          defendantName: editFormData.defendantName,
          venireSize: editFormData.venireSize,
        }),
      });

      if (res.ok) {
        localStorage.setItem('venireSize', editFormData.venireSize.toString());
        setEditing(false);
        reload();
      }
    } catch (error) {
      console.error('Failed to update case:', error);
    }
  };

  const handleCancel = () => {
    if (caseData) {
      setEditFormData({
        name: caseData.name,
        defendantName: caseData.defendantName || '',
        venireSize: caseData.venireSize,
      });
    }
    setEditing(false);
  };

  const handleReset = async () => {
    if (!caseData) return;
    if (window.confirm('This will delete all responses, questions, and juror data for this case. Are you sure?')) {
      try {
        await fetch(`/api/cases/${caseData.id}/reset`, { method: 'POST' });
        reload();
      } catch (error) {
        console.error('Failed to reset case:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold dark:text-white mb-4">No Case Selected</h2>
        <p className="dark:text-slate-400 mb-6">Select or create a case to get started.</p>
        <Link
          href="/dashboard/cases"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Go to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 dark:bg-slate-950 min-h-screen">
      {/* Case Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        {editing ? (
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium dark:text-slate-300 mb-2">Case Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g., State v. Johnson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 mb-2">Defendant Name</label>
              <input
                type="text"
                value={editFormData.defendantName}
                onChange={(e) => setEditFormData({ ...editFormData, defendantName: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g., Marcus Johnson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 mb-2">Size of Venire</label>
              <input
                type="number"
                value={editFormData.venireSize}
                onChange={(e) => setEditFormData({ ...editFormData, venireSize: parseInt(e.target.value) || 85 })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                min="1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
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
              {caseData.defendantName && (
                <p className="text-lg dark:text-slate-300">State v. {caseData.defendantName}</p>
              )}
              <p className="text-sm dark:text-slate-400 mt-2">
                Venire Size: <span className="font-semibold">{caseData.venireSize}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
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
        <Link
          href="/dashboard/strikes"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
        >
          Strike Recorder
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
          <p className="text-xl font-bold dark:text-white">{caseData.defendantName || '—'}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Venire Size</h3>
          <p className="text-xl font-bold dark:text-white">{caseData.venireSize} jurors</p>
        </div>
      </div>
    </div>
  );
}
