// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DriverAvailabilityCard } from './DriverAvailabilityCard';
import { renderComponent, byText } from './test-utils';
import { dispatcherDrivers } from '../../../lib/admin/dispatcher-fixtures';

describe('DriverAvailabilityCard', () => {
  it('renders driver availability table', () => {
    const { container } = renderComponent(<DriverAvailabilityCard drivers={dispatcherDrivers} />);
    expect(byText(container, 'Chauffeurs disponibles')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeTruthy();
    expect(byText(container, 'Disponible')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
  });

  it('filters drivers by search', () => {
    const { container } = renderComponent(<DriverAvailabilityCard drivers={dispatcherDrivers} search="Grace" />);
    expect(byText(container, 'Grace B.')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeFalsy();
  });
});
