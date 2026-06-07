// @vitest-environment jsdom
import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../components/order-marketplace/test-utils';
import { LogisticsDashboardPage } from './LogisticsDashboardPage';

const mocks = vi.hoisted(() => {
  const context = {
    user: {
      id: 'manager-1',
      name: 'Manager Logistique',
      email: 'ops@kinexpress.cd',
      phone: '+243811111111',
      role: 'logistics-manager',
      logisticsPartnerId: 'lp-1',
      pickupAddress: {} as any,
      loyaltyPoints: 0,
      referralCode: 'OPS1',
      createdAt: '2026-06-07T10:00:00.000Z',
      is2FAEnabled: false,
      notificationPreferences: {} as any,
      isEmailValid: true,
    },
    logout: vi.fn(),
    addNotification: vi.fn(),
    openLogisticsMissionForOrderId: null,
    setOpenLogisticsMissionForOrderId: vi.fn(),
  };

  const task = {
    id: 'task-1',
    order_id: 'order-1',
    order_number: 'LX-2001',
    task_type: 'pickup',
    status: 'pending',
    customer_name: 'Marie Kabongo',
    pickup_address_line: '10 Av. Du 30 Juin',
    pickup_commune: 'Gombe',
    created_at: '2026-06-07T10:00:00.000Z',
    updated_at: '2026-06-07T10:00:00.000Z',
  };

  const driver = {
    id: 'driver-row-1',
    user_id: 'driver-1',
    user_name: 'Driver Kin',
    user_email: 'driver1@kinexpress.cd',
    user_phone: '+243812345678',
    status: 'active',
    is_available: true,
    rating_avg: 5,
    rating_count: 0,
    created_at: '2026-06-07T10:00:00.000Z',
    updated_at: '2026-06-07T10:00:00.000Z',
  };

  const realApi = {
    getLogisticsTasks: vi.fn(async () => ({ tasks: [task], total: 1, page: 1, page_size: 200 })),
    getLogisticsDrivers: vi.fn(async () => ({ drivers: [driver], total: 1, page: 1, page_size: 200 })),
    assignLogisticsTask: vi.fn(async () => ({ ...task, status: 'driver_assigned', driver_id: driver.id })),
  };

  return { context, realApi };
});

vi.mock('../context/AppContext', () => ({
  useAppContext: () => mocks.context,
}));

vi.mock('../services/real-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/real-api')>();
  return {
    ...actual,
    realApi: mocks.realApi,
  };
});

describe('LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.user = { ...mocks.context.user, role: 'logistics-manager' };
  });

  it('renders the dispatcher cockpit and logistics controls', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Centre logistique Laundry Express')).not.toBeNull();
    expect(byText(view.container, 'Auto-dispatch')).not.toBeNull();
    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();

    view.unmount();
  });

  it('protects the page for non logistics managers', () => {
    mocks.context.user = { ...mocks.context.user, role: 'driver' };
    const view = renderComponent(<LogisticsDashboardPage />);

    expect(byText(view.container, 'Accès compagnie logistique uniquement')).not.toBeNull();
    view.click(buttonByText(view.container, /retour/i)!);

    expect(mocks.context.logout).toHaveBeenCalledTimes(1);
  });
});
