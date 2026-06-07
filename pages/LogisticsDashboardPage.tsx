import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { LogisticsSidebar } from '../components/logistics/LogisticsSidebar';
import { Icon } from '../components/Icon';

import { LogisticsOverview } from './logistics/LogisticsOverview';
import { LogisticsMissions } from './logistics/LogisticsMissions';
import { LogisticsDrivers } from './logistics/LogisticsDrivers';
import { LogisticsPerformance } from './logistics/LogisticsPerformance';
import { LogisticsAlerts } from './logistics/LogisticsAlerts';
import { LogisticsReports } from './logistics/LogisticsReports';
import { LogisticsSettings } from './logistics/LogisticsSettings';

export const LogisticsDashboardPage: React.FC = () => {
  const { user, addNotification, t, logout } = useAppContext();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleRefresh = () => {
    addNotification('Données actualisées', 'success');
  };

  const handleAutoDispatch = () => {
    addNotification('Auto-dispatch terminé : 12 missions assignées', 'success');
  };

  const handleExport = () => {
    addNotification('Export CSV généré', 'success');
  };

  const sidebar = <LogisticsSidebar activeSection={activeSection} onSectionClick={setActiveSection} />;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <LogisticsOverview onRefresh={handleRefresh} onAutoDispatch={handleAutoDispatch} onExport={handleExport} />;
      case 'missions':
        return <LogisticsMissions />;
      case 'drivers':
        return <LogisticsDrivers />;
      case 'performance':
        return <LogisticsPerformance />;
      case 'alerts':
        return <LogisticsAlerts />;
      case 'reports':
        return <LogisticsReports />;
      case 'settings':
        return <LogisticsSettings />;
      default:
        return <LogisticsOverview onRefresh={handleRefresh} onAutoDispatch={handleAutoDispatch} onExport={handleExport} />;
    }
  };

  return (
    <DashboardLayout sidebar={sidebar} mobileTitle="Centre logistique">
      <div key={activeSection} className="animate-fade-in">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};
