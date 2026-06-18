export type MissionSubPhase = 'in_transit_pickup' | 'in_transit_delivery';

const storageKey = (taskId: string) => `driver-mission-phase:${taskId}`;

export function getMissionSubPhase(taskId: string): MissionSubPhase | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(storageKey(taskId));
  return value === 'in_transit_pickup' || value === 'in_transit_delivery' ? value : null;
}

export function setMissionSubPhase(taskId: string, phase: MissionSubPhase): void {
  sessionStorage.setItem(storageKey(taskId), phase);
}

export function clearMissionSubPhase(taskId: string): void {
  sessionStorage.removeItem(storageKey(taskId));
}

export function resolveMissionStep(
  status: string,
  subPhase: MissionSubPhase | null,
): 'driver_assigned' | 'accepted' | 'in_transit_pickup' | 'in_transit_delivery' | 'completed' {
  if (status === 'driver_assigned') return 'driver_assigned';
  if (status === 'accepted') return 'accepted';
  if (status === 'in_progress') {
    return subPhase === 'in_transit_delivery' ? 'in_transit_delivery' : 'in_transit_pickup';
  }
  if (status === 'completed') return 'completed';
  return 'driver_assigned';
}
