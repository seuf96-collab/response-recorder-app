'use client';

import { useState, useEffect } from 'react';
import {
  Tile,
  TileType,
  TileSize,
  TILE_COLORS,
  TILE_BG_COLORS,
  TILE_TYPE_LABELS,
  TILE_TYPE_DESCRIPTIONS,
  DEFAULT_TILE_CONFIG,
  TYPE_ICONS,
} from '@/types/tiles';

const SIZES: TileSize[] = ['1x1', '2x1', '1x2', '2x2', '3x1', '3x2', '4x1', '4x2'];
const TYPES: TileType[] = ['button', 'toggle', 'clock', 'link', 'counter', 'text', 'iframe', 'media', 'thermostat', 'humidity'];

type DraftTile = Omit<Tile, 'id' | 'order'>;

interface Props {
  tile: Tile | null;   // null = create new
  onSave: (draft: DraftTile, existingId?: string) => void;
  onClose: () => void;
}

export function TileEditor({ tile, onSave, onClose }: Props) {
  const isNew = !tile;
  const [step, setStep] = useState<'type' | 'config'>(isNew ? 'type' : 'config');

  const [draft, setDraft] = useState<DraftTile>({
    type: 'button',
    label: 'New Tile',
    sublabel: '',
    icon: '',
    color: '#ffffff',
    bgColor: '#2563eb',
    size: '2x1',
    config: { ...DEFAULT_TILE_CONFIG['button'] },
  });

  useEffect(() => {
    if (tile) {
      setDraft({
        type: tile.type,
        label: tile.label,
        sublabel: tile.sublabel ?? '',
        icon: tile.icon ?? '',
        color: tile.color,
        bgColor: tile.bgColor,
        size: tile.size,
        config: { ...tile.config },
      });
    }
  }, [tile]);

  const pickType = (type: TileType) => {
    setDraft((d) => ({ ...d, type, config: { ...DEFAULT_TILE_CONFIG[type] } }));
    setStep('config');
  };

  const set = <K extends keyof DraftTile>(k: K, v: DraftTile[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const setCfg = (updates: Record<string, unknown>) =>
    setDraft((d) => ({ ...d, config: { ...d.config, ...updates } }));

  const save = () => {
    onSave(draft, tile?.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-[480px] mx-4 max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">
              {step === 'type' ? 'Choose Tile Type' : isNew ? 'Configure Tile' : 'Edit Tile'}
            </h2>
            {step === 'config' && isNew && (
              <button onClick={() => setStep('type')} className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 transition-colors">
                ← Change type ({TILE_TYPE_LABELS[draft.type]})
              </button>
            )}
            {step === 'config' && !isNew && (
              <p className="text-xs text-slate-500 mt-0.5">{TILE_TYPE_LABELS[draft.type]}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white/70 hover:text-white transition-all flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {step === 'type' ? (
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => pickType(t)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all text-left"
                >
                  <span className="text-2xl shrink-0">{TYPE_ICONS[t]}</span>
                  <div>
                    <div className="text-white font-semibold text-sm leading-tight">{TILE_TYPE_LABELS[t]}</div>
                    <div className="text-slate-400 text-xs mt-0.5 leading-tight">{TILE_TYPE_DESCRIPTIONS[t]}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Appearance */}
              <Sec title="Appearance">
                <Row label="Label">
                  <Input value={draft.label} onChange={(v) => set('label', v)} />
                </Row>
                <Row label="Sublabel (optional)">
                  <Input value={draft.sublabel ?? ''} onChange={(v) => set('sublabel', v)} placeholder="e.g. Room, unit..." />
                </Row>
                <Row label="Icon (emoji)">
                  <Input value={draft.icon ?? ''} onChange={(v) => set('icon', v)} placeholder="💡 🔒 ❄️ ..." />
                </Row>
                <Row label="Size">
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((s) => (
                      <Chip key={s} active={draft.size === s} onClick={() => set('size', s)}>{s}</Chip>
                    ))}
                  </div>
                </Row>
              </Sec>

              {/* Colors */}
              <Sec title="Colors">
                <Row label="Background">
                  <ColorPicker
                    colors={TILE_BG_COLORS}
                    value={draft.bgColor}
                    onChange={(v) => set('bgColor', v)}
                  />
                </Row>
                <Row label="Text / Icon Color">
                  <ColorPicker
                    colors={TILE_COLORS}
                    value={draft.color}
                    onChange={(v) => set('color', v)}
                    withBorder
                  />
                </Row>
              </Sec>

              {/* Type-specific */}
              {draft.type === 'toggle' && (
                <Sec title="Toggle Settings">
                  <Row label="ON Label">
                    <Input value={draft.config.toggleOnLabel ?? 'ON'} onChange={(v) => setCfg({ toggleOnLabel: v })} />
                  </Row>
                  <Row label="OFF Label">
                    <Input value={draft.config.toggleOffLabel ?? 'OFF'} onChange={(v) => setCfg({ toggleOffLabel: v })} />
                  </Row>
                  <Row label="Default State">
                    <SegmentedControl
                      options={[{ label: 'OFF', value: false }, { label: 'ON', value: true }]}
                      value={draft.config.toggleState ?? false}
                      onChange={(v) => setCfg({ toggleState: v })}
                    />
                  </Row>
                </Sec>
              )}

              {draft.type === 'clock' && (
                <Sec title="Clock Settings">
                  <Row label="Format">
                    <SegmentedControl
                      options={[{ label: '12h', value: '12h' }, { label: '24h', value: '24h' }]}
                      value={draft.config.clockFormat ?? '12h'}
                      onChange={(v) => setCfg({ clockFormat: v })}
                    />
                  </Row>
                  <div className="flex gap-5">
                    <Checkbox
                      label="Show seconds"
                      checked={draft.config.clockShowSeconds ?? true}
                      onChange={(v) => setCfg({ clockShowSeconds: v })}
                    />
                    <Checkbox
                      label="Show date"
                      checked={draft.config.clockShowDate ?? true}
                      onChange={(v) => setCfg({ clockShowDate: v })}
                    />
                  </div>
                </Sec>
              )}

              {draft.type === 'link' && (
                <Sec title="Link Settings">
                  <Row label="URL">
                    <Input value={draft.config.linkUrl ?? ''} onChange={(v) => setCfg({ linkUrl: v })} placeholder="https://example.com" />
                  </Row>
                  <Row label="Open in">
                    <SegmentedControl
                      options={[{ label: 'New tab', value: '_blank' }, { label: 'Same tab', value: '_self' }]}
                      value={draft.config.linkTarget ?? '_blank'}
                      onChange={(v) => setCfg({ linkTarget: v })}
                    />
                  </Row>
                </Sec>
              )}

              {draft.type === 'counter' && (
                <Sec title="Counter Settings">
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Start value">
                      <Input type="number" value={String(draft.config.counterValue ?? 0)} onChange={(v) => setCfg({ counterValue: Number(v) })} />
                    </Row>
                    <Row label="Step">
                      <Input type="number" value={String(draft.config.counterStep ?? 1)} onChange={(v) => setCfg({ counterStep: Number(v) })} />
                    </Row>
                    <Row label="Min">
                      <Input type="number" value={String(draft.config.counterMin ?? 0)} onChange={(v) => setCfg({ counterMin: Number(v) })} />
                    </Row>
                    <Row label="Max">
                      <Input type="number" value={String(draft.config.counterMax ?? 100)} onChange={(v) => setCfg({ counterMax: Number(v) })} />
                    </Row>
                  </div>
                </Sec>
              )}

              {draft.type === 'text' && (
                <Sec title="Text Settings">
                  <Row label="Content">
                    <textarea
                      value={draft.config.textContent ?? ''}
                      onChange={(e) => setCfg({ textContent: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </Row>
                  <Row label="Alignment">
                    <SegmentedControl
                      options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]}
                      value={draft.config.textAlign ?? 'center'}
                      onChange={(v) => setCfg({ textAlign: v })}
                    />
                  </Row>
                </Sec>
              )}

              {draft.type === 'iframe' && (
                <Sec title="Embed Settings">
                  <Row label="URL">
                    <Input value={draft.config.iframeSrc ?? ''} onChange={(v) => setCfg({ iframeSrc: v })} placeholder="https://example.com" />
                  </Row>
                  <p className="text-xs text-slate-500">Note: Some sites block embedding. Works best with sites that allow iframes.</p>
                </Sec>
              )}

              {draft.type === 'media' && (
                <Sec title="Media Settings">
                  <Row label="Type">
                    <SegmentedControl
                      options={[{ label: 'Image', value: 'image' }, { label: 'Video', value: 'video' }]}
                      value={draft.config.mediaType ?? 'image'}
                      onChange={(v) => setCfg({ mediaType: v })}
                    />
                  </Row>
                  <Row label="URL">
                    <Input value={draft.config.mediaSrc ?? ''} onChange={(v) => setCfg({ mediaSrc: v })} placeholder="https://example.com/image.jpg" />
                  </Row>
                  <Row label="Alt text">
                    <Input value={draft.config.mediaAlt ?? ''} onChange={(v) => setCfg({ mediaAlt: v })} />
                  </Row>
                </Sec>
              )}

              {draft.type === 'thermostat' && (
                <Sec title="Thermostat Settings">
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Current Temp">
                      <Input
                        type="number"
                        value={String(draft.config.thermostatCurrentTemp ?? 72)}
                        onChange={(v) => setCfg({ thermostatCurrentTemp: Number(v) })}
                      />
                    </Row>
                    <Row label="Setpoint">
                      <Input
                        type="number"
                        value={String(draft.config.thermostatSetpoint ?? 70)}
                        onChange={(v) => setCfg({ thermostatSetpoint: Number(v) })}
                      />
                    </Row>
                  </div>
                  <Row label="Mode">
                    <SegmentedControl
                      options={[
                        { label: '🔥 Heat', value: 'heat' },
                        { label: '❄️ Cool', value: 'cool' },
                        { label: '♻️ Auto', value: 'auto' },
                        { label: '○ Off',  value: 'off'  },
                      ]}
                      value={draft.config.thermostatMode ?? 'heat'}
                      onChange={(v) => setCfg({ thermostatMode: v })}
                    />
                  </Row>
                  <Row label="Unit">
                    <SegmentedControl
                      options={[{ label: '°F', value: '°F' }, { label: '°C', value: '°C' }]}
                      value={draft.config.thermostatUnit ?? '°F'}
                      onChange={(v) => setCfg({ thermostatUnit: v })}
                    />
                  </Row>
                  <Checkbox
                    label="Show as actively heating/cooling"
                    checked={draft.config.thermostatIsActive ?? false}
                    onChange={(v) => setCfg({ thermostatIsActive: v })}
                  />
                  <p className="text-xs text-slate-500">
                    Tap the mode badge on the tile to cycle modes. Use +/− to adjust setpoint.
                  </p>
                </Sec>
              )}

              {draft.type === 'humidity' && (
                <Sec title="Humidity Settings">
                  <Row label="Current Humidity (%)">
                    <Input
                      type="number"
                      value={String(draft.config.humidityValue ?? 45)}
                      onChange={(v) => setCfg({ humidityValue: Number(v) })}
                    />
                  </Row>
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Min %">
                      <Input
                        type="number"
                        value={String(draft.config.humidityMin ?? 0)}
                        onChange={(v) => setCfg({ humidityMin: Number(v) })}
                      />
                    </Row>
                    <Row label="Max %">
                      <Input
                        type="number"
                        value={String(draft.config.humidityMax ?? 100)}
                        onChange={(v) => setCfg({ humidityMax: Number(v) })}
                      />
                    </Row>
                  </div>
                  <p className="text-xs text-slate-500">
                    Comfort zones: 🟡 &lt;30% dry · 🟢 30–60% comfortable · 🔵 &gt;60% humid
                  </p>
                </Sec>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div className="px-5 py-4 border-t border-slate-700/60 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
            >
              {isNew ? 'Add Tile' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-slate-300 font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
    />
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
        active ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function ColorPicker({ colors, value, onChange, withBorder }: {
  colors: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  withBorder?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {colors.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className="w-7 h-7 rounded-lg transition-all hover:scale-110"
          style={{
            backgroundColor: c.value,
            border: withBorder ? '1px solid rgba(255,255,255,0.15)' : undefined,
            outline: value === c.value ? '2px solid #60a5fa' : '2px solid transparent',
            outlineOffset: 2,
          }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
        title="Custom color"
      />
    </div>
  );
}

function SegmentedControl<T>({ options, value, onChange }: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            value === o.value ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-blue-500"
      />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}
