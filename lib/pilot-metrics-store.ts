type MissionTiming = {
  missionId: string;
  createdAt: number;
  assignedAt?: number;
  pickupAt?: number;
  deliveredAt?: number;
  failedAt?: number;
  cancelledAt?: number;
};

export type PilotMetricsSnapshot = {
  avgAssignmentTime: number;
  avgPickupTime: number;
  avgDeliveryTime: number;
  completionRate: number;
  incidentCount: number;
  delayCount: number;
  totalMissions: number;
  completedMissions: number;
  failedMissions: number;
  cancelledMissions: number;
  lastUpdated: Date;
};

const timings = new Map<string, MissionTiming>();
const incidents: { missionId: string; type: string; timestamp: number }[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

export function subscribePilotMetrics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function calculatePilotMetrics(): PilotMetricsSnapshot {
  const entries = Array.from(timings.values());

  const assignmentTimes = entries
    .filter((entry) => entry.assignedAt && entry.createdAt)
    .map((entry) => (entry.assignedAt! - entry.createdAt) / 60000);
  const pickupTimes = entries
    .filter((entry) => entry.pickupAt && entry.assignedAt)
    .map((entry) => (entry.pickupAt! - entry.assignedAt!) / 60000);
  const deliveryTimes = entries
    .filter((entry) => entry.deliveredAt && entry.pickupAt)
    .map((entry) => (entry.deliveredAt! - entry.pickupAt!) / 60000);

  const totalMissions = entries.length;
  const completedMissions = entries.filter((entry) => entry.deliveredAt).length;
  const failedMissions = entries.filter((entry) => entry.failedAt).length;
  const cancelledMissions = entries.filter((entry) => entry.cancelledAt).length;

  return {
    avgAssignmentTime: assignmentTimes.length
      ? Math.round(assignmentTimes.reduce((a, b) => a + b, 0) / assignmentTimes.length)
      : 0,
    avgPickupTime: pickupTimes.length
      ? Math.round(pickupTimes.reduce((a, b) => a + b, 0) / pickupTimes.length)
      : 0,
    avgDeliveryTime: deliveryTimes.length
      ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
      : 0,
    completionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
    incidentCount: incidents.length,
    delayCount: entries.filter((entry) => {
      if (!entry.deliveredAt || !entry.pickupAt) return false;
      return (entry.deliveredAt - entry.pickupAt) / 60000 > 30;
    }).length,
    totalMissions,
    completedMissions,
    failedMissions,
    cancelledMissions,
    lastUpdated: new Date(),
  };
}

export function pilotTrackMissionStart(missionId: string): void {
  timings.set(missionId, { missionId, createdAt: Date.now() });
  notify();
}

export function pilotTrackAssignment(missionId: string): void {
  const timing = timings.get(missionId);
  if (timing) timings.set(missionId, { ...timing, assignedAt: Date.now() });
  else timings.set(missionId, { missionId, createdAt: Date.now(), assignedAt: Date.now() });
  notify();
}

export function pilotTrackPickup(missionId: string): void {
  const timing = timings.get(missionId);
  if (timing) timings.set(missionId, { ...timing, pickupAt: Date.now() });
  notify();
}

export function pilotTrackDelivery(missionId: string): void {
  const timing = timings.get(missionId);
  if (timing) timings.set(missionId, { ...timing, deliveredAt: Date.now() });
  notify();
}

export function pilotTrackIncident(missionId: string, type: string): void {
  incidents.push({ missionId, type, timestamp: Date.now() });
  notify();
}

export function pilotTrackCancellation(missionId: string): void {
  const timing = timings.get(missionId);
  if (timing) timings.set(missionId, { ...timing, cancelledAt: Date.now() });
  notify();
}

export function pilotExportMetrics(): string {
  return JSON.stringify(
    {
      metrics: calculatePilotMetrics(),
      timings: Array.from(timings.values()),
      incidents,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function pilotResetMetrics(): void {
  timings.clear();
  incidents.length = 0;
  notify();
}

export function getPilotTimings(): MissionTiming[] {
  return Array.from(timings.values());
}
