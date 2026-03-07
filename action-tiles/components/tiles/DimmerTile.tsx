'use client';

import { TileConfig } from '@/types/tiles';
import { STDeviceStatus, SmartThingsClient } from '@/lib/smartthings';

interface Props {
  config: TileConfig;
  color: string;
  stStatus?: STDeviceStatus;
  onUpdate: (cfg: Partial<TileConfig>) => void;
  onToggle: (v: boolean) => void;
}

export function DimmerTile({ config, color, stStatus, onUpdate, onToggle }: Props) {
  const liveLevel  = stStatus ? SmartThingsClient.getLevel(stStatus)         : null;
  const liveOn     = stStatus ? SmartThingsClient.getSwitchLevelOn(stStatus)  : null;
  const hasLive    = liveLevel !== null;

  const level = liveLevel ?? config.dimmerLevel ?? 50;
  const isOn  = liveOn   ?? config.dimmerOn     ?? false;

  // Clamp to 1–100; 0 means off
  const setLevel = (v: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.min(100, Math.max(1, level + v));
    onUpdate({ dimmerLevel: next, dimmerOn: true });
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(!isOn);
  };

  // Arc percentage for display
  const pct = isOn ? level / 100 : 0;
  const arcColor = isOn
    ? level > 66 ? '#fbbf24' : level > 33 ? '#fb923c' : '#f97316'
    : 'rgba(255,255,255,0.2)';

  // SVG arc math (same pattern as humidity)
  const r = 32, cx = 50, cy = 52, startDeg = 210, sweep = 120;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (deg: number) => ({ x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) });
  const start = pt(startDeg);
  const end   = pt(startDeg + sweep);
  const fillPt = pt(startDeg + sweep * pct);
  const arc = (from: { x: number; y: number }, to: { x: number; y: number }, large: boolean) =>
    `M ${from.x} ${from.y} A ${r} ${r} 0 ${large ? 1 : 0} 1 ${to.x} ${to.y}`;
  const fillLarge = sweep * pct > 180;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full py-2 px-2 select-none">
      {/* Arc brightness gauge */}
      <svg viewBox="0 0 100 72" className="w-full" style={{ maxHeight: 64 }}>
        {/* Track */}
        <path d={arc(start, end, true)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7" strokeLinecap="round" />
        {/* Fill */}
        {pct > 0 && (
          <path d={arc(start, fillPt, fillLarge)} fill="none" stroke={arcColor} strokeWidth="7" strokeLinecap="round" />
        )}
        {/* Center label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="15" fontWeight="bold" fontFamily="system-ui">
          {isOn ? `${level}%` : '—'}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize="7" opacity="0.45" fontFamily="system-ui">
          {isOn ? 'brightness' : 'off'}
        </text>
      </svg>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {/* Dim down */}
        <button
          onClick={setLevel(-10)}
          disabled={!isOn || level <= 1}
          className="w-7 h-7 rounded-full text-sm font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
          title="Dim −10%"
        >
          −
        </button>
        <button
          onClick={setLevel(-1)}
          disabled={!isOn || level <= 1}
          className="w-6 h-6 rounded-full text-xs font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', color }}
          title="Dim −1%"
        >
          ‹
        </button>

        {/* On/Off toggle */}
        <button
          onClick={toggle}
          className="mx-1 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: isOn ? arcColor : 'rgba(255,255,255,0.12)',
            color: isOn ? '#000' : color,
          }}
        >
          {isOn ? 'ON' : 'OFF'}
        </button>

        {/* Brighten */}
        <button
          onClick={setLevel(1)}
          disabled={!isOn || level >= 100}
          className="w-6 h-6 rounded-full text-xs font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', color }}
          title="Brighten +1%"
        >
          ›
        </button>
        <button
          onClick={setLevel(10)}
          disabled={!isOn || level >= 100}
          className="w-7 h-7 rounded-full text-sm font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
          title="Brighten +10%"
        >
          +
        </button>
      </div>

      {hasLive && (
        <span className="text-[10px] opacity-40" style={{ color }}>● live</span>
      )}
    </div>
  );
}
