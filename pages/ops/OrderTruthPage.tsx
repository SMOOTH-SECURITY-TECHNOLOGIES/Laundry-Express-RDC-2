import React, { useState } from 'react';
import { realApi } from '../../services/real-api';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';

interface TimelineEvent {
  id: string; order_id: string; task_id?: string | null;
  event_type: string; event_subtype?: string | null;
  from_status?: string | null; to_status?: string | null;
  payload: Record<string, unknown>;
  occurred_at: string; source: string; correlation_id?: string | null;
  created_at: string;
}

interface Proof {
  id: string; order_id: string; task_id?: string | null;
  proof_type: string; proof_data: Record<string, unknown>;
  actor_type: string; actor_id: string; actor_name: string;
  recorded_at: string; verified_at?: string | null;
  location_lat?: string | null; location_lng?: string | null;
  verification_status: string; created_at: string;
}

interface TruthTimeline {
  order_id: string; order_number: string; customer_id: string;
  partner_id: string; current_status: string; version: number;
  events: TimelineEvent[]; proofs: Proof[];
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

const STATUS_ORDER = [
  'draft','pending_confirmation','confirmed','pickup_scheduled',
  'pickup_driver_assigned','pickup_in_progress','picked_up',
  'received_by_partner','cleaning_in_progress','quality_check',
  'ready_for_delivery','delivery_driver_assigned','delivery_in_progress',
  'delivered','completed','cancelled','failed','disputed',
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_confirmation: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  pickup_scheduled: 'bg-blue-50 text-blue-700',
  pickup_driver_assigned: 'bg-indigo-50 text-indigo-700',
  pickup_in_progress: 'bg-indigo-50 text-indigo-700',
  picked_up: 'bg-teal-50 text-teal-700',
  received_by_partner: 'bg-purple-50 text-purple-700',
  cleaning_in_progress: 'bg-purple-50 text-purple-700',
  quality_check: 'bg-purple-50 text-purple-700',
  ready_for_delivery: 'bg-cyan-50 text-cyan-700',
  delivery_driver_assigned: 'bg-cyan-50 text-cyan-700',
  delivery_in_progress: 'bg-cyan-50 text-cyan-700',
  delivered: 'bg-green-50 text-green-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-50 text-red-700',
  failed: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-50 text-orange-700',
};

export const OrderTruthPage: React.FC = () => {
  const { setAdminSectionParams } = useNavigation();
  const [orderId, setOrderId] = useState('');
  const [timeline, setTimeline] = useState<TruthTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPayloads, setExpandedPayloads] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (!orderId.trim()) return;
    setLoading(true); setError(null); setTimeline(null);
    realApi.getOrderTruthTimeline(orderId.trim())
      .then(data => { setTimeline(data); setLoading(false); })
      .catch(() => { setError('Commande non trouvée ou inaccessible'); setLoading(false); });
  };

  const togglePayload = (id: string) => {
    setExpandedPayloads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relative: Math.floor((Date.now() - date.getTime()) / 1000),
    };
  };

  const getEventIcon = (event: TimelineEvent) => {
    if (event.event_type === 'status_change') return 'arrowRight';
    if (event.event_type === 'payment') return 'currencyDollar';
    if (event.event_type === 'proof_added') return 'camera';
    if (event.event_type === 'dispute') return 'warning';
    return 'circle';
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.event_subtype) return 'bg-red-100 text-red-600 border-red-300';
    if (event.event_type === 'status_change') return 'bg-blue-100 text-blue-600 border-blue-300';
    if (event.event_type === 'payment') return 'bg-green-100 text-green-600 border-green-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setAdminSectionParams({ section: 'ops_dashboard' })} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Icon name="arrowLeft" className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Truth Timeline</h1>
          <p className="text-sm text-gray-500">Reconstruction chronologique avec preuves</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Icon name="search" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Entrez l'ID de la commande (UUID)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !orderId.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
          >
            <Icon name="search" className="w-4 h-4" />
            {loading ? 'Chargement...' : 'Rechercher'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3">
          <Icon name="warning" className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {timeline && (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Icon name="shirt" className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Commande</div>
                  <div className="text-xl font-bold text-gray-900">{timeline.order_number}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{timeline.order_id}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[timeline.current_status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[timeline.current_status] || timeline.current_status}
                </span>
                <div className="text-xs text-gray-400 mt-2">Version {timeline.version}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{timeline.events.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Événements</div>
              </div>
              <div className="text-center border-l border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{timeline.proofs.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Preuves</div>
              </div>
              <div className="text-center border-l border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{timeline.proofs.filter(p => p.verification_status === 'verified').length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Vérifiées</div>
              </div>
              <div className="text-center border-l border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {timeline.events.filter(e => e.event_subtype === 'transition_rejected').length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Rejets</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="clock-history" className="w-5 h-5 text-gray-500" />
                Timeline ({timeline.events.length} événements)
              </h2>
            </div>
            <div className="p-5">
              {timeline.events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucun événement enregistré</div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {timeline.events.map((event, idx) => {
                    const dt = formatDate(event.occurred_at);
                    const isExpanded = expandedPayloads.has(event.id);

                    return (
                      <div key={event.id} className="relative flex gap-4 mb-6 last:mb-0">
                        {/* Icon on the line */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEventColor(event)}`}>
                            <Icon name={getEventIcon(event) as any} className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">
                                  {event.event_type === 'status_change' && event.to_status
                                    ? STATUS_LABELS[event.to_status] || event.to_status
                                    : event.event_type}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded text-gray-600">{event.source}</span>
                                {event.event_subtype && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 rounded text-red-700 font-medium">{event.event_subtype}</span>
                                )}
                              </div>
                              {event.from_status && event.to_status && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="text-gray-400">{STATUS_LABELS[event.from_status] || event.from_status}</span>
                                  <Icon name="arrowRight" className="w-3 h-3 inline mx-1 text-gray-400" />
                                  <span className="font-medium">{STATUS_LABELS[event.to_status] || event.to_status}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <div>{dt.date}</div>
                              <div>{dt.time}</div>
                            </div>
                          </div>

                          {event.payload && Object.keys(event.payload).length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => togglePayload(event.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="w-3 h-3" />
                                {isExpanded ? 'Masquer' : 'Voir'} le payload
                              </button>
                              {isExpanded && (
                                <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto font-mono">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Proofs */}
          {timeline.proofs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon name="camera" className="w-5 h-5 text-gray-500" />
                  Preuves opérationnelles ({timeline.proofs.length})
                </h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {timeline.proofs.map(proof => (
                  <div key={proof.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name={proof.proof_type === 'photo' ? 'camera' : proof.proof_type === 'geolocation' ? 'mapPin' : 'document'} className="w-4 h-4 text-gray-500" />
                        <span className="font-medium capitalize text-sm">{proof.proof_type}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        proof.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                        proof.verification_status === 'disputed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {proof.verification_status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Par <span className="font-medium">{proof.actor_name}</span>
                      <span className="text-gray-400 text-xs"> ({proof.actor_type})</span>
                    </div>
                    {proof.proof_data && Object.keys(proof.proof_data).length > 0 && (
                      <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto">
                        {JSON.stringify(proof.proof_data, null, 2)}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{formatDate(proof.recorded_at).date} {formatDate(proof.recorded_at).time}</span>
                      {proof.location_lat && proof.location_lng && (
                        <span className="flex items-center gap-1">
                          <Icon name="mapPin" className="w-3 h-3" />
                          {parseFloat(proof.location_lat).toFixed(4)}, {parseFloat(proof.location_lng).toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!timeline && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <Icon name="search" className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Entrez un ID de commande pour voir sa timeline de vérité</p>
          <p className="text-sm mt-2">La timeline montre tous les événements, transitions et preuves</p>
        </div>
      )}
    </div>
  );
};