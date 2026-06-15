// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DisputesControlCenter } from './DisputesControlCenter';
import { renderComponent, byText } from '../components/admin/disputes/test-utils';
import {
  mockSummary,
  mockDisputeRequests,
  mockTrend,
  mockBreakdown,
  mockStatusAmounts,
  mockRootCauses,
  mockSla,
  mockFinancialImpact,
  mockAnomalies,
  mockProtection,
  mockActivity,
} from '../lib/admin/disputes-fixtures';

vi.mock('../hooks/useAdminDisputes', () => ({
  useAdminDisputes: vi.fn(),
}));

import { useAdminDisputes } from '../hooks/useAdminDisputes';

const mockHook = (overrides: Partial<ReturnType<typeof useAdminDisputes>> = {}) => {
  vi.mocked(useAdminDisputes).mockReturnValue({
    summary: mockSummary,
    requests: mockDisputeRequests,
    breakdown: mockBreakdown,
    statusAmounts: mockStatusAmounts,
    trend: mockTrend,
    partners: [],
    partnerOptions: ['Prestige Pressing'],
    rootCauses: mockRootCauses,
    sla: mockSla,
    financial: mockFinancialImpact,
    anomalies: mockAnomalies,
    protection: mockProtection,
    activity: mockActivity,
    loading: false,
    error: null,
    refresh: vi.fn(),
    filters: { status: '', type: '', dateFrom: '', dateTo: '', partner: '', paymentMethod: '', amountRange: '', search: '', severity: '' },
    setFilters: vi.fn(),
    resetFilters: vi.fn(),
    readOnly: true,
    degraded: false,
    createDispute: vi.fn(),
    approveDispute: vi.fn(),
    rejectDispute: vi.fn(),
    assignDispute: vi.fn(),
    investigateDispute: vi.fn(),
    exportDisputes: vi.fn().mockResolvedValue({ url: '/export', count: 148 }),
    auditDisputes: vi.fn(),
    openDispute: vi.fn(),
    openOrderTruth: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAdminDisputes>);
};

describe('DisputesControlCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI row and header', () => {
    mockHook();
    const { container } = renderComponent(<DisputesControlCenter />);
    expect(byText(container, 'Gestion des litiges')).toBeTruthy();
    expect(byText(container, 'Demandes totales')).toBeTruthy();
    expect(byText(container, '148')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger les litiges.', summary: null, requests: [] });
    const { container } = renderComponent(<DisputesControlCenter />);
    expect(byText(container, 'Impossible de charger les litiges.')).toBeTruthy();
    expect(byText(container, 'Réessayer')).toBeTruthy();
  });

  it('shows empty state when no requests', () => {
    mockHook({ requests: [] });
    const { container } = renderComponent(<DisputesControlCenter />);
    expect(byText(container, 'Aucune demande de remboursement trouvée.')).toBeTruthy();
  });

  it('shows degraded mode banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<DisputesControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined or null placeholders', () => {
    mockHook();
    const { container } = renderComponent(<DisputesControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
