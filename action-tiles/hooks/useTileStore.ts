'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dashboard, Tile, TileType, DEFAULT_TILE_CONFIG } from '@/types/tiles';

const STORAGE_KEY = 'action-tiles-v1-dashboards';
const ACTIVE_KEY = 'action-tiles-v1-active';

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function makeSampleDashboard(): Dashboard {
  return {
    id: uid(),
    name: 'My Dashboard',
    columns: 6,
    gap: 8,
    bgColor: '#0f172a',
    tiles: [
      {
        id: uid(),
        type: 'clock',
        label: 'Clock',
        sublabel: '',
        icon: '🕐',
        color: '#ffffff',
        bgColor: '#1e40af',
        size: '2x2',
        order: 0,
        config: { clockFormat: '12h', clockShowSeconds: true, clockShowDate: true },
      },
      {
        id: uid(),
        type: 'toggle',
        label: 'Living Room',
        sublabel: 'Lights',
        icon: '💡',
        color: '#ffffff',
        bgColor: '#15803d',
        size: '2x1',
        order: 1,
        config: { toggleState: false, toggleOnLabel: 'ON', toggleOffLabel: 'OFF' },
      },
      {
        id: uid(),
        type: 'toggle',
        label: 'AC Unit',
        sublabel: 'Climate',
        icon: '❄️',
        color: '#ffffff',
        bgColor: '#0d9488',
        size: '2x1',
        order: 2,
        config: { toggleState: true, toggleOnLabel: 'ON', toggleOffLabel: 'OFF' },
      },
      {
        id: uid(),
        type: 'button',
        label: 'Lock Door',
        sublabel: 'Front',
        icon: '🔒',
        color: '#ffffff',
        bgColor: '#b91c1c',
        size: '2x1',
        order: 3,
        config: { buttonAction: 'lock' },
      },
      {
        id: uid(),
        type: 'counter',
        label: 'Temperature',
        sublabel: '°F',
        icon: '🌡️',
        color: '#ffffff',
        bgColor: '#c2410c',
        size: '2x1',
        order: 4,
        config: { counterValue: 72, counterStep: 1, counterMin: 60, counterMax: 90 },
      },
      {
        id: uid(),
        type: 'toggle',
        label: 'Alarm',
        sublabel: 'Security',
        icon: '🚨',
        color: '#ffffff',
        bgColor: '#7e22ce',
        size: '2x1',
        order: 5,
        config: { toggleState: false, toggleOnLabel: 'ARMED', toggleOffLabel: 'DISARMED' },
      },
      {
        id: uid(),
        type: 'text',
        label: 'Welcome Home',
        icon: '🏠',
        color: '#1e293b',
        bgColor: '#e2e8f0',
        size: '2x1',
        order: 6,
        config: { textContent: 'Smart Home Dashboard', textAlign: 'center' },
      },
      {
        id: uid(),
        type: 'link',
        label: 'Weather',
        sublabel: 'Forecast',
        icon: '🌤️',
        color: '#ffffff',
        bgColor: '#475569',
        size: '2x1',
        order: 7,
        config: { linkUrl: 'https://weather.com', linkTarget: '_blank' },
      },
    ],
  };
}

export function useTileStore() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_KEY);
      if (stored) {
        const parsed: Dashboard[] = JSON.parse(stored);
        setDashboards(parsed);
        setActiveDashboardId(activeId || parsed[0]?.id || '');
      } else {
        const sample = makeSampleDashboard();
        setDashboards([sample]);
        setActiveDashboardId(sample.id);
      }
    } catch {
      const sample = makeSampleDashboard();
      setDashboards([sample]);
      setActiveDashboardId(sample.id);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  }, [dashboards, loaded]);

  useEffect(() => {
    if (!loaded || !activeDashboardId) return;
    localStorage.setItem(ACTIVE_KEY, activeDashboardId);
  }, [activeDashboardId, loaded]);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) ?? dashboards[0];

  const mutateDashboard = useCallback(
    (id: string, updater: (d: Dashboard) => Dashboard) => {
      setDashboards((prev) => prev.map((d) => (d.id === id ? updater(d) : d)));
    },
    []
  );

  // ── Dashboards ──────────────────────────────────────────────────────────────

  const createDashboard = useCallback((name: string) => {
    const d: Dashboard = { id: uid(), name, columns: 6, gap: 8, bgColor: '#0f172a', tiles: [] };
    setDashboards((prev) => [...prev, d]);
    setActiveDashboardId(d.id);
  }, []);

  const renameDashboard = useCallback(
    (id: string, name: string) => mutateDashboard(id, (d) => ({ ...d, name })),
    [mutateDashboard]
  );

  const deleteDashboard = useCallback(
    (id: string) => {
      setDashboards((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (activeDashboardId === id && next.length > 0) setActiveDashboardId(next[0].id);
        return next;
      });
    },
    [activeDashboardId]
  );

  const updateDashboardSettings = useCallback(
    (id: string, patch: Partial<Pick<Dashboard, 'columns' | 'gap' | 'bgColor' | 'name'>>) =>
      mutateDashboard(id, (d) => ({ ...d, ...patch })),
    [mutateDashboard]
  );

  // ── Tiles ────────────────────────────────────────────────────────────────────

  const addTile = useCallback(
    (type: TileType): string => {
      const id = uid();
      const newTile: Tile = {
        id,
        type,
        label: 'New Tile',
        sublabel: '',
        icon: '',
        color: '#ffffff',
        bgColor: '#2563eb',
        size: '2x1',
        order: activeDashboard?.tiles.length ?? 0,
        config: { ...DEFAULT_TILE_CONFIG[type] },
      };
      mutateDashboard(activeDashboard?.id ?? '', (d) => ({ ...d, tiles: [...d.tiles, newTile] }));
      return id;
    },
    [activeDashboard, mutateDashboard]
  );

  const updateTile = useCallback(
    (dashId: string, tileId: string, updates: Partial<Tile>) =>
      mutateDashboard(dashId, (d) => ({
        ...d,
        tiles: d.tiles.map((t) => (t.id === tileId ? { ...t, ...updates } : t)),
      })),
    [mutateDashboard]
  );

  const deleteTile = useCallback(
    (dashId: string, tileId: string) =>
      mutateDashboard(dashId, (d) => ({ ...d, tiles: d.tiles.filter((t) => t.id !== tileId) })),
    [mutateDashboard]
  );

  const reorderTiles = useCallback(
    (dashId: string, tiles: Tile[]) => mutateDashboard(dashId, (d) => ({ ...d, tiles })),
    [mutateDashboard]
  );

  return {
    dashboards,
    activeDashboard,
    activeDashboardId,
    setActiveDashboardId,
    editMode,
    setEditMode,
    loaded,
    createDashboard,
    renameDashboard,
    deleteDashboard,
    updateDashboardSettings,
    addTile,
    updateTile,
    deleteTile,
    reorderTiles,
  };
}
