import { Icon } from '../../Icon';

const CONNECTIONS = ['Cockpit Dispatcher', 'Chauffeurs', 'SLA Center', 'Services'];

export function ZonesConnectionsBanner() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Gestion des zones</h3>
          <p className="text-xs text-gray-500 mt-1">Définissez les zones de couverture, tarifs par zone et limites de livraison.</p>
          <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
            <Icon name="warning" className="w-3.5 h-3.5" />
            Module à connecter au backend avant activation des actions sensibles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONNECTIONS.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              <Icon name="check" className="w-3.5 h-3.5" /> {c} · Connecté
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
