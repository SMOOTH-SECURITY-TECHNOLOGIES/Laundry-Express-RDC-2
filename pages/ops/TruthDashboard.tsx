import React, { useState, useEffect } from 'react';
import { realApi } from '../../services/real-api';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';

const CORRIDOR_CONFIG: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  order: { label: 'Commande', icon: 'shirt', color: 'blue', desc: 'Transitions & preuves' },
  payment: { label: 'Paiement', icon: 'currencyDollar', color: 'green', desc: 'Précision & idempotence' },
  logistics: { label: 'Logistique', icon: 'truck', color: 'orange', desc: 'Preuves & assignations' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  healthy: {
    label: 'Sain',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  warning: {
    label: 'Attention',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
  critical: {
    label: 'Critique',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Faible', color: 'text-green-600' },
  medium: { label: 'Moyen', color: 'text-yellow-600' },
  high: { label: 'Élevé', color: 'text-red-600' },
};

export const TruthDashboard: React.FC = () => {
  const { setAdminSectionParams } = useNavigation();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    realApi.getCorridorsHealth()
      .then(data => { setHealth(data); setLoading(false); })
      .catch(() => { setError('Impossible de charger la santé des corridors'); setLoading(false); });
  }, []);

  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
        <div className="flex items-center gap-2">
          <Icon name="warning" className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-medium">{error || 'Erreur inconnue'}</span>
        </div>
      </div>
    );
  }

  const totalAnomalies = health.corridors.reduce((sum: number, c: any) => sum + c.open_anomalies, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operational Truth Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble des corridors de vérité</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${totalAnomalies > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {totalAnomalies}
          </div>
          <div className="text-xs text-gray-500">anomalie(s) ouverte(s)</div>
        </div>
      </div>

      {/* Corridor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health.corridors.map((c: any) => {
          const cfg = CORRIDOR_CONFIG[c.corridor] || { label: c.corridor, icon: 'circle', color: 'gray', desc: '' };
          const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.healthy;
          const risk = RISK_CONFIG[c.risk_level] || RISK_CONFIG.low;

          return (
            <div
              key={c.corridor}
              className={`bg-white rounded-xl shadow-sm border-2 ${status.border} p-5 hover:shadow-md transition cursor-pointer`}
              onClick={() => {
                if (c.open_anomalies > 0) {
                  setAdminSectionParams({ section: 'ops_anomalies' });
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${cfg.color}-100 rounded-lg`}>
                    <Icon name={cfg.icon as any} className={`w-5 h-5 text-${cfg.color}-600`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{cfg.label}</div>
                    <div className="text-xs text-gray-500">{cfg.desc}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                  {status.label}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <div className={`text-xl font-bold ${c.open_anomalies > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {c.open_anomalies}
                  </div>
                  <div className="text-xs text-gray-500">Anomalies</div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className={`text-xl font-bold ${risk.color}`}>{risk.label}</div>
                  <div className="text-xs text-gray-500">Risque</div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-xl font-bold text-gray-700">{formatTimeAgo(c.last_event_at)}</div>
                  <div className="text-xs text-gray-500">Dernier evt</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Outils d'investigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setAdminSectionParams({ section: 'ops_truth' })}
            className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition text-left"
          >
            <div className="p-2 bg-blue-200 rounded-lg">
              <Icon name="search" className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <div className="font-medium text-blue-900">Order Truth</div>
              <div className="text-xs text-blue-700">Rechercher une commande</div>
            </div>
          </button>

          <button
            onClick={() => setAdminSectionParams({ section: 'ops_anomalies' })}
            className={`flex items-center gap-3 p-4 rounded-lg transition text-left ${
              totalAnomalies > 0 ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`p-2 rounded-lg ${totalAnomalies > 0 ? 'bg-red-200' : 'bg-gray-200'}`}>
              <Icon name="warning" className={`w-5 h-5 ${totalAnomalies > 0 ? 'text-red-700' : 'text-gray-700'}`} />
            </div>
            <div>
              <div className={`font-medium ${totalAnomalies > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                Anomaly Center
              </div>
              <div className={`text-xs ${totalAnomalies > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                {totalAnomalies > 0 ? `${totalAnomalies} violation(s) détectée(s)` : 'Aucune violation'}
              </div>
            </div>
          </button>

          <button
            onClick={() => setAdminSectionParams({ section: 'ops_investigate' })}
            className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition text-left"
          >
            <div className="p-2 bg-purple-200 rounded-lg">
              <Icon name="shield" className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="font-medium text-purple-900">Investigate</div>
              <div className="text-xs text-purple-700">Reconstruction multi-ID</div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer timestamp */}
      <div className="text-right text-xs text-gray-400">
        Dernière vérification : {new Date(health.checked_at).toLocaleString('fr-FR')}
      </div>
    </div>
  );
};