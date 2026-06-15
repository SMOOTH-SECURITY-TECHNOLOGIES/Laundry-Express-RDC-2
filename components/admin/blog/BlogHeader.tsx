import { Icon } from '../../Icon';

export function BlogHeader({ search, onSearchChange, onRefresh, onNewPost }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onNewPost: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-gray-500">SEO • Content Marketing • Acquisition organique • Leads</p>
          <button type="button" onClick={onNewPost} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">
            <Icon name="plus" className="w-4 h-4" /> Nouvel article
          </button>
        </div>
        <div className="flex flex-col gap-2 xl:max-w-md w-full">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher un article..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm" />
          </div>
          <button type="button" onClick={onRefresh} className="self-end px-4 py-2 border rounded-xl text-sm">Actualiser</button>
        </div>
      </div>
    </div>
  );
}
