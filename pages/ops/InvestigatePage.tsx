import React, { useState } from 'react';
import { realApi } from '../../services/real-api';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';

interface InvestigationResult {
  order?: Record<string, unknown> | null;
  payment_intent?: Record<string, unknown> | null;
  delivery_tasks: Array<Record<string, unknown>>;
  timelines: Array<Record<string, unknown>>;
  proofs: Array<Record<string, unknown>>;
  status_history: Array<Record<string, unknown>>;
  anomalies: Array<Record<string, unknown>>;
  summary: Record<string, unknown>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', pending_confirmation: 'En attente', confirmed: 'Confirmée',
  pickup_scheduled: 'Enlèvement programmé', pickup_driver_assigned: 'Chauffeur assigné',
  pickup_in_progress: 'Enlèvement en cours', picked_up: 'Enlevée',
  received_by_partner: 'Reçue pressing', cleaning_in_progress: 'Nettoyage',
  quality_check: 'Contrôle qualité', ready_for_delivery: 'Prête livraison',
  delivery_driver_assigned: 'Livreur assigné', delivery_in_progress: 'Livraison en cours',
  delivered: 'Livrée', completed: 'Terminée', cancelled: 'Annulée',
  failed: 'Échouée', disputed: 'Disputée',
};

const CORRIDOR_COLORS: Record<string, string> = {
  order: 'bg-blue-50 text-blue-700 border-blue-200',
  payment: 'bg-green-50 text-green-700 border-green-200',
  logistics: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const InvestigatePage: React.FC = () => {
  const { setAdminSectionParams } = useNavigation();
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvestigate = () => {
    if (!orderId.trim() && !paymentId.trim() && !taskId.trim()) return;
    setLoading(true); setError(null); setResult(null);

    const params: Record<string, string> = {};
    if (orderId.trim()) params.order_id = orderId.trim();
    if (paymentId.trim()) params.payment_intent_id = paymentId.trim();
    if (taskId.trim()) params.delivery_task_id = taskId.trim();

    realApi.investigate(params)
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { setError('Investigation échouée. Vérifiez les IDs fournis.'); setLoading(false); });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const totalEvents = (result?.timelines?.length || 0) + (result?.status_history?.length || 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setAdminSectionParams({ section: 'ops_dashboard' })} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Icon name="arrowLeft" className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cross-Corridor Investigation</h1>
          <p className="text-sm text-gray-500">Reconstruction multi-ID entre les corridors de vérité</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Paramètres d'investigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <div className="relative">
              <Icon name="shirt" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="UUID de la commande"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Intent ID</label>
            <div className="relative">
              <Icon name="currencyDollar" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={paymentId}
                onChange={e => setPaymentId(e.target.value)}
                placeholder="ID du paiement"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Task ID</label>
            <div className="relative">
              <Icon name="truck" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" value={taskId}
                onChange={e => setTaskId(e.target.value)}
                placeholder="ID de la tâche logistique"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Au moins un ID requis. Plus vous fournissez, plus la reconstruction est précise.</p>
          <button
            onClick={handleInvestigate}
            disabled={loading || (!orderId.trim() && !paymentId.trim() && !taskId.trim())}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
          >
            <Icon name="search" className="w-4 h-4" />
            {loading ? 'Reconstruction...' : 'Investiguer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3">
          <Icon name="warning" className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé de l'investigation</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{totalEvents}</div>
                <div className="text-xs text-blue-600 uppercase tracking-wider">Événements</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{result.proofs.length}</div>
                <div className="text-xs text-green-600 uppercase tracking-wider">Preuves</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{result.anomalies.length}</div>
                <div className="text-xs text-red-600 uppercase tracking-wider">Anomalies</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {result.delivery_tasks.length}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wider">Tâches</div>
              </div>
            </div>
            {result.order && (
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const oid = (result.order as Record<string, unknown>)?.id as string;
                    if (oid) setAdminSectionParams({ section: 'ops_truth', orderId: oid });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
                >
                  <Icon name="shirt" className="w-3 h-3" />
                  Voir la timeline commande
                </button>
                {result.anomalies.length > 0 && (
                  <button
                    onClick={() => setAdminSectionParams({ section: 'ops_anomalies' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                  >
                    <Icon name="warning" className="w-3 h-3" />
                    Voir toutes les anomalies
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Card */}
          {result.order && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon name="shirt" className="w-5 h-5 text-blue-600" />
                Commande
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">N°</span>
                  <div className="font-medium">{(result.order as Record<string, unknown>).order_number as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Statut</span>
                  <div className="font-medium">{STATUS_LABELS[(result.order as Record<string, unknown>).status as string] || (result.order as Record<string, unknown>).status as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Montant</span>
                  <div className="font-medium">{(result.order as Record<string, unknown>).total_amount as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Payé</span>
                  <div className="font-medium">{(result.order as Record<string, unknown>).amount_paid as string}</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Intent Card */}
          {result.payment_intent && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Icon name="currencyDollar" className="w-5 h-5 text-green-600" />
                Paiement
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Méthode</span>
                  <div className="font-medium">{(result.payment_intent as Record<string, unknown>).payment_method as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Provider</span>
                  <div className="font-medium">{(result.payment_intent as Record<string, unknown>).provider as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Montant</span>
                  <div className="font-medium">{(result.payment_intent as Record<string, unknown>).amount as string}</div>
                </div>
                <div>
                  <span className="text-gray-500">Statut</span>
                  <div className="font-medium">{(result.payment_intent as Record<string, unknown>).status as string}</div>
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          {result.status_history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="clock-history" className="w-5 h-5 text-gray-500" />
                  Historique des statuts ({result.status_history.length})
                </h2>
              </div>
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {result.status_history.map((hist, idx) => (
                    <div key={idx} className="relative flex gap-4 mb-6 last:mb-0">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full border-2 bg-blue-100 text-blue-600 border-blue-300 flex items-center justify-center">
                          <Icon name="arrowRight" className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className="text-gray-400">{STATUS_LABELS[(hist as Record<string, unknown>).old_status as string] || (hist as Record<string, unknown>).old_status as string}</span>
                            <Icon name="arrowRight" className="w-3 h-3 inline mx-1 text-gray-400" />
                            <span className="font-medium">{STATUS_LABELS[(hist as Record<string, unknown>).new_status as string] || (hist as Record<string, unknown>).new_status as string}</span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate((hist as Record<string, unknown>).created_at as string)}</span>
                        </div>
                        {(hist as Record<string, unknown>).change_reason && (
                          <div className="text-sm text-gray-600 mt-1">{(hist as Record<string, unknown>).change_reason as string}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Events */}
          {result.timelines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="clock-history" className="w-5 h-5 text-gray-500" />
                  Timeline opérationnelle ({result.timelines.length})
                </h2>
              </div>
              <div className="p-5">
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {result.timelines.map((event, idx) => {
                    const evt = event as Record<string, unknown>;
                    const corridor = (evt.source as string) || 'order';
                    return (
                      <div key={idx} className="relative flex gap-4 mb-6 last:mb-0">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${CORRIDOR_COLORS[corridor] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                            <Icon name={corridor === 'order' ? 'shirt' : corridor === 'payment' ? 'currencyDollar' : 'truck'} className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <span className="font-semibold text-gray-900">{evt.event_type as string}</span>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium border ${CORRIDOR_COLORS[corridor] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                {corridor}
                              </span>
                              {evt.event_subtype && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{evt.event_subtype as string}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(evt.occurred_at as string)}</span>
                          </div>
                          {evt.from_status && evt.to_status && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="text-gray-400">{STATUS_LABELS[evt.from_status as string] || evt.from_status as string}</span>
                              <Icon name="arrowRight" className="w-3 h-3 inline mx-1 text-gray-400" />
                              <span className="font-medium">{STATUS_LABELS[evt.to_status as string] || evt.to_status as string}</span>
                            </div>
                          )}
                          {evt.payload && Object.keys(evt.payload as object).length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-100 text-xs font-mono text-gray-600 overflow-x-auto">
                              {JSON.stringify(evt.payload, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Proofs */}
          {result.proofs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="camera" className="w-5 h-5 text-gray-500" />
                  Preuves ({result.proofs.length})
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.proofs.map((proof, idx) => {
                  const p = proof as Record<string, unknown>;
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm capitalize">{p.proof_type as string}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                          p.verification_status === 'disputed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.verification_status as string}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Par {p.actor_name as string} <span className="text-gray-400">({p.actor_type as string})</span>
                      </div>
                      {p.proof_data && Object.keys(p.proof_data as object).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-500 overflow-x-auto">
                          {JSON.stringify(p.proof_data, null, 2)}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        {formatDate(p.recorded_at as string)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Tasks */}
          {result.delivery_tasks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="truck" className="w-5 h-5 text-orange-600" />
                  Tâches logistiques ({result.delivery_tasks.length})
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {result.delivery_tasks.map((task, idx) => {
                  const t = task as Record<string, unknown>;
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm capitalize">{t.task_type as string}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">{t.status as string}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        {t.driver_id && <div>Chauffeur: {t.driver_id as string}</div>}
                        {t.created_at && <div>Créée: {formatDate(t.created_at as string)}</div>}
                        {t.completed_at && <div>Terminée: {formatDate(t.completed_at as string)}</div>}
                      </div>
                      {t.failure_reason && (
                        <div className="mt-2 text-sm text-red-600">Échec: {t.failure_reason as string}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {result.anomalies.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="warning" className="w-5 h-5 text-red-500" />
                  Anomalies ({result.anomalies.length})
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {result.anomalies.map((anomaly, idx) => {
                  const a = anomaly as Record<string, unknown>;
                  const sev = (a.severity as string) || 'low';
                  const corr = (a.corridor as string) || 'order';
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      sev === 'high' ? 'bg-red-50 border-red-200' :
                      sev === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${
                          sev === 'high' ? 'text-red-700' :
                          sev === 'medium' ? 'text-yellow-700' :
                          'text-gray-700'
                        }`}>
                          {sev === 'high' ? 'Critique' : sev === 'medium' ? 'Moyen' : 'Faible'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(a.detected_at as string)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{a.description as string}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${CORRIDOR_COLORS[corr] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                          {corr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary JSON */}
          {result.summary && Object.keys(result.summary).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="document" className="w-5 h-5 text-gray-500" />
                  Résumé technique
                </h2>
              </div>
              <div className="p-5">
                <pre className="p-3 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto font-mono">
                  {JSON.stringify(result.summary, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <Icon name="search" className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Entrez au moins un ID pour démarrer l'investigation</p>
          <p className="text-sm mt-2">La reconstruction cross-corridor lie commande, paiement et logistique</p>
        </div>
      )}
    </div>
  );
};