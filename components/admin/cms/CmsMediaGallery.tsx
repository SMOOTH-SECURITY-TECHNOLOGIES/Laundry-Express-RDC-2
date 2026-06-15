import type { CmsMedia } from '../../../lib/admin/cms-types';

export function CmsMediaGallery({ media }: { media: CmsMedia[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Médias récents</h3>
      {media.length === 0 ? <p className="text-sm text-gray-400">Aucun média uploadé.</p> : (
        <div className="flex gap-3 overflow-x-auto">
          {media.map((m) => (
            <div key={m.id} className="shrink-0 w-24">
              <div className="w-24 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt={m.filename} className="w-full h-full object-cover" /> : 'IMG'}
              </div>
              <p className="text-[10px] truncate mt-1">{m.filename}</p>
              {m.size && <p className="text-[10px] text-gray-400">{(m.size / 1024).toFixed(0)} Ko</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
