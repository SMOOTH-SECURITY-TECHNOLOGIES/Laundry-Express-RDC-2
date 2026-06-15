import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { Language } from '../context/LanguageContext';
import { NotificationBell } from './NotificationBell';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAppContext } from '../context/AppContext';
import { Page, PageObject } from '../context/NavigationContext';
import { realApi } from '../services/real-api';

type NavPage = 'home' | 'order' | 'tracking' | 'profile' | 'admin' | 'partner-dashboard' | 'logistics-dashboard' | 'driver-dashboard' | 'login' | 'register' | 'notifications';
type IconName = 'logo' | 'wash' | 'iron' | 'shirt' | 'star' | 'check' | 'mapPin' | 'calendar' | 'clock' | 'user' | 'xmark' | 'search' | 'shoppingBag' | 'truck' | 'sparkles' | 'home' | 'bell' | 'pencil' | 'lifebuoy' | 'map' | 'list' | 'chatBubble' | 'bars3' | 'currencyDollar' | 'sun' | 'moon';

// Helper component for navigation links to keep it stable
const NavLink: React.FC<{
  targetPage: Page;
  currentPage: string;
  setCurrentPage: (page: PageObject) => void;
  children: React.ReactNode;
  iconName?: IconName;
  isResponsive?: boolean;
}> = ({ targetPage, currentPage, setCurrentPage, children, iconName, isResponsive }) => {
  const { t } = useAppContext();
  const isActive = currentPage === targetPage;
  const baseClasses = "py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center";
  const activeClasses = 'text-white bg-brand-blue shadow-sm';
  const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100';

  if (isResponsive && iconName) {
    return (
      <button
        onClick={() => setCurrentPage({ name: targetPage })}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} px-3 lg:px-4`}
        aria-label={children as string}
      >
        <Icon name={iconName} className="h-5 w-5" />
        <span className="hidden lg:inline lg:ml-2">{children}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setCurrentPage({ name: targetPage })}
      className={`px-4 ${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};


const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, t } = useAppContext();

    return (
        <div className="relative">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="text-sm appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-blue pl-3 pr-8 py-2 rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Select language"
            >
                <option value="fr">{t('languages.fr')}</option>
                <option value="en">{t('languages.en')}</option>
                <option value="sw">{t('languages.sw')}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600 dark:text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    );
};

export const Header: React.FC = () => {
  const { setCurrentPage, currentPage, activeOrder, user, logout, t } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = !!user && realApi.hasAuthSession();
  
  const dashboardPage = useMemo((): Page | null => {
    if (!isLoggedIn) return null;
    switch (user!.role) {
      case 'admin':
      case 'superadmin':
        return 'admin';
      case 'driver':
        return 'driver-dashboard';
      case 'logistics-manager':
        return 'logistics-dashboard';
      case 'partner-owner':
      case 'partner-manager':
      case 'partner-staff':
        return 'partner-dashboard';
      default:
        return null;
    }
  }, [user]);

  const dashboardLabel = useMemo(() => {
    if (!dashboardPage) return '';
    return dashboardPage === 'admin' ? t('header.admin') : t('header.dashboard');
  }, [dashboardPage, t]);

  const handleLogout = () => {
    logout();
  };

  const handleMobileNav = (page: Page) => {
    setCurrentPage({ name: page });
    setIsMenuOpen(false);
  };

  const handleMobileLogout = () => {
    handleLogout();
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-surface-card/80 dark:bg-surface-card/90 backdrop-blur-lg border-b border-surface-border-subtle fixed top-0 w-full z-50 shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage({ name: 'home' })}>
          <Icon name="logo" className="h-8 w-8 text-brand-blue" />
          <span className="text-lg sm:text-xl font-bold text-content-primary whitespace-nowrap">Laundry Express</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-2">
          <NavLink currentPage={currentPage} setCurrentPage={setCurrentPage} targetPage="home">{t('header.home')}</NavLink>
          {activeOrder && <NavLink currentPage={currentPage} setCurrentPage={setCurrentPage} targetPage="tracking">{t('header.tracking')}</NavLink>}
          <NavLink currentPage={currentPage} setCurrentPage={setCurrentPage} targetPage="profile" iconName="user" isResponsive>
            {isLoggedIn ? t('header.profile') : t('header.history')}
          </NavLink>
          {dashboardPage && <NavLink currentPage={currentPage} setCurrentPage={setCurrentPage} targetPage={dashboardPage} iconName="logo" isResponsive>{dashboardLabel}</NavLink>}
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
          
          <LanguageSwitcher />
          <ThemeSwitcher />

          {isLoggedIn && (
            <>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <NotificationBell />
            </>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

          {isLoggedIn ? (
            <>
              <div className="flex items-center space-x-2">
                 <Icon name="user" className="w-6 h-6 text-slate-500 dark:text-slate-400"/>
                 <span className="hidden lg:inline text-sm text-slate-600 dark:text-slate-300 font-medium">{t('header.greeting', {name: user!.name?.split(' ')[0] || ''})}</span>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                {t('header.logout')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setCurrentPage({ name: 'login' })} className="px-4 py-2 rounded-full text-sm font-medium text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {t('header.login')}
              </button>
              <button onClick={() => setCurrentPage({ name: 'register' })} className="px-4 py-2 rounded-full text-sm font-medium bg-brand-orange text-white hover:bg-opacity-90 transition-colors">
                {t('header.register')}
              </button>
            </>
          )}
        </div>

        {/* Mobile Nav Button */}
        <div className="md:hidden flex items-center space-x-2">
            {isLoggedIn && <NotificationBell />}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={t('header.openMenu')} aria-expanded={isMenuOpen}>
                <Icon name={isMenuOpen ? "xmark" : "bars3"} className="h-7 w-7 text-brand-dark dark:text-slate-200" />
            </button>
        </div>
      </nav>

       {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="px-4 pt-2 pb-4 space-y-1">
                {isLoggedIn ? (
                  <div className="flex items-center px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Icon name="user" className="w-8 h-8 text-brand-blue mr-3"/>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user!.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user!.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => handleMobileNav('login')} className="flex-1 py-3 rounded-xl text-sm font-bold text-brand-blue border-2 border-brand-blue hover:bg-brand-blue/5 transition-colors">
                      {t('header.login')}
                    </button>
                    <button onClick={() => handleMobileNav('register')} className="flex-1 py-3 rounded-xl text-sm font-bold bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors">
                      {t('header.register')}
                    </button>
                  </div>
                )}

                <hr className="my-1 border-slate-200 dark:border-slate-700"/>

                <button onClick={() => handleMobileNav('home')} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Icon name="home" className="w-5 h-5 mr-3 text-slate-400"/>
                  {t('header.home')}
                </button>
                {activeOrder && (
                  <button onClick={() => handleMobileNav('tracking')} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="truck" className="w-5 h-5 mr-3 text-slate-400"/>
                    {t('header.tracking')}
                  </button>
                )}
                <button onClick={() => handleMobileNav('profile')} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Icon name="user" className="w-5 h-5 mr-3 text-slate-400"/>
                  {isLoggedIn ? t('header.profile') : t('header.history')}
                </button>
                {dashboardPage && (
                  <button onClick={() => handleMobileNav(dashboardPage)} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="logo" className="w-5 h-5 mr-3 text-slate-400"/>
                    {dashboardLabel}
                  </button>
                )}
                {isLoggedIn && (
                  <button onClick={() => handleMobileNav('notifications')} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Icon name="bell" className="w-5 h-5 mr-3 text-slate-400"/>
                    {t('notifications.title')}
                  </button>
                )}

                <hr className="my-1 border-slate-200 dark:border-slate-700"/>

                <div className="px-2 py-2 flex items-center gap-3">
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                </div>

                {isLoggedIn && (
                  <>
                    <hr className="my-1 border-slate-200 dark:border-slate-700"/>
                    <button onClick={handleMobileLogout} className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Icon name="xmark" className="w-5 h-5 mr-3"/>
                      {t('header.logout')}
                    </button>
                  </>
                )}
            </div>
        </div>
      )}
    </header>
  );
};
