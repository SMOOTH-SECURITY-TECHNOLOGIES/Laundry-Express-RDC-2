import React, { useState, useEffect } from 'react';
import { realApi } from '../../services/real-api';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';

interface Anomaly {
  id: string; anomaly_type: string; corridor: string;
  order_id?: string | null; payment_intent_id?: string | null; task_id?: string | null;
  description: string; severity: string; detected_at: string;
  resolved_at?: string | null; payload: Record<string, unknown>;
}

const ANOMALY_LABELS: Record<string, string> = {
  payment_mismatch: 'Incohérence paiement',
  delivered_without_proof: 'Livraison sans preuve',
  duplicate_delivery_task: 'Tâche en double',
  transition_rejected: 'Transition refusée',
  race_blocked: 'Race bloquée',
  webhook_duplicate: 'Webhook dupliqué',
  commission_duplicate: 'Commission dupliquée',
  missing_proof: 'Preuve manquante',
};

const CORRIDOR_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  order: { label: 'Commande', color: 'blue', icon: 'shirt' },
  payment: { label: 'Paiement', color: 'green', icon: 'currencyDollar' },
  logistics: { label: 'Logistique', color: 'orange', icon: 'truck' },
};

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  low: { label: 'Faible', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'circle' },
  medium: { label: 'Moyen', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'warning' },
  high: { label: 'Critique', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'warning' },
};

export const AnomalyCenterPage: React.FC = () => {
  const { setAdminSectionParams } = useNavigation();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [corridor, setCorridor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const pageSize = 20;

  const MOCK_ANOMALIES: Anomaly[] = [
    { id: 'ANO-001', anomaly_type: 'status_mismatch', corridor: 'order', order_id: 'ORD-1790', detected_at: new Date(Date.now() - 7200000).toISOString(), severity: 'low', description: 'Statut incohérent', payload: {} },
    { id: 'ANO-002', anomaly_type: 'payment_orphan', corridor: 'payment', order_id: 'ORD-1781', detected_at: new Date(Date.now() - 3600000).toISOString(), severity: 'medium', description: 'Paiement sans collecte', payload: {} },
    { id: 'ANO-003', anomaly_type: 'duplicate_delivery_task', corridor: 'payment', order_id: 'ORD-1779', detected_at: new Date(Date.now() - 1800000).toISOString(), severity: 'high', description: 'Double paiement détecté', payload: {} },
    { id: 'ANO-004', anomaly_type: 'race_blocked', corridor: 'logistics', order_id: 'ORD-1775', detected_at: new Date(Date.now() - 900000).toISOString(), severity: 'high', description: 'Collecte sans chauffeur', payload: {} },
    { id: 'ANO-005', anomaly_type: 'delivery_outside_sla', corridor: 'logistics', order_id: 'ORD-1770', detected_at: new Date(Date.now() - 600000).toISOString(), severity: 'medium', description: 'Livraison hors SLA', payload: {} },
    { id: 'ANO-006', anomaly_type: 'webhook_duplicate', corridor: 'order', order_id: 'ORD-1765', detected_at: new Date(Date.now() - 5400000).toISOString(), severity: 'low', description: 'Webhook dupliqué', resolved_at: new Date(Date.now() - 5000000).toISOString(), payload: {} },
    { id: 'ANO-007', anomaly_type: 'commission_duplicate', corridor: 'logistics', order_id: 'ORD-1760', detected_at: new Date(Date.now() - 4800000).toISOString(), severity: 'medium', description: 'Commission en double', payload: {} },
  ];

  useEffect(() => {
    setLoading(true);
    setIsUsingFallback(false);
    realApi.getAnomalies({ corridor: corridor === 'all' ? undefined : corridor, page, page_size: pageSize })
      .then(data => {
        setAnomalies(data.anomalies as Anomaly[]);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => {
        const filteredFallback = corridor && corridor !== 'all'
          ? MOCK_ANOMALIES.filter((anomaly) => anomaly.corridor === corridor)
          : MOCK_ANOMALIES;
        setAnomalies(filteredFallback);
        setTotal(filteredFallback.length);
        setIsUsingFallback(true);
        setLoading(false);
      });
  }, [corridor, page]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(total / pageSize);

  const severityCounts = {
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {isUsingFallback && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          Mode dégradé : l'API des anomalies est indisponible, affichage de données de secours.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setAdminSectionParams({ section: 'ops_dashboard' })} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Icon name="arrowLeft" className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Anomaly Center</h1>
          <p className="text-sm text-gray-500">Violations détectées dans les corridors de vérité</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700">{severityCounts.high}</div>
          <div className="text-xs text-red-600 uppercase tracking-wider">Critique</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-700">{severityCounts.medium}</div>
          <div className="text-xs text-yellow-600 uppercase tracking-wider">Moyen</div>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-700">{severityCounts.low}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Faible</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-2">Filtrer par corridor :</span>
          {[
            { key: 'all', label: 'Tous', count: total },
            { key: 'order', label: 'Commande', count: anomalies.filter(a => a.corridor === 'order').length },
            { key: 'payment', label: 'Paiement', count: anomalies.filter(a => a.corridor === 'payment').length },
            { key: 'logistics', label: 'Logistique', count: anomalies.filter(a => a.corridor === 'logistics').length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setCorridor(f.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                (f.key === 'all' && !corridor) || corridor === f.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                (f.key === 'all' && !corridor) || corridor === f.key ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Icon name="shield-check" className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune anomalie détectée</h3>
          <p className="text-sm text-gray-500">Les corridors de vérité fonctionnent normalement.</p>
        </div>
      ) : (
        <>
          {/* Anomaly Cards */}
          <div className="space-y-3">
            {anomalies.map(anomaly => {
              const severity = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.low;
              const corridorCfg = CORRIDOR_CONFIG[anomaly.corridor] || { label: anomaly.corridor, color: 'gray', icon: 'circle' };

              return (
                <div key={anomaly.id} className={`bg-white rounded-lg border ${severity.border} shadow-sm hover:shadow-md transition overflow-hidden`}>
                  <div className={`px-4 py-3 ${severity.bg} border-b ${severity.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Icon name={severity.icon as any} className={`w-4 h-4 ${severity.text}`} />
                      <span className={`text-sm font-semibold ${severity.text}`}>{severity.label}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(anomaly.detected_at)}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {ANOMALY_LABELS[anomaly.anomaly_type] || anomaly.anomaly_type}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${corridorCfg.color}-100 text-${corridorCfg.color}-700`}>
                            <Icon name={corridorCfg.icon as any} className="w-3 h-3" />
                            {corridorCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{anomaly.description}</p>
                        {Object.keys(anomaly.payload).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-500 overflow-x-auto">
                            {JSON.stringify(anomaly.payload)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {anomaly.order_id && (
                          <button
                            onClick={() => setAdminSectionParams({ section: 'ops_investigate', orderId: anomaly.order_id })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                          >
                            <Icon name="search" className="w-3 h-3" />
                            Investiguer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="text-sm text-gray-500">
                Affichage {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} sur {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 text-sm font-medium transition"
                >
                  ← Précédent
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 text-sm font-medium transition"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
