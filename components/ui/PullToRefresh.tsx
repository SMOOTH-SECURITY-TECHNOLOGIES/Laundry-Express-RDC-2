import React, { useRef, useState, useCallback } from 'react';
import { Icon } from '../Icon';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** Seuil de pull pour déclencher le refresh */
  threshold?: number;
  /** Texte affiché pendant le pull */
  pullText?: string;
  /** Texte affiché pendant le release */
  releaseText?: string;
  /** Texte affiché pendant le chargement */
  loadingText?: string;
  /** Désactiver le pull-to-refresh */
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  pullText = 'Tirez pour rafraîchir',
  releaseText = 'Relâchez pour rafraîchir',
  loadingText = 'Chargement...',
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Vérifier si on est en haut de la page
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Résistance au pull (60% de la distance réelle)
      const resistance = 0.6;
      setPullDistance(Math.min(diff * resistance, threshold * 1.5));
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(40); // Hauteur pendant le chargement

      try {
        await onRefresh();
      } catch {
        // Erreur silencieuse
      }

      setIsRefreshing(false);
    }

    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = pullDistance * 2;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: pullDistance,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-content-muted">
          {isRefreshing ? (
            <>
              <Icon name="arrow-path" className="h-5 w-5 animate-spin" />
              {loadingText}
            </>
          ) : pullDistance >= threshold ? (
            <>
              <Icon
                name="arrow-path"
                className="h-5 w-5"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              {releaseText}
            </>
          ) : (
            <>
              <Icon
                name="arrow-path"
                className="h-5 w-5"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              {pullText}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: isRefreshing ? `translateY(${pullDistance}px)` : `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
