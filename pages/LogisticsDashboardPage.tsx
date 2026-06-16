import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { LogisticsSidebar } from '../components/logistics/LogisticsSidebar';
import { isLogisticsSection, LogisticsSection } from '../components/logistics/logistics-types';
import { useAppContext } from '../context/AppContext';
import { LogisticsAlerts } from './logistics/LogisticsAlerts';
import { LogisticsDrivers } from './logistics/LogisticsDrivers';
import { LogisticsDispatch } from './logistics/LogisticsDispatch';
import { LogisticsFleet } from './logistics/LogisticsFleet';
import { LogisticsMaintenance } from './logistics/LogisticsMaintenance';
import { LogisticsMissions } from './logistics/LogisticsMissions';
import { LogisticsOverview } from './logistics/LogisticsOverview';
import { LogisticsPerformance } from './logistics/LogisticsPerformance';
import { LogisticsReports } from './logistics/LogisticsReports';
import { LogisticsSettings } from './logistics/LogisticsSettings';
import { LogisticsShipments } from './logistics/LogisticsShipments';
import { LogisticsTracking } from './logistics/LogisticsTracking';

const SECTION_LABELS: Record<LogisticsSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Centre logistique Laundry Express',
    subtitle: 'Cockpit dispatcher, carte, tournées et supervision opérationnelle.',
  },
  missions: {
    title: 'Missions',
    subtitle: 'Backlog, missions actives et assignation chauffeur.',
  },
  fleet: {
    title: 'Fleet',
    subtitle: 'Véhicules, plaques, zones et disponibilité.',
  },
  drivers: {
    title: 'Chauffeurs',
    subtitle: 'Disponibilité, performance et gestion du réseau.',
  },
  dispatch: {
    title: 'Dispatch',
    subtitle: 'File d’attente, assignation et priorités opérationnelles.',
  },
  tracking: {
    title: 'Tracking',
    subtitle: 'Carte temps réel, trajets et ETA.',
  },
  shipments: {
    title: 'Shipments',
    subtitle: 'Livraisons rattachées aux commandes Laundry.',
  },
  performance: {
    title: 'Performance',
    subtitle: 'KPIs, ponctualité et analyse par zone.',
  },
  alerts: {
    title: 'Alertes',
    subtitle: 'Retards, files d’attente et incidents en temps réel.',
  },
  reports: {
    title: 'Rapports',
    subtitle: 'Exports quotidiens, hebdomadaires et personnalisés.',
  },
  maintenance: {
    title: 'Maintenance',
    subtitle: 'Entretien véhicules, incidents et disponibilité.',
  },
  settings: {
    title: 'Paramètres',
    subtitle: 'Notifications, dispatch automatique et zones.',
  },
};

const LogisticsTopbar: React.FC<{
  title: string;
  onMenuClick: () => void;
}> = ({ title, onMenuClick }) => (
  <header className="fixed inset-x-0 top-0 z-40 flex h-[72px] items-center justify-between border-b border-surface-border bg-surface-card/95 px-4 backdrop-blur md:hidden">
    <button
      type="button"
      onClick={onMenuClick}
      className="rounded-xl p-2 text-content-muted hover:bg-surface-muted"
      aria-label="Ouvrir le menu logistique"
    >
      <Icon name="bars3" className="h-6 w-6" />
    </button>
    <p className="truncate px-2 text-sm font-black text-content-primary">{title}</p>
    <div className="flex items-center gap-1">
      <ThemeSwitcher />
      <NotificationBell />
    </div>
  </header>
);

const LogisticsDesktopBar: React.FC<{ userName: string }> = ({ userName }) => (
  <div className="sticky top-0 z-30 mb-4 hidden items-center justify-between gap-3 rounded-2xl border border-surface-border-subtle bg-surface-card/95 px-4 py-3 backdrop-blur md:flex">
    <p className="text-sm text-content-muted">
      Connecté en tant que <span className="font-black text-content-primary">{userName}</span>
    </p>
    <NotificationBell />
  </div>
);

export const LogisticsDashboardPage: React.FC = () => {
  const { user, addNotification, logout, setCurrentPage } = useAppContext();
  const [activeSection, setActiveSection] = useState<LogisticsSection>(() => {
    const hash = window.location.hash.replace('#', '');
    return isLogisticsSection(hash) ? hash : 'dashboard';
  });
  const [missionFocusId, setMissionFocusId] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusMissionId')
  );
  const [missionFocusAlert, setMissionFocusAlert] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusMissionAlert')
  );
  const [missionFocusType, setMissionFocusType] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusMissionType')
  );
  const [missionFocusZone, setMissionFocusZone] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusZone')
  );
  const [driverFocusName, setDriverFocusName] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusDriverName')
  );
  const [reportFocusAlert, setReportFocusAlert] = useState<string | null>(() =>
    sessionStorage.getItem('logisticsFocusReportAlert')
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleRefresh = () => addNotification('Données actualisées', 'success');
  const handleAutoDispatch = () => addNotification('Auto-dispatch terminé : 12 missions assignées', 'success');
  const handleExport = () => addNotification('Export CSV généré', 'success');

  const clearFocus = useCallback(() => {
    setMissionFocusId(null);
    setMissionFocusAlert(null);
    setMissionFocusType(null);
    setMissionFocusZone(null);
    setDriverFocusName(null);
    setReportFocusAlert(null);
    sessionStorage.removeItem('logisticsFocusMissionId');
    sessionStorage.removeItem('logisticsFocusMissionAlert');
    sessionStorage.removeItem('logisticsFocusMissionType');
    sessionStorage.removeItem('logisticsFocusZone');
    sessionStorage.removeItem('logisticsFocusDriverName');
    sessionStorage.removeItem('logisticsFocusReportAlert');
  }, []);

  const handleSectionChange = useCallback((section: string, options?: { missionId?: string; driverName?: string; alertTitle?: string; missionAlertTitle?: string; missionFocusType?: string; zone?: string }) => {
    if (!isLogisticsSection(section)) return;
    if (section === 'missions' || section === 'dispatch') {
      const nextMissionId = options?.missionId ?? null;
      const nextMissionAlert = options?.missionAlertTitle ?? null;
      const nextMissionType = options?.missionFocusType ?? null;
      const nextZone = options?.zone ?? null;
      setMissionFocusId(nextMissionId);
      setMissionFocusAlert(nextMissionAlert);
      setMissionFocusType(nextMissionType);
      setMissionFocusZone(nextZone);
      if (nextMissionId) sessionStorage.setItem('logisticsFocusMissionId', nextMissionId);
      else sessionStorage.removeItem('logisticsFocusMissionId');
      if (nextMissionAlert) sessionStorage.setItem('logisticsFocusMissionAlert', nextMissionAlert);
      else sessionStorage.removeItem('logisticsFocusMissionAlert');
      if (nextMissionType) sessionStorage.setItem('logisticsFocusMissionType', nextMissionType);
      else sessionStorage.removeItem('logisticsFocusMissionType');
      if (nextZone) sessionStorage.setItem('logisticsFocusZone', nextZone);
      else sessionStorage.removeItem('logisticsFocusZone');
      setDriverFocusName(null);
      setReportFocusAlert(null);
      sessionStorage.removeItem('logisticsFocusDriverName');
      sessionStorage.removeItem('logisticsFocusReportAlert');
    } else if (section === 'drivers') {
      const nextDriverName = options?.driverName ?? null;
      setDriverFocusName(nextDriverName);
      if (nextDriverName) sessionStorage.setItem('logisticsFocusDriverName', nextDriverName);
      else sessionStorage.removeItem('logisticsFocusDriverName');
      setMissionFocusId(null);
      setReportFocusAlert(null);
      sessionStorage.removeItem('logisticsFocusMissionId');
      sessionStorage.removeItem('logisticsFocusMissionAlert');
      sessionStorage.removeItem('logisticsFocusMissionType');
      sessionStorage.removeItem('logisticsFocusZone');
      sessionStorage.removeItem('logisticsFocusReportAlert');
    } else if (section === 'reports') {
      const nextAlert = options?.alertTitle ?? null;
      setReportFocusAlert(nextAlert);
      if (nextAlert) sessionStorage.setItem('logisticsFocusReportAlert', nextAlert);
      else sessionStorage.removeItem('logisticsFocusReportAlert');
      setMissionFocusId(options?.missionId ?? null);
      if (options?.missionId) sessionStorage.setItem('logisticsFocusMissionId', options.missionId);
      else sessionStorage.removeItem('logisticsFocusMissionId');
      setMissionFocusAlert(null);
      setMissionFocusType(null);
      setMissionFocusZone(null);
      setDriverFocusName(null);
      sessionStorage.removeItem('logisticsFocusMissionAlert');
      sessionStorage.removeItem('logisticsFocusMissionType');
      sessionStorage.removeItem('logisticsFocusZone');
      sessionStorage.removeItem('logisticsFocusDriverName');
    } else {
      clearFocus();
    }
    setActiveSection(section);
    const nextUrl = `${window.location.pathname}${window.location.search}#${section}`;
    window.history.replaceState(null, '', nextUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearFocus]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (isLogisticsSection(hash)) {
        setActiveSection(hash);
        if (hash === 'missions' || hash === 'dispatch') {
          setMissionFocusId(sessionStorage.getItem('logisticsFocusMissionId'));
          setMissionFocusAlert(sessionStorage.getItem('logisticsFocusMissionAlert'));
          setMissionFocusType(sessionStorage.getItem('logisticsFocusMissionType'));
          setMissionFocusZone(sessionStorage.getItem('logisticsFocusZone'));
          setDriverFocusName(null);
          setReportFocusAlert(null);
        } else if (hash === 'drivers') {
          setDriverFocusName(sessionStorage.getItem('logisticsFocusDriverName'));
          setMissionFocusId(null);
          setMissionFocusAlert(null);
          setMissionFocusType(null);
          setMissionFocusZone(null);
          setReportFocusAlert(null);
        } else if (hash === 'reports') {
          setReportFocusAlert(sessionStorage.getItem('logisticsFocusReportAlert'));
          setMissionFocusId(sessionStorage.getItem('logisticsFocusMissionId'));
          setMissionFocusAlert(null);
          setMissionFocusType(null);
          setMissionFocusZone(null);
          setDriverFocusName(null);
        } else {
          clearFocus();
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [clearFocus]);

  if (!user || user.role !== 'logistics-manager') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
        <div className="max-w-md rounded-2xl border border-surface-border-subtle bg-surface-card p-8 text-center shadow-sm">
          <Icon name="truck" className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-4 text-2xl font-black text-content-primary">Accès compagnie logistique uniquement</h1>
          <p className="mt-2 text-sm text-content-muted">
            Connectez-vous avec un compte responsable logistique pour ouvrir ce cockpit.
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-6 rounded-xl bg-brand-blue px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const sectionMeta = SECTION_LABELS[activeSection];
  const isDashboard = activeSection === 'dashboard';
  const userName = user.name?.split(' ')[0] || 'Logistics';

  const renderContent = () => {
    switch (activeSection) {
      case 'fleet':
        return <LogisticsFleet />;
      case 'dispatch':
        return (
          <LogisticsDispatch
            focusMissionId={missionFocusId}
            focusAlertTitle={missionFocusAlert}
            focusType={missionFocusType}
            focusZone={missionFocusZone}
            onClearFocus={clearFocus}
          />
        );
      case 'missions':
        return (
          <LogisticsMissions
            focusMissionId={missionFocusId}
            focusAlertTitle={missionFocusAlert}
            focusType={missionFocusType}
            focusZone={missionFocusZone}
            onClearFocus={clearFocus}
          />
        );
      case 'drivers':
        return <LogisticsDrivers focusDriverName={driverFocusName} onClearFocus={clearFocus} />;
      case 'performance':
        return <LogisticsPerformance />;
      case 'tracking':
        return <LogisticsTracking />;
      case 'shipments':
        return <LogisticsShipments />;
      case 'alerts':
        return <LogisticsAlerts onNavigate={handleSectionChange} onActionFeedback={(message) => addNotification(message, 'info')} />;
      case 'maintenance':
        return <LogisticsMaintenance />;
      case 'reports':
        return <LogisticsReports focusAlertTitle={reportFocusAlert} focusMissionId={missionFocusId} onClearFocus={clearFocus} />;
      case 'settings':
        return <LogisticsSettings />;
      case 'dashboard':
      default:
        return (
          <LogisticsOverview
            onRefresh={handleRefresh}
            onAutoDispatch={handleAutoDispatch}
            onExport={handleExport}
          />
        );
    }
  };

  return (
    <div className="logistics-shell min-h-screen bg-surface-page text-content-primary">
      <LogisticsSidebar
        activeSection={activeSection}
        onSectionClick={handleSectionChange}
        onNavigateHome={() => setCurrentPage({ name: 'home' })}
        onLogout={logout}
      />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div
            className="h-full w-[min(280px,88vw)] bg-surface-card p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <LogisticsSidebar
              mobile
              activeSection={activeSection}
              onSectionClick={(section) => {
                handleSectionChange(section);
                setIsSidebarOpen(false);
              }}
              onNavigateHome={() => setCurrentPage({ name: 'home' })}
              onLogout={logout}
            />
          </div>
        </div>
      )}

      <LogisticsTopbar title={sectionMeta.title} onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="relative z-0 px-4 pb-8 pt-[88px] md:ml-[260px] md:px-8 md:pt-6">
        <div key={activeSection} className="mx-auto max-w-[1500px] space-y-6">
          <LogisticsDesktopBar userName={userName} />

          {!isDashboard && (
            <button
              type="button"
              onClick={() => handleSectionChange('dashboard')}
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:underline"
            >
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              Retour au centre logistique
            </button>
          )}

          <section>
            <h1 className="text-3xl font-black text-content-primary">{sectionMeta.title}</h1>
            <p className="mt-2 text-content-muted">{sectionMeta.subtitle}</p>
          </section>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};
