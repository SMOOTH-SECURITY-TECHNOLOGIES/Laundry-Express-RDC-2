// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SlaControlCenter } from './SlaControlCenter';
import { renderComponent, byText } from '../components/admin/sla/test-utils';
import { slaFixtureBundle } from '../lib/admin/sla-fixtures';

vi.mock('../hooks/useSlaCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import useSlaCenter from '../hooks/useSlaCenter';

const bundle = slaFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useSlaCenter>> = {}) => {
  vi.mocked(useSlaCenter).mockReturnValue({
    kpis: bundle.kpis, distribution: bundle.distribution, heatmap: bundle.heatmap,
    timeline: bundle.timeline, zonePerformance: bundle.zonePerformance,
    partnerPerformance: bundle.partnerPerformance, driverPerformance: bundle.driverPerformance,
    atRiskOrders: bundle.atRiskOrders, breachedOrders: bundle.breachedOrders,
    violationCauses: bundle.violationCauses, financialImpact: bundle.financialImpact,
    truthAnomalies: bundle.truthAnomalies, problematicOrders: bundle.problematicOrders,
    dispatcherSnapshot: bundle.dispatcherSnapshot, alerts: bundle.alerts, rules: bundle.rules,
    loading: false, error: null, degraded: false,
    refresh: vi.fn(), handleCreateRule: vi.fn(), handleExport: vi.fn().mockResolvedValue({ filename: 'sla.csv', count: 10 }),
    ...overrides,
  } as ReturnType<typeof useSlaCenter>);
};

describe('SlaControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPIs', () => {
    mockHook();
    const { container } = renderComponent(<SlaControlCenter />);
    expect(byText(container, 'SLA Center')).toBeTruthy();
    expect(byText(container, 'SLA Global')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('94%');
  });

  it('renders zone map and at-risk orders', () => {
    mockHook();
    const { container } = renderComponent(<SlaControlCenter />);
    expect(byText(container, 'SLA par zone')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
    expect(byText(container, 'Commandes à risque')).toBeTruthy();
    expect(byText(container, 'ORD-7845')).toBeTruthy();
  });

  it('renders financial impact and alerts', () => {
    mockHook();
    const { container } = renderComponent(<SlaControlCenter />);
    expect(byText(container, 'Impact financier')).toBeTruthy();
    expect(byText(container, 'Alertes SLA')).toBeTruthy();
    expect(byText(container, 'Prestige Pressing')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le SLA Center.', kpis: null });
    const { container } = renderComponent(<SlaControlCenter />);
    expect(byText(container, 'Impossible de charger le SLA Center.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<SlaControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<SlaControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
