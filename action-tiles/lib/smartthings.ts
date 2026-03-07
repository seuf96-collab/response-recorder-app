// ─── SmartThings REST API client ─────────────────────────────────────────────
// Uses Personal Access Tokens (PAT) — no OAuth flow required.
// Generate one at: https://account.smartthings.com/tokens

const BASE = 'https://api.smartthings.com/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface STDevice {
  deviceId: string;
  name: string;
  label: string;
  components: STComponent[];
  /** Top-level categories for easy filtering */
  categories?: { name: string; id: string }[];
}

export interface STComponent {
  id: string;
  capabilities: { id: string; version: number }[];
}

/** Flat map of capability → attribute → { value, unit, timestamp } */
export type STDeviceStatus = Record<string, Record<string, { value: unknown; unit?: string; timestamp?: string }>>;

export interface STCommandRequest {
  capability: string;
  command: string;
  arguments?: unknown[];
}

// ── Capability constants ──────────────────────────────────────────────────────

export const CAP = {
  SWITCH:               'switch',
  SWITCH_LEVEL:         'switchLevel',
  TEMPERATURE:          'temperatureMeasurement',
  THERMOSTAT_MODE:      'thermostatMode',
  THERMOSTAT_HEAT_SP:   'thermostatHeatingSetpoint',
  THERMOSTAT_COOL_SP:   'thermostatCoolingSetpoint',
  THERMOSTAT_OP_STATE:  'thermostatOperatingState',
  HUMIDITY:             'relativeHumidityMeasurement',
} as const;

// Capabilities that make a device relevant for each tile type
export const TILE_TYPE_CAPS: Record<string, string[]> = {
  toggle:     [CAP.SWITCH],
  dimmer:     [CAP.SWITCH_LEVEL],
  thermostat: [CAP.THERMOSTAT_MODE, CAP.TEMPERATURE],
  humidity:   [CAP.HUMIDITY],
};

// ── Client ────────────────────────────────────────────────────────────────────

export class SmartThingsClient {
  constructor(private readonly token: string) {}

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`SmartThings API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async listDevices(): Promise<STDevice[]> {
    const data = await this.request<{ items: STDevice[] }>('/devices?max=200');
    return data.items ?? [];
  }

  async getDeviceStatus(deviceId: string): Promise<STDeviceStatus> {
    const data = await this.request<{ components: Record<string, STDeviceStatus> }>(
      `/devices/${deviceId}/status`
    );
    // Merge all components into a flat capability map
    const merged: STDeviceStatus = {};
    for (const comp of Object.values(data.components ?? {})) {
      for (const [cap, attrs] of Object.entries(comp)) {
        merged[cap] = { ...(merged[cap] ?? {}), ...attrs };
      }
    }
    return merged;
  }

  async sendCommand(deviceId: string, cmd: STCommandRequest): Promise<void> {
    await this.request(`/devices/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({ commands: [{ component: 'main', ...cmd }] }),
    });
  }

  // ── Convenience helpers ──────────────────────────────────────────────────

  async switchOn(deviceId: string)  { return this.sendCommand(deviceId, { capability: CAP.SWITCH, command: 'on' }); }
  async switchOff(deviceId: string) { return this.sendCommand(deviceId, { capability: CAP.SWITCH, command: 'off' }); }
  async setLevel(deviceId: string, level: number, rate?: number) {
    const args: unknown[] = [Math.round(Math.min(100, Math.max(0, level)))];
    if (rate !== undefined) args.push(rate);
    return this.sendCommand(deviceId, { capability: CAP.SWITCH_LEVEL, command: 'setLevel', arguments: args });
  }

  async setThermostatMode(deviceId: string, mode: string) {
    return this.sendCommand(deviceId, { capability: CAP.THERMOSTAT_MODE, command: 'setThermostatMode', arguments: [mode] });
  }
  async setHeatingSetpoint(deviceId: string, temp: number) {
    return this.sendCommand(deviceId, { capability: CAP.THERMOSTAT_HEAT_SP, command: 'setHeatingSetpoint', arguments: [temp] });
  }
  async setCoolingSetpoint(deviceId: string, temp: number) {
    return this.sendCommand(deviceId, { capability: CAP.THERMOSTAT_COOL_SP, command: 'setCoolingSetpoint', arguments: [temp] });
  }

  // ── Status extractors ────────────────────────────────────────────────────

  static getSwitchState(status: STDeviceStatus): boolean {
    return status[CAP.SWITCH]?.switch?.value === 'on';
  }

  static getTemperature(status: STDeviceStatus): number | null {
    const v = status[CAP.TEMPERATURE]?.temperature?.value;
    return typeof v === 'number' ? v : null;
  }

  static getThermostatMode(status: STDeviceStatus): string | null {
    const v = status[CAP.THERMOSTAT_MODE]?.thermostatMode?.value;
    return typeof v === 'string' ? v : null;
  }

  static getHeatingSetpoint(status: STDeviceStatus): number | null {
    const v = status[CAP.THERMOSTAT_HEAT_SP]?.heatingSetpoint?.value;
    return typeof v === 'number' ? v : null;
  }

  static getCoolingSetpoint(status: STDeviceStatus): number | null {
    const v = status[CAP.THERMOSTAT_COOL_SP]?.coolingSetpoint?.value;
    return typeof v === 'number' ? v : null;
  }

  static getOperatingState(status: STDeviceStatus): string | null {
    const v = status[CAP.THERMOSTAT_OP_STATE]?.thermostatOperatingState?.value;
    return typeof v === 'string' ? v : null;
  }

  static getHumidity(status: STDeviceStatus): number | null {
    const v = status[CAP.HUMIDITY]?.humidity?.value;
    return typeof v === 'number' ? v : null;
  }

  static getLevel(status: STDeviceStatus): number | null {
    const v = status[CAP.SWITCH_LEVEL]?.level?.value;
    return typeof v === 'number' ? v : null;
  }

  static getSwitchLevelOn(status: STDeviceStatus): boolean {
    // A dimmer's on/off is stored in the switch capability, not switchLevel
    const sw = status[CAP.SWITCH]?.switch?.value;
    if (sw === 'on' || sw === 'off') return sw === 'on';
    // Fallback: consider on if level > 0
    const lvl = SmartThingsClient.getLevel(status);
    return lvl !== null ? lvl > 0 : false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function deviceHasCapability(device: STDevice, cap: string): boolean {
  return device.components.some((c) => c.capabilities.some((k) => k.id === cap));
}

export function filterDevicesForTileType(devices: STDevice[], tileType: string): STDevice[] {
  const required = TILE_TYPE_CAPS[tileType];
  if (!required?.length) return [];
  return devices.filter((d) => required.some((cap) => deviceHasCapability(d, cap)));
}
