// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../hooks/usePaymentGatewaysCenter', () => ({
  default: () => ({
    kpis: {
      revenueTrend: 18.4, revenueTrendSparkline: [],
      revenueToday: 1850, revenueTodayChange: 9, revenueTodayTx: 138,
      revenueWeek: 11000, revenueWeekChange: 12, revenueWeekTx: 785,
      revenueMonth: 42750, revenueMonthChange: 18, revenueMonthTx: 3245,
      commissionsDue: 5240, commissionsDueOps: 246,
      commissionsPaid: 18900, commissionsPaidOps: 156,
      cashInTransit: 2460, cashInTransitOps: 87,
    },
    gateways: [{ id: '1', slug: 'flutterwave', name: 'Flutterwave', channel: 'Mobile Money', logoKey: null, status: 'online', statusLabel: 'En ligne', volume: 100, revenue: 1000, commission: 100, successRate: 98, lastIncidentAt: null }],
    revenueDistribution: [], channelPerformance: [], transactions: [],
    cashFlow: { cashReceived: 1, cashWithdrawn: 1, cashInTransit: 1, cashNet: 1, sparkline7d: [], sparkline30d: [], sparkline90d: [] },
    commissions: { generated: 1, paid: 1, pending: 1, cancelled: 0, distribution: [] },
    incidents: [], successRateTrend: [], topPartners: [], settlements: [], webhooks: [],
    reconciliations: [], providerHealth: [], refunds: [], fraud: { score: 24, repeatedPayments: 0, suspiciousAmounts: 0, abusiveRefunds: 0, multipleAttempts: 0 },
    loading: false, error: null, refresh: vi.fn(), handleExport: vi.fn(), handleReconciliation: vi.fn(), handleTestWebhook: vi.fn(),
  }),
}));

import { PaymentGatewaysControlCenter } from './PaymentGatewaysControlCenter';

describe('PaymentGatewaysControlCenter', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders payment gateway header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<PaymentGatewaysControlCenter />); });
    expect(container.textContent).toContain('Passerelles paiement');
    expect(container.textContent).toContain('Revenu mois');
    root.unmount();
  });
});
