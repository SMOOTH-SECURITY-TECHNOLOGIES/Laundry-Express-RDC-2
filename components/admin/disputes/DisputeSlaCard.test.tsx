// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { DisputeSlaCard } from './DisputeSlaCard';
import { renderComponent, byText } from './test-utils';
import { mockSla } from '../../../lib/admin/disputes-fixtures';

describe('DisputeSlaCard', () => {
  it('renders SLA compliance', () => {
    const { container } = renderComponent(<DisputeSlaCard sla={mockSla} />);
    expect(byText(container, '92%')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});
