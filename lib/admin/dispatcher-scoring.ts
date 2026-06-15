export interface DriverScoreInput {
  distanceKm: number;
  slaUrgency: number;
  performanceHistory: number;
  currentLoad: number;
  availability: number;
}

export function computeDriverScore(input: DriverScoreInput): number {
  const distanceScore = Math.max(0, 100 - input.distanceKm * 8);
  const loadScore = Math.max(0, 100 - input.currentLoad);
  const raw =
    distanceScore * 0.4 +
    input.slaUrgency * 0.25 +
    input.performanceHistory * 0.2 +
    loadScore * 0.1 +
    input.availability * 0.05;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function rankDrivers<T extends { id: string }>(
  drivers: T[],
  scoreFn: (driver: T) => number
): Array<T & { score: number }> {
  return drivers
    .map((driver) => ({ ...driver, score: scoreFn(driver) }))
    .sort((a, b) => b.score - a.score);
}
