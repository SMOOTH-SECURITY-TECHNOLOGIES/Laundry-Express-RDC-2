// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { PaymentsKpiStrip } from './PaymentsKpiStrip';
import { renderComponent, byText } from './test-utils';
import { paymentKpis } from '../../../lib/admin/payments-fixtures';

describe('PaymentsKpiStrip', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = renderComponent(<PaymentsKpiStrip kpis={paymentKpis} />);
    expect(byText(container, 'Paiements reçus')).toBeTruthy();
    expect(byText(container, 'Transactions')).toBeTruthy();
    expect(byText(container, 'Paiements réussis')).toBeTruthy();
    expect(byText(container, 'En attente')).toBeTruthy();
    expect(byText(container, 'Echoués')).toBeTruthy();
    expect(byText(container, 'Ticket moyen')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('94.8%');
  });
});
