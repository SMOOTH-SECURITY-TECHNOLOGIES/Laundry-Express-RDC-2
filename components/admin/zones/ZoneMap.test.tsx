// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ZoneMap } from './ZoneMap';
import { renderComponent, byText } from './test-utils';
import { fixtureZones } from '../../../lib/admin/zones-fixtures';

describe('ZoneMap', () => {
  it('renders Kinshasa zone map', () => {
    const { container } = renderComponent(<ZoneMap zones={fixtureZones} />);
    expect(byText(container, 'Carte des zones')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
    expect(byText(container, 'Saine')).toBeTruthy();
  });
});
