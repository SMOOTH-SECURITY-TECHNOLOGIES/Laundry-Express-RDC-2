import { useState, useCallback, useEffect } from 'react';
import {
  calculatePilotMetrics,
  pilotExportMetrics,
  pilotResetMetrics,
  pilotTrackAssignment,
  pilotTrackCancellation,
  pilotTrackDelivery,
  pilotTrackIncident,
  pilotTrackMissionStart,
  pilotTrackPickup,
  subscribePilotMetrics,
  type PilotMetricsSnapshot,
} from '../lib/pilot-metrics-store';

interface UsePilotMetricsResult {
  metrics: PilotMetricsSnapshot;
  trackMissionStart: (missionId: string) => void;
  trackAssignment: (missionId: string) => void;
  trackPickup: (missionId: string) => void;
  trackDelivery: (missionId: string) => void;
  trackIncident: (missionId: string, type: string) => void;
  trackDelay: (missionId: string, minutes: number) => void;
  trackCancellation: (missionId: string) => void;
  exportMetrics: () => string;
  reset: () => void;
}

const defaultMetrics: PilotMetricsSnapshot = {
  avgAssignmentTime: 0,
  avgPickupTime: 0,
  avgDeliveryTime: 0,
  completionRate: 0,
  incidentCount: 0,
  delayCount: 0,
  totalMissions: 0,
  completedMissions: 0,
  failedMissions: 0,
  cancelledMissions: 0,
  lastUpdated: new Date(),
};

export function usePilotMetrics(): UsePilotMetricsResult {
  const [metrics, setMetrics] = useState<PilotMetricsSnapshot>(defaultMetrics);

  useEffect(() => {
    setMetrics(calculatePilotMetrics());
    return subscribePilotMetrics(() => setMetrics(calculatePilotMetrics()));
  }, []);

  const trackDelay = useCallback((missionId: string, minutes: number) => {
    pilotTrackDelivery(missionId);
    void minutes;
  }, []);

  return {
    metrics,
    trackMissionStart: pilotTrackMissionStart,
    trackAssignment: pilotTrackAssignment,
    trackPickup: pilotTrackPickup,
    trackDelivery: pilotTrackDelivery,
    trackIncident: pilotTrackIncident,
    trackCancellation: pilotTrackCancellation,
    trackDelay,
    exportMetrics: pilotExportMetrics,
    reset: pilotResetMetrics,
  };
}

export default usePilotMetrics;
