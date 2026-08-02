import React from 'react';
import { logisticsCard } from '../logistics-ui';
import BacklogBoard from '../BacklogBoard';
import { storeBacklogMissionForDispatch } from '../../../services/logistics-api';
import type { DispatchBacklogItem } from '../../../lib/logistics/backlog-model';
import type { NavigateHandler } from './useOperationalDashboard';

export const DispatchBacklogPanel: React.FC<{
  missions: DispatchBacklogItem[];
  onNavigate?: NavigateHandler;
  compact?: boolean;
  maxItems?: number;
}> = ({ missions, onNavigate, compact, maxItems = 8 }) => (
  <article className={`${logisticsCard} p-5`}>
    <BacklogBoard
      missions={missions}
      compact={compact}
      maxItems={maxItems}
      onMissionClick={(missionId) => {
        const mission = missions.find((item) => item.mission_id === missionId);
        if (mission) storeBacklogMissionForDispatch(mission);
        sessionStorage.setItem('logisticsFocusMissionId', missionId);
        onNavigate?.('dispatch', { missionId });
      }}
    />
  </article>
);
