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
  const [editFormData, setEditFormData] = useState({
    id: 'default-case-1',
    name: 'State v. Johnson',
    defendantName: 'Marcus Johnson',
    venireSize: 85,
  });

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
    const savedName = localStorage.getItem('caseName');
    const savedDefendant = localStorage.getItem('defendantName');
    const savedVenireSize = localStorage.getItem('venireSize');

    if (savedName || savedDefendant || savedVenireSize) {
      const newCaseData = {
        ...caseData,
        name: savedName || caseData.name,
        defendantName: savedDefendant || caseData.defendantName,
        venireSize: savedVenireSize ? parseInt(savedVenireSize) : caseData.venireSize,
      };
      setCaseData(newCaseData);
      setEditFormData(newCaseData);
    } else {
      setEditFormData(caseData);
    }
  }, []);

  const handleSave = async () => {
    // Validate inputs
    if (!editFormData.name.trim() || !editFormData.defendantName.trim()) {
      alert('Case name and defendant name cannot be empty');
      return;
    }

    // Save to localStorage
    localStorage.setItem('caseName', editFormData.name);
    localStorage.setItem('defendantName', editFormData.defendantName);
    localStorage.setItem('venireSize', editFormData.venireSize.toString());

    // Update case data
    setCaseData(editFormData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditFormData(caseData);
    setEditing(false);
  };

  const handleReset = () => {
    if (window.confirm('This will reset everything to defaults. Are you sure?')) {
      const defaultData = {
        id: 'default-case-1',
        name: 'State v. Johnson',
        defendantName: 'Marcus Johnson',
        venireSize: 85,
      };
      localStorage.removeItem('caseName');
      localStorage.removeItem('defendantName');
      localStorage.removeItem('venireSize');
      setCaseData(defaultData);
      setEditFormData(defaultData);
    }
  };

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
              <p className="text-xs dark:text-slate-500 mt-1">Full case name or caption</p>
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
              <p className="text-xs dark:text-slate-500 mt-1">Name of the defendant</p>
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
              <p className="text-xs dark:text-slate-500 mt-1">Number of jurors in venire</p>
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
              <p className="text-lg dark:text-slate-300">State v. {caseData.defendantName}</p>
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
