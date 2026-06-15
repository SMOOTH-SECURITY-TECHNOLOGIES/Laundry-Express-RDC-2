import React from 'react';
import { Icon } from '../../Icon';
import type { AutoDispatchResult } from '../../../lib/admin/dispatcher-types';

interface AutoDispatchModalProps {
  isOpen: boolean;
  loading: boolean;
  result: AutoDispatchResult | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function AutoDispatchModal({ isOpen, loading, result, onConfirm, onClose }: AutoDispatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Icon name="fire" className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Auto Dispatch</h2>
        </div>

        <div className="px-6 py-4">
          {!result ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Affecter automatiquement les missions du backlog selon les critères :
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mb-4">
                <li>· 40% distance · 25% SLA · 20% historique · 10% charge · 5% disponibilité</li>
                <li>· Zone · Score chauffeur · Charge actuelle</li>
              </ul>
              <p className="text-sm text-gray-500">Confirmer le dispatch automatique ?</p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-700">
                {result.assigned} mission(s) assignée(s) · {result.skipped} ignorée(s)
              </p>
              {result.details.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.details.map((d) => (
                    <p key={d.missionId} className="text-xs text-gray-600">
                      {d.missionId} → {d.driverName} (score {d.score})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            {result ? 'Fermer' : 'Annuler'}
          </button>
          {!result && (
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Dispatch en cours…' : 'Lancer Auto Dispatch'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
