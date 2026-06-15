// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralImpactTable } from './ReferralImpactTable';
import { renderComponent, byText } from './test-utils';

describe('ReferralImpactTable', () => {
  it('renders impact comparison', () => {
    const { container } = renderComponent(
      <ReferralImpactTable metrics={[{
        indicator: 'Taux conversion', referred: 36.4, nonReferred: 18.7, difference: 17.7,
      }]} />,
    );
    expect(byText(container, 'Taux conversion')).toBeTruthy();
    expect(byText(container, 'Parrainés')).toBeTruthy();
  });
});
