import type { PlatformProtectionSummary } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface PlatformProtectionCardProps {
  protection: PlatformProtectionSummary;
  onSettings?: () => void;
}

export function PlatformProtectionCard({ protection, onSettings }: PlatformProtectionCardProps) {
  const items = [
    { label: 'Détection fraude IA', active: protection.fraudDetection },
    { label: 'Règle de protection', active: protection.protectionRules > 0, detail: `${protection.protectionRules} actives` },
    { label: 'Limites configurées', active: protection.limitsConfigured > 0, detail: `${protection.limitsConfigured} seuils` },
    { label: 'Validation automatique', active: protection.autoValidation },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Protection plateforme
      </h3>

      <div className="flex-1 flex flex-col items-center text-center mb-4">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
          <Icon name="shield" className="w-10 h-10 text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-emerald-700">Système de protection actif</p>
        <p className="text-xs text-gray-500 mt-1">Surveillance continue des litiges et remboursements</p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </div>
            {'detail' in item && item.detail && (
              <span className="text-xs text-gray-500">{item.detail}</span>
            )}
          </div>
        ))}
      </div>

      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          className="w-full text-sm font-semibold text-blue-600 hover:underline"
        >
          Voir paramètres
        </button>
      )}
    </div>
  );
}
