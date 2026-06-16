import React from 'react';
import { LogisticsMissions } from './LogisticsMissions';

interface LogisticsDispatchProps {
  focusMissionId?: string | null;
  focusAlertTitle?: string | null;
  focusType?: string | null;
  focusZone?: string | null;
  onClearFocus?: () => void;
}

export const LogisticsDispatch: React.FC<LogisticsDispatchProps> = (props) => <LogisticsMissions {...props} />;
