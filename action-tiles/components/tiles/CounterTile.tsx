'use client';

import { TileConfig } from '@/types/tiles';

interface Props {
  config: TileConfig;
  color: string;
  sublabel?: string;
  onUpdate: (cfg: Partial<TileConfig>) => void;
}

export function CounterTile({ config, color, sublabel, onUpdate }: Props) {
  const { counterValue = 0, counterStep = 1, counterMin = 0, counterMax = 100 } = config;

  const inc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (counterValue + counterStep <= counterMax) onUpdate({ counterValue: counterValue + counterStep });
  };

  const dec = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (counterValue - counterStep >= counterMin) onUpdate({ counterValue: counterValue - counterStep });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
      <div className="text-4xl font-bold tabular-nums leading-none" style={{ color }}>
        {counterValue}
      </div>
      {sublabel && (
        <div className="text-xs font-medium opacity-60" style={{ color }}>
          {sublabel}
        </div>
      )}
      <div className="flex gap-2 mt-1">
        {[{ label: '−', fn: dec, disabled: counterValue - counterStep < counterMin },
          { label: '+', fn: inc, disabled: counterValue + counterStep > counterMax }].map(({ label, fn, disabled }) => (
          <button
            key={label}
            onClick={fn}
            disabled={disabled}
            className="w-9 h-9 rounded-full text-lg font-bold transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.28)', color }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
