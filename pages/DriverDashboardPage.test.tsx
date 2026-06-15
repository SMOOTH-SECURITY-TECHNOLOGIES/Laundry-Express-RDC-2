// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { byText, buttonByText, renderComponent } from '../components/order-marketplace/test-utils';
import { DriverDashboardPage } from './DriverDashboardPage';

const mocks = vi.hoisted(() => {
  const context = {
    user: {
      id: 'driver-1',
      name: 'Driver Kin',
      email: 'driver1@kinexpress.cd',
      phone: '+243811111111',
      role: 'driver',
      driverStatus: 'UNAVAILABLE',
      pickupAddress: {} as any,
      loyaltyPoints: 0,
      referralCode: 'DRV1',
      createdAt: '2026-06-07T10:00:00.000Z',
      is2FAEnabled: false,
      notificationPreferences: {} as any,
      isEmailValid: true,
    },
    updateUser: vi.fn(async () => undefined),
    getCompletedOrdersForDriver: vi.fn(() => []),
    getOrdersForDriver: vi.fn(() => null),
    updateOrderStatus: vi.fn(async () => undefined),
    addNotification: vi.fn(),
    appNotifications: [],
    setCurrentPage: vi.fn(),
    logout: vi.fn(),
    openDriverMissionForOrderId: null,
    setOpenDriverMissionForOrderId: vi.fn(),
  };

  const realApi = {
    getLogisticsTasks: vi.fn(async () => ({ tasks: [], total: 0, page: 1, page_size: 100 })),
    getLogisticsDrivers: vi.fn(async () => ({
      drivers: [{
        id: 'ld-1',
        user_id: 'driver-1',
        user_name: 'Driver Kin',
        status: 'active',
        is_available: false,
        rating_avg: 5,
        rating_count: 0,
        created_at: '2026-06-07T10:00:00.000Z',
        updated_at: '2026-06-07T10:00:00.000Z',
      }],
      total: 1,
      page: 1,
      page_size: 100,
    })),
    updateDriverAvailability: vi.fn(async () => ({ available: true })),
    acceptLogisticsTask: vi.fn(),
    startLogisticsTask: vi.fn(),
    completeLogisticsTask: vi.fn(),
    getMyReferralStats: vi.fn(async () => ({
      referral_code: 'DRV1',
      referred_users_count: 0,
      completed_conversions: 0,
      total_bonus_points: 0,
    })),
  };

  return { context, realApi };
});

vi.mock('../context/AppContext', () => ({
  useAppContext: () => mocks.context,
}));

vi.mock('../components/ThemeSwitcher', () => ({
  ThemeSwitcher: () => null,
}));

vi.mock('../services/real-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/real-api')>();
  return {
    ...actual,
    realApi: mocks.realApi,
  };
});

describe('DriverDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.user = { ...mocks.context.user, role: 'driver', driverStatus: 'UNAVAILABLE' };
  });

  it('renders the professional driver dashboard shell', () => {
    const view = renderComponent(<DriverDashboardPage />);

    expect(byText(view.container, 'Tableau de bord chauffeur')).not.toBeNull();
    expect(byText(view.container, 'Bienvenue, Driver')).not.toBeNull();
    expect(byText(view.container, 'Missions terminées')).not.toBeNull();
    expect(byText(view.container, 'Astuces pour recevoir plus de missions')).not.toBeNull();

    view.unmount();
  });

  it('shows an access guard for non-driver users', () => {
    mocks.context.user = { ...mocks.context.user, role: 'customer' };
    const view = renderComponent(<DriverDashboardPage />);

    expect(byText(view.container, 'Accès chauffeur uniquement')).not.toBeNull();

    view.unmount();
  });

  it('navigates to the missions section from the sidebar', () => {
    const view = renderComponent(<DriverDashboardPage />);
    const missionsButton = buttonByText(view.container, /^Missions$/);

    expect(missionsButton).not.toBeNull();
    view.click(missionsButton!);

    expect(byText(view.container, 'Mission active, propositions et actions opérationnelles.')).not.toBeNull();
    expect(byText(view.container, 'Missions disponibles')).not.toBeNull();
    expect(byText(view.container, 'Missions terminées')).toBeNull();

    view.unmount();
  });
});
