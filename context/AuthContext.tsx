import React, { createContext, useState, useContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { User, LoginRequest, RegisterRequest, DrcAddress } from '../types';
import { realApi, ApiCurrentUserResponse, ApiAddress } from '../services/real-api';
import { apiLogin, apiRegister } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { appEvents } from '../utils/events';
import { useLanguageContext } from './LanguageContext';
import { useNavigation } from './NavigationContext';

const normalizeRole = (role: string): User['role'] => {
  switch (role) {
    case 'partner_owner':
      return 'partner-owner';
    case 'partner_staff':
      return 'partner-staff';
    case 'logistics_manager':
      return 'logistics-manager';
    case 'super_admin':
      return 'superadmin';
    default:
      return role as User['role'];
  }
};

const mapAddressToFrontend = (address?: ApiAddress | null): DrcAddress => {
  if (!address) {
    return {
      commune: '',
      avenue: '',
      numero: '',
    };
  }

  return {
    commune: address.commune || '',
    quartier: address.zone || undefined,
    avenue: address.address_line_1 || '',
    numero: address.address_line_2 || 'N/A',
    reference: address.reference_point || undefined,
  };
};

// Helper function to convert API current-user response to frontend User
const convertApiUserToFrontendUser = (apiResponse: ApiCurrentUserResponse): User => {
  const primaryAddress =
    apiResponse.addresses.find((address) => address.is_default) ||
    apiResponse.addresses[0] ||
    null;
  const partnerId = apiResponse.primary_partner_id || apiResponse.partner_ids?.[0];

  return {
    id: apiResponse.user.id,
    name: apiResponse.user.name || '',
    email: apiResponse.user.email,
    phone: apiResponse.user.phone || '',
    role: normalizeRole(apiResponse.user.role),
    pickupAddress: mapAddressToFrontend(primaryAddress),
    backendAddressId: primaryAddress?.id,
    loyaltyPoints: Number(apiResponse.user.loyalty_points || 0),
    referralCode: apiResponse.user.referral_code || '',
    createdAt: apiResponse.user.created_at,
    is2FAEnabled: apiResponse.user.is_2fa_enabled,
    notificationPreferences: {
      newOrder: true,
      orderStatusChange: true,
      newChatMessage: true,
      promotions: true,
      general: true,
    },
    isEmailValid: apiResponse.user.is_email_verified,
    partnerId: partnerId || undefined,
    logisticsPartnerId: undefined,
  };
};

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
  const skipNextSyncRef = useRef(false);

  const clearStaleSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('activeOrder');
    localStorage.removeItem('activeOrderId');
    realApi.clearToken();
    appEvents.emit('logout');
  }, [setUser]);

  useEffect(() => {
    const onAuthCleared = () => clearStaleSession();
    window.addEventListener('ler:auth-cleared', onAuthCleared);
    return () => window.removeEventListener('ler:auth-cleared', onAuthCleared);
  }, [clearStaleSession]);

  useEffect(() => {
    if (!user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token?.startsWith('TOKEN-')) return;
    if (!realApi.hasAuthSession()) {
      clearStaleSession();
    }
  }, []);

  useEffect(() => {
    const syncCurrentUser = async () => {
        if (!user) return;
        if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false;
            return;
        }

        if (!realApi.hasAuthSession()) {
            clearStaleSession();
            return;
        }

        try {
            const latestApiUser = await realApi.getCurrentUser();
            const latestUserData = convertApiUserToFrontendUser(latestApiUser);
            if (latestUserData && JSON.stringify(latestUserData) !== JSON.stringify(user)) {
                setUser(latestUserData);
            }
        } catch (error: any) {
            if (error?.status === 401 || error?.status === 403) {
                clearStaleSession();
            }
        }
    };

    if (user && !user.backendAddressId) {
        syncCurrentUser();
    }
    
    const unsubscribe = appEvents.on('data_changed', syncCurrentUser);
    return () => unsubscribe();
  }, [user, setUser, clearStaleSession]);

  // Effect for Advanced Matching and User ID tracking
  useEffect(() => {
    if (user) {
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
    let backendError: any = null;

    try {
      setUser(null);
      realApi.clearToken();

      // 1) Try real backend first
      const response = await realApi.login(payload);
      const currentUserResponse = await realApi.getCurrentUser();
      const frontendUser = convertApiUserToFrontendUser(currentUserResponse);
      const result = {
        user: frontendUser,
        token: response.access_token
      };
      setUser(frontendUser);
      localStorage.removeItem('guestOrderCount');
      return result;
    } catch (apiError: any) {
      backendError = apiError;
      const status = backendError?.status || 0;
      const isNetworkError = !status;
      const shouldUseMockFallback = import.meta.env.VITE_USE_MOCK_API === 'true';

      // Mock fallback only when explicitly enabled — never on network errors in pilot.
      if (shouldUseMockFallback) {
        try {
          const mockResult = await apiLogin(payload);
          const mockUser: User = {
            id: mockResult.user.id,
            name: mockResult.user.name || '',
            email: mockResult.user.email,
            phone: mockResult.user.phone || '',
            role: mockResult.user.role as User['role'],
            pickupAddress: mockResult.user.pickupAddress || { commune: '', avenue: '', numero: '' },
            loyaltyPoints: 0,
            referralCode: mockResult.user.referralCode || '',
            createdAt: mockResult.user.createdAt || new Date().toISOString(),
            is2FAEnabled: false,
            notificationPreferences: {
              newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true,
            },
            isEmailValid: true,
            partnerId: mockResult.user.partnerId || undefined,
            logisticsPartnerId: mockResult.user.logisticsPartnerId || undefined,
          };
          setUser(mockUser);
          localStorage.setItem('auth_token', mockResult.token);
          localStorage.removeItem('guestOrderCount');
          return { user: mockUser, token: mockResult.token };
        } catch (mockError) {
          console.warn('Mock login also failed:', mockError);
        }
      }

      console.error('Login failed:', backendError);
      throw backendError;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (payload: RegisterRequest) => {
    setIsLoading(true);
    let backendError: any = null;

    try {
      await realApi.register({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        referral_code: payload.referralCode,
      });
      const loginResponse = await realApi.login({
        email: payload.email,
        password: payload.password
      });

      let currentUserResponse = await realApi.getCurrentUser();

      if (payload.pickupAddress && currentUserResponse.addresses.length === 0) {
        await realApi.createAddress({
          user_id: currentUserResponse.user.id,
          label: 'Maison',
          contact_name: payload.name,
          contact_phone: payload.phone,
          address_line_1: payload.pickupAddress.avenue,
          address_line_2: payload.pickupAddress.numero,
          city: 'Kinshasa',
          commune: payload.pickupAddress.commune,
          zone: payload.pickupAddress.quartier,
          reference_point: payload.pickupAddress.reference,
          is_default: true,
        });
        currentUserResponse = await realApi.getCurrentUser();
      }

      const frontendUser = convertApiUserToFrontendUser(currentUserResponse);
      const result = {
        user: frontendUser,
        token: loginResponse.access_token
      };
      setUser(frontendUser);
      localStorage.removeItem('guestOrderCount');
      return result;
    } catch (apiError: any) {
      backendError = apiError;
      const status = backendError?.status || 0;
      const isNetworkError = !status;
      const shouldUseMockFallback = import.meta.env.VITE_USE_MOCK_API === 'true';

      if (shouldUseMockFallback) {
        try {
          const mockResult = await apiRegister(payload, t);
          const mockUser: User = {
            id: mockResult.user.id,
            name: mockResult.user.name || '',
            email: mockResult.user.email,
            phone: mockResult.user.phone || '',
            role: mockResult.user.role as User['role'],
            pickupAddress: payload.pickupAddress || { commune: '', avenue: '', numero: '' },
            loyaltyPoints: 0,
            referralCode: mockResult.user.referralCode || '',
            createdAt: mockResult.user.createdAt || new Date().toISOString(),
            is2FAEnabled: false,
            notificationPreferences: {
              newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true,
            },
            isEmailValid: true,
          };
          setUser(mockUser);
          localStorage.setItem('auth_token', mockResult.token);
          localStorage.removeItem('guestOrderCount');
          return { user: mockUser, token: mockResult.token };
        } catch (mockError) {
          console.warn('Mock registration also failed:', mockError);
        }
      }

      console.error('Registration failed:', backendError);
      throw backendError;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, t]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('activeOrder');
    localStorage.removeItem('activeOrderId');
    realApi.clearToken();
    appEvents.emit('logout'); // Emit logout event to clear other contexts
    setCurrentPage({ name: 'home' });
  }, [setUser, setCurrentPage]);

  const updateUser = useCallback(async (updatedUser: User) => {
    if (user?.id === updatedUser.id) {
      skipNextSyncRef.current = true;
      setUser(updatedUser);
    }
    return updatedUser;
  }, [user, setUser]);
  
  const value = useMemo(() => ({ 
    user, 
    login, 
    register, 
    logout, 
    updateUser, 
    isAuthenticated: !!user, 
    isLoading 
  }), [user, login, register, logout, updateUser, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
