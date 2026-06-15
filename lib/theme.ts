export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFERENCE_KEY = 'themePreference';
export const LEGACY_THEME_KEY = 'theme';

export const isThemePreference = (value: string | null | undefined): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

export const readStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system';

  const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  if (isThemePreference(stored)) return stored;

  const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
  if (legacy === 'light' || legacy === 'dark') return legacy;

  return 'system';
};

export const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const applyThemeToDocument = (resolved: ResolvedTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#0077B6');
  }
};

/** Theme-aware surfaces — prefer these over bg-white + dark: pairs */
export const cardClass = 'surface-card rounded-2xl';
export const cardClassPlain = 'bg-surface-card rounded-2xl border border-surface-border-subtle';
export const mutedPanelClass = 'surface-muted rounded-xl';
export const pageHeadingClass = 'text-content-primary';
export const pageSubtextClass = 'text-content-muted';
export const faintTextClass = 'text-content-faint';
