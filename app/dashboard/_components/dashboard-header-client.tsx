'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Save, X, RotateCcw } from 'lucide-react';

interface Case {
  id: string;
  name: string;
  defendantName?: string | null;
  venireSize?: number | null;
}

interface Props {
  activeCase: Case;
}

export default function DashboardHeaderClient({ activeCase }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: activeCase.name,
    defendantName: activeCase.defendantName || '',
    venireSize: activeCase.venireSize || 36,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cases/${activeCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          defendantName: formData.defendantName || null,
          venireSize: parseInt(formData.venireSize.toString()),
        }),
      });

      if (response.ok) {
        setEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to save case:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('This will delete all data and reset everything. Are you sure?')) {
      return;
    }

    try {
      await fetch(`/api/cases/${activeCase.id}/reset`, {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
            Case Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
            Defendant Name
          </label>
          <input
            type="text"
            value={formData.defendantName}
            onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
            placeholder="Optional"
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
            Size of Venire
          </label>
          <input
            type="number"
            value={formData.venireSize}
            onChange={(e) => setFormData({ ...formData, venireSize: parseInt(e.target.value) })}
            min={1}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
            Number of jurors to record responses for in Scale Mode
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setFormData({
                name: activeCase.name,
                defendantName: activeCase.defendantName || '',
                venireSize: activeCase.venireSize || 36,
              });
            }}
            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">{activeCase.name}</h1>
        {activeCase.defendantName && (
          <p className="text-lg dark:text-slate-300">State v. {activeCase.defendantName}</p>
        )}
        <p className="text-sm dark:text-slate-400 mt-2">
          Venire Size: <span className="font-semibold">{activeCase.venireSize || 36}</span>
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
  );
}
