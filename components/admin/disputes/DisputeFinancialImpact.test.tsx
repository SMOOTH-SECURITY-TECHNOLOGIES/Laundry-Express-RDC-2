// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DisputeFinancialImpact } from './DisputeFinancialImpact';
import { renderComponent, byText } from './test-utils';
import { mockFinancialImpact } from '../../../lib/admin/disputes-fixtures';

describe('DisputeFinancialImpact', () => {
  it('renders financial KPIs', () => {
    const { container } = renderComponent(<DisputeFinancialImpact impact={mockFinancialImpact} />);
    expect(byText(container, 'Impact financier')).toBeTruthy();
    expect(container.textContent).toMatch(/2[\s\u00a0\u202f]?845/);
    expect(byText(container, '1.2%')).toBeTruthy();
  });
});
