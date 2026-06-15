// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { LoyaltyKpiCards } from './LoyaltyKpiCards';
import { renderComponent, byText } from './test-utils';
import type { LoyaltyKpis } from '../../../lib/admin/loyalty-types';

const sample: LoyaltyKpis = {
  members: 1284, membersChange: 8.2, membersSparkline: [1200, 1250, 1284],
  pointsCirculation: 220000, pointsCirculationChange: 12.4, pointsCirculationSparkline: [200000, 210000, 220000],
  pointsEarned: 312450, pointsEarnedChange: 15.6, pointsEarnedSparkline: [280000, 300000, 312450],
  pointsRedeemed: 86200, pointsRedeemedChange: 9.3, pointsRedeemedSparkline: [80000, 83000, 86200],
  pointsValue: 2200, pointsValueChange: 11, pointsValueSparkline: [2000, 2100, 2200],
  redemptionRate: 39, redemptionRateChange: 4.3, redemptionRateSparkline: [35, 37, 39],
  influencedRevenue: 42500, influencedRevenueChange: 21.2, influencedRevenueSparkline: [38000, 40000, 42500],
  retentionRate: 74, retentionRateChange: 6.1, retentionRateSparkline: [68, 71, 74],
};

describe('LoyaltyKpiCards', () => {
  it('renders all 8 KPI cards', () => {
    const { container } = renderComponent(<LoyaltyKpiCards kpis={sample} />);
    expect(byText(container, 'Membres fidélité')).toBeTruthy();
    expect(byText(container, 'Points en circulation')).toBeTruthy();
    expect(byText(container, 'Taux redemption')).toBeTruthy();
    expect(byText(container, 'Rétention membres')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('39%');
  });
});
