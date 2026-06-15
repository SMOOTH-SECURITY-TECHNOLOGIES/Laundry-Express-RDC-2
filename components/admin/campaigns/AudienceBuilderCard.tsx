import { Icon } from '../../Icon';
import { CAMPAIGNS_WRITE_ENABLED } from '../../../lib/admin/campaigns-api';

interface Props { estimatedSize: number; onOpenBuilder: () => void; }

export function AudienceBuilderCard({ estimatedSize, onOpenBuilder }: Props) {
  const tip = 'Module à connecter au backend avant activation des actions sensibles.';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Audience Builder</h3></div>
      <p className="text-xs text-gray-500 mb-3">Créez des segments par zone, fréquence, panier, fidélité, partenaire ou canal préféré.</p>
      <div className="p-4 rounded-xl bg-purple-50 text-center mb-3">
        <p className="text-2xl font-bold text-purple-700">{estimatedSize.toLocaleString('fr-FR')}</p>
        <p className="text-[10px] text-gray-500">utilisateurs ciblés (estimation)</p>
      </div>
      <button type="button" onClick={onOpenBuilder} disabled={!CAMPAIGNS_WRITE_ENABLED} title={!CAMPAIGNS_WRITE_ENABLED ? tip : undefined} className="w-full py-2 text-xs bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50">Créer un segment</button>
    </div>
  );
}
