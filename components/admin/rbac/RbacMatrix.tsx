import type { RbacMatrixCell } from '../../../lib/admin/rbac-types';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', finance: 'Finance', support: 'Support',
  marketing: 'Marketing', partenaire: 'Partenaire', chauffeur: 'Chauffeur', moderateur: 'Modérateur',
};

function Dot({ level }: { level: string }) {
  if (level === 'allowed') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" title="Autorisé" />;
  if (level === 'restricted') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" title="Restreint" />;
  return <span className="text-gray-300">—</span>;
}

export function RbacMatrix({ matrix, modules, roleSlugs, compact }: {
  matrix: RbacMatrixCell[]; modules: string[]; roleSlugs: string[];
  compact?: boolean;
}) {
  const cell = (role: string, module: string) => matrix.find((c) => c.roleSlug === role && c.module === module);
  const displayModules = compact ? modules.slice(0, 10) : modules;
  const displayRoles = compact ? roleSlugs.slice(0, 6) : roleSlugs;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Matrice des permissions{compact ? ' (aperçu)' : ''}</h3>
        {compact && <span className="text-xs text-blue-600 cursor-pointer">Voir la matrice complète →</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr><th className="px-3 py-2 text-left sticky left-0 bg-gray-50">Rôle</th>{displayModules.map((m) => <th key={m} className="px-2 py-2 text-center whitespace-nowrap">{m}</th>)}</tr>
          </thead>
          <tbody>{displayRoles.map((role) => (
            <tr key={role} className="border-t">
              <td className="px-3 py-2 font-medium whitespace-nowrap sticky left-0 bg-white">{ROLE_LABELS[role] || role}</td>
              {displayModules.map((mod) => {
                const c = cell(role, mod);
                return <td key={mod} className="px-2 py-2 text-center"><Dot level={c?.accessLevel || 'forbidden'} /></td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t flex gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Autorisé</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Restreint</span>
        <span className="flex items-center gap-1"><span className="text-gray-300">—</span> Interdit</span>
      </div>
    </div>
  );
}
