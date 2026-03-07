'use client';

import { TileConfig } from '@/types/tiles';

interface Props {
  config: TileConfig;
  color: string;
  onToggle: (v: boolean) => void;
}

export function ToggleTile({ config, color, onToggle }: Props) {
  const { toggleState = false, toggleOnLabel = 'ON', toggleOffLabel = 'OFF' } = config;

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(!toggleState); }}
        role="switch"
        aria-checked={toggleState}
        className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40"
        style={{ backgroundColor: toggleState ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.35)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300"
          style={{
            backgroundColor: toggleState ? '#15803d' : '#6b7280',
            transform: toggleState ? 'translateX(28px)' : 'translateX(0)',
          }}
        />
      </button>
      <span className="text-xs font-bold tracking-widest uppercase opacity-90" style={{ color }}>
        {toggleState ? toggleOnLabel : toggleOffLabel}
      </span>
    </div>
  );
}
