import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types';
import * as api from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { appEvents } from '../utils/events';
import { useLanguageContext } from './LanguageContext';
import { useNavigation } from './NavigationContext';

interface AuthContextType {
  user: User | null;
  login: (payload: LoginRequest) => Promise<{ user: User; token: string }>;
  register: (payload: RegisterRequest) => Promise<{ user: User; token: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<User>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguageContext();
  const { setCurrentPage } = useNavigation();

  useEffect(() => {
    const handleDataChange = async () => {
        if (user) {
            const { users } = await api.fetchAllData();
            const latestUserData = users.find(u => u.id === user.id);
            if (latestUserData && JSON.stringify(latestUserData) !== JSON.stringify(user)) {
                setUser(latestUserData);
            } else if (!latestUserData) {
                logout();
            }
        }
    };
    
    const unsubscribe = appEvents.on('data_changed', handleDataChange);
    return () => unsubscribe();
  }, [user, setUser]);

  // Effect for Advanced Matching and User ID tracking
  useEffect(() => {
    if (user) {
        console.log('[Tracking] User identified, setting user properties for GTM.', user.id);
        window.dataLayer = window.dataLayer || [];

        const nameParts = (user.name || '').split(' ');
        const fn = nameParts[0];
        const ln = nameParts.slice(1).join(' ');

        // Push a generic 'user_authenticated' event which GTM can use as a trigger
        // This is more robust than using 'login' which might only be for the initial login action
        window.dataLayer.push({
            event: 'user_authenticated',
            user_id: user.id, // For GA4 User ID tracking
            user_properties: { // For GA4 User Properties
                user_role: user.role,
                has_partner_id: !!user.partnerId
            },
            // For Meta Advanced Matching (GTM will be configured to pick this up and hash it)
            user_data: {
                email: user.email,
                phone: user.phone,
                fn: fn, // First name
                ln: ln, // Last name
                ct: user.pickupAddress?.commune, // City
            }
        });
    }
  }, [user]);

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoading(true);
    try {
      const result = await api.apiLogin(payload);
      setUser(result.user);
      // Clean up guest order count upon successful login
      localStorage.removeItem('guestOrderCount');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      const result = await api.apiRegister(payload, t);
      setUser(result.user);
      // Clean up guest order count upon successful registration
      localStorage.removeItem('guestOrderCount');
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, t]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('activeOrder');
    appEvents.emit('logout'); // Emit logout event to clear other contexts
    setCurrentPage({ name: 'home' });
  }, [setUser, setCurrentPage]);

  const updateUser = useCallback(async (updatedUser: User) => {
    setIsLoading(true);
    try {
      const savedUser = await api.apiUpdateUser(updatedUser);
      if (user?.id === savedUser.id) {
        setUser(savedUser);
      }
      return savedUser;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser]);
  
  const value = useMemo(() => ({ user, login, register, logout, updateUser, isAuthenticated: !!user, isLoading }), [user, login, register, logout, updateUser, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};