// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SlaKpiCards } from './SlaKpiCards';
import { renderComponent, byText } from './test-utils';
import { slaKpis } from '../../../lib/admin/sla-fixtures';

describe('SlaKpiCards', () => {
  it('renders all 8 KPI cards', () => {
    const { container } = renderComponent(<SlaKpiCards kpis={slaKpis} />);
    expect(byText(container, 'SLA Global')).toBeTruthy();
    expect(byText(container, 'Commandes sous SLA')).toBeTruthy();
    expect(byText(container, 'Commandes à risque')).toBeTruthy();
    expect(byText(container, 'Commandes dépassées')).toBeTruthy();
    expect(byText(container, 'Temps moyen livraison')).toBeTruthy();
    expect(byText(container, 'ETA moyen')).toBeTruthy();
    expect(byText(container, 'Incidents SLA')).toBeTruthy();
    expect(byText(container, 'Coût SLA (mois)')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('94%');
    expect(container.textContent?.replace(/\s/g, '')).toContain('1180');
  });
});
