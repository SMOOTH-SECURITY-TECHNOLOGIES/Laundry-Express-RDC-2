import React, { useRef, useState, useCallback } from 'react';

interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  /** Seuil de swipe en px pour déclencher l'action */
  threshold?: number;
  /** Désactiver le swipe */
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Limiter le swipe dans les deux sens
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setOffsetX(clampedOffset);
  }, [disabled, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsDragging(false);

    if (leftAction && offsetX < -threshold) {
      leftAction.onClick();
    } else if (rightAction && offsetX > threshold) {
      rightAction.onClick();
    }

    setOffsetX(0);
  }, [disabled, offsetX, threshold, leftAction, rightAction]);

  const showLeft = leftAction && offsetX < -20;
  const showRight = rightAction && offsetX > 20;

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-opacity ${
            showLeft ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: leftAction.bgColor }}
        >
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: leftAction.color }}>
            {leftAction.icon}
            {leftAction.label}
          </span>
        </div>
      )}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-opacity ${
            showRight ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: rightAction.bgColor }}
        >
          <span className="flex items-center gap-2 text-sm font-bold" style={{ color: rightAction.color }}>
            {rightAction.label}
            {rightAction.icon}
          </span>
        </div>
      )}

      {/* Card content */}
      <div
        className="relative z-10 transition-transform"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableCard;
