export function CampaignDeleteModal({ open, name, onClose, onConfirm }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 text-center">
        <h2 className="text-lg font-bold mb-2">Supprimer la campagne ?</h2>
        <p className="text-sm text-gray-500 mb-4">{name}</p>
        <div className="flex gap-2"><button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm">Annuler</button><button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Supprimer</button></div>
      </div>
    </div>
  );
}
