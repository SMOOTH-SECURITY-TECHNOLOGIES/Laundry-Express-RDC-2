// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DispatchMap } from './DispatchMap';
import { renderComponent, byText } from './test-utils';
import { dispatcherMapPoints, dispatcherMapClusters, dispatcherMapZoneKpis } from '../../../lib/admin/dispatcher-fixtures';

describe('DispatchMap', () => {
  it('renders Kinshasa map with zones and LIVE badge', () => {
    const { container } = renderComponent(
      <DispatchMap points={dispatcherMapPoints} clusters={dispatcherMapClusters} zoneKpis={dispatcherMapZoneKpis} />
    );
    expect(byText(container, 'Carte opérationnelle - Kinshasa')).toBeTruthy();
    expect(byText(container, 'LIVE')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
    expect(byText(container, 'Chauffeurs')).toBeTruthy();
  });

  it('does not render undefined placeholders', () => {
    const { container } = renderComponent(
      <DispatchMap points={dispatcherMapPoints} clusters={dispatcherMapClusters} zoneKpis={dispatcherMapZoneKpis} />
    );
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
  });
});
