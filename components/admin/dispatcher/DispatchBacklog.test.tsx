// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DispatchBacklogTable } from './DispatchBacklogTable';
import { renderComponent, byText, buttonByText } from './test-utils';
import { dispatcherBacklog } from '../../../lib/admin/dispatcher-fixtures';

describe('DispatchBacklogTable', () => {
  it('renders backlog missions and assign button', () => {
    const onAssign = vi.fn();
    const { container, click } = renderComponent(
      <DispatchBacklogTable missions={dispatcherBacklog} onAssign={onAssign} />
    );
    expect(byText(container, 'M-7845')).toBeTruthy();
    expect(byText(container, 'Jean Tshibangu')).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeTruthy();
    const assignBtn = buttonByText(container, /Assigner/);
    expect(assignBtn).toBeTruthy();
    if (assignBtn) click(assignBtn);
    expect(onAssign).toHaveBeenCalledWith(dispatcherBacklog[0]);
  });

  it('filters by search', () => {
    const { container } = renderComponent(
      <DispatchBacklogTable missions={dispatcherBacklog} search="Marie" onAssign={vi.fn()} />
    );
    expect(byText(container, 'Marie Kambale')).toBeTruthy();
    expect(byText(container, 'Jean Tshibangu')).toBeFalsy();
  });
});
