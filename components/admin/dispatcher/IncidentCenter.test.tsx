// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IncidentCenterCard } from './IncidentCenterCard';
import { renderComponent, byText } from './test-utils';
import { dispatcherIncidents } from '../../../lib/admin/dispatcher-fixtures';

describe('IncidentCenterCard', () => {
  it('renders incidents with priorities', () => {
    const { container } = renderComponent(
      <IncidentCenterCard incidents={dispatcherIncidents} onInvestigate={vi.fn()} />
    );
    expect(byText(container, 'Incident Center')).toBeTruthy();
    expect(byText(container, 'Collecte en retard')).toBeTruthy();
    expect(byText(container, 'Critique')).toBeTruthy();
    expect(byText(container, 'Adresse introuvable')).toBeTruthy();
  });

  it('calls onInvestigate when clicking Investigate', () => {
    const onInvestigate = vi.fn();
    const { container, click } = renderComponent(
      <IncidentCenterCard incidents={dispatcherIncidents} onInvestigate={onInvestigate} />
    );
    const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Investigate');
    expect(btn).toBeTruthy();
    if (btn) click(btn);
    expect(onInvestigate).toHaveBeenCalledWith(dispatcherIncidents[0]);
  });
});
