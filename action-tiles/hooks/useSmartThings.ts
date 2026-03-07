'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SmartThingsClient, STDevice, STDeviceStatus } from '@/lib/smartthings';

const TOKEN_KEY = 'action-tiles-st-token';
const POLL_INTERVAL = 30_000; // 30 s

export type STConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface UseSmartThingsReturn {
  token: string;
  setToken: (t: string) => void;
  saveToken: (t: string) => Promise<void>;
  connectionStatus: STConnectionStatus;
  connectionError: string;
  devices: STDevice[];
  deviceStatus: Record<string, STDeviceStatus>;   // deviceId → status
  refreshDevices: () => Promise<void>;
  refreshDevice: (deviceId: string) => Promise<void>;
  client: SmartThingsClient | null;
  clearToken: () => void;
}

export function useSmartThings(): UseSmartThingsReturn {
  const [token, setTokenState] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<STConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [devices, setDevices] = useState<STDevice[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, STDeviceStatus>>({});
  const clientRef = useRef<SmartThingsClient | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved token on mount
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY) ?? '';
    if (saved) {
      setTokenState(saved);
      connectWithToken(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWithToken = useCallback(async (t: string) => {
    if (!t.trim()) return;
    const client = new SmartThingsClient(t.trim());
    clientRef.current = client;
    setConnectionStatus('connecting');
    setConnectionError('');
    try {
      const list = await client.listDevices();
      setDevices(list);
      setConnectionStatus('connected');
      startPolling(client, list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setConnectionStatus('error');
      setConnectionError(msg);
      clientRef.current = null;
    }
  }, []);

  const startPolling = (client: SmartThingsClient, deviceList: STDevice[]) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    // Initial fetch
    fetchAllStatuses(client, deviceList);
    pollTimerRef.current = setInterval(() => {
      fetchAllStatuses(client, deviceList);
    }, POLL_INTERVAL);
  };

  const fetchAllStatuses = async (client: SmartThingsClient, deviceList: STDevice[]) => {
    const results = await Promise.allSettled(
      deviceList.map((d) => client.getDeviceStatus(d.deviceId))
    );
    setDeviceStatus((prev) => {
      const next = { ...prev };
      deviceList.forEach((d, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') next[d.deviceId] = r.value;
      });
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const saveToken = useCallback(async (t: string) => {
    localStorage.setItem(TOKEN_KEY, t.trim());
    setTokenState(t.trim());
    // Reset state
    setDevices([]);
    setDeviceStatus({});
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    await connectWithToken(t.trim());
  }, [connectWithToken]);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState('');
    setDevices([]);
    setDeviceStatus({});
    setConnectionStatus('idle');
    setConnectionError('');
    clientRef.current = null;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      const list = await clientRef.current.listDevices();
      setDevices(list);
      startPolling(clientRef.current, list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setConnectionError(msg);
    }
  }, []);

  const refreshDevice = useCallback(async (deviceId: string) => {
    if (!clientRef.current) return;
    try {
      const status = await clientRef.current.getDeviceStatus(deviceId);
      setDeviceStatus((prev) => ({ ...prev, [deviceId]: status }));
    } catch {
      // silently ignore individual refresh failures
    }
  }, []);

  return {
    token,
    setToken: setTokenState,
    saveToken,
    connectionStatus,
    connectionError,
    devices,
    deviceStatus,
    refreshDevices,
    refreshDevice,
    client: clientRef.current,
    clearToken,
  };
}
