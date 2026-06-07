import type { InvestigateParams, InvestigationSummary, TruthEvent, RelationshipNode, RelationshipEdge, Evidence, Violation, FinancialImpact, RootCauseAnalysis, CorridorStatus } from './investigate-types';
import { MOCK_SUMMARY, MOCK_TIMELINE, MOCK_RELATIONSHIPS, MOCK_EVIDENCE, MOCK_VIOLATIONS, MOCK_FINANCIAL, MOCK_ROOT_CAUSE, MOCK_CORRIDORS } from './investigate-fixtures';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function runInvestigation(params: InvestigateParams): Promise<{
  summary: InvestigationSummary;
  timeline: TruthEvent[];
  relationships: { nodes: RelationshipNode[]; edges: RelationshipEdge[] };
  evidence: Evidence[];
  violations: Violation[];
  financial: FinancialImpact;
  rootCause: RootCauseAnalysis;
  corridors: CorridorStatus[];
}> {
  await delay(1500); // Simulate investigation time
  return {
    summary: MOCK_SUMMARY,
    timeline: MOCK_TIMELINE,
    relationships: MOCK_RELATIONSHIPS,
    evidence: MOCK_EVIDENCE,
    violations: MOCK_VIOLATIONS,
    financial: MOCK_FINANCIAL,
    rootCause: MOCK_ROOT_CAUSE,
    corridors: MOCK_CORRIDORS,
  };
}

export async function exportInvestigationReport(params: InvestigateParams): Promise<void> {
  await delay(1000);
  console.log('Exporting investigation report for', params);
}
