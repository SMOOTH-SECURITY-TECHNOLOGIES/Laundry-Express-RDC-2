// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePilotMetrics } from '../usePilotMetrics';
import { pilotResetMetrics } from '../../lib/pilot-metrics-store';

describe('usePilotMetrics', () => {
  beforeEach(() => {
    pilotResetMetrics();
  });
  it('initializes with default metrics', () => {
    const { result } = renderHook(() => usePilotMetrics());
    expect(result.current.metrics.totalMissions).toBe(0);
    expect(result.current.metrics.completionRate).toBe(0);
    expect(result.current.metrics.incidentCount).toBe(0);
    expect(result.current.metrics.delayCount).toBe(0);
  });

  it('tracks mission start', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    expect(result.current.metrics.totalMissions).toBe(1);
  });

  it('tracks assignment', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    act(() => {
      result.current.trackAssignment('mission-1');
    });
    expect(result.current.metrics.totalMissions).toBe(1);
  });

  it('tracks delivery', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    act(() => {
      result.current.trackDelivery('mission-1');
    });
    expect(result.current.metrics.completedMissions).toBe(1);
    expect(result.current.metrics.completionRate).toBe(100);
  });

  it('tracks incident', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    act(() => {
      result.current.trackIncident('mission-1', 'traffic');
    });
    expect(result.current.metrics.incidentCount).toBe(1);
  });

  it('tracks cancellation', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    act(() => {
      result.current.trackCancellation('mission-1');
    });
    expect(result.current.metrics.cancelledMissions).toBe(1);
  });

  it('calculates completion rate correctly', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    act(() => {
      result.current.trackMissionStart('mission-2');
    });
    act(() => {
      result.current.trackDelivery('mission-1');
    });
    expect(result.current.metrics.completionRate).toBe(50);
  });

  it('exports metrics as JSON', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
    });
    const exported = result.current.exportMetrics();
    const parsed = JSON.parse(exported);
    expect(parsed.metrics).toBeDefined();
    expect(parsed.timings).toBeDefined();
    expect(parsed.incidents).toBeDefined();
    expect(parsed.exportedAt).toBeDefined();
  });

  it('resets metrics', () => {
    const { result } = renderHook(() => usePilotMetrics());
    act(() => {
      result.current.trackMissionStart('mission-1');
      result.current.trackDelivery('mission-1');
    });
    expect(result.current.metrics.totalMissions).toBe(1);
    act(() => {
      result.current.reset();
    });
    expect(result.current.metrics.totalMissions).toBe(0);
    expect(result.current.metrics.completedMissions).toBe(0);
  });
});
