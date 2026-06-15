// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisputeFilters } from './DisputeFilters';
import { renderComponent, byText } from './test-utils';
import { defaultDisputeFilters } from '../../../hooks/useAdminDisputes';

describe('DisputeFilters', () => {
  it('renders status and type filters', () => {
    const onChange = vi.fn();
    const { container } = renderComponent(
      <DisputeFilters
        filters={defaultDisputeFilters}
        partnerOptions={['Prestige Pressing']}
        onChange={onChange}
        onReset={vi.fn()}
      />
    );
    expect(byText(container, 'Filtres avancés')).toBeTruthy();
    expect(container.querySelector('select')).toBeTruthy();
  });
});
