const NODES = ['Trigger', 'Condition', 'Wait', 'WhatsApp', 'SMS', 'Email', 'Webhook'];

export function WorkflowBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6">
        <h3 className="font-bold mb-4">Workflow Builder</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {NODES.map((n) => <button key={n} type="button" className="px-3 py-2 border rounded-xl text-sm hover:bg-blue-50">{n}</button>)}
        </div>
        <div className="bg-gray-50 rounded-xl p-8 min-h-[200px] flex items-center justify-center text-gray-400 text-sm">
          Glissez les nodes pour construire votre workflow
        </div>
        <button type="button" onClick={onClose} className="mt-4 px-4 py-2 border rounded-xl text-sm">Fermer</button>
      </div>
    </div>
  );
}
