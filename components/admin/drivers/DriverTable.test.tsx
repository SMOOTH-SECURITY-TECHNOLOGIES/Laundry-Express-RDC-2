// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DriverTable } from './DriverTable';
import { renderComponent, byText } from './test-utils';
import { fixtureDrivers } from '../../../lib/admin/drivers-fixtures';

describe('DriverTable', () => {
  it('renders drivers with status badges', () => {
    const { container } = renderComponent(
      <DriverTable drivers={fixtureDrivers} onViewProfile={vi.fn()} onCall={vi.fn()} onWhatsApp={vi.fn()} onMap={vi.fn()} onHistory={vi.fn()} onSuspend={vi.fn()} />
    );
    expect(byText(container, 'Koffi A.')).toBeTruthy();
    expect(byText(container, 'Disponible')).toBeTruthy();
    expect(byText(container, 'En mission')).toBeTruthy();
    expect(byText(container, 'Suspendu')).toBeTruthy();
  });

  it('filters by search', () => {
    const { container } = renderComponent(
      <DriverTable drivers={fixtureDrivers} search="Grace" onViewProfile={vi.fn()} onCall={vi.fn()} onWhatsApp={vi.fn()} onMap={vi.fn()} onHistory={vi.fn()} onSuspend={vi.fn()} />
    );
    expect(byText(container, 'Grace B.')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeFalsy();
  });
});
