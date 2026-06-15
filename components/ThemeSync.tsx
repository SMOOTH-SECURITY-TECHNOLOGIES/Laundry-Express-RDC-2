import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { realApi } from '../services/real-api';

/** Applies server-side theme preference after login; skips mock sessions. */
export const ThemeSync: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { syncFromProfile } = useTheme();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (!realApi.hasAuthSession()) return;

    let cancelled = false;
    realApi
      .getCurrentUser()
      .then((response) => {
        if (!cancelled) {
          syncFromProfile(response.profile?.theme_preference);
        }
      })
      .catch(() => {
        // Keep local preference when profile fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isAuthenticated, syncFromProfile]);

  return null;
};
