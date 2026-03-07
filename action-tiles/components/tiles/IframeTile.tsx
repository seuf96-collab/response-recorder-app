'use client';

import { TileConfig } from '@/types/tiles';

export function IframeTile({ config, color }: { config: TileConfig; color: string }) {
  const { iframeSrc = '' } = config;
  if (!iframeSrc) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-xs opacity-50" style={{ color }}>
        <span className="text-2xl">🌐</span>
        <span>No URL set</span>
      </div>
    );
  }
  return (
    <div className="w-full h-full overflow-hidden">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="Embedded content"
      />
    </div>
  );
}
