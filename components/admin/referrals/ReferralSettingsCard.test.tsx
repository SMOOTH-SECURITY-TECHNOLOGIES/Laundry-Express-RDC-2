// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralSettingsCard } from './ReferralSettingsCard';
import { renderComponent, byText } from './test-utils';
import type { ReferralSettings } from '../../../lib/admin/referrals-types';

const settings: ReferralSettings = {
  isEnabled: true,
  referrerBonusPoints: 500,
  refereeDiscountAmount: 5,
  referrerConversionBonus: 500,
  refereeConversionBonus: 100,
  pointsExpiryDays: 365,
  bonusCapPerReferrer: 50000,
  allowedChannels: ['whatsapp', 'email'],
};

describe('ReferralSettingsCard', () => {
  it('renders configuration fields', () => {
    const { container } = renderComponent(
      <ReferralSettingsCard settings={settings} onChange={() => {}} onSave={() => {}} />,
    );
    expect(byText(container, 'Configuration du programme de parrainage')).toBeTruthy();
    expect(byText(container, 'Bonus parrain (points)')).toBeTruthy();
    expect(byText(container, 'Enregistrer les paramètres')).toBeTruthy();
  });
});
