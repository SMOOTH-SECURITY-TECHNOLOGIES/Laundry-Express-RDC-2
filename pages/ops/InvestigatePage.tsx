
import React, { useEffect, useState } from 'react';
import { useInvestigate } from '../../hooks/useInvestigate';
import { InvestigateSearchParams } from '../../components/admin/investigate/InvestigateSearchParams';
import { InvestigationSummary } from '../../components/admin/investigate/InvestigationSummary';
import { TruthTimeline } from '../../components/admin/investigate/TruthTimeline';
import { RelationshipGraph } from '../../components/admin/investigate/RelationshipGraph';
import EvidenceCenter from '../../components/admin/investigate/EvidenceCenter';
import RootCauseAnalysis from '../../components/admin/investigate/RootCauseAnalysis';
import CorridorsImpacted from '../../components/admin/investigate/CorridorsImpacted';
import DetectedViolations from '../../components/admin/investigate/DetectedViolations';
import { FinancialImpactCard } from '../../components/admin/investigate/FinancialImpactCard';
import { InvestigateQuickActions } from '../../components/admin/investigate/InvestigateQuickActions';
import { Icon } from '../../components/Icon';

const notify = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const InvestigatePage: React.FC = () => {
  const { params, setParams, loading, result, error, hasSearched, investigate, exportReport } = useInvestigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const openCreateModal = () => setShowCreateModal(true);
    const runAudit = () => notify('Audit cross-corridor lancé.');
    const refreshInvestigation = () => {
      investigate();
      notify('Investigation actualisée.');
    };
    const exportInvestigation = () => {
      exportReport();
      notify('Rapport investigation exporté.');
    };
    window.addEventListener('admin-open-investigation-modal', openCreateModal);
    window.addEventListener('admin-run-investigation-audit', runAudit);
    window.addEventListener('admin-refresh-investigation', refreshInvestigation);
    window.addEventListener('admin-export-investigation', exportInvestigation);
    return () => {
      window.removeEventListener('admin-open-investigation-modal', openCreateModal);
      window.removeEventListener('admin-run-investigation-audit', runAudit);
      window.removeEventListener('admin-refresh-investigation', refreshInvestigation);
      window.removeEventListener('admin-export-investigation', exportInvestigation);
    };
  }, [exportReport, investigate]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium">Reconstruction en cours...</p>
        </div>
      )}

      {!loading && hasSearched && error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl flex items-center gap-4">
          <Icon name="warning" className="w-6 h-6 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={investigate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <InvestigateSearchParams params={params} onChange={setParams} onInvestigate={investigate} loading={loading} />
        </div>
        {result ? (
          <div className="xl:col-span-7">
            <InvestigationSummary summary={result.summary} />
          </div>
        ) : (
          <div className="xl:col-span-7 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <Icon name="search" className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">Entrez au moins un ID</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              La reconstruction cross-corridor relie commande, paiement, partenaire, chauffeur et preuves.
            </p>
          </div>
        )}
      </div>

      {!loading && result && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <TruthTimeline events={result.timeline} />
          </div>
          <div className="xl:col-span-3">
            <RelationshipGraph nodes={result.relationships.nodes} edges={result.relationships.edges} />
          </div>
          <div className="xl:col-span-4">
            <DetectedViolations violations={result.violations} />
          </div>
          <div className="xl:col-span-5">
            <EvidenceCenter evidence={result.evidence} />
          </div>
          <div className="xl:col-span-3">
            <RootCauseAnalysis analysis={result.rootCause} />
          </div>
          <div className="xl:col-span-2">
            <FinancialImpactCard financial={result.financial} />
          </div>
          <div className="xl:col-span-2">
            <InvestigateQuickActions
              onOpenOrderTruth={() => notify('Ouverture Order Truth préparée.')}
              onExport={exportReport}
              onCreateInvestigation={() => setShowCreateModal(true)}
            />
          </div>
          <div className="xl:col-span-12">
            <CorridorsImpacted corridors={result.corridors} />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Créer investigation</h2>
                <p className="text-sm text-gray-500">Escaladez ce dossier vers l'équipe opérationnelle.</p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Fermer">
                <Icon name="xmark" className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3">
              {['Référence', 'Priorité', 'Assigné à'].map((field) => (
                <label key={field} className="text-sm font-bold text-gray-700">
                  {field}
                  <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              ))}
              <label className="text-sm font-bold text-gray-700">
                Note
                <textarea className="mt-1 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <button
                type="button"
                onClick={() => {
                  notify('Investigation créée.');
                  setShowCreateModal(false);
                }}
                className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-purple-700"
              >
                Créer investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
