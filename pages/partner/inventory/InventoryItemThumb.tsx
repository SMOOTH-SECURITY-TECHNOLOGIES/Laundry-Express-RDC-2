import React from 'react';
import { Icon } from '../../../components/Icon';

interface InventoryItemThumbProps {
  name: string;
  imageUrl?: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 rounded-lg text-base',
  md: 'h-10 w-10 rounded-lg text-xl',
  lg: 'h-14 w-14 rounded-xl text-2xl',
};

export const InventoryItemThumb: React.FC<InventoryItemThumbProps> = ({
  name,
  imageUrl,
  icon = '📦',
  size = 'md',
  className = '',
}) => {
  const [broken, setBroken] = React.useState(false);
  const sizeClass = sizeClasses[size];
  const src = imageUrl?.trim() || '';

  React.useEffect(() => {
    setBroken(false);
  }, [src]);

  if (src && !broken) {
    return (
      <img
        key={src}
        src={src}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${sizeClass} shrink-0 object-cover bg-surface-muted ${className}`}
      />
    );
  }

  if (icon) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center bg-surface-muted ${className}`}
        aria-hidden="true"
      >
        {icon}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center bg-brand-blue/10 ${className}`}
      aria-hidden="true"
    >
      <Icon name="archive-box" className="h-4 w-4 text-brand-blue" />
    </div>
  );
};
