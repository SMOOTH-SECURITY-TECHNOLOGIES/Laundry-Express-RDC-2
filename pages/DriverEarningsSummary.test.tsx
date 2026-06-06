// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../components/order-marketplace/test-utils';
import { DriverEarningsSummary } from './DriverDashboardPage';

describe('DriverEarningsSummary', () => {
  it('calculates and renders the estimated total', () => {
    const onOpen = vi.fn();
    const view = renderComponent(
      <DriverEarningsSummary breakdown={{ base: 10, bonus: 4, tips: 2, other: 1 }} onOpen={onOpen} />
    );

    expect(byText(view.container, '17.00 $')).not.toBeNull();
    view.click(buttonByText(view.container, /voir tous mes gains/i)!);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
