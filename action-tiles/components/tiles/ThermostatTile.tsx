'use client';

import { TileConfig, ThermostatMode } from '@/types/tiles';
import { STDeviceStatus, SmartThingsClient } from '@/lib/smartthings';

const MODE_COLORS: Record<ThermostatMode, { bg: string; label: string; icon: string }> = {
  heat: { bg: '#c2410c', label: 'Heating', icon: '🔥' },
  cool: { bg: '#0284c7', label: 'Cooling', icon: '❄️' },
  auto: { bg: '#7c3aed', label: 'Auto',    icon: '♻️' },
  off:  { bg: '#374151', label: 'Off',     icon: '○'  },
};

const MODES: ThermostatMode[] = ['heat', 'cool', 'auto', 'off'];

// SmartThings mode strings → our internal mode
const ST_MODE_MAP: Record<string, ThermostatMode> = {
  heat: 'heat', cool: 'cool', auto: 'auto', 'auto changeover': 'auto', off: 'off', emergency: 'heat',
};

interface Props {
  config: TileConfig;
  color: string;
  label: string;
  stStatus?: STDeviceStatus;
  onUpdate: (cfg: Partial<TileConfig>) => void;
}

export function ThermostatTile({ config, color, stStatus, onUpdate }: Props) {
  // Prefer live SmartThings data when available
  const liveTemp    = stStatus ? SmartThingsClient.getTemperature(stStatus)        : null;
  const liveModeRaw = stStatus ? SmartThingsClient.getThermostatMode(stStatus)     : null;
  const liveMode    = liveModeRaw ? (ST_MODE_MAP[liveModeRaw] ?? 'auto') : null;
  const liveHeatSP  = stStatus ? SmartThingsClient.getHeatingSetpoint(stStatus)    : null;
  const liveCoolSP  = stStatus ? SmartThingsClient.getCoolingSetpoint(stStatus)    : null;
  const liveOpState = stStatus ? SmartThingsClient.getOperatingState(stStatus)     : null;
  const hasLive     = liveTemp !== null;

  const currentTemp = liveTemp    ?? config.thermostatCurrentTemp ?? 72;
  const mode        = liveMode    ?? config.thermostatMode        ?? 'heat';
  const unit        = config.thermostatUnit ?? '°F';
  const isActive    = liveOpState ? ['heating', 'cooling'].includes(liveOpState) : (config.thermostatIsActive ?? false);

  // Pick the relevant setpoint based on mode
  const setpoint =
    mode === 'cool'
      ? (liveCoolSP ?? config.thermostatSetpoint ?? 75)
      : (liveHeatSP ?? config.thermostatSetpoint ?? 70);

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
    liveOpState               ? liveOpState.charAt(0).toUpperCase() + liveOpState.slice(1)
    : mode === 'off'          ? 'Off'
    : isActive                ? modeInfo.label
    : diff > 1                ? (mode === 'cool' ? 'Cooling soon' : 'Idle')
    : diff < -1               ? (mode === 'heat' ? 'Heating soon' : 'Idle')
    : 'At target';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full px-3 py-3 select-none">
      {/* Current temp */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold tabular-nums leading-none" style={{ color }}>
          {currentTemp}{unit}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs opacity-50" style={{ color }}>Current</span>
          {hasLive && <span className="text-[10px] opacity-40" style={{ color }}>● live</span>}
        </div>
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
          <span className="text-xs opacity-50" style={{ color }}>
            {mode === 'cool' ? 'Cool to' : 'Heat to'}
          </span>
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
