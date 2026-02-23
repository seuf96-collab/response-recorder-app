'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  User,
  Star,
  MessageSquare,
  Trash2,
  Plus,
  AlertTriangle,
  Gavel,
} from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Case {
  id: string;
  name: string;
  stateStrikesTotal: number;
  stateStrikesUsed: number;
  defenseStrikesTotal: number;
  defenseStrikesUsed: number;
}

interface Juror {
  id: string;
  name: string;
  seatNumber: string;
  age?: number | null;
  gender?: string | null;
  occupation?: string | null;
  employer?: string | null;
  educationLevel?: string | null;
  maritalStatus?: string | null;
  numberOfChildren?: number | null;
  childrenAges?: string | null;
  zipCode?: string | null;
  neighborhood?: string | null;
  score: number;
  tag: string;
  status: string;
  forCause: boolean;
  notes: Note[];
  case: Case;
}

interface Props {
  juror: Juror;
}

const tagColors = {
  FAVORABLE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Favorable' },
  UNFAVORABLE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unfavorable' },
  NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Neutral' },
  STRIKE_CANDIDATE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Strike Candidate' },
  CAUSE_CHALLENGE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Cause Challenge' },
};

export default function JurorDetailClient({ juror: initialJuror }: Props) {
  const router = useRouter();
  const [juror, setJuror] = useState(initialJuror);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [forCauseLoading, setForCauseLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: juror?.name ?? '',
    seatNumber: juror?.seatNumber ?? '',
    age: juror?.age?.toString() ?? '',
    gender: juror?.gender ?? '',
    occupation: juror?.occupation ?? '',
    employer: juror?.employer ?? '',
    educationLevel: juror?.educationLevel ?? '',
    maritalStatus: juror?.maritalStatus ?? '',
    numberOfChildren: juror?.numberOfChildren?.toString() ?? '',
    childrenAges: juror?.childrenAges ?? '',
    zipCode: juror?.zipCode ?? '',
    neighborhood: juror?.neighborhood ?? '',
    score: juror?.score ?? 3,
    tag: juror?.tag ?? 'NEUTRAL',
    status: juror?.status ?? 'ACTIVE',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/jurors/${juror?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: formData.age ? parseInt(formData.age) : null,
          numberOfChildren: formData.numberOfChildren ? parseInt(formData.numberOfChildren) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJuror(data?.juror ?? juror);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save juror:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurorId: juror?.id,
          content: newNote,
        }),
      });

      if (res.ok) {
        router.refresh();
        setNewNote('');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Update strike counters if status changes involve strikes
    const oldStatus = juror?.status;
    let stateStrikesUsed = juror?.case?.stateStrikesUsed ?? 0;
    let defenseStrikesUsed = juror?.case?.defenseStrikesUsed ?? 0;

    // Decrement old status strike counter
    if (oldStatus === 'STRUCK_BY_STATE') stateStrikesUsed--;
    if (oldStatus === 'STRUCK_BY_DEFENSE') defenseStrikesUsed--;

    // Increment new status strike counter
    if (newStatus === 'STRUCK_BY_STATE') stateStrikesUsed++;
    if (newStatus === 'STRUCK_BY_DEFENSE') defenseStrikesUsed++;

    try {
      // Update juror status
      const jurorRes = await fetch(`/api/jurors/${juror?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      // Update case strike counters
      const caseRes = await fetch(`/api/cases/${juror?.case?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stateStrikesUsed, defenseStrikesUsed }),
      });

      if (jurorRes.ok && caseRes.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleToggleForCause = async () => {
    const newValue = !juror.forCause;
    setForCauseLoading(true);
    try {
      const res = await fetch(`/api/jurors/${juror?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forCause: newValue }),
      });

      if (res.ok) {
        setJuror({ ...juror, forCause: newValue });
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update for-cause status:', error);
    } finally {
      setForCauseLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete juror ${juror?.name}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/jurors/${juror?.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete juror:', error);
    }
  };

  const tagColor = tagColors[juror?.tag as keyof typeof tagColors] ?? tagColors.NEUTRAL;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Juror List
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`${tagColor?.bg ?? 'bg-gray-100'} p-4 rounded-full`}>
              <User className={`w-8 h-8 ${tagColor?.text ?? 'text-gray-700'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{juror?.name}</h1>
              <p className="text-lg text-slate-600">Seat {juror?.seatNumber}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: juror?.name ?? '',
                      seatNumber: juror?.seatNumber ?? '',
                      age: juror?.age?.toString() ?? '',
                      gender: juror?.gender ?? '',
                      occupation: juror?.occupation ?? '',
                      employer: juror?.employer ?? '',
                      educationLevel: juror?.educationLevel ?? '',
                      maritalStatus: juror?.maritalStatus ?? '',
                      numberOfChildren: juror?.numberOfChildren?.toString() ?? '',
                      childrenAges: juror?.childrenAges ?? '',
                      zipCode: juror?.zipCode ?? '',
                      neighborhood: juror?.neighborhood ?? '',
                      score: juror?.score ?? 3,
                      tag: juror?.tag ?? 'NEUTRAL',
                      status: juror?.status ?? 'ACTIVE',
                    });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Profile Information</h2>

            <div className="grid grid-cols-2 gap-4">
              {editing ? (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seat Number</label>
                    <input
                      type="text"
                      value={formData.seatNumber}
                      onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Employer</label>
                    <input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Education</label>
                    <select
                      value={formData.educationLevel}
                      onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="Less than High School">Less than High School</option>
                      <option value="High School Diploma">High School Diploma</option>
                      <option value="Some College">Some College</option>
                      <option value="Associate's Degree">Associate's Degree</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Juris Doctor">Juris Doctor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Marital Status</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Number of Children</label>
                    <input
                      type="number"
                      value={formData.numberOfChildren}
                      onChange={(e) => setFormData({ ...formData, numberOfChildren: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Children Ages</label>
                    <input
                      type="text"
                      value={formData.childrenAges}
                      onChange={(e) => setFormData({ ...formData, childrenAges: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Neighborhood</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="Age" value={juror?.age?.toString()} />
                  <InfoField label="Gender" value={juror?.gender} />
                  <InfoField label="Occupation" value={juror?.occupation} />
                  <InfoField label="Employer" value={juror?.employer} />
                  <InfoField label="Education" value={juror?.educationLevel} />
                  <InfoField label="Marital Status" value={juror?.maritalStatus} />
                  <InfoField label="Number of Children" value={juror?.numberOfChildren?.toString()} />
                  <InfoField label="Children Ages" value={juror?.childrenAges} />
                  <InfoField label="Zip Code" value={juror?.zipCode} />
                  <InfoField label="Neighborhood" value={juror?.neighborhood} />
                </>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Notes
            </h2>

            {/* Add Note */}
            <div className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this juror..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {juror?.notes?.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No notes yet</p>
              ) : (
                juror?.notes?.map?.((note) => (
                  <div key={note?.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-slate-800 mb-2">{note?.content}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{format(new Date(note?.createdAt ?? ''), 'MMM d, yyyy h:mm a')}</span>
                      <button
                        onClick={() => handleDeleteNote(note?.id ?? '')}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )) ?? null
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Tags, Score, Status */}
        <div className="space-y-6">
          {/* Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Favorability Score
            </h3>
            {editing ? (
              <div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <p className="text-center mt-3">
                  <span className="text-3xl font-bold text-amber-600">{formData.score}</span>
                  <span className="text-sm text-slate-600 ml-2">/ 5</span>
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-amber-100 px-6 py-3 rounded-full">
                  <Star className="w-8 h-8 text-amber-600 fill-amber-600" />
                  <span className="text-4xl font-bold text-amber-700">{juror?.score}</span>
                  <span className="text-lg text-amber-600">/ 5</span>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {juror?.score === 1 && 'Very Unfavorable'}
                  {juror?.score === 2 && 'Unfavorable'}
                  {juror?.score === 3 && 'Neutral'}
                  {juror?.score === 4 && 'Favorable'}
                  {juror?.score === 5 && 'Very Favorable'}
                </p>
              </div>
            )}
          </div>

          {/* Tag */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tag</h3>
            {editing ? (
              <select
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="FAVORABLE">Favorable</option>
                <option value="UNFAVORABLE">Unfavorable</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="STRIKE_CANDIDATE">Strike Candidate</option>
                <option value="CAUSE_CHALLENGE">Cause Challenge</option>
              </select>
            ) : (
              <span className={`inline-block ${tagColor?.bg ?? 'bg-gray-100'} ${tagColor?.text ?? 'text-gray-700'} px-4 py-2 rounded-lg text-sm font-semibold w-full text-center`}>
                {tagColor?.label ?? 'Neutral'}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Juror Status
            </h3>
            <select
              value={juror?.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="ACTIVE">Active</option>
              <option value="STRUCK_BY_STATE">Struck by State</option>
              <option value="STRUCK_BY_DEFENSE">Struck by Defense</option>
              <option value="STRUCK_FOR_CAUSE">Struck for Cause</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          {/* Likely For Cause */}
          {juror?.status === 'ACTIVE' && (
            <div className={`rounded-lg shadow-md p-6 border-2 transition-all ${
              juror.forCause
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-400 dark:border-amber-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Gavel className={`w-5 h-5 ${juror.forCause ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                Likely For Cause
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Mark this juror as likely to be struck for cause. They will be removed from the strike zone calculations but remain on the panel until officially struck.
              </p>
              {juror.forCause && (
                <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    This juror is excluded from strike zone calculations
                  </p>
                </div>
              )}
              <button
                onClick={handleToggleForCause}
                disabled={forCauseLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation ${
                  juror.forCause
                    ? 'bg-slate-600 hover:bg-slate-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                } ${forCauseLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Gavel className="w-4 h-4" />
                {forCauseLoading
                  ? 'Updating...'
                  : juror.forCause
                    ? 'Remove Likely For Cause'
                    : 'Mark as Likely For Cause'
                }
              </button>
            </div>
          )}

          {/* Case Info */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg shadow-md p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Case</h3>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{juror?.case?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
      <p className="text-slate-900">{value || '—'}</p>
    </div>
  );
}
