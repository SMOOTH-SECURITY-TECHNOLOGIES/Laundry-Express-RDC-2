import React from 'react';
import { useRealTimeAlerts } from '../../hooks/useRealTimeAlerts';
import { useRealTimeTracking } from '../../hooks/useRealTimeTracking';
import { OperationalControlTower } from './operational/OperationalControlTower';

interface LogisticsOverviewProps {
  onRefresh: () => void;
  onAutoDispatch: () => void;
  onExport: () => void;
  onNavigate?: (section: string, options?: { missionId?: string; driverName?: string; zone?: string }) => void;
  onActionFeedback?: (message: string) => void;
}

export const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({ onRefresh, onNavigate }) => {
  const { alerts, refresh: refreshAlerts } = useRealTimeAlerts();
  const { data: liveTracking, isLoading, mode: liveTrackingMode, refresh: refreshLiveTracking } = useRealTimeTracking();

  const handleRefresh = () => {
    void refreshAlerts();
    void refreshLiveTracking();
    onRefresh();
  };

  return (
    <OperationalControlTower
      tasks={liveTracking.tasks}
      drivers={liveTracking.drivers}
      alerts={alerts}
      mode={liveTrackingMode}
      isLoading={isLoading}
      lastSync={liveTracking.lastSync}
      includeAdminInsights={false}
      onRefresh={handleRefresh}
      onNavigate={onNavigate}
    />
  );
};
