// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { FinanceKpiGrid } from './FinanceKpiGrid';
import { renderComponent, byText } from './test-utils';
import { financeDashboard } from '../../../lib/admin/finance-fixtures';

describe('FinanceKpiGrid', () => {
  it('renders all 7 KPI cards', () => {
    const { container } = renderComponent(<FinanceKpiGrid dashboard={financeDashboard} />);
    expect(byText(container, "Revenu aujourd'hui")).toBeTruthy();
    expect(byText(container, 'Revenu semaine')).toBeTruthy();
    expect(byText(container, 'Revenu mois')).toBeTruthy();
    expect(byText(container, 'Commissions dues')).toBeTruthy();
    expect(byText(container, 'Commissions payées')).toBeTruthy();
    expect(byText(container, 'Cash en transit')).toBeTruthy();
    expect(byText(container, 'Marge brute')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('42750');
  });
});
