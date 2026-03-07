'use client';

import { useState } from 'react';
import { Dashboard } from '@/types/tiles';

interface Props {
  dashboards: Dashboard[];
  activeDashboardId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function DashboardManager({
  dashboards,
  activeDashboardId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    const name = newName.trim() || 'New Dashboard';
    onCreate(name);
    setNewName('');
  };

  const startEdit = (d: Dashboard) => {
    setEditingId(d.id);
    setEditName(d.name);
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <h2 className="text-white font-bold text-base">Dashboards</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white/70 hover:text-white transition-all flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-3">
          {dashboards.map((d) => (
            <div
              key={d.id}
              className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                d.id === activeDashboardId
                  ? 'bg-blue-600/20 border border-blue-500/50'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {editingId === d.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 bg-slate-700 border border-slate-500 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              ) : (
                <button
                  className="flex-1 text-left text-white text-sm font-medium"
                  onClick={() => { onSelect(d.id); onClose(); }}
                >
                  {d.name}
                  {d.id === activeDashboardId && (
                    <span className="ml-2 text-xs text-blue-400">active</span>
                  )}
                </button>
              )}

              <button
                onClick={() => startEdit(d)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-all text-xs"
                title="Rename"
              >
                ✏️
              </button>

              {dashboards.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`Delete "${d.name}"?`)) onDelete(d.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/30 transition-all text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}

          {/* Create new */}
          <div className="flex gap-2 pt-2 border-t border-slate-700/60">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="New dashboard name..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
