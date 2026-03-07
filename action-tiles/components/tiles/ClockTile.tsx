'use client';

import { useEffect, useState } from 'react';
import { TileConfig } from '@/types/tiles';

export function ClockTile({ config, color }: { config: TileConfig; color: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const { clockFormat = '12h', clockShowSeconds = true, clockShowDate = true } = config;

  const rawHours = now.getHours();
  const hours = clockFormat === '12h' ? rawHours % 12 || 12 : rawHours;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = clockFormat === '12h' ? (rawHours >= 12 ? 'PM' : 'AM') : '';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-1 px-2">
      <div className="flex items-end gap-1" style={{ color }}>
        <span className="text-4xl font-bold tabular-nums leading-none">
          {hours.toString().padStart(2, '0')}:{minutes}
        </span>
        {clockShowSeconds && (
          <span className="text-xl font-semibold tabular-nums leading-none mb-1 opacity-75">
            :{seconds}
          </span>
        )}
        {ampm && (
          <span className="text-sm font-semibold leading-none mb-1 opacity-60">{ampm}</span>
        )}
      </div>
      {clockShowDate && (
        <div className="text-xs font-medium opacity-60" style={{ color }}>
          {dateStr}
        </div>
      )}
    </div>
  );
}
