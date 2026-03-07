'use client';

import { useRef, useState } from 'react';
import { Dashboard, Tile, TileConfig } from '@/types/tiles';
import { TileCard, CELL } from './TileCard';

interface TileGridProps {
  dashboard: Dashboard;
  editMode: boolean;
  onEditTile: (id: string) => void;
  onDeleteTile: (id: string) => void;
  onUpdateTile: (id: string, updates: Partial<Tile>) => void;
  onReorder: (tiles: Tile[]) => void;
  onAddTile: () => void;
}

export function TileGrid({
  dashboard,
  editMode,
  onEditTile,
  onDeleteTile,
  onUpdateTile,
  onReorder,
  onAddTile,
}: TileGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const overIdRef = useRef<string | null>(null);

  const handleDrop = (targetId: string) => {
    const fromId = draggingId;
    setDraggingId(null);
    if (!fromId || fromId === targetId) return;
    const tiles = [...dashboard.tiles];
    const fromIdx = tiles.findIndex((t) => t.id === fromId);
    const toIdx = tiles.findIndex((t) => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = tiles.splice(fromIdx, 1);
    tiles.splice(toIdx, 0, moved);
    onReorder(tiles.map((t, i) => ({ ...t, order: i })));
  };

  const handleUpdateConfig = (id: string, cfg: Partial<TileConfig>) => {
    const tile = dashboard.tiles.find((t) => t.id === id);
    if (!tile) return;
    onUpdateTile(id, { config: { ...tile.config, ...cfg } });
  };

  const handleToggle = (id: string, v: boolean) => {
    const tile = dashboard.tiles.find((t) => t.id === id);
    if (!tile) return;
    onUpdateTile(id, { config: { ...tile.config, toggleState: v } });
  };

  const sorted = [...dashboard.tiles].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex flex-wrap content-start"
      style={{ gap: dashboard.gap, padding: 16 }}
    >
      {sorted.map((tile) => (
        <TileCard
          key={tile.id}
          tile={tile}
          gap={dashboard.gap}
          editMode={editMode}
          onEdit={() => onEditTile(tile.id)}
          onDelete={() => onDeleteTile(tile.id)}
          onUpdateConfig={(cfg) => handleUpdateConfig(tile.id, cfg)}
          onToggle={(v) => handleToggle(tile.id, v)}
          isDragging={draggingId === tile.id}
          onDragStart={() => setDraggingId(tile.id)}
          onDragOver={(e) => { e.preventDefault(); overIdRef.current = tile.id; }}
          onDrop={(e) => { e.preventDefault(); handleDrop(tile.id); }}
        />
      ))}

      {/* Add tile button (edit mode) */}
      {editMode && (
        <button
          onClick={onAddTile}
          className="rounded-2xl border-2 border-dashed border-white/20 hover:border-white/50 flex items-center justify-center text-white/40 hover:text-white/70 transition-all hover:scale-[1.03] active:scale-95"
          style={{ width: CELL, height: CELL }}
        >
          <span className="text-4xl leading-none">+</span>
        </button>
      )}
    </div>
  );
}
