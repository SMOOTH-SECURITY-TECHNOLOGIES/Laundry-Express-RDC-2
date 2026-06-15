import { useState, useEffect } from 'react';
import { Icon } from '../../Icon';
import type { NotificationTemplate } from '../../../lib/admin/notifications-types';

export function TemplateEditorDrawer({ template, onClose, onSave }: {
  template: NotificationTemplate | null; onClose: () => void; onSave: (name: string, body: string) => void;
}) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  useEffect(() => {
    if (template) { setName(template.name); setBody(''); }
  }, [template]);
  if (!template) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl border-l flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="font-bold">Modifier template</h2>
        <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4 flex-1 overflow-y-auto">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Corps du template..." className="w-full border rounded-xl px-3 py-2 text-sm" />
        <p className="text-xs text-gray-400">Langues: FR · EN · Lingala · Swahili</p>
      </div>
      <div className="p-5 border-t">
        <button type="button" onClick={() => { onSave(name, body); onClose(); }} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Enregistrer</button>
      </div>
    </div>
  );
}
