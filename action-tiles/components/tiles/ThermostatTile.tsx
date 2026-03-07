'use client';

import { TileConfig, ThermostatMode } from '@/types/tiles';

const MODE_COLORS: Record<ThermostatMode, { bg: string; label: string; icon: string }> = {
  heat: { bg: '#c2410c', label: 'Heating', icon: '🔥' },
  cool: { bg: '#0284c7', label: 'Cooling', icon: '❄️' },
  auto: { bg: '#7c3aed', label: 'Auto',    icon: '♻️' },
  off:  { bg: '#374151', label: 'Off',     icon: '○'  },
};

const MODES: ThermostatMode[] = ['heat', 'cool', 'auto', 'off'];

interface Props {
  config: TileConfig;
  color: string;
  label: string;
  onUpdate: (cfg: Partial<TileConfig>) => void;
}

export function ThermostatTile({ config, color, onUpdate }: Props) {
  const currentTemp = config.thermostatCurrentTemp ?? 72;
  const setpoint    = config.thermostatSetpoint    ?? 70;
  const mode        = config.thermostatMode        ?? 'heat';
  const unit        = config.thermostatUnit        ?? '°F';
  const isActive    = config.thermostatIsActive    ?? false;

  const modeInfo = MODE_COLORS[mode];

  const adjustSetpoint = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ thermostatSetpoint: setpoint + delta });
  };

  const cycleMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    onUpdate({ thermostatMode: next });
  };

  const diff = currentTemp - setpoint;
  const statusText =
    mode === 'off'   ? 'Off'
    : isActive       ? modeInfo.label
    : diff > 1       ? (mode === 'cool' ? 'Cooling soon' : 'Idle')
    : diff < -1      ? (mode === 'heat' ? 'Heating soon' : 'Idle')
    : 'At target';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full px-3 py-3 select-none">
      {/* Current temp */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums leading-none" style={{ color }}>
          {currentTemp}{unit}
        </span>
        <span className="text-xs opacity-50 mt-0.5" style={{ color }}>Current</span>
      </div>

      {/* Setpoint +/- */}
      <div className="flex items-center gap-2">
        <button
          onClick={adjustSetpoint(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
        >
          −
        </button>
        <div className="flex flex-col items-center min-w-[52px]">
          <span className="text-xl font-bold tabular-nums" style={{ color }}>
            {setpoint}{unit}
          </span>
          <span className="text-xs opacity-50" style={{ color }}>Set to</span>
        </div>
        <button
          onClick={adjustSetpoint(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color }}
        >
          +
        </button>
      </div>

      {/* Mode badge + status */}
      <div className="flex flex-col items-center gap-1 w-full">
        <button
          onClick={cycleMode}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: modeInfo.bg, color: '#fff' }}
          title="Tap to change mode"
        >
          <span>{modeInfo.icon}</span>
          <span>{mode === 'off' ? 'Off' : modeInfo.label} mode</span>
        </button>
        <span className="text-xs opacity-50 leading-none" style={{ color }}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
