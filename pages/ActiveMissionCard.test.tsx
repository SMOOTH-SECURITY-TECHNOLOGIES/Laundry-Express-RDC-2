// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../components/order-marketplace/test-utils';
import { LogisticsTask } from '../services/real-api';
import { ActiveMissionCard } from '../components/driver/ActiveMissionCard';

const mission: LogisticsTask = {
  id: 'task-1',
  order_id: 'order-1',
  order_number: 'LX-1001',
  task_type: 'pickup',
  status: 'driver_assigned',
  customer_name: 'Marie Kabongo',
  customer_phone: '+243811111111',
  pickup_address_line: '10 Av. Du 30 Juin',
  pickup_commune: 'Gombe',
  delivery_address_line: 'Prestige Pressing',
  delivery_commune: 'Gombe',
  scheduled_at: '2026-06-07T14:00:00.000Z',
  created_at: '2026-06-07T10:00:00.000Z',
  updated_at: '2026-06-07T10:00:00.000Z',
};

describe('ActiveMissionCard', () => {
  it('renders the empty state and opens available missions', () => {
    const onViewMissions = vi.fn();
    const view = renderComponent(
      <ActiveMissionCard mission={null} available onAccept={vi.fn()} onStart={vi.fn()} onComplete={vi.fn()} onCallClient={vi.fn()} onOpenMap={vi.fn()} onViewMissions={onViewMissions} isUpdating={false} />
    );

    expect(byText(view.container, 'Aucune mission active')).not.toBeNull();
    view.click(buttonByText(view.container, /voir les missions/i)!);

    expect(onViewMissions).toHaveBeenCalledTimes(1);
  });

  it('renders mission details and action button', () => {
    const onAccept = vi.fn();
    const view = renderComponent(
      <ActiveMissionCard mission={mission} available onAccept={onAccept} onStart={vi.fn()} onComplete={vi.fn()} onCallClient={vi.fn()} onOpenMap={vi.fn()} onViewMissions={vi.fn()} isUpdating={false} />
    );

    expect(byText(view.container, 'LX-1001')).not.toBeNull();
    expect(byText(view.container, 'Marie Kabongo')).not.toBeNull();
    view.click(buttonByText(view.container, /accepter/i)!);

    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
