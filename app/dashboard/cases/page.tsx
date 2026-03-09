'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderOpen, Plus, Scale, X, Loader2 } from 'lucide-react';

interface CaseItem {
  id: string;
  name: string;
  defendantName: string | null;
  offenseType: string | null;
  venireSize: number;
  date: string | null;
  _count: { jurors: number };
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    defendantName: '',
    venireSize: 85,
  });

  const loadCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases ?? []);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Case name is required');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        // Save to localStorage so the dashboard picks it up
        localStorage.setItem('caseName', form.name);
        localStorage.setItem('defendantName', form.defendantName);
        localStorage.setItem('venireSize', form.venireSize.toString());
        setShowModal(false);
        setForm({ name: '', defendantName: '', venireSize: 85 });
        await loadCases();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create case');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">My Cases</h1>
          <p className="dark:text-slate-400 text-slate-600">Manage your jury selection cases</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Case
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="dark:bg-slate-800 bg-white rounded-lg shadow-md p-12 text-center">
          <FolderOpen className="w-16 h-16 dark:text-slate-600 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold dark:text-slate-300 text-slate-700 mb-2">No cases yet</h3>
          <p className="dark:text-slate-500 text-slate-500 mb-6">Create your first case to start managing jurors</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard?caseId=${c.id}`}
              className="dark:bg-slate-800 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border dark:border-slate-700 border-slate-200 hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-900/30 dark:bg-blue-900/40 p-3 rounded-lg">
                  <Scale className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white text-slate-900">{c.name}</h3>
                  {c.defendantName && (
                    <p className="text-sm dark:text-slate-400 text-slate-600">{c.defendantName}</p>
                  )}
                  {c.offenseType && (
                    <p className="text-xs dark:text-slate-500 text-slate-500 mt-1">{c.offenseType}</p>
                  )}
                </div>
              </div>
              <div className="text-sm dark:text-slate-400 text-slate-600">
                <span className="font-semibold dark:text-white">{c.venireSize}</span> venire &middot;{' '}
                <span className="font-semibold dark:text-white">{c._count?.jurors ?? 0}</span> jurors
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="dark:bg-slate-800 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white text-slate-900">New Case</h2>
              <button
                onClick={() => { setShowModal(false); setError(''); }}
                className="dark:text-slate-400 text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 mb-1">Case Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border dark:border-slate-600 border-slate-300 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State v. Defendant"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 mb-1">Defendant Name</label>
                <input
                  type="text"
                  value={form.defendantName}
                  onChange={(e) => setForm({ ...form, defendantName: e.target.value })}
                  className="w-full px-4 py-2.5 border dark:border-slate-600 border-slate-300 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Defendant"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 mb-1">Venire Size</label>
                <input
                  type="number"
                  min="1"
                  value={form.venireSize}
                  onChange={(e) => setForm({ ...form, venireSize: parseInt(e.target.value) || 85 })}
                  className="w-full px-4 py-2.5 border dark:border-slate-600 border-slate-300 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setError(''); }}
                className="flex-1 px-4 py-2.5 border dark:border-slate-600 border-slate-300 dark:text-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
