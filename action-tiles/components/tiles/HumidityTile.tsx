'use client';

import { TileConfig } from '@/types/tiles';

function HumidityArc({ pct, color }: { pct: number; color: string }) {
  const r = 36;
  const cx = 50;
  const cy = 54;
  const startDeg = 210;
  const sweep = 120;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  const start = pt(startDeg);
  const end   = pt(startDeg + sweep);
  const fill  = pt(startDeg + sweep * (pct / 100));

  const arc = (from: { x: number; y: number }, to: { x: number; y: number }, large: boolean) =>
    `M ${from.x} ${from.y} A ${r} ${r} 0 ${large ? 1 : 0} 1 ${to.x} ${to.y}`;

  const fillLarge = sweep * (pct / 100) > 180;

  const fillColor =
    pct < 30 ? '#f59e0b'
    : pct < 60 ? '#22c55e'
    : '#3b82f6';

  return (
    <svg viewBox="0 0 100 80" className="w-full" style={{ maxHeight: 70 }}>
      <path d={arc(start, end, true)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" strokeLinecap="round" />
      {pct > 0 && (
        <path d={arc(start, fill, fillLarge)} fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="system-ui">
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize="7" opacity="0.55" fontFamily="system-ui">
        humidity
      </text>
      <text x={start.x - 2} y={start.y + 10} textAnchor="middle" fill={color} fontSize="7" opacity="0.4" fontFamily="system-ui">0</text>
      <text x={end.x + 2}   y={end.y + 10}   textAnchor="middle" fill={color} fontSize="7" opacity="0.4" fontFamily="system-ui">100</text>
    </svg>
  );
}

interface Props {
  config: TileConfig;
  color: string;
  onUpdate: (cfg: Partial<TileConfig>) => void;
}

export function HumidityTile({ config, color, onUpdate }: Props) {
  const value = config.humidityValue ?? 45;
  const min   = config.humidityMin   ?? 0;
  const max   = config.humidityMax   ?? 100;

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const comfort =
    value < 30  ? { label: 'Too Dry',     color: '#f59e0b' }
    : value <= 60 ? { label: 'Comfortable', color: '#22c55e' }
    : { label: 'Too Humid',   color: '#3b82f6' };

  const adjust = (d: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ humidityValue: Math.min(max, Math.max(min, value + d)) });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full py-2 px-2">
      <HumidityArc pct={pct} color={color} />

      <span className="text-xs font-semibold" style={{ color: comfort.color }}>
        {comfort.label}
      </span>

      <div className="flex items-center gap-3">
        <button
          onClick={adjust(-1)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
        >
          −
        </button>
        <span className="text-xs opacity-40" style={{ color }}>adjust</span>
        <button
          onClick={adjust(1)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
        >
          +
        </button>
      </div>
    </div>
  );
}
