import { useState } from 'react';
import { Icon } from '../../Icon';
import type { EmailTemplate } from '../../../lib/admin/email-types';
import { EMAIL_WRITE_ENABLED } from '../../../lib/admin/email-api';

export function EmailTemplateEditor({ open, template, onClose, onSave }: {
  open: boolean; template?: EmailTemplate | null; onClose: () => void;
  onSave: (data: { name: string; subject: string; preheader: string; bodyHtml: string }) => void;
}) {
  const [subject, setSubject] = useState(template?.subject || '');
  const [preheader, setPreheader] = useState('');
  const [bodyHtml, setBodyHtml] = useState('<p>Bonjour {{customer_name}},</p>');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">Email Template Editor</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" className="w-full px-3 py-2 border rounded-xl text-sm" />
            <input value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Preheader" className="w-full px-3 py-2 border rounded-xl text-sm" />
            <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={10} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
            <p className="text-xs text-gray-400">Variables : {'{{customer_name}}'}, {'{{order_id}}'}, {'{{amount}}'}, {'{{invoice_url}}'}</p>
            <button type="button" disabled={!EMAIL_WRITE_ENABLED} onClick={() => { onSave({ name: template?.name || 'new', subject, preheader, bodyHtml }); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">Enregistrer v{(template?.version || 0) + 1}</button>
          </div>
          <div className="space-y-3">
            <div className="border rounded-xl p-4 bg-gray-50"><p className="text-xs text-gray-500 mb-2">Preview desktop</p><div className="bg-white border rounded p-3 text-sm"><strong>{subject}</strong><p className="text-xs text-gray-400">{preheader}</p><div dangerouslySetInnerHTML={{ __html: bodyHtml }} /></div></div>
            <div className="border rounded-2xl p-3 max-w-xs mx-auto bg-gray-900"><p className="text-xs text-gray-400 mb-2 text-center">Preview mobile</p><div className="bg-white rounded p-2 text-xs"><strong>{subject}</strong><div dangerouslySetInnerHTML={{ __html: bodyHtml }} /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
