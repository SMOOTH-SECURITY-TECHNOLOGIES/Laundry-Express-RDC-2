import type { CmsSiteTreeNode } from '../../../lib/admin/cms-types';

export function CmsSiteTree({ tree }: { tree: CmsSiteTreeNode[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Arborescence du site</h3>
      <ul className="space-y-1 text-sm">
        {tree.map((node) => (
          <li key={node.id}>
            <div className="font-medium text-gray-800">{node.label} <span className="text-gray-400 font-normal">{node.slug}</span></div>
            {node.children?.map((c) => (
              <div key={c.id} className="pl-4 text-gray-600 py-0.5">↳ {c.label} <span className="text-gray-400">{c.slug}</span></div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
