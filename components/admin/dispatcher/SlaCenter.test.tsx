// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SlaCenterCard } from './SlaCenterCard';
import { renderComponent, byText } from './test-utils';
import { dispatcherSlaData } from '../../../lib/admin/dispatcher-fixtures';

describe('SlaCenterCard', () => {
  it('renders SLA KPIs and progress bar', () => {
    const { container } = renderComponent(<SlaCenterCard data={dispatcherSlaData} />);
    expect(byText(container, 'SLA Center')).toBeTruthy();
    expect(byText(container, 'Dans SLA')).toBeTruthy();
    expect(byText(container, 'À risque')).toBeTruthy();
    expect(byText(container, 'Dépassés')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
  });
});
