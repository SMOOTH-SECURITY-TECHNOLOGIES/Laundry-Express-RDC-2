// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DriverRevenueChart } from './DriverRevenueChart';
import { renderComponent, byText } from './test-utils';
import { driverRevenueTrend } from '../../../lib/admin/drivers-fixtures';

describe('DriverRevenueChart', () => {
  it('renders revenue KPIs and chart', () => {
    const { container } = renderComponent(<DriverRevenueChart trend={driverRevenueTrend} />);
    expect(byText(container, 'Revenus générés')).toBeTruthy();
    expect(byText(container, 'Journalier')).toBeTruthy();
    expect(byText(container, 'Juin')).toBeTruthy();
  });
});
