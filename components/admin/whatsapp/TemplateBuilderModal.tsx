import { useState } from 'react';
import { Icon } from '../../Icon';
import { WHATSAPP_WRITE_ENABLED } from '../../../lib/admin/whatsapp-api';

export function TemplateBuilderModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: { name: string; category: string; body: string }) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('utility');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex justify-between"><h3 className="font-bold">Template Builder</h3><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du template" className="w-full px-3 py-2 border rounded-xl text-sm" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm">
              <option value="marketing">Marketing</option><option value="utility">Utility</option><option value="authentication">Authentication</option>
            </select>
            <div><label className="text-xs text-gray-500">HEADER (texte)</label><input value={header} onChange={(e) => setHeader(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">BODY</label><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-xl text-sm mt-1" /></div>
            <div><label className="text-xs text-gray-500">FOOTER</label><input value={footer} onChange={(e) => setFooter(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm mt-1" /></div>
            <button type="button" disabled={!WHATSAPP_WRITE_ENABLED || !name} onClick={() => { onSave({ name, category, body }); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">Enregistrer</button>
          </div>
          <div className="bg-gray-900 rounded-3xl p-4 max-w-xs mx-auto">
            <div className="bg-[#075E54] rounded-t-2xl p-3 text-white text-sm font-medium flex items-center gap-2"><Icon name="whatsapp" className="w-4 h-4" /> Laundry Express</div>
            <div className="bg-[#ECE5DD] p-4 min-h-[200px] rounded-b-2xl">
              <div className="bg-white rounded-lg p-3 shadow text-sm max-w-[90%]">
                {header && <p className="font-bold mb-1">{header}</p>}
                <p>{body || 'Aperçu du message...'}</p>
                {footer && <p className="text-xs text-gray-400 mt-2">{footer}</p>}
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Preview mobile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
