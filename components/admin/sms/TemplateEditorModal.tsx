import { useState } from 'react';
import { Icon } from '../../Icon';
import type { SmsTemplate } from '../../../lib/admin/sms-types';
import { SMS_WRITE_ENABLED } from '../../../lib/admin/sms-api';

export function TemplateEditorModal({ open, template, onClose, onSave }: {
  open: boolean; template?: SmsTemplate | null; onClose: () => void; onSave: (data: { name: string; category: string; content: string }) => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'transaction');
  const [content, setContent] = useState(template?.content || '');
  if (!open) return null;
  const chars = content.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Template SMS</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="w-full px-3 py-2 border rounded-xl text-sm mb-3" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm mb-3">
          <option value="otp">OTP</option><option value="transaction">Transaction</option><option value="reminder">Rappel</option><option value="marketing">Marketing</option><option value="notification">Notification</option>
        </select>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Contenu avec {{name}}, {{order_id}}, {{amount}}..." className="w-full px-3 py-2 border rounded-xl text-sm mb-2" />
        <p className={`text-xs mb-4 ${chars > 160 ? 'text-red-600' : 'text-gray-400'}`}>{chars}/160 caractères</p>
        <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4"><p className="text-xs text-gray-500 mb-1">Preview</p>{content || 'Aperçu...'}</div>
        <button type="button" disabled={!SMS_WRITE_ENABLED || !name} onClick={() => { onSave({ name, category, content }); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">Enregistrer</button>
      </div>
    </div>
  );
}
