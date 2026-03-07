'use client';

import { useState } from 'react';
import { useTileStore } from '@/hooks/useTileStore';
import { TileGrid } from '@/components/tiles/TileGrid';
import { TileEditor } from '@/components/tiles/TileEditor';
import { DashboardManager } from '@/components/tiles/DashboardManager';
import { Tile } from '@/types/tiles';

export default function Home() {
  const {
    dashboards,
    activeDashboard,
    activeDashboardId,
    setActiveDashboardId,
    editMode,
    setEditMode,
    loaded,
    createDashboard,
    renameDashboard,
    deleteDashboard,
    addTile,
    updateTile,
    deleteTile,
    reorderTiles,
  } = useTileStore();

  const [editorTileId, setEditorTileId] = useState<string | null>(null);   // tile id to edit, or '__new__'
  const [showDashManager, setShowDashManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  const editingTile = editorTileId && editorTileId !== '__new__'
    ? activeDashboard?.tiles.find((t) => t.id === editorTileId) ?? null
    : null;

  const handleSave = (
    draft: Omit<Tile, 'id' | 'order'>,
    existingId?: string
  ) => {
    if (existingId) {
      updateTile(activeDashboardId, existingId, { ...draft });
    } else {
      const id = addTile(draft.type);
      // Apply the rest of the draft fields
      updateTile(activeDashboardId, id, {
        label: draft.label,
        sublabel: draft.sublabel,
        icon: draft.icon,
        color: draft.color,
        bgColor: draft.bgColor,
        size: draft.size,
        config: draft.config,
      });
    }
    setEditorTileId(null);
  };

  const bg = activeDashboard?.bgColor ?? '#0f172a';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-black/30 backdrop-blur-sm border-b border-white/5 shrink-0">
        {/* Logo / App name */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-xl">⊞</span>
          <span className="text-white font-bold text-sm hidden sm:block tracking-tight">Action Tiles</span>
        </div>

        {/* Dashboard selector */}
        <button
          onClick={() => setShowDashManager(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all max-w-[200px]"
        >
          <span className="truncate">{activeDashboard?.name ?? 'Dashboard'}</span>
          <span className="opacity-50 text-xs">▾</span>
        </button>

        <div className="flex-1" />

        {/* Settings (edit mode: column + gap) */}
        {editMode && (
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
          >
            ⚙️ Settings
          </button>
        )}

        {/* Edit toggle */}
        <button
          onClick={() => setEditMode((m) => !m)}
          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
            editMode
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-white/10 hover:bg-white/15 text-white'
          }`}
        >
          {editMode ? '✓ Done' : '✏️ Edit'}
        </button>
      </header>

      {/* Dashboard settings bar (visible in edit mode) */}
      {editMode && showSettings && activeDashboard && (
        <SettingsBar dashboard={activeDashboard} onChange={() => {}} />
      )}

      {/* Edit mode banner */}
      {editMode && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-medium">
          <span>✏️ Edit mode — click tiles to edit, drag to reorder, + to add new</span>
        </div>
      )}

      {/* Tile grid */}
      <main className="flex-1 overflow-auto">
        {activeDashboard ? (
          <TileGrid
            dashboard={activeDashboard}
            editMode={editMode}
            onEditTile={(id) => setEditorTileId(id)}
            onDeleteTile={(id) => deleteTile(activeDashboardId, id)}
            onUpdateTile={(id, updates) => updateTile(activeDashboardId, id, updates)}
            onReorder={(tiles) => reorderTiles(activeDashboardId, tiles)}
            onAddTile={() => setEditorTileId('__new__')}
          />
        ) : (
          <EmptyState onEdit={() => setEditMode(true)} />
        )}
      </main>

      {/* Modals */}
      {editorTileId !== null && (
        <TileEditor
          tile={editingTile}
          onSave={handleSave}
          onClose={() => setEditorTileId(null)}
        />
      )}

      {showDashManager && (
        <DashboardManager
          dashboards={dashboards}
          activeDashboardId={activeDashboardId}
          onSelect={setActiveDashboardId}
          onCreate={createDashboard}
          onRename={renameDashboard}
          onDelete={deleteDashboard}
          onClose={() => setShowDashManager(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <span className="text-5xl">⊞</span>
      <div>
        <p className="text-white font-semibold text-lg">No tiles yet</p>
        <p className="text-slate-400 text-sm mt-1">Enter edit mode and add your first tile</p>
      </div>
      <button
        onClick={onEdit}
        className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
      >
        ✏️ Enter Edit Mode
      </button>
    </div>
  );
}

function SettingsBar({ dashboard }: { dashboard: { columns: number; gap: number; bgColor: string }; onChange: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-black/20 text-slate-300 text-xs border-b border-white/5 flex-wrap">
      <span className="font-semibold text-slate-400">Dashboard settings:</span>
      <span>Columns: <strong className="text-white">{dashboard.columns}</strong></span>
      <span>Gap: <strong className="text-white">{dashboard.gap}px</strong></span>
      <span>
        BG:
        <span
          className="inline-block w-4 h-4 rounded ml-1 align-middle border border-white/20"
          style={{ backgroundColor: dashboard.bgColor }}
        />
      </span>
    </div>
  );
}
