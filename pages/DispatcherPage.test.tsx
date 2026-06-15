// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DispatcherControlCenter } from './DispatcherControlCenter';
import { renderComponent, byText } from '../components/admin/dispatcher/test-utils';
import { dispatcherFixtureBundle } from '../lib/admin/dispatcher-fixtures';

vi.mock('../hooks/useDispatcherCenter', () => ({
  default: vi.fn(),
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({ setAdminSectionParams: vi.fn() }),
}));

import useDispatcherCenter from '../hooks/useDispatcherCenter';

const bundle = dispatcherFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useDispatcherCenter>> = {}) => {
  vi.mocked(useDispatcherCenter).mockReturnValue({
    kpis: bundle.kpis,
    backlog: bundle.backlog,
    activeMissions: bundle.activeMissions,
    drivers: bundle.drivers,
    driverHealth: bundle.driverHealth,
    sla: bundle.sla,
    mapPoints: bundle.mapPoints,
    mapClusters: bundle.mapClusters,
    mapZoneKpis: bundle.mapZoneKpis,
    incidents: bundle.incidents,
    revenue: bundle.revenue,
    topDrivers: bundle.topDrivers,
    analytics: bundle.analytics,
    loading: false,
    error: null,
    degraded: false,
    wsConnected: true,
    lastWsEvent: null,
    refresh: vi.fn(),
    handleAssign: vi.fn(),
    handleAutoDispatch: vi.fn(),
    handleExport: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useDispatcherCenter>);
};

describe('DispatcherControlCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI row and header', () => {
    mockHook();
    const { container } = renderComponent(<DispatcherControlCenter />);
    expect(byText(container, 'Cockpit Dispatcher')).toBeTruthy();
    expect(byText(container, 'Missions ouvertes')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('24');
  });

  it('renders backlog and active missions sections', () => {
    mockHook();
    const { container } = renderComponent(<DispatcherControlCenter />);
    expect(byText(container, 'Backlog à dispatcher')).toBeTruthy();
    expect(byText(container, 'Missions actives')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le cockpit dispatcher.', kpis: null });
    const { container } = renderComponent(<DispatcherControlCenter />);
    expect(byText(container, 'Impossible de charger le cockpit dispatcher.')).toBeTruthy();
    expect(byText(container, 'Réessayer')).toBeTruthy();
  });

  it('shows degraded mode banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<DispatcherControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined or null placeholders', () => {
    mockHook();
    const { container } = renderComponent(<DispatcherControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
