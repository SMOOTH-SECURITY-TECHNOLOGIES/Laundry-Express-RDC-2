// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { RefundsKpiStrip } from './RefundsKpiStrip';
import { renderComponent, byText } from './test-utils';
import { refundKpis } from '../../../lib/admin/refunds-fixtures';

describe('RefundsKpiStrip', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = renderComponent(<RefundsKpiStrip kpis={refundKpis} />);
    expect(byText(container, 'Demandes ouvertes')).toBeTruthy();
    expect(byText(container, 'En attente')).toBeTruthy();
    expect(byText(container, 'Approuvées')).toBeTruthy();
    expect(byText(container, 'Rejetées')).toBeTruthy();
    expect(byText(container, 'Montant remboursé')).toBeTruthy();
    expect(byText(container, 'Suspicion fraude')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('24');
  });
});
