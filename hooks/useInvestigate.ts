import { useState, useCallback } from 'react';
import type { InvestigateParams, InvestigationSummary, TruthEvent, RelationshipNode, RelationshipEdge, Evidence, Violation, FinancialImpact, RootCauseAnalysis, CorridorStatus } from '../lib/admin/investigate-types';
import * as api from '../lib/admin/investigate-api';
import {
  MOCK_CORRIDORS,
  MOCK_EVIDENCE,
  MOCK_FINANCIAL,
  MOCK_RELATIONSHIPS,
  MOCK_ROOT_CAUSE,
  MOCK_SUMMARY,
  MOCK_TIMELINE,
  MOCK_VIOLATIONS,
} from '../lib/admin/investigate-fixtures';

const DEFAULT_PARAMS: InvestigateParams = {
  orderId: 'ORD-7841',
  paymentId: 'PAY-224',
  deliveryTaskId: 'DRV-981',
  driverId: 'DRV-DAVID-98',
  customerPhone: '+243 812 345 678',
  partnerId: 'PAR-115',
};

const DEFAULT_RESULT = {
  summary: MOCK_SUMMARY,
  timeline: MOCK_TIMELINE,
  relationships: MOCK_RELATIONSHIPS,
  evidence: MOCK_EVIDENCE,
  violations: MOCK_VIOLATIONS,
  financial: MOCK_FINANCIAL,
  rootCause: MOCK_ROOT_CAUSE,
  corridors: MOCK_CORRIDORS,
};

export function useInvestigate() {
  const [params, setParams] = useState<InvestigateParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: InvestigationSummary | null;
    timeline: TruthEvent[];
    relationships: { nodes: RelationshipNode[]; edges: RelationshipEdge[] };
    evidence: Evidence[];
    violations: Violation[];
    financial: FinancialImpact | null;
    rootCause: RootCauseAnalysis | null;
    corridors: CorridorStatus[];
  } | null>(DEFAULT_RESULT);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(true);

  const investigate = useCallback(async () => {
    const hasParam = params.orderId || params.paymentId || params.deliveryTaskId || params.driverId || params.customerPhone || params.partnerId;
    if (!hasParam) {
      setError('Entrez au moins un identifiant pour démarrer l\'investigation.');
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await api.runInvestigation(params);
      setResult(data);
    } catch {
      setError('Impossible de reconstruire cette opération.');
    }
    setLoading(false);
  }, [params]);

  const exportReport = useCallback(async () => {
    await api.exportInvestigationReport(params);
  }, [params]);

  return { params, setParams, loading, result, error, hasSearched, investigate, exportReport };
}
