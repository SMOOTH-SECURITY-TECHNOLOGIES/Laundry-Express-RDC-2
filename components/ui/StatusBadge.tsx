/**
 * StatusBadge — Legacy wrapper
 * Delegates to StatusChip for consistent design system usage.
 * Kept for backward compatibility with existing imports.
 */
import React from 'react';
import { StatusChip } from './StatusChip';
import { type StatusTone } from './tokens';

type LegacyTone = 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'slate';

const TONE_MAP: Record<LegacyTone, StatusTone> = {
  blue: 'info',
  green: 'success',
  orange: 'warning',
  red: 'danger',
  violet: 'info',
  slate: 'neutral',
};

interface StatusBadgeProps {
  label: string;
  tone?: LegacyTone;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'slate',
  pulse = false,
  size = 'sm',
}) => (
  <StatusChip
    label={label}
    tone={TONE_MAP[tone]}
    pulse={pulse}
    size={size}
    variant="soft"
  />
);

export default StatusBadge;
