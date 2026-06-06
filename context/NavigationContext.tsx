
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

export type Page = 'home' | 'order' | 'tracking' | 'profile' | 'become-partner' | 'login' | 'register' | 'admin' | 'partner-dashboard' | 'faq' | 'support' | 'logistics-partnership' | 'logistics-dashboard' | 'driver-dashboard' | 'partner-detail' | 'notifications' | 'mini-site';

export interface PageParams {
  [key: string]: any;
}

export interface PageObject {
  name: Page;
  params?: PageParams;
}

interface NavigationContextType {
    currentPage: Page;
    setCurrentPage: (page: PageObject) => void; 
    setRouterPage: (page: Page) => void; 
    navigate: (path: string) => void; 
    previousPage: Page | null;
    activePartnerId: string | null;
    setActivePartnerId: (id: string | null) => void;
    openChatForOrderId: string | null;
    setOpenChatForOrderId: (id: string | null) => void;
    openOrderDetailsForOrderId: string | null;
    setOpenOrderDetailsForOrderId: (id: string | null) => void;
    openLogisticsMissionForOrderId: string | null;
    setOpenLogisticsMissionForOrderId: (id: string | null) => void;
    adminSectionParams: { [key: string]: any } | null;
    setAdminSectionParams: (params: { [key: string]: any } | null) => void;
    openDriverMissionForOrderId: string | null;
    setOpenDriverMissionForOrderId: (id: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentPage, _setCurrentPage] = useState<Page>('home');
    const [previousPage, setPreviousPage] = useState<Page | null>(null);
    const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
    const [openChatForOrderId, setOpenChatForOrderId] = useState<string | null>(null);
    const [openOrderDetailsForOrderId, setOpenOrderDetailsForOrderId] = useState<string | null>(null);
    const [openLogisticsMissionForOrderId, setOpenLogisticsMissionForOrderId] = useState<string | null>(null);
    const [adminSectionParams, setAdminSectionParams] = useState<{ [key: string]: any } | null>(null);
    const [openDriverMissionForOrderId, setOpenDriverMissionForOrderId] = useState<string | null>(null);

    const setRouterPage = useCallback((page: Page) => {
        _setCurrentPage(prevPage => {
            if (page !== prevPage) {
                setPreviousPage(prevPage);
            }
            return page;
        });
    }, []);

    const navigate = useCallback((path: string) => {
        if (window.location.pathname === path) return;

        try {
            window.history.pushState(null, '', path);
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            const pageFromPath = path === '/' ? 'home' : path.replace('/', '') as Page;
            const validPages: Page[] = ['home', 'order', 'tracking', 'profile', 'become-partner', 'login', 'register', 'admin', 'partner-dashboard', 'faq', 'support', 'logistics-partnership', 'logistics-dashboard', 'driver-dashboard', 'partner-detail', 'notifications'];
            
            if (validPages.includes(pageFromPath)) {
                setRouterPage(pageFromPath);
            } else {
                setRouterPage('home');
            }
        }
    }, [setRouterPage]);

    const setCurrentPage = useCallback((page: PageObject) => {
        const path = page.name === 'home' ? '/' : `/${page.name}`;
        navigate(path);
        
        if (page.params?.partnerId) {
            setActivePartnerId(page.params.partnerId);
        }
    }, [navigate, setActivePartnerId]);

    const value = useMemo(() => ({ 
        currentPage, 
        setCurrentPage,
        setRouterPage,
        navigate, 
        previousPage, 
        activePartnerId, 
        setActivePartnerId, 
        openChatForOrderId, 
        setOpenChatForOrderId,
        openOrderDetailsForOrderId,
        setOpenOrderDetailsForOrderId,
        openLogisticsMissionForOrderId,
        setOpenLogisticsMissionForOrderId,
        adminSectionParams,
        setAdminSectionParams,
        openDriverMissionForOrderId,
        setOpenDriverMissionForOrderId
    }), [
        currentPage, 
        setCurrentPage, 
        setRouterPage,
        navigate,
        previousPage, 
        activePartnerId, 
        openChatForOrderId, 
        openOrderDetailsForOrderId,
        openLogisticsMissionForOrderId,
        adminSectionParams,
        openDriverMissionForOrderId
    ]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    )
}
