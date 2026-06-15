// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RefundsControlCenter } from './RefundsControlCenter';
import { renderComponent, byText } from '../components/admin/refunds/test-utils';
import { refundsFixtureBundle } from '../lib/admin/refunds-fixtures';

vi.mock('../hooks/useRefundsCenter', () => ({ default: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useAppContext: () => ({ setAdminSectionParams: vi.fn() }) }));
import useRefundsCenter from '../hooks/useRefundsCenter';

const bundle = refundsFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof useRefundsCenter>> = {}) => {
  vi.mocked(useRefundsCenter).mockReturnValue({
    kpis: bundle.kpis, health: bundle.health, pipeline: bundle.pipeline,
    requests: bundle.requests, timeline: bundle.timeline, reasonBreakdown: bundle.reasonBreakdown,
    partnerStats: bundle.partnerStats, monthlyTrend: bundle.monthlyTrend, leakage: bundle.leakage,
    truthCorridors: bundle.truthCorridors, alerts: bundle.alerts, fraudItems: bundle.fraudItems,
    automation: bundle.automation,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleApprove: vi.fn(), handleReject: vi.fn(), handleCreatePolicy: vi.fn(),
    handleExport: vi.fn().mockResolvedValue({ filename: 'refunds.csv', count: 10 }),
    ...overrides,
  } as ReturnType<typeof useRefundsCenter>);
};

describe('RefundsControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPI strip', () => {
    mockHook();
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(byText(container, 'Remboursements')).toBeTruthy();
    expect(byText(container, 'Demandes ouvertes')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('18250');
  });

  it('renders health, pipeline and requests table', () => {
    mockHook();
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(byText(container, 'Refund Health')).toBeTruthy();
    expect(byText(container, 'Pipeline des remboursements')).toBeTruthy();
    expect(byText(container, 'Refund Requests')).toBeTruthy();
    expect(byText(container, 'REF-8821')).toBeTruthy();
  });

  it('renders truth corridor and fraud detection', () => {
    mockHook();
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(byText(container, 'Refund Truth Corridor')).toBeTruthy();
    expect(byText(container, 'Fraud Detection')).toBeTruthy();
    expect(byText(container, 'Refund Leakage')).toBeTruthy();
    expect(byText(container, 'Investigate Refund')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Refund Center.', kpis: null });
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(byText(container, 'Impossible de charger le Refund Center.')).toBeTruthy();
  });

  it('shows degraded banner', () => {
    mockHook({ degraded: true });
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(byText(container, 'Mode dégradé')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<RefundsControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
