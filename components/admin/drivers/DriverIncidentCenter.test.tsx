// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DriverIncidentCenter } from './DriverIncidentCenter';
import { renderComponent, byText } from './test-utils';
import { driverIncidents } from '../../../lib/admin/drivers-fixtures';

describe('DriverIncidentCenter', () => {
  it('renders incidents', () => {
    const { container } = renderComponent(<DriverIncidentCenter incidents={driverIncidents} onInvestigate={vi.fn()} />);
    expect(byText(container, 'Retard important')).toBeTruthy();
    expect(byText(container, 'Critique')).toBeTruthy();
  });
});
