// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SlaDistributionBar } from './SlaDistributionBar';
import { renderComponent, byText } from './test-utils';
import { slaDistribution } from '../../../lib/admin/sla-fixtures';

describe('SlaDistributionBar', () => {
  it('renders distribution segments', () => {
    const { container } = renderComponent(<SlaDistributionBar data={slaDistribution} />);
    expect(byText(container, 'Distribution du SLA')).toBeTruthy();
    expect(byText(container, '94% Dans SLA')).toBeTruthy();
    expect(byText(container, '5% À risque')).toBeTruthy();
    expect(byText(container, '1% Dépassé')).toBeTruthy();
  });
});
