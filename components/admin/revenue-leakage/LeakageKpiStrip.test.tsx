// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { LeakageKpiStrip } from './LeakageKpiStrip';
import { renderComponent, byText } from './test-utils';
import { leakageKpis } from '../../../lib/admin/revenue-leakage-fixtures';

describe('LeakageKpiStrip', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = renderComponent(<LeakageKpiStrip kpis={leakageKpis} />);
    expect(byText(container, 'Revenue at Risk')).toBeTruthy();
    expect(byText(container, 'Cas ouverts')).toBeTruthy();
    expect(byText(container, 'Critiques')).toBeTruthy();
    expect(byText(container, 'Corrigés ce mois')).toBeTruthy();
    expect(byText(container, 'Taux de fuite')).toBeTruthy();
    expect(byText(container, 'Temps moyen résolution')).toBeTruthy();
    expect(container.textContent).toContain('1.8%');
  });
});
