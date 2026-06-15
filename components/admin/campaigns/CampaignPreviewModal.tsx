import { Icon } from '../../Icon';

export function CampaignPreviewModal({ open, channel, content, onClose }: { open: boolean; channel: string; content: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between mb-4"><h2 className="text-lg font-bold">Aperçu — {channel}</h2><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-2">Desktop / Email</p><div className="text-xs bg-gray-50 p-3 rounded-lg min-h-[80px]">{content || 'Aperçu contenu...'}</div></div>
          <div className="border rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-2">Mobile / {channel}</p><div className="text-xs bg-green-50 p-3 rounded-lg min-h-[80px]">{content || 'Aperçu mobile...'}</div></div>
        </div>
      </div>
    </div>
  );
}
