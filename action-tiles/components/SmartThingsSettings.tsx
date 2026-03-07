'use client';

import { useState } from 'react';
import { STConnectionStatus } from '@/hooks/useSmartThings';
import { STDevice } from '@/lib/smartthings';

interface Props {
  token: string;
  connectionStatus: STConnectionStatus;
  connectionError: string;
  devices: STDevice[];
  onSave: (token: string) => Promise<void>;
  onClear: () => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

const STATUS_INFO: Record<STConnectionStatus, { color: string; label: string; dot: string }> = {
  idle:       { color: 'text-slate-400', label: 'Not connected', dot: 'bg-slate-500' },
  connecting: { color: 'text-yellow-400', label: 'Connecting…',   dot: 'bg-yellow-400 animate-pulse' },
  connected:  { color: 'text-green-400',  label: 'Connected',     dot: 'bg-green-400' },
  error:      { color: 'text-red-400',    label: 'Error',         dot: 'bg-red-400' },
};

export function SmartThingsSettings({
  token,
  connectionStatus,
  connectionError,
  devices,
  onSave,
  onClear,
  onRefresh,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(token);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
  };

  const info = STATUS_INFO[connectionStatus];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md mx-4 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <h2 className="text-white font-bold text-base">SmartThings Integration</h2>
              <p className="text-slate-400 text-xs">Connect your Samsung SmartThings account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white/70 hover:text-white transition-all flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status indicator */}
          <div className={`flex items-center gap-2 text-sm ${info.color}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot}`} />
            <span>{info.label}</span>
            {connectionStatus === 'connected' && (
              <span className="text-slate-400">· {devices.length} device{devices.length !== 1 ? 's' : ''} found</span>
            )}
          </div>

          {connectionError && (
            <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-red-300 text-xs leading-relaxed">
              {connectionError}
            </div>
          )}

          {/* PAT input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Personal Access Token</label>
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Paste your SmartThings PAT here"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a token at{' '}
              <a
                href="https://account.smartthings.com/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                account.smartthings.com/tokens
              </a>
              . Required scopes: <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">r:devices:*</span>{' '}
              and <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">x:devices:*</span>.
            </p>
          </div>

          {/* Device list */}
          {connectionStatus === 'connected' && devices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Discovered Devices ({devices.length})
                </span>
                <button
                  onClick={onRefresh}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {devices.map((d) => (
                  <div key={d.deviceId} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{d.label || d.name}</div>
                      <div className="text-slate-500 text-xs font-mono truncate">{d.deviceId}</div>
                    </div>
                    <div className="text-slate-600 text-xs font-mono">
                      {d.components[0]?.capabilities.slice(0, 2).map((c) => c.id).join(', ')}
                      {(d.components[0]?.capabilities.length ?? 0) > 2 && '…'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700/60 flex gap-3 shrink-0">
          {token && (
            <button
              onClick={onClear}
              className="px-4 py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/70 text-red-300 text-sm font-semibold transition-colors border border-red-800/40"
            >
              Disconnect
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
          >
            {saving ? 'Connecting…' : connectionStatus === 'connected' ? 'Reconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
