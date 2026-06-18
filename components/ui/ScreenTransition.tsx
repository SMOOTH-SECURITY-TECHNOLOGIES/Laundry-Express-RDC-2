import React, { useEffect, useRef, useState } from 'react';

interface ScreenTransitionProps {
  children: React.ReactNode;
  /** Clé qui change pour déclencher l'animation */
  transitionKey: string;
  /** Type d'animation */
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  /** Durée en ms */
  duration?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  transitionKey,
  animation = 'fade',
  duration = 200,
}) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationClass, setAnimationClass] = useState('');
  const prevKey = useRef(transitionKey);

  useEffect(() => {
    if (prevKey.current !== transitionKey) {
      // Sortie
      setAnimationClass(getExitClass(animation));
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        // Entrée
        setAnimationClass(getEnterClass(animation));
      }, duration / 2);
      prevKey.current = transitionKey;
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [children, transitionKey, animation, duration]);

  return (
    <div
      className={animationClass}
      style={{
        transitionDuration: `${duration / 2}ms`,
        transitionTimingFunction: 'ease-out',
      }}
    >
      {displayChildren}
    </div>
  );
};

const getEnterClass = (animation: string) => {
  switch (animation) {
    case 'slide-up':
      return 'animate-slide-up';
    case 'slide-left':
      return 'translate-x-0 opacity-100';
    case 'scale':
      return 'scale-100 opacity-100';
    default:
      return 'animate-fade-in';
  }
};

const getExitClass = (animation: string) => {
  switch (animation) {
    case 'slide-up':
      return 'opacity-0 translate-y-4';
    case 'slide-left':
      return 'translate-x-4 opacity-0';
    case 'scale':
      return 'scale-95 opacity-0';
    default:
      return 'opacity-0';
  }
};

export default ScreenTransition;
