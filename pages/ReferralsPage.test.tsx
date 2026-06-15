// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../lib/admin/referrals-api', () => ({
  trackReferralEvent: vi.fn(),
  REFERRALS_WRITE_ENABLED: true,
}));

const mockBundle = {
  kpis: {
    usersWithCode: 1284, usersWithCodeChange: 18.4, usersWithCodeSparkline: [1200, 1284],
    referredUsers: 856, referredUsersChange: 22.7, referredUsersSparkline: [800, 856],
    discountsUsed: 623, discountsUsedChange: 16.3, discountsUsedSparkline: [600, 623],
    bonusPoints: 428500, bonusPointsChange: 28.8, bonusPointsSparkline: [400000, 428500],
    completedConversions: 312, completedConversionsChange: 21.1, completedConversionsSparkline: [280, 312],
    revenueGenerated: 24850, revenueGeneratedChange: 3.2, revenueGeneratedSparkline: [24000, 24850],
  },
  settings: {
    isEnabled: true, referrerBonusPoints: 500, refereeDiscountAmount: 5,
    referrerConversionBonus: 500, refereeConversionBonus: 100,
    pointsExpiryDays: 365, bonusCapPerReferrer: 50000, allowedChannels: ['whatsapp'] as string[],
  },
  channels: [{ channel: 'WhatsApp', percent: 46, conversions: 156, roi: 7.2, color: '#25D366' }],
  topReferrers: [] as never[],
  recentConversions: [{ id: '1', refereeName: 'A', refereeEmail: 'a@t.com', orderId: null, date: null, discountUsed: 5, status: 'converted' }],
  watchlist: [] as never[],
  trends: [{ date: '2026-06-01', conversions: 10, revenue: 500 }],
  impact: [] as never[],
  popularCodes: [] as never[],
  totalRevenue: 24850,
  loading: false,
  error: null as string | null,
  source: 'backend',
  days: 7,
  refresh: vi.fn(),
  handleSaveSettings: vi.fn(),
  handleCreateCampaign: vi.fn(),
  handleManualBonus: vi.fn(),
  handleExport: vi.fn(),
  handleAudit: vi.fn(),
};

vi.mock('../hooks/useReferralsCenter', () => ({
  default: () => mockBundle,
}));

import { ReferralsControlCenter } from './ReferralsControlCenter';

describe('ReferralsPage', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('renders Referral Growth Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<ReferralsControlCenter />); });
    expect(container.textContent).toContain('Parrainage');
    expect(container.textContent).toContain('Acquisition');
    root.unmount();
    container.remove();
  });
});
