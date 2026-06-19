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

  const now = new Date();
  const isoNow = now.toISOString();
  const isoThirtyMinutesAgo = new Date(now.getTime() - 30 * 60000).toISOString();
  const isoNinetyMinutesAgo = new Date(now.getTime() - 90 * 60000).toISOString();

  const realApi = {
    getLogisticsTasks: vi.fn(async () => ({ tasks: [], total: 0, page: 1, page_size: 200 })),
    getLogisticsDrivers: vi.fn(async () => ({ drivers: [driver], total: 1, page: 1, page_size: 200 })),
    getVehicles: vi.fn(async () => ({
      vehicles: [
        { id: 'vehicle-default-1', plate: 'KIN-207-MT', type: 'moto', status: 'assigned', driverId: driver.id, assignedDriverName: driver.user_name, zone: 'Kinshasa', location: 'Dépôt Gombe', mileageKm: 12400, insuranceExpiresAt: isoNow, maintenance: { status: 'ok', nextServiceAtKm: 15000 } },
      ],
    })),
    getTrips: vi.fn(async () => ({ trips: [] })),
    getTrackingPoints: vi.fn(async () => ({ tracking_points: [] })),
    getMaintenanceEvents: vi.fn(async () => ({ maintenance_events: [] })),
    assignLogisticsTask: vi.fn(async () => ({ ...task, status: 'driver_assigned', driver_id: driver.id })),
    getOrders: vi.fn(async () => ({
      orders: [
        { id: 'order-1', order_number: 'LX-3001', customer_id: 'customer-1', partner_id: 'partner-1', partner_name: 'Pressing Prestige', total_amount: 120, amount_paid: 120, payment_status: 'paid', status: 'created', created_at: isoNow, updated_at: isoNow, pickup_commune: 'Gombe' },
        { id: 'order-2', order_number: 'LX-3002', customer_id: 'customer-2', partner_id: 'partner-2', partner_name: 'Clean Gombe', total_amount: 80, amount_paid: 0, payment_status: 'failed', status: 'created', created_at: isoNow, updated_at: isoNow, pickup_commune: 'Limete' },
      ],
      total: 2,
      page: 1,
      page_size: 250,
    })),
    getSupportTickets: vi.fn(async () => [
      { id: 'ticket-1', user_id: 'customer-1', user_name: 'Mama Jeanne', title: 'Retard livraison', description: 'Client attend la livraison', status: 'open', priority: 'critical', category: 'delivery', created_at: isoNow, updated_at: isoNow, messages: [] },
    ]),
    getSupportDashboard: vi.fn(async () => ({
      kpis: { open_tickets: 1, open_tickets_change: 0, new_tickets: 1, new_tickets_change: 0, waiting_client: 0, waiting_client_change: 0, waiting_support: 1, waiting_support_change: 0, sla_compliance: 92, sla_compliance_change: 0, critical_tickets: 1, critical_tickets_change: 0, satisfaction: 88, satisfaction_change: 0, avg_response_minutes: 16, avg_response_change: 0 },
      tickets: [],
      sla: { within_sla: 4, at_risk: 1, breached: 0, avg_resolution_minutes: 20, compliance_percent: 92 },
      queue: [],
      ai_triage: [],
      sentiment: [],
      top_issues: [],
      agents: [],
      escalations: [],
      trends: [],
      channels: [],
      source: 'backend',
    })),
    getClaimsDashboard: vi.fn(async () => ({
      kpis: { open_claims: 1, open_claims_change: 0, critical_claims: 1, critical_claims_change: 0, active_disputes: 0, active_disputes_change: 0, refund_exposure: 0, refund_exposure_change: 0, sla_compliance: 80, sla_compliance_change: 0, avg_resolution_hours: 2, avg_resolution_change: 0, resolved_this_month: 0, resolved_change: 0, amount_at_risk: 0, amount_at_risk_change: 0 },
      claims: [{ id: 'claim-1', claim_number: 'CLM-1', title: 'Collecte manquée', ai_summary: 'Collecte non faite', client_name: 'Client', category: 'delivery', category_label: 'Livraison', priority: 'critical', priority_label: 'Critique', status: 'open', status_label: 'Ouvert', financial_impact: 0, sla_label: 'SLA dépassé', sla_state: 'breached', sla_minutes_remaining: null, updated_at: isoNow, partner_name: 'Pressing Prestige' }],
      distribution: [],
      sla: { in_sla: 0, at_risk: 0, breached: 1, compliance_percent: 80, by_category: [] },
      workflow: [],
      root_causes: [],
      heatmap: [],
      partner_risks: [],
      driver_risks: [],
      refunds: { pending_count: 0, pending_amount: 0, approved_count: 0, approved_amount: 0, paid_count: 0, paid_amount: 0, rejected_count: 0, rejected_amount: 0, total_exposure: 0 },
      escalations: [],
      source: 'backend',
    })),
    getReviewsDashboard: vi.fn(async () => ({
      kpis: { avg_rating: 4.7, avg_rating_change: 0, total_reviews: 2, total_reviews_change: 0, five_star: 1, five_star_change: 0, low_star: 0, low_star_change: 0, response_rate: 90, response_rate_change: 0, pending_reviews: 0, pending_reviews_change: 0, positive_sentiment: 95, positive_sentiment_change: 0, churn_risk: 0, churn_risk_change: 0 },
      reviews: [],
      rating_distribution: [],
      channels: [],
      review_types: [],
      top_partners: [{ partner_id: 'partner-1', partner_name: 'Pressing Prestige', avg_rating: 4.9, review_count: 12 }],
      top_drivers: [],
      negative_queue: [],
      sentiment: [],
      issues: [],
      agents: [],
      insights: [],
      word_cloud: [],
      trends: [],
      source: 'backend',
    })),
    getLoyaltyDashboard: vi.fn(async () => ({
      kpis: { members: 10, members_change: 0, points_circulation: 100, points_circulation_change: 0, points_earned: 20, points_earned_change: 0, points_redeemed: 5, points_redeemed_change: 0, points_value: 10, points_value_change: 0, redemption_rate: 10, redemption_rate_change: 0, influenced_revenue: 50, influenced_revenue_change: 0, retention_rate: 70, retention_rate_change: 0 },
      health: { score: 82, status: 'healthy', redemption_rate: 10, points_liability: 10, retention_uplift: 2, fraud_risk: 0 },
      tiers: [],
      top_customers: [],
      rewards: [],
      redemptions: [],
      trends: [],
      segments: [],
      source: 'backend',
    })),
    getCampaignDashboard: vi.fn(async () => ({
      kpis: { active_campaigns: 1, active_campaigns_change: 0, messages_sent: 10, messages_sent_change: 0, open_rate: 40, open_rate_change: 0, click_rate: 10, click_rate_change: 0, conversions: 2, conversions_change: 0, attributed_revenue: 50, attributed_revenue_change: 0 },
      campaigns: [],
      channels: [],
      funnel: [],
      trends: [],
      top_campaigns: [],
      segments: [],
      automations: [],
      calendar: [],
      roi: { budget_spent: 0, revenue_generated: 0, global_roi: 0, cost_per_acquisition: 0, customer_lifetime_value: 0, roas: 0 },
      watchlist: [],
      source: 'backend',
    })),
    getPaymentGatewaysDashboard: vi.fn(async () => ({
      kpis: { revenue_trend: 0, revenue_today: 120, revenue_today_change: 0, revenue_today_tx: 1, revenue_week: 120, revenue_week_change: 0, revenue_week_tx: 1, revenue_month: 120, revenue_month_change: 0, revenue_month_tx: 1, commissions_due: 0, commissions_due_ops: 0, commissions_paid: 0, commissions_paid_ops: 0, cash_in_transit: 0, cash_in_transit_ops: 0 },
      gateways: [],
      revenue_distribution: [],
      channel_performance: [],
      transactions: [],
      cash_flow: { cash_received: 0, cash_withdrawn: 0, cash_in_transit: 0, cash_net: 0 },
      commissions: { generated: 0, paid: 0, pending: 0, cancelled: 0, distribution: [] },
      incidents: [{ id: 'pay-1', incident_type: 'failed', title: 'Paiement échoué', severity: 'warning', gateway_slug: 'mobile_money', impact: 'Paiement à rapprocher', occurred_at: isoNow }],
      success_rate_trend: [],
      top_partners: [],
      settlements: [],
      webhooks: [],
      reconciliations: [],
      provider_health: [],
      refunds: [],
      fraud: { score: 0, repeated_payments: 0, suspicious_amounts: 0, abusive_refunds: 0, multiple_attempts: 0 },
      source: 'backend',
    })),
    getActivityLogDashboard: vi.fn(async () => ({
      kpis: { total_activities: 1, total_change: 0, admin_activities: 0, admin_change: 0, partner_activities: 0, partner_change: 0, driver_activities: 1, driver_change: 0, system_activities: 0, system_change: 0, anomalies: 0, anomalies_change: 0 },
      events: [{ id: 'event-1', event_id: 'evt-1', occurred_at: isoNow, actor_id: 'driver-1', actor_type: 'driver', actor_type_label: 'Chauffeur', actor_name: 'Driver Kin', actor_role: 'driver', action: 'delivery_completed', action_label: 'Livraison réalisée', description: 'Livraison confirmée', resource_type: 'order', resource_id: 'order-1', reference: 'LX-3001', corridor: 'logistics', corridor_label: 'Logistics Truth', severity: 'info', severity_label: 'Info', status: 'ok', status_label: 'OK', impact: null, ip_address: null, user_agent: null, device: null, browser: null, os_name: null, before_state: null, after_state: null, corridors_impacted: [], is_anomaly: false }],
      live_events: [],
      anomalies: [],
      heatmap: [],
      top_activities: [],
      corridor_health: [],
      actor_distribution: [],
      severity_distribution: [],
      analytics: [],
      total: 1,
      sensitive_access: false,
      read_only: false,
      source: 'backend',
    })),
    getMarketplaceCompanies: vi.fn(async () => ({ companies: [], total: 0, page: 1, page_size: 100 })),
  };

  return { context, realApi, isoNow, isoThirtyMinutesAgo, isoNinetyMinutesAgo };
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
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
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
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'Fleet Management')).not.toBeNull();

    view.click(buttonByText(view.container, /^Tracking$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'Live Tracking')).not.toBeNull();

    view.click(buttonByText(view.container, /^Trip Details$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'Timeline trajet')).not.toBeNull();
    expect(byText(view.container, 'Actions trajet')).not.toBeNull();

    view.click(buttonByText(view.container, /^Shipments$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'shp-001')).not.toBeNull();

    view.click(buttonByText(view.container, /^Maintenance$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(byText(view.container, 'Contrôle freinage moto')).not.toBeNull();

    view.click(buttonByText(view.container, /^Pilote$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
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
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
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

  it('renders logistics operational truth center from backend sources', async () => {
    window.history.replaceState(null, '', '/#performance');
    mocks.realApi.getLogisticsTasks.mockResolvedValueOnce({
      tasks: [
        {
          id: 'task-pickup-1',
          order_id: 'order-1',
          order_number: 'LX-3001',
          task_type: 'pickup',
          status: 'completed',
          pickup_commune: 'Gombe',
          delivery_commune: 'Lingwala',
          created_at: mocks.isoNinetyMinutesAgo,
          updated_at: mocks.isoThirtyMinutesAgo,
          started_at: mocks.isoNinetyMinutesAgo,
          completed_at: mocks.isoThirtyMinutesAgo,
        },
        {
          id: 'task-delivery-1',
          order_id: 'order-1',
          order_number: 'LX-3001',
          task_type: 'delivery',
          status: 'completed',
          pickup_commune: 'Gombe',
          delivery_commune: 'Lingwala',
          created_at: mocks.isoNinetyMinutesAgo,
          updated_at: mocks.isoNow,
          started_at: mocks.isoThirtyMinutesAgo,
          completed_at: mocks.isoNow,
        },
        {
          id: 'task-delivery-2',
          order_id: 'order-2',
          order_number: 'LX-3002',
          task_type: 'delivery',
          status: 'failed',
          pickup_commune: 'Limete',
          delivery_commune: 'Limete',
          created_at: mocks.isoNow,
          updated_at: mocks.isoNow,
        },
      ],
      total: 3,
      page: 1,
      page_size: 250,
    });
    mocks.realApi.getLogisticsDrivers.mockResolvedValueOnce({
      drivers: [
        { id: 'driver-1', user_id: 'driver-1', user_name: 'Driver Kin', user_email: 'driver1@kinexpress.cd', user_phone: '+243812345678', status: 'active', is_available: true, rating_avg: 5, rating_count: 0, created_at: mocks.isoNow, updated_at: mocks.isoNow },
        { id: 'driver-2', user_id: 'driver-2', user_name: 'Driver Two', user_email: 'driver2@kinexpress.cd', user_phone: '+243812345679', status: 'active', is_available: false, rating_avg: 4, rating_count: 0, created_at: mocks.isoNow, updated_at: mocks.isoNow },
      ],
      total: 2,
      page: 1,
      page_size: 250,
    });
    mocks.realApi.getVehicles.mockResolvedValueOnce({
      vehicles: [
        { id: 'vehicle-1', plate: 'KIN-001-MT', type: 'moto', status: 'assigned', driverId: 'driver-1', assignedDriverName: 'Driver Kin', zone: 'Gombe', location: 'Gombe', mileageKm: 1000, insuranceExpiresAt: mocks.isoNow, maintenance: { status: 'ok', nextServiceAtKm: 2000 } },
        { id: 'vehicle-2', plate: 'KIN-002-MT', type: 'moto', status: 'in_transit', driverId: 'driver-2', assignedDriverName: 'Driver Two', zone: 'Limete', location: 'Limete', mileageKm: 2000, insuranceExpiresAt: mocks.isoNow, maintenance: { status: 'scheduled', nextServiceAtKm: 2500 } },
      ],
    });

    const view = renderComponent(<LogisticsDashboardPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(byText(view.container, 'CENTRE OPÉRATIONNEL')).not.toBeNull();
    expect(byText(view.container, 'Pilotage temps réel des opérations Laundry Express')).not.toBeNull();
    expect(byText(view.container, 'LIVE')).not.toBeNull();
    expect(byText(view.container, 'Corridor de Vérité — Commandes')).not.toBeNull();
    expect(byText(view.container, 'Commandes créées')).not.toBeNull();
    expect(byText(view.container, 'Paiements validés')).not.toBeNull();
    expect(byText(view.container, 'Collectes effectuées')).not.toBeNull();
    expect(byText(view.container, 'Livraisons réalisées')).not.toBeNull();
    expect(byText(view.container, 'Retards critiques')).not.toBeNull();
    expect(byText(view.container, 'Tickets ouverts')).not.toBeNull();
    expect(byText(view.container, 'Pressing Prestige')).not.toBeNull();
    expect(byText(view.container, 'Truth Health')).not.toBeNull();
    expect(byText(view.container, 'Activity feed temps réel')).not.toBeNull();
    expect(mocks.realApi.getOrders).toHaveBeenCalled();
    expect(mocks.realApi.getSupportDashboard).toHaveBeenCalledWith(1);

    view.click(buttonByText(view.container, /^Cette semaine$/)!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mocks.realApi.getSupportDashboard).toHaveBeenCalledWith(7);

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
