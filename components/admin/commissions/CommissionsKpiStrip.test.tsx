// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CommissionsKpiStrip } from './CommissionsKpiStrip';
import { renderComponent, byText } from './test-utils';
import { commissionKpis } from '../../../lib/admin/commissions-fixtures';

describe('CommissionsKpiStrip', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = renderComponent(<CommissionsKpiStrip kpis={commissionKpis} />);
    expect(byText(container, 'Commissions générées')).toBeTruthy();
    expect(byText(container, 'Commissions dues')).toBeTruthy();
    expect(byText(container, 'Commissions payées')).toBeTruthy();
    expect(byText(container, 'Commissions en litige')).toBeTruthy();
    expect(byText(container, 'Commissions manquantes')).toBeTruthy();
    expect(byText(container, 'Taux de collecte')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('94%');
  });
});
