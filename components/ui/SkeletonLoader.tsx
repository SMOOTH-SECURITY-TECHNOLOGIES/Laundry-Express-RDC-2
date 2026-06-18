import React from 'react';

interface SkeletonLoaderProps {
  /** Type de skeleton */
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  /** Nombre de lignes (pour variant text) */
  lines?: number;
  /** Largeur (CSS) */
  width?: string;
  /** Hauteur (CSS) */
  height?: string;
  /** Classes supplémentaires */
  className?: string;
}

const SkeletonPulse: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`animate-pulse rounded-xl bg-surface-muted ${className}`} style={style} />
);

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  lines = 1,
  width,
  height,
  className = '',
}) => {
  if (variant === 'circular') {
    return (
      <SkeletonPulse
        className={`rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <SkeletonPulse
        className={`rounded-2xl ${className}`}
        style={{ width: width || '100%', height: height || '100px' }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-surface-border-subtle bg-surface-card p-4 shadow-card ${className}`}>
        <div className="flex items-start gap-3">
          <SkeletonPulse className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <SkeletonPulse className="h-3 w-full" />
          <SkeletonPulse className="h-3 w-5/6" />
        </div>
      </div>
    );
  }

  // Text variant
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton pour une card de mission
 */
export const MissionCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4 shadow-card">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="80px" height="12px" />
        <SkeletonLoader variant="text" width="120px" height="20px" />
        <SkeletonLoader variant="text" width="100px" height="14px" />
      </div>
      <SkeletonLoader variant="circular" width="60px" height="24px" />
    </div>
    <div className="mt-4 rounded-2xl bg-surface-muted p-3 space-y-2">
      <div className="flex justify-between">
        <SkeletonLoader variant="text" width="60px" height="12px" />
        <SkeletonLoader variant="text" width="80px" height="14px" />
      </div>
      <div className="flex justify-between">
        <SkeletonLoader variant="text" width="70px" height="12px" />
        <SkeletonLoader variant="text" width="90px" height="14px" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <SkeletonLoader variant="rectangular" height="48px" className="rounded-2xl" />
      <div className="grid grid-cols-2 gap-2">
        <SkeletonLoader variant="rectangular" height="40px" className="rounded-2xl" />
        <SkeletonLoader variant="rectangular" height="40px" className="rounded-2xl" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton pour une liste de missions
 */
export const MissionListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <MissionCardSkeleton key={i} />
    ))}
  </div>
);

export default SkeletonLoader;
