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
    appNotifications: [],
    setCurrentPage: vi.fn(),
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

const linkByText = (container: HTMLElement, text: RegExp) =>
  Array.from(container.querySelectorAll('a')).find((link) => text.test(link.textContent || '')) as HTMLAnchorElement | undefined;

describe('LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.user = { ...mocks.context.user, role: 'logistics-manager' };
    window.history.replaceState(null, '', '/#dashboard');
  });

  it('renders the dispatcher cockpit and logistics controls', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 900));
    });

    expect(byText(view.container, 'Centre logistique Laundry Express')).not.toBeNull();
    expect(byText(view.container, 'Auto-dispatch')).not.toBeNull();
    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();

    view.unmount();
  });

  it('navigates to the missions section from the sidebar', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const missionsButton = buttonByText(view.container, /^Missions$/);
    expect(missionsButton).not.toBeNull();
    view.click(missionsButton!);

    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();
    expect(byText(view.container, 'Cockpit logistique universel')).toBeNull();

    view.unmount();
  });

  it('routes logistics alert actions to the section that can handle them', async () => {
    window.history.replaceState(null, '', '/#alerts');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Alertes opérationnelles')).not.toBeNull();

    const delayAction = linkByText(view.container, /^Voir$/);
    expect(delayAction).not.toBeUndefined();
    expect(delayAction?.getAttribute('href')).toBe('#missions');
    view.click(delayAction!);
    expect(byText(view.container, 'Mission ciblée depuis l’alerte: MSN-004')).not.toBeNull();
    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();
    expect(window.location.hash).toBe('#missions');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des missions pour analyser le retard. Mission cible: MSN-004.', 'info');
    view.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const driversView = renderComponent(<LogisticsDashboardPage />);
    driversView.click(buttonByText(driversView.container, /Inactifs/)!);
    const contactAction = linkByText(driversView.container, /^Contacter$/);
    expect(contactAction).not.toBeUndefined();
    expect(contactAction?.getAttribute('href')).toBe('#drivers');
    driversView.click(contactAction!);
    expect(byText(driversView.container, 'Gestion des chauffeurs')).not.toBeNull();
    expect(window.location.hash).toBe('#drivers');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des chauffeurs pour prise de contact.', 'info');
    driversView.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const reportsView = renderComponent(<LogisticsDashboardPage />);
    reportsView.click(buttonByText(reportsView.container, /Paiements/)!);
    const paymentAction = linkByText(reportsView.container, /^Résoudre$/);
    expect(paymentAction).not.toBeUndefined();
    expect(paymentAction?.getAttribute('href')).toBe('#reports');
    reportsView.click(paymentAction!);
    expect(byText(reportsView.container, 'Rapports')).not.toBeNull();
    expect(window.location.hash).toBe('#reports');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des rapports pour suivi paiement. Mission cible: MSN-007.', 'info');
    reportsView.unmount();
  });

  it('protects the page for non logistics managers', () => {
    mocks.context.user = { ...mocks.context.user, role: 'driver' };
    const view = renderComponent(<LogisticsDashboardPage />);

    expect(byText(view.container, 'Accès compagnie logistique uniquement')).not.toBeNull();
    view.click(buttonByText(view.container, /retour/i)!);

    expect(mocks.context.logout).toHaveBeenCalledTimes(1);
  });
});
