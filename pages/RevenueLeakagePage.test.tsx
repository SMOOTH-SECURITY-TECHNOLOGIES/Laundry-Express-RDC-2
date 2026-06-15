// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RevenueLeakageControlCenter } from './RevenueLeakageControlCenter';
import { renderComponent, byText } from '../components/admin/revenue-leakage/test-utils';
import { revenueLeakageFixtureBundle } from '../lib/admin/revenue-leakage-fixtures';

vi.mock('../hooks/useRevenueLeakageCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import useRevenueLeakageCenter from '../hooks/useRevenueLeakageCenter';

const bundle = revenueLeakageFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useRevenueLeakageCenter>> = {}) => {
  vi.mocked(useRevenueLeakageCenter).mockReturnValue({
    kpis: bundle.kpis, riskScore: bundle.riskScore, orphanPayments: bundle.orphanPayments,
    unbilledCollections: bundle.unbilledCollections, missingCommissions: bundle.missingCommissions,
    suspiciousRefunds: bundle.suspiciousRefunds, uncollectedOrders: bundle.uncollectedOrders,
    payoutAnomalies: bundle.payoutAnomalies, timeline: bundle.timeline, corridor: bundle.corridor,
    partners: bundle.partners, zones: bundle.zones, trend: bundle.trend, alerts: bundle.alerts,
    assignments: bundle.assignments, truthHealth: bundle.truthHealth, financialImpact: bundle.financialImpact,
    insights: bundle.insights, investigationDetail: bundle.investigationDetail,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleInvestigate: vi.fn(), handleResolve: vi.fn(), handleAssign: vi.fn(),
    handleExport: vi.fn().mockResolvedValue({ filename: 'leakage.csv', count: 10 }),
    ...overrides,
  } as ReturnType<typeof useRevenueLeakageCenter>);
};

describe('RevenueLeakageControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPI strip', () => {
    mockHook();
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(byText(container, 'Revenue Leakage Center')).toBeTruthy();
    expect(byText(container, 'Revenue at Risk')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('18450');
  });

  it('renders detection blocks P0', () => {
    mockHook();
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(byText(container, 'Paiements orphelins')).toBeTruthy();
    expect(byText(container, 'PAY-89451')).toBeTruthy();
    expect(byText(container, 'Commissions manquantes')).toBeTruthy();
    expect(byText(container, 'Collectes non facturées')).toBeTruthy();
    expect(byText(container, 'Prestige Pressing')).toBeTruthy();
  });

  it('renders risk gauge and financial impact', () => {
    mockHook();
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(byText(container, 'Revenue Leakage Risk')).toBeTruthy();
    expect(byText(container, '73')).toBeTruthy();
    expect(byText(container, 'Impact financier')).toBeTruthy();
    expect(byText(container, 'Montant récupéré ce mois')).toBeTruthy();
  });

  it('renders corridor partners and insights', () => {
    mockHook();
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(byText(container, 'Leakage par corridor')).toBeTruthy();
    expect(byText(container, 'Insights IA')).toBeTruthy();
    expect(byText(container, '80% des commissions manquantes')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Revenue Leakage Center.', kpis: null });
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(byText(container, 'Impossible de charger le Revenue Leakage Center.')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<RevenueLeakageControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
