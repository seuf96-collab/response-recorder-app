'use client';

import { TileConfig } from '@/types/tiles';

export function MediaTile({ config, color }: { config: TileConfig; color: string }) {
  const { mediaSrc = '', mediaAlt = '', mediaType = 'image' } = config;

  if (!mediaSrc) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-xs opacity-50" style={{ color }}>
        <span className="text-2xl">🖼️</span>
        <span>No media URL</span>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <video src={mediaSrc} className="w-full h-full object-cover" autoPlay muted loop playsInline />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaSrc} alt={mediaAlt} className="w-full h-full object-cover" />
  );
}
