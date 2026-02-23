'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Calendar, FileText, Users } from 'lucide-react';

export default function CreateCaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    causeNumber: '',
    defendantName: '',
    offenseType: '',
    date: '',
    jurySize: 12,
    numAlternates: 1,
    stateStrikes: 10,
    defenseStrikes: 10,
    stateAltStrikes: 1,
    defenseAltStrikes: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create case:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 dark:bg-slate-950 dark:text-white">
      <div>
        <label htmlFor="name" className="block text-sm font-medium dark:text-slate-300 mb-2">
          Case Name *
        </label>
        <div className="relative">
          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="State v. Defendant"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="causeNumber" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Cause Number
          </label>
          <input
            id="causeNumber"
            type="text"
            value={formData.causeNumber}
            onChange={(e) => setFormData({ ...formData, causeNumber: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-1234"
          />
        </div>
        <div>
          <label htmlFor="defendantName" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Defendant Name
          </label>
          <input
            id="defendantName"
            type="text"
            value={formData.defendantName}
            onChange={(e) => setFormData({ ...formData, defendantName: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Defendant"
          />
        </div>
      </div>

      <div>
        <label htmlFor="offenseType" className="block text-sm font-medium dark:text-slate-300 mb-2">
          Offense Type
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="offenseType"
            type="text"
            value={formData.offenseType}
            onChange={(e) => setFormData({ ...formData, offenseType: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Aggravated Assault, Robbery"
          />
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium dark:text-slate-300 mb-2">
          Trial Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="jurySize" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Jury Size
          </label>
          <input
            id="jurySize"
            type="number"
            min="1"
            value={formData.jurySize}
            onChange={(e) => setFormData({ ...formData, jurySize: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="numAlternates" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Number of Alternates
          </label>
          <input
            id="numAlternates"
            type="number"
            min="0"
            value={formData.numAlternates}
            onChange={(e) => setFormData({ ...formData, numAlternates: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stateStrikes" className="block text-sm font-medium dark:text-slate-300 mb-2">
            State Strikes (Regular Panel)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="stateStrikes"
              type="number"
              min="0"
              value={formData.stateStrikes}
              onChange={(e) => setFormData({ ...formData, stateStrikes: parseInt(e.target.value) })}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="defenseStrikes" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Defense Strikes (Regular Panel)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="defenseStrikes"
              type="number"
              min="0"
              value={formData.defenseStrikes}
              onChange={(e) => setFormData({ ...formData, defenseStrikes: parseInt(e.target.value) })}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stateAltStrikes" className="block text-sm font-medium dark:text-slate-300 mb-2">
            State Strikes (Alternate Panel)
          </label>
          <input
            id="stateAltStrikes"
            type="number"
            min="0"
            value={formData.stateAltStrikes}
            onChange={(e) => setFormData({ ...formData, stateAltStrikes: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="defenseAltStrikes" className="block text-sm font-medium dark:text-slate-300 mb-2">
            Defense Strikes (Alternate Panel)
          </label>
          <input
            id="defenseAltStrikes"
            type="number"
            min="0"
            value={formData.defenseAltStrikes}
            onChange={(e) => setFormData({ ...formData, defenseAltStrikes: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </div>
    </form>
  );
}
