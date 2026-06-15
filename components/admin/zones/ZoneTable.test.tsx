// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ZoneTable } from './ZoneTable';
import { renderComponent, byText } from './test-utils';
import { fixtureZones } from '../../../lib/admin/zones-fixtures';

describe('ZoneTable', () => {
  it('renders zones with status badges', () => {
    const { container } = renderComponent(
      <ZoneTable zones={fixtureZones} onView={vi.fn()} onEdit={vi.fn()} onTariffs={vi.fn()} onHistory={vi.fn()} onDelete={vi.fn()} />
    );
    expect(byText(container, 'Gombe')).toBeTruthy();
    expect(byText(container, 'Actif')).toBeTruthy();
    expect(byText(container, 'À risque')).toBeTruthy();
    expect(byText(container, 'Saturé')).toBeTruthy();
  });

  it('filters by search', () => {
    const { container } = renderComponent(
      <ZoneTable zones={fixtureZones} search="Kintambo" onView={vi.fn()} onEdit={vi.fn()} onTariffs={vi.fn()} onHistory={vi.fn()} onDelete={vi.fn()} />
    );
    expect(byText(container, 'Kintambo')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeFalsy();
  });
});
