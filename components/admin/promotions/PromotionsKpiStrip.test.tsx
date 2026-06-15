// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { PromotionsKpiStrip } from './PromotionsKpiStrip';
import { renderComponent, byText } from './test-utils';
import { promoKpis } from '../../../lib/admin/promotions-fixtures';

describe('PromotionsKpiStrip', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = renderComponent(<PromotionsKpiStrip kpis={promoKpis} />);
    expect(byText(container, 'Promotions actives')).toBeTruthy();
    expect(byText(container, 'Utilisations')).toBeTruthy();
    expect(byText(container, 'Revenus générés')).toBeTruthy();
    expect(byText(container, 'ROI moyen')).toBeTruthy();
    expect(byText(container, 'Clients réactivés')).toBeTruthy();
    expect(byText(container, 'Taux conversion promo')).toBeTruthy();
    expect(container.textContent).toContain('5.8');
    expect(container.textContent).toContain('18.4%');
  });
});
