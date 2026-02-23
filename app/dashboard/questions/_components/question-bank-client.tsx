'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface Question {
  id: string;
  caseId: string;
  text: string;
  type: 'SCALED' | 'OPEN_ENDED' | 'YES_NO';
  scaleMax?: number | null;
  weight: number;
  category?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  caseId: string;
  caseName: string;
}

const CATEGORIES = [
  'General Background',
  'Case-Specific',
  'Bias & Fairness',
  'Law Enforcement',
  'Punishment',
  'Experience',
  'Other',
];

export default function QuestionBankClient({ caseId, caseName }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    type: 'SCALED' as 'SCALED' | 'OPEN_ENDED' | 'YES_NO',
    scaleMax: 5,
    weight: 1,
    category: '',
  });

  useEffect(() => {
    fetchQuestions();
  }, [caseId]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/questions?caseId=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ text: '', type: 'SCALED', scaleMax: 5, weight: 1, category: '' });
  };

  const handleCreate = async () => {
    if (!formData.text.trim()) return;
    setSaving(true);
    try {
      const maxSortOrder = questions.length > 0
        ? Math.max(...questions.map(q => q.sortOrder))
        : -1;

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          text: formData.text,
          type: formData.type,
          scaleMax: formData.type === 'SCALED' ? formData.scaleMax : null,
          weight: formData.type === 'SCALED' ? formData.weight : 1,
          category: formData.category || null,
          sortOrder: maxSortOrder + 1,
        }),
      });

      if (res.ok) {
        setShowCreateDialog(false);
        resetForm();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingQuestion || !formData.text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          type: formData.type,
          scaleMax: formData.type === 'SCALED' ? formData.scaleMax : null,
          weight: formData.type === 'SCALED' ? formData.weight : 1,
          category: formData.category || null,
        }),
      });

      if (res.ok) {
        setEditingQuestion(null);
        resetForm();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateScores = async () => {
    setRecalculating(true);
    setRecalcMessage(null);
    try {
      const res = await fetch('/api/scores/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecalcMessage(`${data.updatedCount} juror score${data.updatedCount !== 1 ? 's' : ''} updated.`);
        setTimeout(() => setRecalcMessage(null), 4000);
      } else {
        setRecalcMessage(data.error || 'Failed to recalculate');
      }
    } catch (error) {
      console.error('Failed to recalculate scores:', error);
      setRecalcMessage('Network error');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Delete this question? All responses will also be deleted.')) return;
    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleReorder = async (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === questionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const current = questions[index];
    const swap = questions[swapIndex];

    try {
      await Promise.all([
        fetch(`/api/questions/${current.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: swap.sortOrder }),
        }),
        fetch(`/api/questions/${swap.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      scaleMax: question.scaleMax ?? 5,
      weight: question.weight ?? 1,
      category: question.category ?? '',
    });
  };

  const scaledQuestions = questions.filter(q => q.type === 'SCALED');

  if (loading) {
    return (
      <div className="p-6 dark:bg-slate-950 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-slate-900">Question Bank</h1>
            <p className="text-lg dark:text-slate-400 text-slate-600 mt-1">{caseName}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {scaledQuestions.length > 0 && (
              <button
                onClick={handleRecalculateScores}
                disabled={recalculating}
                className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 transition-colors touch-manipulation"
                title="Recalculate all juror scores using current question weights"
              >
                <RefreshCw className={`w-5 h-5 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculating...' : 'Recalc Scores'}
              </button>
            )}
            {scaledQuestions.length > 0 && (
              <button
                onClick={() => router.push(`/dashboard/questions/scale-mode?caseId=${caseId}`)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 transition-colors touch-manipulation"
              >
                <BarChart3 className="w-5 h-5" />
                Scaled Question Mode
              </button>
            )}
            <button
              onClick={() => router.push(`/dashboard/questions/tracker?caseId=${caseId}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 transition-colors touch-manipulation"
            >
              <MessageSquare className="w-5 h-5" />
              Response Tracker
            </button>
            <button
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Recalculate message */}
      {recalcMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 mb-4 text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {recalcMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-blue-300 text-blue-700">Total Questions</p>
          <p className="text-3xl font-bold dark:text-white text-slate-900">{questions.length}</p>
        </div>
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
          <p className="text-sm dark:text-amber-300 text-amber-700">Scaled Response Options</p>
          <p className="text-sm dark:text-amber-300 text-amber-700 mt-1">3, 4, 5, 6, or 7-point scales</p>
        </div>
      </div>

      {/* Question List */}
      {questions.length === 0 ? (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 dark:text-slate-600 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold dark:text-slate-300 text-slate-700 mb-2">No questions yet</h3>
          <p className="dark:text-slate-500 text-slate-500 mb-6">Add your first voir dire question to get started.</p>
          <button
            onClick={() => { resetForm(); setShowCreateDialog(true); }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-4"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => handleReorder(question.id, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                </button>
                <button
                  onClick={() => handleReorder(question.id, 'down')}
                  disabled={index === questions.length - 1}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                </button>
              </div>

              {/* Question content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium dark:text-slate-400 text-slate-500">
                    Q{index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      question.type === 'SCALED'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        : question.type === 'YES_NO'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {question.type === 'SCALED' ? `Scale 1-${question.scaleMax}` : question.type === 'YES_NO' ? 'Yes / No' : 'Open-Ended'}
                  </span>
                  {question.type === 'SCALED' && question.weight > 1 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {question.weight}x weight
                    </span>
                  )}
                  {question.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {question.category}
                    </span>
                  )}
                </div>
                <p className="dark:text-white text-slate-900 text-base">{question.text}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditDialog(question)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
                  title="Edit question"
                >
                  <Edit2 className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-manipulation"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add Question</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Create a new voir dire question for this case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Question Text
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter your question..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Question Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SCALED' | 'OPEN_ENDED' | 'YES_NO' })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
              >
                <option value="SCALED">Scaled (1-7)</option>
                <option value="YES_NO">Yes / No</option>
                <option value="OPEN_ENDED">Open-Ended</option>
              </select>
            </div>

            {formData.type === 'SCALED' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Scale Max
                  </label>
                  <select
                    value={formData.scaleMax}
                    onChange={(e) => setFormData({ ...formData, scaleMax: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
                  >
                    <option value={3}>1-3</option>
                    <option value={4}>1-4</option>
                    <option value={5}>1-5</option>
                    <option value={6}>1-6</option>
                    <option value={7}>1-7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Weight
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-semibold dark:text-white text-slate-900 min-w-[2rem]">
                      {formData.weight}x
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
              >
                <option value="">Select a category (optional)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowCreateDialog(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !formData.text.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Question'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => { if (!open) setEditingQuestion(null); }}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Question</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Update this voir dire question.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Question Text
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Question Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SCALED' | 'OPEN_ENDED' | 'YES_NO' })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
              >
                <option value="SCALED">Scaled (1-7)</option>
                <option value="YES_NO">Yes / No</option>
                <option value="OPEN_ENDED">Open-Ended</option>
              </select>
            </div>

            {formData.type === 'SCALED' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Scale Max
                  </label>
                  <select
                    value={formData.scaleMax}
                    onChange={(e) => setFormData({ ...formData, scaleMax: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
                  >
                    <option value={3}>1-3</option>
                    <option value={4}>1-4</option>
                    <option value={5}>1-5</option>
                    <option value={6}>1-6</option>
                    <option value={7}>1-7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Weight
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-semibold dark:text-white text-slate-900 min-w-[2rem]">
                      {formData.weight}x
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white bg-white"
              >
                <option value="">Select a category (optional)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setEditingQuestion(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving || !formData.text.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
