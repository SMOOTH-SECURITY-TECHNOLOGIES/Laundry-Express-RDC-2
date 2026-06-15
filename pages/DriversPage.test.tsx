// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DriversControlCenter } from './DriversControlCenter';
import { renderComponent, byText } from '../components/admin/drivers/test-utils';
import { driversFixtureBundle } from '../lib/admin/drivers-fixtures';

vi.mock('../hooks/useDriversCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));

import useDriversCenter from '../hooks/useDriversCenter';

const bundle = driversFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useDriversCenter>> = {}) => {
  vi.mocked(useDriversCenter).mockReturnValue({
    kpis: bundle.kpis, drivers: bundle.drivers, health: bundle.health, mapPoints: bundle.mapPoints,
    ranking: bundle.ranking, sla: bundle.sla, incidents: bundle.incidents, rewards: bundle.rewards,
    watchList: bundle.watchList, zoneAvailability: bundle.zoneAvailability, revenueTrend: bundle.revenueTrend,
    activity: bundle.activity, loading: false, error: null, degraded: false, wsConnected: true,
    lastWsEvent: null, refresh: vi.fn(), handleAddDriver: vi.fn(), handleSuspend: vi.fn(), handleExport: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useDriversCenter>);
};

describe('DriversControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPIs', () => {
    mockHook();
    const { container } = renderComponent(<DriversControlCenter />);
    expect(byText(container, 'Gestion des chauffeurs')).toBeTruthy();
    expect(byText(container, 'Chauffeurs enregistrés')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('32');
  });

  it('renders driver table and health card', () => {
    mockHook();
    const { container } = renderComponent(<DriversControlCenter />);
    expect(byText(container, 'Tous les chauffeurs')).toBeTruthy();
    expect(byText(container, 'Santé du réseau')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger les chauffeurs.', kpis: null });
    const { container } = renderComponent(<DriversControlCenter />);
    expect(byText(container, 'Impossible de charger les chauffeurs.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<DriversControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<DriversControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
