'use client';

import { useRef, useState } from 'react';
import { Dashboard, Tile, TileConfig } from '@/types/tiles';
import { SmartThingsClient, STDeviceStatus } from '@/lib/smartthings';
import { TileCard, CELL } from './TileCard';

interface TileGridProps {
  dashboard: Dashboard;
  editMode: boolean;
  /** All live device statuses keyed by deviceId */
  deviceStatus: Record<string, STDeviceStatus>;
  stClient: SmartThingsClient | null;
  onRefreshDevice: (deviceId: string) => Promise<void>;
  onEditTile: (id: string) => void;
  onDeleteTile: (id: string) => void;
  onUpdateTile: (id: string, updates: Partial<Tile>) => void;
  onReorder: (tiles: Tile[]) => void;
  onAddTile: () => void;
}

export function TileGrid({
  dashboard,
  editMode,
  deviceStatus,
  stClient,
  onRefreshDevice,
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
    const toIdx   = tiles.findIndex((t) => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = tiles.splice(fromIdx, 1);
    tiles.splice(toIdx, 0, moved);
    onReorder(tiles.map((t, i) => ({ ...t, order: i })));
  };

  const handleUpdateConfig = (id: string, cfg: Partial<TileConfig>) => {
    const tile = dashboard.tiles.find((t) => t.id === id);
    if (!tile) return;

    // Send thermostat setpoint to SmartThings if linked
    // Send dimmer level to SmartThings if linked
    if (stClient && tile.config.stDeviceId && tile.type === 'dimmer') {
      const deviceId = tile.config.stDeviceId;
      if ('dimmerLevel' in cfg && typeof cfg.dimmerLevel === 'number') {
        stClient.setLevel(deviceId, cfg.dimmerLevel)
          .then(() => onRefreshDevice(deviceId))
          .catch(console.error);
      }
    }

    if (stClient && tile.config.stDeviceId && tile.type === 'thermostat') {
      const deviceId = tile.config.stDeviceId;
      const mode = tile.config.thermostatMode ?? 'heat';
      if ('thermostatSetpoint' in cfg && typeof cfg.thermostatSetpoint === 'number') {
        const fn = mode === 'cool'
          ? stClient.setCoolingSetpoint(deviceId, cfg.thermostatSetpoint)
          : stClient.setHeatingSetpoint(deviceId, cfg.thermostatSetpoint);
        fn.then(() => onRefreshDevice(deviceId)).catch(console.error);
      }
      if ('thermostatMode' in cfg && typeof cfg.thermostatMode === 'string') {
        stClient.setThermostatMode(deviceId, cfg.thermostatMode)
          .then(() => onRefreshDevice(deviceId))
          .catch(console.error);
      }
    }

    onUpdateTile(id, { config: { ...tile.config, ...cfg } });
  };

  const handleToggle = (id: string, v: boolean) => {
    const tile = dashboard.tiles.find((t) => t.id === id);
    if (!tile) return;

    // Send switch / dimmer on-off command to SmartThings if linked
    if (stClient && tile.config.stDeviceId) {
      const deviceId = tile.config.stDeviceId;
      const fn = v ? stClient.switchOn(deviceId) : stClient.switchOff(deviceId);
      fn.then(() => onRefreshDevice(deviceId)).catch(console.error);
    }

    if (tile.type === 'dimmer') {
      onUpdateTile(id, { config: { ...tile.config, dimmerOn: v } });
    } else {
      onUpdateTile(id, { config: { ...tile.config, toggleState: v } });
    }
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
          stStatus={tile.config.stDeviceId ? deviceStatus[tile.config.stDeviceId] : undefined}
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
