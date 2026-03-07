'use client';

import { STDevice, filterDevicesForTileType } from '@/lib/smartthings';
import { TileType, STConnectionStatus } from '@/types/tiles';

interface Props {
  tileType: TileType;
  devices: STDevice[];
  connectionStatus: STConnectionStatus;
  selectedDeviceId: string;
  onChange: (deviceId: string) => void;
  onOpenSettings: () => void;
}

export function SmartThingsDevicePicker({
  tileType,
  devices,
  connectionStatus,
  selectedDeviceId,
  onChange,
  onOpenSettings,
}: Props) {
  const compatible = filterDevicesForTileType(devices, tileType);
  const isConnected = connectionStatus === 'connected';

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
          <span className="text-slate-400 text-xs">SmartThings not connected</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
        >
          Connect →
        </button>
      </div>
    );
  }

  if (compatible.length === 0) {
    return (
      <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-400 text-xs">
        No compatible SmartThings devices found for this tile type.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <select
        value={selectedDeviceId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
      >
        <option value="">— No device linked —</option>
        {compatible.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || d.name}
          </option>
        ))}
      </select>
      {selectedDeviceId && (
        <p className="text-xs text-slate-500 font-mono px-1">
          ID: {selectedDeviceId}
        </p>
      )}
    </div>
  );
}
