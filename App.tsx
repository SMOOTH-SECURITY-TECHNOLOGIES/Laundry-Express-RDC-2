
import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { OrderPage } from './pages/OrderPage';
import { TrackingPage } from './pages/TrackingPage';
import { ProfilePage } from './pages/ProfilePage';
import { BecomePartnerPage } from './pages/BecomePartnerPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Footer } from './components/Footer';
import { AdminPage } from './pages/AdminPage';
import { PartnerDashboardPage } from './pages/PartnerDashboardPage';
import { NotificationContainer } from './components/Notification';
import { FAQPage } from './pages/FAQPage';
import { SupportCenterPage } from './pages/SupportCenterPage';
import { LogisticsPartnershipPage } from './pages/LogisticsPartnershipPage';
import { LogisticsDashboardPage } from './pages/LogisticsDashboardPage';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { MiniSitePage } from './pages/MiniSitePage';
import { useAppContext } from './context/AppContext';
import { Page } from './context/NavigationContext';
import { Icon } from './components/Icon';
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));

const PartnerDetailPage = lazy(() => import('./pages/PartnerDetailPage').then(module => ({ default: module.PartnerDetailPage })));

const App: React.FC = () => {
  const { 
    currentPage, setCurrentPage, setActivePartnerId, partners, 
    isLoading, orderHistory, setActiveOrder, 
    setOpenChatForOrderId, setOpenOrderDetailsForOrderId,
    setOpenLogisticsMissionForOrderId, setAdminSectionParams,
    setOpenDriverMissionForOrderId, t, user,
    setRouterPage, activePartnerId, trackingSettings
  } = useAppContext();

  const initialRoutingHandled = useRef(false);
  const partnersRef = useRef(partners);
  const orderHistoryRef = useRef(orderHistory);

  useEffect(() => {
    partnersRef.current = partners;
  }, [partners]);

  useEffect(() => {
    orderHistoryRef.current = orderHistory;
  }, [orderHistory]);

  // Dynamically inject tracking scripts from Admin settings
  useEffect(() => {
    const { gtmContainerId, metaPixelId } = trackingSettings || {};

    // --- Google Tag Manager ---
    if (gtmContainerId && !document.getElementById('gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmContainerId}');`;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.id = 'gtm-noscript';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    // --- Meta Pixel ---
    if (metaPixelId && !document.getElementById('meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'meta-pixel-script';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.id = 'meta-pixel-noscript';
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }, [trackingSettings]);

  // SEO: Update meta tags dynamically
  useEffect(() => {
    // Get all meta elements
    const metaDescriptionTag = document.querySelector('meta[name="description"]');
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    // Check if all essential tags are present
    if (!metaDescriptionTag || !canonicalLink || !ogUrl || !ogTitle || !ogDescription || !ogImage || !twitterTitle || !twitterDescription || !twitterImage) {
      return;
    }

    let title = 'Laundry Express RDC';
    let description = 'An on-demand laundry app for cities in the DRC, connecting customers with local laundromats for quick and easy laundry service, pickup, and delivery.';
    let imageUrl = new URL('/favicon.svg', window.location.origin).href; // Default image

    switch (currentPage) {
      case 'home':
        title = 'Laundry Express RDC - On-demand Laundry & Dry Cleaning';
        description = 'The #1 marketplace for laundry and dry cleaning in Kinshasa. Order online, we pick up, clean, and deliver to your doorstep.';
        break;
      case 'partner-detail': {
        const partner = partners.find(p => p.id === activePartnerId);
        if (partner) {
          title = `${partner.name} - ${t(`partnerTypeEnum.${partner.type}`)} | Laundry Express RDC`;
          description = `High-quality ${t(`partnerTypeEnum.${partner.type}`).toLowerCase()} services from ${partner.name}, located at ${partner.address}. Check prices and order online.`;
          imageUrl = partner.imageUrls?.[0] || imageUrl; // Use partner image if available
        }
        break;
      }
      case 'order':
        title = 'Place Your Order - Laundry Express RDC';
        description = 'Select your laundry service, choose a trusted partner, and schedule your pickup and delivery with Laundry Express RDC.';
        break;
      case 'faq':
        title = 'FAQ - Laundry Express RDC';
        description = 'Find answers to frequently asked questions about our laundry services, pricing, delivery, and more.';
        break;
      case 'become-partner':
        title = 'Become a Partner - Laundry Express RDC';
        description = 'Grow your laundry or dry cleaning business by joining the Laundry Express network. Reach new customers in your city.';
        break;
      case 'profile':
        title = 'My Profile - Laundry Express RDC';
        description = 'Manage your account, view order history, and track loyalty points with Laundry Express RDC.';
        break;
      case 'mini-site': {
        const partner = partners.find(p => p.id === activePartnerId);
        if (partner) {
          title = `${partner.name} - Mini-site | Laundry Express RDC`;
          description = `Découvrez ${partner.name} : services, horaires, avis et commande en ligne.`;
          imageUrl = partner.imageUrls?.[0] || imageUrl;
        }
        break;
      }
    }

    // Construct the canonical URL
    const canonicalUrl = new URL(window.location.pathname, 'https://laundry.app').href;

    // Update all tags
    document.title = title;
    metaDescriptionTag.setAttribute('content', description);
    canonicalLink.setAttribute('href', canonicalUrl);
    
    ogUrl.setAttribute('content', canonicalUrl);
    ogTitle.setAttribute('content', title);
    ogDescription.setAttribute('content', description);
    ogImage.setAttribute('content', imageUrl);
    
    twitterTitle.setAttribute('content', title);
    twitterDescription.setAttribute('content', description);
    twitterImage.setAttribute('content', imageUrl);

  }, [currentPage, activePartnerId, partners, t]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 APP DEBUG - Current Page:', currentPage);
    console.log('🔍 APP DEBUG - User:', user);
    console.log('🔍 APP DEBUG - Is Loading:', isLoading);
  }, [currentPage, user, isLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(Boolean);
      
      if (path.startsWith('/partner/')) {
        const partnerSlug = pathParts[1];
        const partner = partnersRef.current.find(p => p.slug === partnerSlug);
        if (partner) {
          setActivePartnerId(partner.id);
          setRouterPage('partner-detail');
        } else {
          setRouterPage('home');
        }
      } else if (path.startsWith('/mini-site/')) {
        const partnerSlug = pathParts[1];
        const partner = partnersRef.current.find(p => p.slug === partnerSlug);
        if (partner) {
          setActivePartnerId(partner.id);
        }
        setRouterPage('mini-site');
      } else {
        const page = (pathParts[0] as Page) || 'home';
        const validPages: Page[] = ['home', 'order', 'tracking', 'profile', 'become-partner', 'login', 'register', 'admin', 'partner-dashboard', 'faq', 'support', 'logistics-partnership', 'logistics-dashboard', 'driver-dashboard', 'partner-detail', 'notifications', 'mini-site'];
        if (validPages.includes(page)) {
          setRouterPage(page);
        } else {
          setRouterPage('home');
        }
      }
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [setActivePartnerId, setRouterPage]);

  useEffect(() => {
    if (!isLoading && !initialRoutingHandled.current && partners.length > 0) {
        initialRoutingHandled.current = true;

        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') as Page | null;
        const orderId = params.get('orderId');
        const section = params.get('section');

        if (page) {
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (page === 'admin' && section) {
                const paramsToSet: Record<string, string | boolean> = { section };
                if (orderId) {
                    paramsToSet.orderId = orderId;
                    if (params.get('openChat') === 'true') {
                        paramsToSet.openChat = true;
                    }
                }
                setAdminSectionParams(paramsToSet);
                setRouterPage('admin');
                return;
            }

            if (orderId) {
                 const order = orderHistory.find(o => o.id === orderId);
                 if (order) setActiveOrder(order);
                 
                 if (params.get('openChat') === 'true') {
                     setOpenChatForOrderId(orderId);
                 } else if (page === 'partner-dashboard') {
                     setOpenOrderDetailsForOrderId(orderId);
                 } else if (page === 'logistics-dashboard') {
                     setOpenLogisticsMissionForOrderId(orderId);
                 } else if (page === 'driver-dashboard') {
                     setOpenDriverMissionForOrderId(orderId);
                 }
            }

            setRouterPage(page);
            return;
        }

        const customDomainPartnerSlug = window.customDomainPartnerSlug;
        if (customDomainPartnerSlug) {
          const partner = partners.find(p => p.slug === customDomainPartnerSlug);
          if (partner) {
            setActivePartnerId(partner.id);
          }
          setRouterPage('mini-site');
          return;
        }

        const customDomainPartnerId = window.customDomainPartnerId;
        if (customDomainPartnerId) {
          const partner = partners.find(p => p.id === customDomainPartnerId);
          if (partner) {
            setActivePartnerId(partner.id);
          }
          setRouterPage('mini-site');
          return;
        }
        
        // Handle initial path if no query params
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(Boolean);
        if (path.startsWith('/partner/')) {
            const partnerSlug = pathParts[1];
            const partner = partners.find(p => p.slug === partnerSlug);
            if (partner) {
                setActivePartnerId(partner.id);
                setRouterPage('partner-detail');
            }
        } else if (path.startsWith('/mini-site/')) {
            const partnerSlug = pathParts[1];
            const partner = partners.find(p => p.slug === partnerSlug);
            if (partner) {
                setActivePartnerId(partner.id);
            }
            setRouterPage('mini-site');
        } else if (pathParts[0]) {
            const pageFromPath = pathParts[0] as Page;
            const validPages: Page[] = ['home', 'order', 'tracking', 'profile', 'become-partner', 'login', 'register', 'admin', 'partner-dashboard', 'faq', 'support', 'logistics-partnership', 'logistics-dashboard', 'driver-dashboard', 'partner-detail', 'notifications', 'mini-site'];
            if (validPages.includes(pageFromPath)) {
                setRouterPage(pageFromPath);
            }
        }
    }
  }, [
      isLoading, partners, setActivePartnerId, setRouterPage, 
      orderHistory, setActiveOrder, setOpenChatForOrderId,
      setOpenOrderDetailsForOrderId, setOpenLogisticsMissionForOrderId, 
      setAdminSectionParams, setOpenDriverMissionForOrderId
    ]);

  const renderPage = () => {
    console.log('🔍 RENDERING PAGE:', currentPage);
    switch (currentPage) {
      case 'order':
        return <OrderPage />;
      case 'tracking':
        return <TrackingPage />;
      case 'profile':
        return <ProfilePage />;
      case 'become-partner':
        return <BecomePartnerPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'admin':
        return <AdminPage />;
      case 'partner-dashboard':
        return <PartnerDashboardPage />;
      case 'faq':
        return <FAQPage />;
      case 'support':
        return <SupportCenterPage />;
      case 'logistics-partnership':
        return <LogisticsPartnershipPage />;
      case 'logistics-dashboard':
        return <LogisticsDashboardPage />;
      case 'driver-dashboard':
        return <DriverDashboardPage />;
      case 'partner-detail':
        return (
          <Suspense fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
            </div>
          }>
            <PartnerDetailPage />
          </Suspense>
        );
      case 'notifications':
        return <NotificationsPage />;
      case 'mini-site':
        return <MiniSitePage />;
      case 'home':
      default:
        // By default, we show HomePage, but if user is not logged in, special landing page logic will apply
        return <HomePage />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-brand-gray dark:bg-slate-900 text-brand-dark dark:text-slate-100 font-sans">
        <Icon name="logo" className="w-20 h-20 text-brand-blue animate-pulse" />
        <p className="mt-4 text-lg font-semibold">{t('app.loading', { default: 'Loading the application...' })}</p>
      </div>
    );
  }

  // TEMPORARY FIX: Comment out the LandingPage condition to test login
  // Special condition to show LandingPage if 'home' is selected and user is not authenticated.
  // if (currentPage === 'home' && !user) {
  //   return <LandingPage setCurrentPage={setCurrentPage} />;
  // }

  // Alternative fix: Only show LandingPage on home page, allow other pages to render normally
  if (currentPage === 'home' && !user) {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5FFF]"></div>
        </div>
      }>
        <LandingPage setCurrentPage={setCurrentPage} />
      </Suspense>
    );
  }
  
  // Mini-site: standalone page without app chrome
  if (currentPage === 'mini-site') {
    return (
      <div className="min-h-screen font-sans">
        <NotificationContainer />
        {renderPage()}
      </div>
    );
  }

  const dashboardPages: Page[] = ['admin', 'partner-dashboard', 'logistics-dashboard', 'driver-dashboard'];
  const isDashboardPage = dashboardPages.includes(currentPage);

  // Layout for Dashboard pages (no footer, full width)
  if (isDashboardPage) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800">
        <Header />
        <NotificationContainer />
        <main className="flex-grow pt-24 px-4 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
    );
  }

  // Partner detail: full-width marketplace layout (no container padding)
  if (currentPage === 'partner-detail') {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <NotificationContainer />
        <main className="flex-grow pt-24">
          {renderPage()}
        </main>
        <Footer />
      </div>
    );
  }

  // Default layout for all other pages
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <NotificationContainer />
      <main className="flex-grow container mx-auto px-4 pt-28 pb-10 md:pb-16 animate-fade-in">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
