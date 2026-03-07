'use client';

import { useState } from 'react';
import { Tile, TileConfig, TILE_SIZE_SPANS } from '@/types/tiles';
import { ClockTile } from './ClockTile';
import { ToggleTile } from './ToggleTile';
import { CounterTile } from './CounterTile';
import { TextTile } from './TextTile';
import { IframeTile } from './IframeTile';
import { MediaTile } from './MediaTile';
import { ThermostatTile } from './ThermostatTile';
import { HumidityTile } from './HumidityTile';

const CELL = 110; // px per grid cell

interface TileCardProps {
  tile: Tile;
  gap: number;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateConfig: (cfg: Partial<TileConfig>) => void;
  onToggle: (v: boolean) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function TileCard({
  tile,
  gap,
  editMode,
  onEdit,
  onDelete,
  onUpdateConfig,
  onToggle,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: TileCardProps) {
  const [pressing, setPressing] = useState(false);
  const span = TILE_SIZE_SPANS[tile.size];
  const w = span.cols * CELL + (span.cols - 1) * gap;
  const h = span.rows * CELL + (span.rows - 1) * gap;

  const isButton = tile.type === 'button';
  const isLink = tile.type === 'link';
  const isSimple = isButton || isLink;

  const handleClick = () => {
    if (editMode) { onEdit(); return; }
    if (isButton) {
      setPressing(true);
      setTimeout(() => setPressing(false), 200);
    }
    if (isLink && tile.config.linkUrl) {
      window.open(tile.config.linkUrl, tile.config.linkTarget ?? '_blank');
    }
  };

  const showHeader = !['clock', 'text', 'iframe', 'media', 'thermostat', 'humidity'].includes(tile.type);

  const renderBody = () => {
    if (isSimple) return null;
    switch (tile.type) {
      case 'clock':   return <ClockTile config={tile.config} color={tile.color} />;
      case 'toggle':  return <ToggleTile config={tile.config} color={tile.color} onToggle={onToggle} />;
      case 'counter': return <CounterTile config={tile.config} color={tile.color} sublabel={tile.sublabel} onUpdate={onUpdateConfig} />;
      case 'text':    return <TextTile config={tile.config} color={tile.color} />;
      case 'iframe':     return <IframeTile config={tile.config} color={tile.color} />;
      case 'media':      return <MediaTile config={tile.config} color={tile.color} />;
      case 'thermostat': return <ThermostatTile config={tile.config} color={tile.color} label={tile.label} onUpdate={onUpdateConfig} />;
      case 'humidity':   return <HumidityTile config={tile.config} color={tile.color} onUpdate={onUpdateConfig} />;
      default:           return null;
    }
  };

  return (
    <div
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleClick}
      className="relative rounded-2xl overflow-hidden flex flex-col select-none transition-all duration-150"
      style={{
        width: w,
        height: h,
        backgroundColor: tile.bgColor,
        opacity: isDragging ? 0.35 : 1,
        transform: pressing ? 'scale(0.93)' : 'scale(1)',
        cursor: editMode ? 'grab' : isSimple ? 'pointer' : 'default',
        boxShadow: editMode
          ? '0 0 0 2px rgba(255,255,255,0.25), 0 6px 20px rgba(0,0,0,0.5)'
          : '0 2px 10px rgba(0,0,0,0.35)',
      }}
    >
      {/* Edit ring */}
      {editMode && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 pointer-events-none z-10" />
      )}

      {/* Delete button */}
      {editMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-lg transition-all hover:scale-110"
        >
          ×
        </button>
      )}

      {/* Drag dots */}
      {editMode && (
        <div className="absolute top-2 left-2 z-20 opacity-50 cursor-grab pointer-events-none">
          <svg width="10" height="10" viewBox="0 0 10 10" fill={tile.color}>
            {[2, 8].flatMap((x) => [2, 8].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />
            )))}
          </svg>
        </div>
      )}

      {/* Simple tile (button / link) */}
      {isSimple && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2 px-3 text-center">
          {tile.icon && <span className="text-3xl leading-none">{tile.icon}</span>}
          <span className="text-sm font-bold leading-tight" style={{ color: tile.color }}>
            {tile.label}
          </span>
          {tile.sublabel && (
            <span className="text-xs opacity-60" style={{ color: tile.color }}>{tile.sublabel}</span>
          )}
          {isLink && tile.config.linkUrl && (
            <span className="text-xs opacity-40 truncate max-w-full" style={{ color: tile.color }}>
              {tile.config.linkUrl.replace(/^https?:\/\//, '').split('/')[0]}
            </span>
          )}
        </div>
      )}

      {/* Complex tile: header + body */}
      {!isSimple && (
        <>
          {showHeader && (
            <div className="flex flex-col items-center pt-3 px-2 gap-0.5 shrink-0">
              {tile.icon && <span className="text-xl leading-none">{tile.icon}</span>}
              <span className="text-xs font-semibold text-center leading-tight truncate max-w-full" style={{ color: tile.color }}>
                {tile.label}
              </span>
              {!['counter', 'thermostat', 'humidity'].includes(tile.type) && tile.sublabel && (
                <span className="text-xs opacity-60 text-center" style={{ color: tile.color }}>{tile.sublabel}</span>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0">
            {renderBody()}
          </div>
        </>
      )}
    </div>
  );
}

export { CELL };
