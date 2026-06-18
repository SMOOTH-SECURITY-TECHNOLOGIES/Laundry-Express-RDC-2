/**
 * QuickAction — Legacy wrapper
 * Delegates to MobileButton for consistent design system usage.
 * Kept for backward compatibility with existing imports.
 */
import React from 'react';
import { MobileButton } from './MobileButton';
import type { Icon } from '../Icon';

type LegacyVariant = 'primary' | 'secondary' | 'danger';

const VARIANT_MAP: Record<LegacyVariant, 'primary' | 'secondary' | 'danger'> = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
};

interface QuickActionProps {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onClick: () => void;
  variant?: LegacyVariant;
  disabled?: boolean;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
}) => (
  <MobileButton
    label={label}
    icon={icon}
    variant={VARIANT_MAP[variant]}
    size="md"
    disabled={disabled}
    onClick={onClick}
  />
);

export default QuickAction;
