// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OrdersControlCenter } from './OrdersControlCenter';
import { renderComponent, byText } from '../components/admin/orders/test-utils';
import {
  orderKpis,
  orderPipeline,
  liveOrders,
  orderSlaData,
  orderFunnel,
  orderRevenueData,
  orderRevenueBlock,
  orderAnomalies,
  orderPartners,
  orderInvoiceKpis,
  orderActivity,
  orderMapZones,
} from '../lib/admin/orders-fixtures';

vi.mock('../hooks/useOrdersCenter', () => ({
  default: vi.fn(),
}));

import useOrdersCenter from '../hooks/useOrdersCenter';

const mockHook = (overrides: Partial<ReturnType<typeof useOrdersCenter>> = {}) => {
  vi.mocked(useOrdersCenter).mockReturnValue({
    kpis: orderKpis,
    pipeline: orderPipeline,
    orders: liveOrders,
    sla: orderSlaData,
    funnel: orderFunnel,
    revenue: orderRevenueData,
    revenueBlock: orderRevenueBlock,
    anomalies: orderAnomalies,
    partners: orderPartners,
    invoices: orderInvoiceKpis,
    activity: orderActivity,
    mapZones: orderMapZones,
    loading: false,
    error: null,
    degraded: false,
    refresh: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useOrdersCenter>);
};

describe('OrdersControlCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI row and header', () => {
    mockHook();
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(byText(container, 'Gestion des commandes')).toBeTruthy();
    expect(byText(container, 'Total commandes')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('1254');
  });

  it('renders pipeline and live operations sections', () => {
    mockHook();
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(byText(container, 'Pipeline des commandes')).toBeTruthy();
    expect(byText(container, 'Opérations en cours')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger les commandes.', kpis: null });
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(byText(container, 'Impossible de charger les commandes.')).toBeTruthy();
    expect(byText(container, 'Réessayer')).toBeTruthy();
  });

  it('shows empty state when no kpis', () => {
    mockHook({ kpis: null });
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(byText(container, 'Aucune commande trouvée')).toBeTruthy();
  });

  it('shows degraded mode banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined or null placeholders', () => {
    mockHook();
    const { container } = renderComponent(<OrdersControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
