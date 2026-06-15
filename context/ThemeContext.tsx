import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import {
  applyThemeToDocument,
  readStoredThemePreference,
  resolveTheme,
  THEME_PREFERENCE_KEY,
  LEGACY_THEME_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';
import { realApi } from '../services/real-api';

interface ThemeContextType {
  theme: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  syncFromProfile: (preference: string | null | undefined) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const persistThemeToBackend = async (preference: ThemePreference) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token || token.startsWith('TOKEN-')) return;
  try {
    await realApi.updateThemePreference(preference);
  } catch {
    // Local preference remains applied even if sync fails.
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => readStoredThemePreference());
  const theme = useMemo(() => resolveTheme(themePreference), [themePreference]);

  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(THEME_PREFERENCE_KEY, themePreference);
    localStorage.setItem(LEGACY_THEME_KEY, theme);
  }, [theme, themePreference]);

  useEffect(() => {
    if (themePreference !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDocument(resolveTheme('system'));
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void persistThemeToBackend(preference);
  }, []);

  const syncFromProfile = useCallback((preference: string | null | undefined) => {
    if (preference === 'light' || preference === 'dark' || preference === 'system') {
      setThemePreferenceState(preference);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextResolved: ResolvedTheme = theme === 'light' ? 'dark' : 'light';
    setThemePreference(nextResolved);
  }, [theme, setThemePreference]);

  const value = useMemo(
    () => ({ theme, themePreference, setThemePreference, toggleTheme, syncFromProfile }),
    [theme, themePreference, setThemePreference, toggleTheme, syncFromProfile],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
