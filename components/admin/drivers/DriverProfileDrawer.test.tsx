// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DriverProfileDrawer } from './DriverProfileDrawer';
import { renderComponent, byText } from './test-utils';
import { fixtureDrivers } from '../../../lib/admin/drivers-fixtures';

describe('DriverProfileDrawer', () => {
  it('renders driver profile with score and documents', () => {
    const driver = fixtureDrivers[0];
    const { container } = renderComponent(
      <DriverProfileDrawer driver={driver} onClose={vi.fn()} onOrderTruth={vi.fn()} onInvestigate={vi.fn()} />
    );
    expect(byText(container, 'Profil chauffeur')).toBeTruthy();
    expect(byText(container, driver.name)).toBeTruthy();
    expect(byText(container, 'Driver Score')).toBeTruthy();
    expect(byText(container, 'Permis')).toBeTruthy();
    expect(byText(container, 'Voir Truth Timeline')).toBeTruthy();
  });

  it('returns null when no driver', () => {
    const { container } = renderComponent(
      <DriverProfileDrawer driver={null} onClose={vi.fn()} onOrderTruth={vi.fn()} onInvestigate={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });
});
