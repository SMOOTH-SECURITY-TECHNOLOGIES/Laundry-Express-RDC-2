import { Icon } from '../../Icon';

const actions = ['Créer template', 'Envoyer email test', 'Créer campagne', 'Voir bounces', 'Voir désabonnés', 'Vérifier domaine', 'Exporter logs'];

export function EmailQuickActions({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Actions rapides</h3>
      <div className="space-y-2">{actions.map((a) => (
        <button key={a} type="button" onClick={() => onAction(a)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-left">
          <Icon name="envelope" className="w-4 h-4 text-gray-500" />{a}
        </button>
      ))}</div>
    </div>
  );
}
