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

const changeInput = (input: HTMLInputElement, value: string) => {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

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
    expect(byText(view.container, 'Fleet')).not.toBeNull();
    expect(byText(view.container, 'Drivers')).not.toBeNull();
    expect(byText(view.container, 'Dispatch')).not.toBeNull();
    expect(byText(view.container, 'Tracking')).not.toBeNull();
    expect(byText(view.container, 'Shipments')).not.toBeNull();
    expect(byText(view.container, 'Maintenance')).not.toBeNull();
    expect(byText(view.container, 'Auto-dispatch')).not.toBeNull();
    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();

    view.unmount();
  });

  it('navigates to the dispatch section from the sidebar', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const dispatchButton = buttonByText(view.container, /^Dispatch$/);
    expect(dispatchButton).not.toBeNull();
    view.click(dispatchButton!);

    expect(byText(view.container, 'Nouvelles missions')).not.toBeNull();
    expect(byText(view.container, 'Assignées')).not.toBeNull();
    expect(byText(view.container, 'En cours')).not.toBeNull();
    expect(byText(view.container, 'Terminées')).not.toBeNull();
    expect(byText(view.container, 'Cockpit logistique universel')).toBeNull();

    view.unmount();
  });

  it('manages dispatch tasks with matching and operational actions', async () => {
    window.history.replaceState(null, '', '/#dispatch');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Missions urgentes')).not.toBeNull();
    expect(byText(view.container, 'Files d’attente')).not.toBeNull();
    expect(byText(view.container, 'MSN-004')).not.toBeNull();

    view.click(buttonByText(view.container, /^Assigner chauffeur$/)!);
    expect(byText(view.container, 'Matching chauffeur')).not.toBeNull();
    view.click(buttonByText(view.container, /Kabongo M\./)!);
    expect(byText(view.container, 'Chauffeur: Kabongo M.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Réassigner$/)!);
    view.click(buttonByText(view.container, /Mutombo P\./)!);
    expect(byText(view.container, 'Chauffeur: Mutombo P.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Prioriser$/)!);
    expect(byText(view.container, 'Urgent')).not.toBeNull();

    view.click(buttonByText(view.container, /^Annuler$/)!);
    expect(byText(view.container, 'Monique V.')).toBeNull();

    view.unmount();
  });

  it('opens the new TMS foundation sections from the sidebar', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    view.click(buttonByText(view.container, /^Fleet$/)!);
    expect(byText(view.container, 'Fleet Management')).not.toBeNull();

    view.click(buttonByText(view.container, /^Tracking$/)!);
    expect(byText(view.container, 'Live Tracking')).not.toBeNull();

    view.click(buttonByText(view.container, /^Shipments$/)!);
    expect(byText(view.container, 'shp-001')).not.toBeNull();

    view.click(buttonByText(view.container, /^Maintenance$/)!);
    expect(byText(view.container, 'Contrôle freinage moto')).not.toBeNull();

    view.unmount();
  });

  it('shows live tracking map, active mission panel and geolocation fallback', async () => {
    window.history.replaceState(null, '', '/#tracking');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Live Tracking')).not.toBeNull();
    expect(byText(view.container, 'Disponible')).not.toBeNull();
    expect(byText(view.container, 'Occupé')).not.toBeNull();
    expect(byText(view.container, 'Retard')).not.toBeNull();
    expect(byText(view.container, 'Hors ligne')).not.toBeNull();
    expect(byText(view.container, 'Mission active')).not.toBeNull();
    expect(byText(view.container, 'MSN-004')).not.toBeNull();
    expect(byText(view.container, 'Tshimanga A.')).not.toBeNull();
    expect(byText(view.container, 'KIN-042-MT')).not.toBeNull();
    expect(byText(view.container, 'Pickup Gombe')).not.toBeNull();
    expect(byText(view.container, 'Delivery Lingwala')).not.toBeNull();
    expect(byText(view.container, 'Détail trajet')).not.toBeNull();
    expect(byText(view.container, 'Mama Jeanne')).not.toBeNull();
    expect(byText(view.container, 'Durée estimée')).not.toBeNull();
    expect(byText(view.container, 'Créé')).not.toBeNull();
    expect(byText(view.container, 'Ramassage')).not.toBeNull();
    expect(byText(view.container, 'Livré')).not.toBeNull();
    expect(byText(view.container, 'Géolocalisation indisponible')).not.toBeNull();

    view.click(buttonByText(view.container, /MSN-014/)!);
    expect(byText(view.container, 'Mutombo P.')).not.toBeNull();
    expect(byText(view.container, 'KIN-118-VN')).not.toBeNull();
    expect(byText(view.container, 'Sarah K.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Update status$/)!);
    expect(byText(view.container, 'Statut mis à jour: Livré')).not.toBeNull();

    view.click(buttonByText(view.container, /^Contacter chauffeur$/)!);
    expect(byText(view.container, 'Contact chauffeur: Mutombo P.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Contacter client$/)!);
    expect(byText(view.container, 'Contact client: Sarah K.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Signaler incident$/)!);
    expect(byText(view.container, 'Statut mis à jour: Incident')).not.toBeNull();

    view.click(buttonByText(view.container, /Basculer fallback géolocalisation/)!);
    expect(byText(view.container, 'Géolocalisation indisponible')).toBeNull();

    view.unmount();
  });

  it('shows complete driver profile and handles driver actions', async () => {
    window.history.replaceState(null, '', '/#drivers');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Profil chauffeur')).not.toBeNull();
    expect(byText(view.container, 'Kabongo Mutombo')).not.toBeNull();
    expect(byText(view.container, 'CD-1234-KIN')).not.toBeNull();
    expect(byText(view.container, 'Documents')).not.toBeNull();
    expect(byText(view.container, 'Permis')).not.toBeNull();
    expect(byText(view.container, 'Performance')).not.toBeNull();
    expect(byText(view.container, 'Ponctualité')).not.toBeNull();
    expect(byText(view.container, 'Revenus')).not.toBeNull();

    view.click(buttonByText(view.container, /^Appeler$/)!);
    expect(byText(view.container, 'Appel chauffeur: +243 812 345 001')).not.toBeNull();

    view.click(buttonByText(view.container, /^Message$/)!);
    expect(byText(view.container, 'Message envoyé à Kabongo Mutombo')).not.toBeNull();

    view.click(buttonByText(view.container, /^Suspendre$/)!);
    expect(byText(view.container, 'Chauffeur suspendu')).not.toBeNull();
    expect(byText(view.container, 'Suspendu')).not.toBeNull();

    view.click(buttonByText(view.container, /^Réactiver$/)!);
    expect(byText(view.container, 'Chauffeur réactivé')).not.toBeNull();

    view.click(buttonByText(view.container, /^Assigner mission$/)!);
    expect(byText(view.container, 'Mission assignée à Kabongo Mutombo')).not.toBeNull();
    expect(byText(view.container, '1 mission')).not.toBeNull();

    view.unmount();
  });

  it('manages fleet vehicles with create, assign, edit and disable actions', async () => {
    window.history.replaceState(null, '', '/#fleet');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Total véhicules')).not.toBeNull();
    expect(byText(view.container, 'Actifs')).not.toBeNull();
    expect(byText(view.container, 'En maintenance')).not.toBeNull();
    expect(byText(view.container, 'Indisponibles')).not.toBeNull();

    view.click(buttonByText(view.container, /Ajouter véhicule/)!);
    const plateInput = view.container.querySelector('input[placeholder="KIN-000-MT"]') as HTMLInputElement;
    expect(plateInput).not.toBeNull();
    changeInput(plateInput, 'KIN-999-MT');
    changeInput(Array.from(view.container.querySelectorAll('input')).find((input) => input.placeholder === 'Dépôt Gombe')!, 'Dépôt Gombe');
    view.click(buttonByText(view.container, /^Enregistrer$/)!);
    expect(byText(view.container, 'KIN-999-MT')).not.toBeNull();

    const assignButtons = Array.from(view.container.querySelectorAll('button')).filter((button) => button.textContent === 'Assigner');
    view.click(assignButtons[0]);
    view.click(buttonByText(view.container, /^Ngoy L\.$/)!);
    expect(byText(view.container, 'Ngoy L.')).not.toBeNull();

    const editButtons = Array.from(view.container.querySelectorAll('button')).filter((button) => button.textContent === 'Modifier');
    view.click(editButtons[0]);
    const editPlateInput = view.container.querySelector('input[placeholder="KIN-000-MT"]') as HTMLInputElement;
    changeInput(editPlateInput, 'KIN-998-MT');
    view.click(buttonByText(view.container, /^Enregistrer$/)!);
    expect(byText(view.container, 'KIN-998-MT')).not.toBeNull();

    const disableButtons = Array.from(view.container.querySelectorAll('button')).filter((button) => button.textContent === 'Désactiver');
    view.click(disableButtons[0]);
    expect(byText(view.container, 'Désactivé')).not.toBeNull();

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
    expect(delayAction?.getAttribute('href')).toBe('#dispatch');
    view.click(delayAction!);
    expect(byText(view.container, 'Mission ciblée depuis l’alerte: MSN-004')).not.toBeNull();
    expect(byText(view.container, 'Nouvelles missions')).not.toBeNull();
    expect(window.location.hash).toBe('#dispatch');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des missions pour analyser le retard. Mission cible: MSN-004. Chauffeur cible: Tshimanga A.', 'info');
    view.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const driversView = renderComponent(<LogisticsDashboardPage />);
    driversView.click(buttonByText(driversView.container, /Inactifs/)!);
    const contactAction = linkByText(driversView.container, /^Contacter$/);
    expect(contactAction).not.toBeUndefined();
    expect(contactAction?.getAttribute('href')).toBe('#drivers');
    driversView.click(contactAction!);
    expect(byText(driversView.container, 'Chauffeur ciblé depuis l’alerte: Mbuyi T.')).not.toBeNull();
    expect(byText(driversView.container, 'Gestion des chauffeurs')).not.toBeNull();
    expect(window.location.hash).toBe('#drivers');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des chauffeurs pour prise de contact. Chauffeur cible: Mbuyi T.', 'info');
    driversView.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const reportsView = renderComponent(<LogisticsDashboardPage />);
    reportsView.click(buttonByText(reportsView.container, /Paiements/)!);
    const paymentAction = linkByText(reportsView.container, /^Résoudre$/);
    expect(paymentAction).not.toBeUndefined();
    expect(paymentAction?.getAttribute('href')).toBe('#reports');
    reportsView.click(paymentAction!);
    expect(byText(reportsView.container, 'Rapport ciblé depuis l’alerte: Paiement échoué MSN-007')).not.toBeNull();
    expect(byText(reportsView.container, 'Rapports')).not.toBeNull();
    expect(window.location.hash).toBe('#reports');
    expect(mocks.context.addNotification).toHaveBeenCalledWith('Ouverture des rapports pour suivi paiement. Mission cible: MSN-007.', 'info');
    reportsView.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const lateGroupView = renderComponent(<LogisticsDashboardPage />);
    lateGroupView.click(buttonByText(lateGroupView.container, /Retards/)!);
    const lateGroupActions = Array.from(lateGroupView.container.querySelectorAll('a')).filter((link) => /^Voir$/.test(link.textContent || ''));
    lateGroupView.click(lateGroupActions[lateGroupActions.length - 1]);
    expect(byText(lateGroupView.container, 'Alerte missions ciblée: 3 missions avec retard > 20 min')).not.toBeNull();
    expect(window.location.hash).toBe('#dispatch');
    lateGroupView.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const waitingGroupView = renderComponent(<LogisticsDashboardPage />);
    waitingGroupView.click(buttonByText(waitingGroupView.container, /En attente/)!);
    const waitingActions = Array.from(waitingGroupView.container.querySelectorAll('a')).filter((link) => /^Résoudre$/.test(link.textContent || ''));
    waitingGroupView.click(waitingActions[waitingActions.length - 1]);
    expect(byText(waitingGroupView.container, 'Alerte missions ciblée: File d\'attente Limete bloquée')).not.toBeNull();
    expect(byText(waitingGroupView.container, 'Zone ciblée: Limete')).not.toBeNull();
    expect(window.location.hash).toBe('#dispatch');
    waitingGroupView.unmount();
  });

  it('protects the page for non logistics managers', () => {
    mocks.context.user = { ...mocks.context.user, role: 'driver' };
    const view = renderComponent(<LogisticsDashboardPage />);

    expect(byText(view.container, 'Accès compagnie logistique uniquement')).not.toBeNull();
    view.click(buttonByText(view.container, /retour/i)!);

    expect(mocks.context.logout).toHaveBeenCalledTimes(1);
  });
});
