const ACTIONS = ['Créer une clé API', 'Tester un webhook', 'Vérifier la santé', 'Exporter logs', 'Ouvrir analytics'];

export function QuickActions({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-3">Actions rapides</h3>
      <div className="space-y-2">{ACTIONS.map((a) => (
        <button key={a} type="button" onClick={() => onAction(a)} className="block w-full text-left text-sm text-blue-600 hover:underline">{a}</button>
      ))}</div>
    </div>
  );
}
