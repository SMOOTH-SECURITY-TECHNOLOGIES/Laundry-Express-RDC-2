// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DisputeKpiCards } from './DisputeKpiCards';
import { renderComponent, byText } from './test-utils';
import { mockSummary } from '../../../lib/admin/disputes-fixtures';

describe('DisputeKpiCards', () => {
  it('renders 8 KPI cards with summary values', () => {
    const { container } = renderComponent(<DisputeKpiCards summary={mockSummary} />);
    expect(byText(container, 'Demandes totales')).toBeTruthy();
    expect(byText(container, 'En attente')).toBeTruthy();
    expect(byText(container, 'Taux acceptation')).toBeTruthy();
    expect(byText(container, '78%')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
  });
});
