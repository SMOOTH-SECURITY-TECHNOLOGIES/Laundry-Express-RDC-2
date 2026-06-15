// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RevenueControlCenter } from './RevenueControlCenter';
import { renderComponent, byText } from '../components/admin/finance/test-utils';
import { financeFixtureBundle } from '../lib/admin/finance-fixtures';

vi.mock('../hooks/useFinanceCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import useFinanceCenter from '../hooks/useFinanceCenter';

const bundle = financeFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useFinanceCenter>> = {}) => {
  vi.mocked(useFinanceCenter).mockReturnValue({
    dashboard: bundle.dashboard, dailyRevenue: bundle.dailyRevenue, breakdown: bundle.breakdown,
    partners: bundle.partners, leakage: bundle.leakage, alerts: bundle.alerts,
    zones: bundle.zones, truthCorridors: bundle.truthCorridors,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleCreateRule: vi.fn(), handleExport: vi.fn().mockResolvedValue({ filename: 'finance.csv', count: 12 }),
    applyFilters: vi.fn(), ...overrides,
  } as ReturnType<typeof useFinanceCenter>);
};

describe('RevenueControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and trend KPI', () => {
    mockHook();
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(byText(container, 'Revenus')).toBeTruthy();
    expect(byText(container, 'Tendance Revenus')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('+18.4%');
  });

  it('renders KPI grid and breakdown', () => {
    mockHook();
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(byText(container, "Revenu aujourd'hui")).toBeTruthy();
    expect(byText(container, 'Répartition des revenus')).toBeTruthy();
    expect(byText(container, 'Services de lavage')).toBeTruthy();
    expect(byText(container, 'Prestige Pressing')).toBeTruthy();
  });

  it('renders leakage and truth corridor', () => {
    mockHook();
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(byText(container, 'Revenue Leakage')).toBeTruthy();
    expect(byText(container, 'Paiements orphelins')).toBeTruthy();
    expect(byText(container, 'Financial Truth Corridor')).toBeTruthy();
    expect(byText(container, 'Investigate Financial Flow')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Finance Center.', dashboard: null });
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(byText(container, 'Impossible de charger le Finance Center.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<RevenueControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
