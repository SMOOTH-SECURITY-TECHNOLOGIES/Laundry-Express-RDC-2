// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralKpiCards } from './ReferralKpiCards';
import { renderComponent, byText } from './test-utils';
import type { ReferralKpis } from '../../../lib/admin/referrals-types';

const sample: ReferralKpis = {
  usersWithCode: 1284, usersWithCodeChange: 18.4, usersWithCodeSparkline: [1100, 1200, 1284],
  referredUsers: 856, referredUsersChange: 22.7, referredUsersSparkline: [700, 800, 856],
  discountsUsed: 623, discountsUsedChange: 16.3, discountsUsedSparkline: [500, 580, 623],
  bonusPoints: 428500, bonusPointsChange: 28.8, bonusPointsSparkline: [380000, 410000, 428500],
  completedConversions: 312, completedConversionsChange: 21.1, completedConversionsSparkline: [250, 280, 312],
  revenueGenerated: 24850, revenueGeneratedChange: 3.2, revenueGeneratedSparkline: [22000, 23500, 24850],
};

describe('ReferralKpiCards', () => {
  it('renders all 6 KPI cards without NaN', () => {
    const { container } = renderComponent(<ReferralKpiCards kpis={sample} />);
    expect(byText(container, 'Utilisateurs avec code')).toBeTruthy();
    expect(byText(container, 'Revenus générés')).toBeTruthy();
    expect(container.textContent).not.toContain('NaN');
    expect(container.textContent).not.toContain('undefined');
  });
});
