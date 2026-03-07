export type TileSize = '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '3x2' | '4x1' | '4x2';

export type ThermostatMode = 'heat' | 'cool' | 'auto' | 'off';

export type TileType =
  | 'button'
  | 'toggle'
  | 'clock'
  | 'link'
  | 'counter'
  | 'text'
  | 'iframe'
  | 'media'
  | 'thermostat'
  | 'humidity';

export interface TileConfig {
  // button
  buttonAction?: string;
  // toggle
  toggleState?: boolean;
  toggleOnLabel?: string;
  toggleOffLabel?: string;
  // clock
  clockFormat?: '12h' | '24h';
  clockShowSeconds?: boolean;
  clockShowDate?: boolean;
  // link
  linkUrl?: string;
  linkTarget?: '_blank' | '_self';
  // counter
  counterValue?: number;
  counterStep?: number;
  counterMin?: number;
  counterMax?: number;
  // text
  textContent?: string;
  textAlign?: 'left' | 'center' | 'right';
  // iframe
  iframeSrc?: string;
  // media
  mediaType?: 'image' | 'video';
  mediaSrc?: string;
  mediaAlt?: string;
  // thermostat
  thermostatCurrentTemp?: number;
  thermostatSetpoint?: number;
  thermostatMode?: ThermostatMode;
  thermostatUnit?: '°F' | '°C';
  thermostatIsActive?: boolean;
  // humidity
  humidityValue?: number;
  humidityMin?: number;
  humidityMax?: number;
}

export interface Tile {
  id: string;
  type: TileType;
  label: string;
  sublabel?: string;
  icon?: string;
  color: string;
  bgColor: string;
  size: TileSize;
  order: number;
  config: TileConfig;
}

export interface Dashboard {
  id: string;
  name: string;
  tiles: Tile[];
  columns: number;
  gap: number;
  bgColor: string;
}

export const TILE_SIZE_SPANS: Record<TileSize, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
  '3x1': { cols: 3, rows: 1 },
  '3x2': { cols: 3, rows: 2 },
  '4x1': { cols: 4, rows: 1 },
  '4x2': { cols: 4, rows: 2 },
};

export const TILE_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Light', value: '#e2e8f0' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Green', value: '#4ade80' },
  { label: 'Red', value: '#f87171' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Purple', value: '#c084fc' },
  { label: 'Orange', value: '#fb923c' },
  { label: 'Teal', value: '#2dd4bf' },
  { label: 'Pink', value: '#f472b6' },
  { label: 'Slate', value: '#94a3b8' },
  { label: 'Dark', value: '#1e293b' },
];

export const TILE_BG_COLORS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Dark Blue', value: '#1e40af' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Dark Green', value: '#15803d' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Dark Red', value: '#b91c1c' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Dark Purple', value: '#7e22ce' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Slate', value: '#475569' },
  { label: 'Dark', value: '#1e293b' },
  { label: 'Charcoal', value: '#374151' },
  { label: 'Light', value: '#e2e8f0' },
];

export const DEFAULT_TILE_CONFIG: Record<TileType, TileConfig> = {
  button:      { buttonAction: '' },
  toggle:      { toggleState: false, toggleOnLabel: 'ON', toggleOffLabel: 'OFF' },
  clock:       { clockFormat: '12h', clockShowSeconds: true, clockShowDate: true },
  link:        { linkUrl: '', linkTarget: '_blank' },
  counter:     { counterValue: 0, counterStep: 1, counterMin: 0, counterMax: 100 },
  text:        { textContent: 'Your text here', textAlign: 'center' },
  iframe:      { iframeSrc: '' },
  media:       { mediaType: 'image', mediaSrc: '', mediaAlt: '' },
  thermostat:  { thermostatCurrentTemp: 72, thermostatSetpoint: 70, thermostatMode: 'heat', thermostatUnit: '°F', thermostatIsActive: false },
  humidity:    { humidityValue: 45, humidityMin: 0, humidityMax: 100 },
};

export const TILE_TYPE_LABELS: Record<TileType, string> = {
  button:     'Button',
  toggle:     'Toggle Switch',
  clock:      'Clock',
  link:       'Link',
  counter:    'Counter',
  text:       'Text / Info',
  iframe:     'Web Embed',
  media:      'Image / Media',
  thermostat: 'Thermostat',
  humidity:   'Humidity',
};

export const TILE_TYPE_DESCRIPTIONS: Record<TileType, string> = {
  button:     'A pressable button tile',
  toggle:     'An on/off toggle switch',
  clock:      'Live clock and date display',
  link:       'A clickable link tile',
  counter:    'A numeric counter with +/− controls',
  text:       'Static text or information display',
  iframe:     'Embed an external webpage',
  media:      'Display an image or video',
  thermostat: 'Thermostat with setpoint & mode control',
  humidity:   'Humidity gauge with comfort indicator',
};

export const TYPE_ICONS: Record<TileType, string> = {
  button:     '🔘',
  toggle:     '🔀',
  clock:      '🕐',
  link:       '🔗',
  counter:    '🔢',
  text:       '📝',
  iframe:     '🌐',
  media:      '🖼️',
  thermostat: '🌡️',
  humidity:   '💧',
};
