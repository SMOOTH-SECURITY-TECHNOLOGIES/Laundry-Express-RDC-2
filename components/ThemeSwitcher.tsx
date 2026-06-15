import React from 'react';
import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-full text-content-muted hover:bg-surface-muted transition-colors ${className}`}
      aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
    >
      {theme === 'light' ? (
        <Icon name="moon" className="w-5 h-5" />
      ) : (
        <Icon name="sun" className="w-5 h-5" />
      )}
    </button>
  );
};
