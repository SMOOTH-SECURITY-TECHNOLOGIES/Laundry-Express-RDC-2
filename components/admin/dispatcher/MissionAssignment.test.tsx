// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MissionAssignmentModal } from './MissionAssignmentModal';
import { renderComponent, byText } from './test-utils';
import { dispatcherBacklog } from '../../../lib/admin/dispatcher-fixtures';

describe('MissionAssignmentModal', () => {
  it('renders mission details and confirms assignment', () => {
    const onConfirm = vi.fn();
    const mission = dispatcherBacklog[0];
    const { container, click } = renderComponent(
      <MissionAssignmentModal
        isOpen
        mission={mission}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );
    expect(byText(container, 'Assigner la mission')).toBeTruthy();
    expect(byText(container, mission.client)).toBeTruthy();
    expect(byText(container, 'Koffi A.')).toBeTruthy();
    const confirmBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Confirmer');
    expect(confirmBtn).toBeTruthy();
    if (confirmBtn) click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith(mission.id, 'DRV-01');
  });

  it('does not render when closed', () => {
    const { container } = renderComponent(
      <MissionAssignmentModal isOpen={false} mission={dispatcherBacklog[0]} onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    expect(byText(container, 'Assigner la mission')).toBeFalsy();
  });
});
