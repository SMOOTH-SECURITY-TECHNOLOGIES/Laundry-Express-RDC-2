export interface DriverScoreInput {
  sla: number;
  rating: number;
  punctuality: number;
  acceptance: number;
  incidentPenalty: number;
}

export function computeDriverScore(input: DriverScoreInput): number {
  const incidentScore = Math.max(0, 100 - input.incidentPenalty);
  const raw =
    input.sla * 0.3 +
    (input.rating / 5) * 100 * 0.25 +
    input.punctuality * 0.2 +
    input.acceptance * 0.15 +
    incidentScore * 0.1;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
