// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CommissionsControlCenter } from './CommissionsControlCenter';
import { renderComponent, byText } from '../components/admin/commissions/test-utils';
import { commissionsFixtureBundle } from '../lib/admin/commissions-fixtures';

vi.mock('../hooks/useCommissionsCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import useCommissionsCenter from '../hooks/useCommissionsCenter';

const bundle = commissionsFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useCommissionsCenter>> = {}) => {
  vi.mocked(useCommissionsCenter).mockReturnValue({
    kpis: bundle.kpis, health: bundle.health, rules: bundle.rules, services: bundle.services,
    partners: bundle.partners, timeline: bundle.timeline, leakage: bundle.leakage,
    topPartners: bundle.topPartners, monthlyTrend: bundle.monthlyTrend, breakdown: bundle.breakdown,
    revenueVsCommission: bundle.revenueVsCommission, truthCorridors: bundle.truthCorridors,
    alerts: bundle.alerts, automation: bundle.automation,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleCreateRule: vi.fn(), handleUpdateRule: vi.fn(),
    handleExport: vi.fn().mockResolvedValue({ filename: 'commissions.csv', count: 12 }),
    ...overrides,
  } as ReturnType<typeof useCommissionsCenter>);
};

describe('CommissionsControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPI strip', () => {
    mockHook();
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(byText(container, 'Commissions')).toBeTruthy();
    expect(byText(container, 'Commissions générées')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('52450');
  });

  it('renders health card and partner matrix', () => {
    mockHook();
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(byText(container, 'Commission Health')).toBeTruthy();
    expect(byText(container, 'Matrice des commissions')).toBeTruthy();
    expect(byText(container, 'Prestige Pressing')).toBeTruthy();
  });

  it('renders truth corridor and investigate', () => {
    mockHook();
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(byText(container, 'Commission Truth Corridor')).toBeTruthy();
    expect(byText(container, 'Commission Leakage')).toBeTruthy();
    expect(byText(container, 'Investigate Commission Flow')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Commission Center.', kpis: null });
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(byText(container, 'Impossible de charger le Commission Center.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<CommissionsControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
