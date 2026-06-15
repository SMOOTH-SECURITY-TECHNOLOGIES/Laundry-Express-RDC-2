// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AutoDispatchModal } from './AutoDispatchModal';
import { renderComponent, byText } from './test-utils';

describe('AutoDispatchModal', () => {
  it('renders auto dispatch criteria and confirms', () => {
    const onConfirm = vi.fn();
    const { container, click } = renderComponent(
      <AutoDispatchModal isOpen loading={false} result={null} onConfirm={onConfirm} onClose={vi.fn()} />
    );
    expect(byText(container, 'Auto Dispatch')).toBeTruthy();
    expect(byText(container, '40% distance')).toBeTruthy();
    const launchBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Lancer Auto Dispatch')
    );
    expect(launchBtn).toBeTruthy();
    if (launchBtn) click(launchBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows result after dispatch', () => {
    const { container } = renderComponent(
      <AutoDispatchModal
        isOpen
        loading={false}
        result={{ assigned: 3, skipped: 1, details: [{ missionId: 'M-7845', driverId: 'DRV-01', driverName: 'Koffi A.', score: 92 }] }}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(byText(container, '3 mission(s) assignée(s)')).toBeTruthy();
    expect(byText(container, 'M-7845')).toBeTruthy();
  });
});
