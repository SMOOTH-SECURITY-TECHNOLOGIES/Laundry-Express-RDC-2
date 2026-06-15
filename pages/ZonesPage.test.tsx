// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ZonesControlCenter } from './ZonesControlCenter';
import { renderComponent, byText } from '../components/admin/zones/test-utils';
import { zonesFixtureBundle } from '../lib/admin/zones-fixtures';

vi.mock('../hooks/useZonesCenter', () => ({ default: vi.fn() }));
import useZonesCenter from '../hooks/useZonesCenter';

const bundle = zonesFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useZonesCenter>> = {}) => {
  vi.mocked(useZonesCenter).mockReturnValue({
    kpis: bundle.kpis, zones: bundle.zones, distribution: bundle.distribution,
    etaAnalytics: bundle.etaAnalytics, alerts: bundle.alerts, heatmap: bundle.heatmap,
    dispatcherSnapshots: bundle.dispatcherSnapshots, truthAnomalies: bundle.truthAnomalies,
    slaSummary: bundle.slaSummary, loading: false, error: null, degraded: false,
    refresh: vi.fn(), handleCreateZone: vi.fn(), handleUpdateTariff: vi.fn(),
    handleDeleteZone: vi.fn(), handleExport: vi.fn(), ...overrides,
  } as ReturnType<typeof useZonesCenter>);
};

describe('ZonesControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPIs', () => {
    mockHook();
    const { container } = renderComponent(<ZonesControlCenter />);
    expect(byText(container, 'Gestion des zones')).toBeTruthy();
    expect(byText(container, 'Zones actives')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('12');
  });

  it('renders zone table and map', () => {
    mockHook();
    const { container } = renderComponent(<ZonesControlCenter />);
    expect(byText(container, 'Toutes les zones')).toBeTruthy();
    expect(byText(container, 'Carte des zones')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger les zones.', kpis: null });
    const { container } = renderComponent(<ZonesControlCenter />);
    expect(byText(container, 'Impossible de charger les zones.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<ZonesControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<ZonesControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
