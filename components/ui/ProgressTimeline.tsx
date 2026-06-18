/**
 * ProgressTimeline — Legacy wrapper
 * Delegates to DeliveryTimeline for consistent design system usage.
 * Kept for backward compatibility with existing imports.
 */
import React from 'react';
import { DeliveryTimeline, type DeliveryStep } from './DeliveryTimeline';
import type { StatusTone } from './tokens';

export interface TimelineStep {
  label: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  compact?: boolean;
}

const toDeliverySteps = (steps: TimelineStep[]): DeliveryStep[] =>
  steps.map((step, i) => ({
    id: `step-${i}`,
    label: step.label,
    timestamp: step.timestamp,
    completed: step.completed,
    current: step.current,
  }));

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ steps, compact = false }) => (
  <DeliveryTimeline steps={toDeliverySteps(steps)} compact={compact} showDescriptions={false} />
);

export default ProgressTimeline;
