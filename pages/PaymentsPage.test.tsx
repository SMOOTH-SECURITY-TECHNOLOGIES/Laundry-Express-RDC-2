// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PaymentsControlCenter } from './PaymentsControlCenter';
import { renderComponent, byText } from '../components/admin/payments/test-utils';
import { paymentsFixtureBundle } from '../lib/admin/payments-fixtures';

vi.mock('../hooks/usePaymentsCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import usePaymentsCenter from '../hooks/usePaymentsCenter';

const bundle = paymentsFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof usePaymentsCenter>> = {}) => {
  vi.mocked(usePaymentsCenter).mockReturnValue({
    kpis: bundle.kpis, trend: bundle.trend, methods: bundle.methods, zones: bundle.zones,
    transactions: bundle.transactions, failed: bundle.failed, health: bundle.health,
    alerts: bundle.alerts, truthCorridors: bundle.truthCorridors, reconciliation: bundle.reconciliation,
    fraudSignals: bundle.fraudSignals, commissionWidget: bundle.commissionWidget,
    refundWidget: bundle.refundWidget, insights: bundle.insights, transactionDetail: bundle.transactionDetail,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleRetry: vi.fn(), handleExport: vi.fn().mockResolvedValue({ filename: 'payments.csv', count: 12 }),
    ...overrides,
  } as ReturnType<typeof usePaymentsCenter>);
};

describe('PaymentsControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPI strip', () => {
    mockHook();
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(byText(container, 'Payment Operations Center')).toBeTruthy();
    expect(byText(container, 'Paiements reçus')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('28450');
  });

  it('renders transactions and failed card', () => {
    mockHook();
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(byText(container, 'Dernières transactions')).toBeTruthy();
    expect(byText(container, 'Transactions échouées')).toBeTruthy();
    expect(byText(container, 'PAY-9901')).toBeTruthy();
    expect(byText(container, 'Carte expirée')).toBeTruthy();
  });

  it('renders truth corridor and insights', () => {
    mockHook();
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(byText(container, 'Payment Truth Corridor')).toBeTruthy();
    expect(byText(container, 'Payment Health')).toBeTruthy();
    expect(byText(container, 'Insights IA')).toBeTruthy();
    expect(byText(container, 'Réconciliation')).toBeTruthy();
    expect(byText(container, 'Détection fraude')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Payment Operations Center.', kpis: null });
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(byText(container, 'Impossible de charger le Payment Operations Center.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<PaymentsControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
