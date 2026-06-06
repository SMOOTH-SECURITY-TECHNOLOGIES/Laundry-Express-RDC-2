// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../components/order-marketplace/test-utils';
import { DriverStatusCard } from './DriverDashboardPage';

describe('DriverStatusCard', () => {
  it('renders unavailable state and triggers availability toggle', () => {
    const onToggle = vi.fn();
    const view = renderComponent(<DriverStatusCard available={false} isUpdating={false} onToggle={onToggle} />);

    expect(byText(view.container, 'Indisponible')).not.toBeNull();
    view.click(buttonByText(view.container, /devenir disponible/i)!);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('disables the action while updating', () => {
    const view = renderComponent(<DriverStatusCard available isUpdating onToggle={vi.fn()} />);

    expect((buttonByText(view.container, /passer indisponible/i) as HTMLButtonElement).disabled).toBe(true);
  });
});
