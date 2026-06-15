// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DriverMap } from './DriverMap';
import { renderComponent, byText } from './test-utils';
import { driverMapPoints } from '../../../lib/admin/drivers-fixtures';

describe('DriverMap', () => {
  it('renders live map with legend', () => {
    const { container } = renderComponent(<DriverMap points={driverMapPoints} />);
    expect(byText(container, 'Localisation chauffeurs')).toBeTruthy();
    expect(byText(container, 'LIVE')).toBeTruthy();
    expect(byText(container, 'Disponible')).toBeTruthy();
  });
});
