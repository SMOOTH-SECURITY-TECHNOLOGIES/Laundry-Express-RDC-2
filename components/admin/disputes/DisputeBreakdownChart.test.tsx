// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DisputeBreakdownChart } from './DisputeBreakdownChart';
import { renderComponent, byText } from './test-utils';
import { mockBreakdown } from '../../../lib/admin/disputes-fixtures';

describe('DisputeBreakdownChart', () => {
  it('renders donut total from breakdown items', () => {
    const { container } = renderComponent(<DisputeBreakdownChart items={mockBreakdown} />);
    const total = mockBreakdown.reduce((s, i) => s + i.count, 0);
    expect(byText(container, String(total))).toBeTruthy();
    expect(byText(container, 'Qualité')).toBeTruthy();
  });
});
