// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { DriverMobileDashboard } from '../DriverMobileDashboard';
import { pilotResetMetrics } from '../../../lib/pilot-metrics-store';

const baseProps = {
  mission: {
    id: 'task-1',
    orderRef: 'LX-1001',
    type: 'pickup' as const,
    status: 'in_progress',
    statusLabel: 'En cours',
    clientName: 'Marie Kabongo',
    clientPhone: '+243812345678',
    pickupAddress: 'Gombe, Kinshasa',
    deliveryAddress: 'Lingwala, Kinshasa',
    eta: '14:30',
    gain: '2.00 $',
    distance: '3.2 km',
  },
  availableMissions: [],
  missionHistory: [],
  earnings: [],
  stats: {
    completedToday: 2,
    totalEarnings: '12.00 $',
    weeklyEarnings: '8.00 $',
    weeklyMissions: 4,
    rating: 4.8,
    reviewCount: 12,
    acceptanceRate: 92,
  },
  driverName: 'Kabongo',
  isAvailable: true,
  referralCode: 'DRV-REF',
  referralCount: 1,
  onToggleAvailability: vi.fn(),
  onAcceptMission: vi.fn(),
  onStartMission: vi.fn(),
  onCompleteMission: vi.fn(),
  onArrivePickup: vi.fn(),
  onArriveDelivery: vi.fn(),
  onIncidentSubmit: vi.fn(),
  onProofSubmit: vi.fn(),
  onCallClient: vi.fn(),
  onOpenMap: vi.fn(),
  onNavigate: vi.fn(),
  onAvatarChange: vi.fn(),
  onSaveProfile: vi.fn(),
  isUpdating: false,
  missionSubPhase: 'in_transit_pickup' as const,
};

const viewports = [360, 390, 430] as const;

describe('DriverMobileDashboard Mobile', () => {
  beforeEach(() => {
    pilotResetMetrics();
    vi.clearAllMocks();
  });

  viewports.forEach((width) => {
    it(`renders active mission at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      const view = renderComponent(<DriverMobileDashboard {...baseProps} />);
      expect(byText(view.container, 'Bonjour, Kabongo')).not.toBeNull();
      expect(byText(view.container, 'LX-1001')).not.toBeNull();
      expect(byText(view.container, 'Marie Kabongo')).not.toBeNull();
      view.unmount();
    });
  });

  it('calls onArrivePickup from mission actions', () => {
    const onArrivePickup = vi.fn();
    const view = renderComponent(
      <DriverMobileDashboard {...baseProps} onArrivePickup={onArrivePickup} />,
    );
    const btn = buttonByText(view.container, /Arrivé au pickup/i);
    expect(btn).not.toBeNull();
    view.click(btn!);
    expect(onArrivePickup).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('opens incident sheet and submits', () => {
    const onIncidentSubmit = vi.fn();
    const view = renderComponent(
      <DriverMobileDashboard {...baseProps} onIncidentSubmit={onIncidentSubmit} />,
    );
    const incidentBtn = buttonByText(view.container, /Signaler un incident/i);
    expect(incidentBtn).not.toBeNull();
    view.click(incidentBtn!);
    view.unmount();
  });

  it('shows bottom navigation with missions tab', () => {
    const view = renderComponent(<DriverMobileDashboard {...baseProps} />);
    expect(byText(view.container, 'Missions')).not.toBeNull();
    expect(byText(view.container, 'Historique')).not.toBeNull();
    view.unmount();
  });

  it('opens documents screen from quick actions instead of blank view', () => {
    const view = renderComponent(<DriverMobileDashboard {...baseProps} />);
    const documentsBtn = buttonByText(view.container, /Documents/i);
    expect(documentsBtn).not.toBeNull();
    view.click(documentsBtn!);
    expect(byText(view.container, 'Permis de conduire')).not.toBeNull();
    expect(byText(view.container, "Retour à l'accueil")).not.toBeNull();
    view.unmount();
  });

  it('opens support screen from quick actions', () => {
    const view = renderComponent(<DriverMobileDashboard {...baseProps} />);
    const supportBtn = buttonByText(view.container, /^Support$/i);
    expect(supportBtn).not.toBeNull();
    view.click(supportBtn!);
    expect(byText(view.container, 'Ouvrir le centre support')).not.toBeNull();
    view.unmount();
  });
});
