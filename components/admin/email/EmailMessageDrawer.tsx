import { Icon } from '../../Icon';
import type { EmailMessage } from '../../../lib/admin/email-types';

export function EmailMessageDrawer({ message, onClose }: { message: EmailMessage | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl p-5 overflow-y-auto">
        <div className="flex justify-between mb-4"><h3 className="font-bold">{message.reference}</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <p className="text-sm text-gray-500 mb-4">{message.recipientEmail}</p>
        <div className="space-y-2 text-sm">
          <p><strong>Sujet :</strong> {message.subject}</p>
          <p><strong>Type :</strong> {message.messageTypeLabel}</p>
          <p><strong>Template :</strong> {message.templateName}</p>
          <p><strong>Statut :</strong> {message.statusLabel}</p>
          {message.openRate != null && <p><strong>Ouverture :</strong> {message.openRate}%</p>}
          {message.clickRate != null && <p><strong>Clic :</strong> {message.clickRate}%</p>}
        </div>
      </div>
    </div>
  );
}
