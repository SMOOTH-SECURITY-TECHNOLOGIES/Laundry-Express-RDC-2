import React from 'react';
import { STATUS_COLORS, type StatusTone } from './tokens';

interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  /** Affiche un point animé (pulse) */
  pulse?: boolean;
  /** Variante visuelle */
  variant?: 'filled' | 'soft' | 'outline';
  /** Taille */
  size?: 'xs' | 'sm' | 'md';
  /** Icône optionnelle à gauche */
  icon?: React.ReactNode;
}

const SIZE_MAP = {
  xs: 'px-1.5 py-0.5 text-[9px] gap-1',
  sm: 'px-2 py-0.5 text-[10px] gap-1.5',
  md: 'px-3 py-1 text-xs gap-1.5',
} as const;

const DOT_SIZE = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
} as const;

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  tone = 'neutral',
  pulse = false,
  variant = 'soft',
  size = 'sm',
  icon,
}) => {
  const colors = STATUS_COLORS[tone];
  const sizeClass = SIZE_MAP[size];
  const dotSize = DOT_SIZE[size];

  const variantClass =
    variant === 'filled'
      ? `${colors.bgSolid} ${colors.textSolid}`
      : variant === 'outline'
        ? `border ${colors.border} ${colors.text} bg-transparent`
        : `${colors.bg} ${colors.text}`;

  return (
    <span
      className={`inline-flex items-center rounded-full font-black ${variantClass} ${sizeClass}`}
      role="status"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={`${dotSize} rounded-full ${colors.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};

export default StatusChip;
