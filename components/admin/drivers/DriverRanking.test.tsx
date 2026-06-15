// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DriverRanking } from './DriverRanking';
import { renderComponent, byText } from './test-utils';
import { driverRanking } from '../../../lib/admin/drivers-fixtures';

describe('DriverRanking', () => {
  it('renders top drivers', () => {
    const { container } = renderComponent(<DriverRanking ranking={driverRanking} />);
    expect(byText(container, 'Performance des chauffeurs')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
  });
});
