import { realApi } from '../../services/real-api';
import { truthDashboardFixture } from './truth-dashboard-fixtures';
import { TruthDashboardData } from './truth-dashboard-types';

export async function fetchTruthDashboardData(): Promise<{ data: TruthDashboardData; isFallback: boolean }> {
  try {
    const health = await realApi.getCorridorsHealth();
    const corridors = truthDashboardFixture.corridors.map((corridor) => {
      const backendCorridor = health.corridors.find((item) => item.corridor === corridor.id);
      if (!backendCorridor) return corridor;
      return {
        ...corridor,
        status: backendCorridor.status as typeof corridor.status,
        rows: corridor.rows.map((row) =>
          row.label.toLowerCase().includes('anomalies') || row.label.toLowerCase().includes('retards')
            ? { ...row, value: backendCorridor.open_anomalies }
            : row
        ),
      };
    });

    return {
      data: {
        ...truthDashboardFixture,
        corridors,
        summary: {
          ...truthDashboardFixture.summary,
          lastCheckedAt: health.checked_at,
          openAnomalies: health.corridors.reduce((sum, corridor) => sum + Number(corridor.open_anomalies || 0), 0),
        },
      },
      isFallback: false,
    };
  } catch {
    return { data: truthDashboardFixture, isFallback: true };
  }
}

export async function runTruthAudit(): Promise<{ status: 'queued' }> {
  return { status: 'queued' };
}

export async function exportTruthReport(): Promise<{ status: 'ready' }> {
  return { status: 'ready' };
}
