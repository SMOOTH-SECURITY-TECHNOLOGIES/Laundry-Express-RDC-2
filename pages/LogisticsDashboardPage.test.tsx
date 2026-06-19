// @vitest-environment jsdom
import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../components/order-marketplace/test-utils';
import { LogisticsDashboardPage } from './LogisticsDashboardPage';

vi.mock('../config/pilot', () => ({
  pilotConfig: { isPilotMode: true, hiddenAdminModules: new Set(), paymentMode: 'sandbox', paymentModeLabel: 'sandbox' },
  isAdminModuleVisible: () => true,
}));

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
    getLogisticsTasks: vi.fn(async () => ({ tasks: [], total: 0, page: 1, page_size: 200 })),
    getLogisticsDrivers: vi.fn(async () => ({ drivers: [driver], total: 1, page: 1, page_size: 200 })),
    getVehicles: vi.fn(async () => ({ vehicles: [] })),
    getTrips: vi.fn(async () => ({ trips: [] })),
    getTrackingPoints: vi.fn(async () => ({ tracking_points: [] })),
    getMaintenanceEvents: vi.fn(async () => ({ maintenance_events: [] })),
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
    expect(byText(view.container, 'Trip Details')).not.toBeNull();
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

  it('navigates to the missions section from the sidebar', async () => {
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const missionsButton = buttonByText(view.container, /^Missions$/);
    expect(missionsButton).not.toBeNull();
    view.click(missionsButton!);

    expect(byText(view.container, 'Backlog à dispatcher')).not.toBeNull();
    expect(byText(view.container, 'Toutes les missions')).not.toBeNull();

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
    expect(byText(view.container, 'Assignation bloquée: véhicule indisponible: maintenance overdue')).not.toBeNull();
    view.click(buttonByText(view.container, /Kalonji S\./)!);
    expect(byText(view.container, 'Chauffeur: Kalonji S.')).not.toBeNull();

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

    view.click(buttonByText(view.container, /^Trip Details$/)!);
    expect(byText(view.container, 'Timeline trajet')).not.toBeNull();
    expect(byText(view.container, 'Actions trajet')).not.toBeNull();

    view.click(buttonByText(view.container, /^Shipments$/)!);
    expect(byText(view.container, 'shp-001')).not.toBeNull();

    view.click(buttonByText(view.container, /^Maintenance$/)!);
    expect(byText(view.container, 'Contrôle freinage moto')).not.toBeNull();

    view.click(buttonByText(view.container, /^Pilote$/)!);
    expect(byText(view.container, 'Métriques temps réel')).not.toBeNull();
    expect(byText(view.container, 'Résumé missions')).not.toBeNull();

    view.unmount();
  });

  it('opens every logistics section from the mobile menu', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const menuButton = view.container.querySelector('button[aria-label="Ouvrir le menu logistique"]');
    expect(menuButton).not.toBeNull();
    view.click(menuButton!);

    const mobileSections: Array<[RegExp, string]> = [
      [/^Dashboard$/, 'Auto-dispatch'],
      [/^Fleet$/, 'Fleet Management'],
      [/^Drivers$/, 'Profil chauffeur'],
      [/^Dispatch$/, 'Nouvelles missions'],
      [/^Missions$/, 'Backlog à dispatcher'],
      [/^Tracking$/, 'Live Tracking'],
      [/^Trip Details$/, 'Timeline trajet'],
      [/^Shipments$/, 'shp-001'],
      [/^Alertes/, 'Alertes opérationnelles'],
      [/^Maintenance$/, 'Suivi entretien véhicules'],
      [/^Reports$/, 'Reports & Analytics'],
      [/^Settings$/, 'Notifications'],
      [/^Pilote$/, 'Résumé missions'],
    ];

    for (const [label, expectedText] of mobileSections) {
      const button = buttonByText(view.container, label);
      expect(button).not.toBeNull();
      view.click(button!);
      expect(byText(view.container, expectedText)).not.toBeNull();
    }

    view.unmount();
  });

  it('shows dedicated trip details and handles trip actions', async () => {
    window.history.replaceState(null, '', '/#trip-details');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Trip Details')).not.toBeNull();
    expect(byText(view.container, 'Origine')).not.toBeNull();
    expect(byText(view.container, 'Destination')).not.toBeNull();
    expect(byText(view.container, 'Durée estimée')).not.toBeNull();
    expect(byText(view.container, 'Timeline trajet')).not.toBeNull();
    expect(byText(view.container, 'Actions trajet')).not.toBeNull();

    view.click(buttonByText(view.container, /^Update status$/)!);
    expect(byText(view.container, 'Statut mis à jour: Livré')).not.toBeNull();

    view.click(buttonByText(view.container, /^Contacter chauffeur$/)!);
    expect(byText(view.container, 'Fiche contact chauffeur ouverte: Tshimanga A.')).not.toBeNull();
    expect(byText(view.container, 'Fiche contact chauffeur')).not.toBeNull();

    view.click(buttonByText(view.container, /^Contacter client$/)!);
    expect(byText(view.container, 'Fiche contact client ouverte: Mama Jeanne')).not.toBeNull();
    expect(byText(view.container, 'Fiche contact client')).not.toBeNull();

    view.click(buttonByText(view.container, /^Signaler incident$/)!);
    expect(byText(view.container, 'Créer un incident traçable pour MSN-004, avec owner opérationnel.')).not.toBeNull();
    view.click(buttonByText(view.container, /^Enregistrer incident$/)!);
    expect(byText(view.container, 'Incident Embouteillage enregistré sur MSN-004')).not.toBeNull();
    expect(byText(view.container, 'Incidents ouverts')).not.toBeNull();

    view.unmount();
  });

  it('shows live tracking map, active mission panel and geolocation fallback', async () => {
    window.history.replaceState(null, '', '/#tracking');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Live Tracking')).not.toBeNull();
    expect(byText(view.container, 'Missions suivies')).not.toBeNull();
    expect(byText(view.container, 'Retards live')).not.toBeNull();
    expect(byText(view.container, 'ETA moyen')).not.toBeNull();
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
    expect(byText(view.container, 'Fiche contact chauffeur ouverte: Mutombo P.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Contacter client$/)!);
    expect(byText(view.container, 'Fiche contact client ouverte: Sarah K.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Signaler incident$/)!);
    expect(byText(view.container, 'Mission MSN-014 · owner automatique selon le type.')).not.toBeNull();
    view.click(buttonByText(view.container, /^Enregistrer incident$/)!);
    expect(byText(view.container, 'Incident Embouteillage enregistré sur MSN-014')).not.toBeNull();

    view.click(buttonByText(view.container, /^Marquer retard$/)!);
    expect(byText(view.container, 'Statut mis à jour: Retard')).not.toBeNull();

    view.click(buttonByText(view.container, /^Actualiser positions$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'Positions actualisées')).not.toBeNull();

    const tripDetailsLink = Array.from(view.container.querySelectorAll('a')).find((link) => link.textContent === 'Ouvrir Trip Details');
    expect(tripDetailsLink?.getAttribute('href')).toBe('#trip-details');

    view.unmount();
  });

  it('manages shipments with filters, search and operational actions', async () => {
    window.history.replaceState(null, '', '/#shipments');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Shipments V1')).not.toBeNull();
    expect(byText(view.container, 'Total shipments')).not.toBeNull();
    expect(byText(view.container, 'En transit')).not.toBeNull();
    expect(byText(view.container, 'Détail shipment')).not.toBeNull();

    const searchInput = view.container.querySelector('input[placeholder="Rechercher shipment, commande, client, zone, chauffeur..."]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    changeInput(searchInput, 'Monique');
    expect(byText(view.container, 'shp-003')).not.toBeNull();
    expect(byText(view.container, 'shp-001')).toBeNull();

    view.click(buttonByText(view.container, /^Retards$/)!);
    expect(byText(view.container, 'Monique V.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Voir détail$/)!);
    expect(byText(view.container, 'shp-003 · LX-2014 · Monique V.')).not.toBeNull();

    view.click(buttonByText(view.container, /^Signaler incident$/)!);
    expect(byText(view.container, 'Incident shipment enregistré: shp-003')).not.toBeNull();
    expect(byText(view.container, 'Incident')).not.toBeNull();

    view.click(buttonByText(view.container, /^Marquer livré$/)!);
    expect(byText(view.container, 'shp-003 mis à jour: Livré')).not.toBeNull();

    view.click(buttonByText(view.container, /^Ouvrir tracking$/)!);
    expect(window.location.hash).toBe('#tracking');

    window.history.replaceState(null, '', '/#shipments');
    view.click(buttonByText(view.container, /^Trip details$/)!);
    expect(window.location.hash).toBe('#trip-details');

    view.unmount();
  });

  it('shows complete driver profile and handles driver actions', async () => {
    window.history.replaceState(null, '', '/#drivers');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Profil chauffeur')).not.toBeNull();
    expect(byText(view.container, 'Driver Kin')).not.toBeNull();
    expect(byText(view.container, 'Plaque à confirmer')).not.toBeNull();
    expect(byText(view.container, 'Documents')).not.toBeNull();
    expect(byText(view.container, 'Permis')).not.toBeNull();
    expect(byText(view.container, 'Performance')).not.toBeNull();
    expect(byText(view.container, 'Ponctualité')).not.toBeNull();
    expect(byText(view.container, 'Revenus')).not.toBeNull();

    view.click(buttonByText(view.container, /^Appeler$/)!);
    expect(byText(view.container, 'Appel chauffeur: +243812345678')).not.toBeNull();

    view.click(buttonByText(view.container, /^Message$/)!);
    expect(byText(view.container, 'Message envoyé à Driver Kin')).not.toBeNull();

    view.click(buttonByText(view.container, /^Suspendre$/)!);
    expect(byText(view.container, 'Chauffeur suspendu')).not.toBeNull();
    expect(byText(view.container, 'Suspendu')).not.toBeNull();

    view.click(buttonByText(view.container, /^Réactiver$/)!);
    expect(byText(view.container, 'Chauffeur réactivé')).not.toBeNull();

    view.click(buttonByText(view.container, /^Assigner mission$/)!);
    expect(byText(view.container, 'Mission assignée à Driver Kin')).not.toBeNull();
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

  it('tracks vehicle maintenance alerts and blocks unavailable vehicles from dispatch assignment', async () => {
    window.history.replaceState(null, '', '/#maintenance');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Suivi entretien véhicules')).not.toBeNull();
    expect(byText(view.container, 'Entretiens suivis')).not.toBeNull();
    expect(byText(view.container, 'Alertes maintenance')).not.toBeNull();
    expect(byText(view.container, 'Véhicules indisponibles')).not.toBeNull();
    expect(byText(view.container, 'Assurance expirée')).not.toBeNull();
    expect(byText(view.container, 'Véhicule en panne')).not.toBeNull();
    expect(byText(view.container, 'Maintenance overdue')).not.toBeNull();
    expect(byText(view.container, 'Type entretien')).not.toBeNull();
    expect(byText(view.container, 'Prochain contrôle')).not.toBeNull();
    expect(byText(view.container, 'Indisponible')).not.toBeNull();
    expect(byText(view.container, 'Coût maintenance')).not.toBeNull();
    expect(byText(view.container, 'Planifier contrôle')).not.toBeNull();
    expect(byText(view.container, 'Dossier maintenance')).not.toBeNull();
    expect(byText(view.container, 'Décision dispatch')).not.toBeNull();

    view.click(buttonByText(view.container, /^Planifier contrôle$/)!);
    expect(byText(view.container, 'Contrôle préventif planifié')).not.toBeNull();
    expect(byText(view.container, 'contrôle planifié')).not.toBeNull();

    view.click(buttonByText(view.container, /^Bloquer assignation$/)!);
    expect(byText(view.container, 'assignation bloquée')).not.toBeNull();

    view.click(buttonByText(view.container, /^Rendre disponible$/)!);
    expect(byText(view.container, 'véhicule disponible')).not.toBeNull();

    view.unmount();

    window.history.replaceState(null, '', '/#dispatch');
    const dispatchView = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    dispatchView.click(buttonByText(dispatchView.container, /^Assigner chauffeur$/)!);
    expect(byText(dispatchView.container, 'Assignation bloquée: véhicule indisponible: maintenance overdue')).not.toBeNull();
    dispatchView.unmount();
  });

  it('generates logistics reports with operational analytics', async () => {
    window.history.replaceState(null, '', '/#reports');
    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'Reports & Analytics')).not.toBeNull();
    expect(byText(view.container, 'On-time delivery')).not.toBeNull();
    expect(byText(view.container, 'Missions / jour')).not.toBeNull();
    expect(byText(view.container, 'Temps moyen')).not.toBeNull();
    expect(byText(view.container, 'Coût logistique')).not.toBeNull();
    expect(byText(view.container, 'Générateur de rapports')).not.toBeNull();
    expect(byText(view.container, 'Graphique volume')).not.toBeNull();
    expect(byText(view.container, 'Graphique zones')).not.toBeNull();
    expect(byText(view.container, 'Top chauffeurs')).not.toBeNull();
    expect(byText(view.container, 'Incidents à reporter')).not.toBeNull();
    expect(byText(view.container, 'Performance par zone')).not.toBeNull();
    expect(byText(view.container, 'Rapports véhicules')).not.toBeNull();

    view.click(buttonByText(view.container, /Générer rapport hebdomadaire/)!);
    expect(byText(view.container, 'Rapport généré: Rapport hebdomadaire')).not.toBeNull();
    expect(byText(view.container, 'Rapport actif')).not.toBeNull();
    expect(byText(view.container, 'Rapport hebdomadaire')).not.toBeNull();
    expect(buttonByText(view.container, /^Exporter CSV$/)).not.toBeNull();
    expect(buttonByText(view.container, /^Exporter PDF$/)).not.toBeNull();
    expect(byText(view.container, 'Kabongo M.')).not.toBeNull();
    expect(byText(view.container, 'KIN-207-MT')).not.toBeNull();

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
    expect(window.location.hash).toBe('#missions');
    lateGroupView.unmount();

    window.history.replaceState(null, '', '/#alerts');
    const waitingGroupView = renderComponent(<LogisticsDashboardPage />);
    waitingGroupView.click(buttonByText(waitingGroupView.container, /En attente/)!);
    const waitingActions = Array.from(waitingGroupView.container.querySelectorAll('a')).filter((link) => /^Résoudre$/.test(link.textContent || ''));
    waitingGroupView.click(waitingActions[waitingActions.length - 1]);
    expect(byText(waitingGroupView.container, 'Alerte missions ciblée: File d\'attente Limete bloquée')).not.toBeNull();
    expect(byText(waitingGroupView.container, 'Zone ciblée: Limete')).not.toBeNull();
    expect(window.location.hash).toBe('#missions');
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
