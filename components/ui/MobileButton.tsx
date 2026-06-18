import React from 'react';
import { Icon } from '../Icon';
import { TOUCH, TYPO } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

interface MobileButtonProps {
  children?: React.ReactNode;
  label?: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  iconRight?: React.ComponentProps<typeof Icon>['name'];
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-blue text-white hover:bg-brand-blue-700 active:bg-brand-blue-800 shadow-lg shadow-blue-200 dark:shadow-blue-900/30',
  secondary:
    'border border-surface-border bg-surface-card text-content-primary hover:bg-surface-muted active:bg-surface-border',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-lg shadow-red-200 dark:shadow-red-900/30',
  ghost:
    'text-content-primary hover:bg-surface-muted active:bg-surface-border',
  success:
    'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/30',
  warning:
    'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-orange-900/30',
};

const SIZE_MAP: Record<ButtonSize, { height: string; padding: string; text: string; icon: string }> = {
  sm: { height: TOUCH.minBtnSm, padding: 'px-3', text: TYPO.btnSm, icon: 'h-3.5 w-3.5' },
  md: { height: TOUCH.minBtn, padding: 'px-4', text: TYPO.btn, icon: 'h-4 w-4' },
  lg: { height: TOUCH.minBtnLg, padding: 'px-6', text: 'text-base font-black', icon: 'h-5 w-5' },
};

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  label,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
}) => {
  const s = SIZE_MAP[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-black transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANT_MAP[variant]
      } ${s.height} ${s.padding} ${s.text} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} className={s.icon} />
      ) : null}
      {label || children}
      {iconRight && !loading && <Icon name={iconRight} className={s.icon} />}
    </button>
  );
};

export default MobileButton;
