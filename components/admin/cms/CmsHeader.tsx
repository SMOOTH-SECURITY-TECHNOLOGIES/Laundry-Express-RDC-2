import { Icon } from '../../Icon';

export function CmsHeader({ search, onSearchChange, onRefresh, onNewPage }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onNewPage: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages & CMS</h1>
          <p className="text-sm text-gray-500">Gestion du contenu public • SEO • Médias • Blog</p>
          <button type="button" onClick={onNewPage} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">
            <Icon name="plus" className="w-4 h-4" /> Nouvelle page
          </button>
        </div>
        <div className="flex flex-col gap-2 w-full xl:max-w-md">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher une page, section, FAQ..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm" />
          </div>
          <button type="button" onClick={onRefresh} className="self-end px-4 py-2 border rounded-xl text-sm">Actualiser</button>
        </div>
      </div>
    </div>
  );
}
