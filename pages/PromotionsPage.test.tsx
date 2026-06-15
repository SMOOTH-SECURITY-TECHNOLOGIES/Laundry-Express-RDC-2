// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PromotionsControlCenter } from './PromotionsControlCenter';
import { renderComponent, byText } from '../components/admin/promotions/test-utils';
import { promotionsFixtureBundle } from '../lib/admin/promotions-fixtures';

vi.mock('../hooks/usePromotionsCenter', () => ({ default: vi.fn() }));
import usePromotionsCenter from '../hooks/usePromotionsCenter';

const bundle = promotionsFixtureBundle();

const mockHook = (overrides: Partial<ReturnType<typeof usePromotionsCenter>> = {}) => {
  vi.mocked(usePromotionsCenter).mockReturnValue({
    kpis: bundle.kpis, growthScore: bundle.growthScore, activePromotions: bundle.activePromotions,
    campaigns: bundle.campaigns, segments: bundle.segments, reactivation: bundle.reactivation,
    loyalty: bundle.loyalty, referral: bundle.referral, zones: bundle.zones, funnel: bundle.funnel,
    attribution: bundle.attribution, abTests: bundle.abTests, topPromotions: bundle.topPromotions,
    riskPromotions: bundle.riskPromotions, insights: bundle.insights,
    loading: false, error: null, degraded: false, wsConnected: true,
    refresh: vi.fn(), handleCreate: vi.fn().mockResolvedValue({ id: 'p-new' }),
    handleUpdate: vi.fn(), handleDelete: vi.fn(), handlePause: vi.fn(),
    handleCreateCampaign: vi.fn().mockResolvedValue({ id: 'c-new' }),
    handleExport: vi.fn().mockResolvedValue({ filename: 'promotions.csv', count: 10 }),
    ...overrides,
  } as ReturnType<typeof usePromotionsCenter>);
};

describe('PromotionsControlCenter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders header and KPI strip', () => {
    mockHook();
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(byText(container, 'Promotions Center')).toBeTruthy();
    expect(byText(container, 'Promotions actives')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('42500');
  });

  it('renders active promotions table P0', () => {
    mockHook();
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(byText(container, 'WELCOME20')).toBeTruthy();
    expect(byText(container, 'FREESHIP')).toBeTruthy();
    expect(byText(container, 'REACTIVATE30')).toBeTruthy();
  });

  it('renders funnel segments and growth score', () => {
    mockHook();
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(byText(container, 'Growth Score')).toBeTruthy();
    expect(byText(container, '82')).toBeTruthy();
    expect(byText(container, 'Funnel de conversion')).toBeTruthy();
    expect(byText(container, 'Segments performants')).toBeTruthy();
    expect(byText(container, '10')).toBeTruthy();
  });

  it('renders insights and top promotions', () => {
    mockHook();
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(byText(container, 'Insights IA')).toBeTruthy();
    expect(byText(container, 'livraison gratuite')).toBeTruthy();
    expect(byText(container, 'Top promotions')).toBeTruthy();
  });

  it('shows error state', () => {
    mockHook({ error: 'Impossible de charger le Promotions Center.', kpis: null });
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(byText(container, 'Impossible de charger le Promotions Center.')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    mockHook();
    const { container } = renderComponent(<PromotionsControlCenter />);
    expect(container.textContent).not.toMatch(/undefined|null|NaN|Invalid Date|N\/A/);
  });
});
