import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LoginRequest } from '../types';
import { Page } from '../context/NavigationContext';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
  </svg>
);


export const LoginPage: React.FC = () => {
  const { login, setCurrentPage, addNotification, clearNotifications, t, previousPage, orderDraft, user } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<string>('');
  const runtimeMarker = 'frontend-login-debug-2026-03-20-v1';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'missing';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const hasAuthToken = typeof window !== 'undefined' ? !!window.localStorage.getItem('auth_token') : false;

  const navigateAfterLogin = (targetPage: Page) => {
    setLoginStatus(`Connexion reussie. Redirection vers ${targetPage}...`);
    console.log('[login] navigation target', targetPage);
    setCurrentPage({ name: targetPage });

    const targetPath = targetPage === 'home' ? '/' : `/${targetPage}`;
    window.setTimeout(() => {
      if (window.location.pathname !== targetPath) {
        console.log('[login] forcing browser navigation', targetPath);
        window.location.assign(targetPath);
      }
    }, 150);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    if (!password) {
      newErrors.password = t('validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    clearNotifications();
    setLoginStatus('Envoi de la demande de connexion...');
    setIsLoading(true);
    try {
      const payload: LoginRequest = { email, password };
      console.log('[login] submit', { email });
      const { user: loggedInUser } = await login(payload);
      console.log('[login] login response received', loggedInUser);
      
      if (loggedInUser) {
        clearNotifications();
        setLoginStatus('Connexion validee par le backend.');
        addNotification('Connexion reussie. Redirection en cours...', 'success');

        // This is a special case to return user to order flow
        if (orderDraft.serviceType && (previousPage === 'order' || previousPage === 'partner-detail')) {
            navigateAfterLogin('order');
            return;
        }

        // General case: return to previous page if it makes sense
        if (previousPage && !['login', 'register', 'home'].includes(previousPage)) {
            navigateAfterLogin(previousPage);
            return;
        }

        // Role-based defaults
        if (loggedInUser.role === 'superadmin' || loggedInUser.role === 'admin') {
          navigateAfterLogin('admin');
        } else if (loggedInUser.role === 'driver') {
          navigateAfterLogin('driver-dashboard');
        } else if (loggedInUser.role === 'logistics-manager') {
          navigateAfterLogin('logistics-dashboard');
        } else if (loggedInUser.role.startsWith('partner-')) {
          navigateAfterLogin('partner-dashboard');
        } else {
          navigateAfterLogin('home');
        }
      } else {
        setLoginStatus('Connexion terminee sans utilisateur retourne.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const normalizedMessage = message.toLowerCase();
      const isInvalidCredentials =
        normalizedMessage.includes('email ou mot de passe incorrect') ||
        normalizedMessage.includes('incorrect email or password') ||
        normalizedMessage.includes('invalid credentials');

      console.error('[login] failed', err);
      setLoginStatus(isInvalidCredentials ? 'Le backend a refuse les identifiants.' : `Erreur frontend/runtime: ${message || 'inconnue'}`);
      addNotification(
        isInvalidCredentials ? t('loginPage.invalidCredentials') : (message || 'Une erreur est survenue pendant la connexion.'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = async (email: string) => {
    console.info('Social login placeholder clicked for', email);
    addNotification('Connexion sociale non disponible pour le moment.', 'info');
  }


  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6">{t('loginPage.login')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('loginPage.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validate}
              required
              className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              placeholder={t('loginPage.emailPlaceholder')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('loginPage.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validate}
              required
              className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
              placeholder={t('loginPage.passwordPlaceholder', { default: "********" })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div className="text-right">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait"
            >
              {isLoading ? t('buttons.loading') : t('loginPage.login')}
            </button>
          </div>
          {loginStatus && (
            <p className="text-sm text-slate-600 dark:text-slate-300" data-testid="login-status">
              {loginStatus}
            </p>
          )}
        </form>

        {import.meta.env.DEV && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1" data-testid="login-dev-diagnostics">
            <p><strong>Runtime:</strong> {runtimeMarker}</p>
            <p><strong>Route:</strong> {currentPath}</p>
            <p><strong>API:</strong> {apiBaseUrl}</p>
            <p><strong>Auth token:</strong> {hasAuthToken ? 'present' : 'absent'}</p>
            <p><strong>User state:</strong> {user ? `${user.email} / ${user.role}` : 'anonymous'}</p>
            <p><strong>Status:</strong> {loginStatus || 'idle'}</p>
          </div>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">
              {t('loginPage.or')}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSocialLogin('google.user@example.com')}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50"
          >
            <GoogleIcon />
            {t('loginPage.googleSignIn')}
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('facebook.user@example.com')}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-blue-600 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FacebookIcon />
            {t('loginPage.facebookSignIn')}
          </button>
        </div>

         <p className="text-center text-sm text-gray-600 dark:text-slate-400 mt-6">
            {t('loginPage.noAccount')}{' '}
            <button onClick={() => setCurrentPage({ name: 'register' })} className="font-semibold text-brand-blue hover:underline">
                {t('loginPage.register')}
            </button>
        </p>
      </div>
    </div>
  );
};
