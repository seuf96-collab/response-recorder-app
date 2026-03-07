'use client';

import { TileConfig } from '@/types/tiles';

export function TextTile({ config, color }: { config: TileConfig; color: string }) {
  const { textContent = '', textAlign = 'center' } = config;
  return (
    <div className="flex items-center justify-center w-full h-full px-3">
      <p
        className="text-sm font-medium leading-snug break-words w-full"
        style={{ color, textAlign }}
      >
        {textContent}
      </p>
    </div>
  );
}
