import { useState } from "react";
import { Icon } from "../../Icon";
import type { LiveOrder } from "../../../lib/admin/orders-types";

interface LiveOperationsBoardProps {
  orders: LiveOrder[];
  externalSearch?: string;
}

const mockOrders: LiveOrder[] = [
  {
    id: "ORD-1254",
    clientName: "Jean Mokonzi",
    clientPhone: "+243 812 345 678",
    partnerName: "Prestige Pressing",
    partnerCommune: "Gombe",
    driverName: "Koffi Amba",
    driverPhone: "+243 998 112 233",
    status: "En collecte",
    statusColor: "bg-blue-100 text-blue-700",
    amount: 15000,
    paymentMethod: "Mobile Money",
    paymentStatus: "Payé",
    eta: "14 min",
    sla: 98,
    slaColor: "text-green-600",
    commune: "Gombe",
  },
  {
    id: "ORD-1253",
    clientName: "Sarah Lukusa",
    clientPhone: "+243 823 456 789",
    partnerName: "Clean Master",
    partnerCommune: "Limete",
    driverName: "Pascal Kabongo",
    driverPhone: "+243 815 223 344",
    status: "En nettoyage",
    statusColor: "bg-violet-100 text-violet-700",
    amount: 22000,
    paymentMethod: "Cash",
    paymentStatus: "Payé",
    eta: "1h 20min",
    sla: 95,
    slaColor: "text-green-600",
    commune: "Limete",
  },
  {
    id: "ORD-1252",
    clientName: "David Tshimanga",
    clientPhone: "+243 997 334 455",
    partnerName: "Buvez Pressing",
    partnerCommune: "Bandalungwa",
    driverName: "Emmanuel Kasongo",
    driverPhone: "+243 814 556 677",
    status: "En livraison",
    statusColor: "bg-orange-100 text-orange-700",
    amount: 18500,
    paymentMethod: "Mobile Money",
    paymentStatus: "Payé",
    eta: "8 min",
    sla: 88,
    slaColor: "text-amber-600",
    commune: "Bandalungwa",
  },
  {
    id: "ORD-1251",
    clientName: "Marie Kabila",
    clientPhone: "+243 816 677 889",
    partnerName: "Lavage Express",
    partnerCommune: "Ngaliema",
    driverName: "—",
    driverPhone: "",
    status: "Créée",
    statusColor: "bg-gray-100 text-content-muted",
    amount: 12000,
    paymentMethod: "Mobile Money",
    paymentStatus: "En attente",
    eta: "—",
    sla: 72,
    slaColor: "text-red-600",
    commune: "Ngaliema",
  },
  {
    id: "ORD-1250",
    clientName: "Patrick Lumumba",
    clientPhone: "+243 818 990 011",
    partnerName: "Prestige Pressing",
    partnerCommune: "Gombe",
    driverName: "Koffi Amba",
    driverPhone: "+243 998 112 233",
    status: "Litige",
    statusColor: "bg-red-100 text-red-700",
    amount: 25000,
    paymentMethod: "Cash",
    paymentStatus: "Remboursé",
    eta: "—",
    sla: 45,
    slaColor: "text-red-600",
    commune: "Gombe",
  },
];

const statusFilters = ["Tous", "Créée", "En collecte", "En nettoyage", "En livraison", "Litige"];
const partnerFilters = ["Tous", "Prestige Pressing", "Clean Master", "Buvez Pressing", "Lavage Express"];
const chauffeurFilters = ["Tous", "Koffi Amba", "Pascal Kabongo", "Emmanuel Kasongo"];
const paiementFilters = ["Tous", "Mobile Money", "Cash"];

function formatAmount(amount: number) {
  return `$${amount.toLocaleString()}`;
}

function StatusBadge({ status, statusColor }: { status: string; statusColor: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColor}`}>
      {status}
    </span>
  );
}

function SlaIndicator({ sla, slaColor }: { sla: number; slaColor: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${
            sla >= 90 ? "bg-green-500" : sla >= 70 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${Math.min(sla, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${slaColor}`}>{sla}%</span>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <label className="block text-[10px] font-medium text-content-muted mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs font-medium text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        className="absolute right-2 bottom-1.5 w-3.5 h-3.5 text-content-faint pointer-events-none"
      />
    </div>
  );
}

export function LiveOperationsBoard({ orders, externalSearch = "" }: LiveOperationsBoardProps) {
  const [search, setSearch] = useState("");
  const combinedSearch = externalSearch || search;
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [partnerFilter, setPartnerFilter] = useState("Tous");
  const [chauffeurFilter, setChauffeurFilter] = useState("Tous");
  const [paiementFilter, setPaiementFilter] = useState("Tous");

  const displayOrders = orders.length > 0 ? orders : mockOrders;

  const filtered = displayOrders.filter((order) => {
    if (combinedSearch) {
      const q = combinedSearch.toLowerCase();
      const match =
        order.id.toLowerCase().includes(q) ||
        order.clientName.toLowerCase().includes(q) ||
        order.partnerName.toLowerCase().includes(q) ||
        order.driverName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== "Tous" && order.status !== statusFilter) return false;
    if (partnerFilter !== "Tous" && order.partnerName !== partnerFilter) return false;
    if (chauffeurFilter !== "Tous" && order.driverName !== chauffeurFilter) return false;
    if (paiementFilter !== "Tous" && order.paymentMethod !== paiementFilter) return false;
    return true;
  });

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm">
      <div className="px-6 py-4 border-b border-surface-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-content-primary">Opérations en cours</h3>
            <p className="text-xs text-content-muted">{filtered.length} commandes affichées</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-content-muted">Live</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, client, partenaire..."
            className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-surface-border rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FilterDropdown
            label="Statut"
            options={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Partenaire"
            options={partnerFilters}
            value={partnerFilter}
            onChange={setPartnerFilter}
          />
          <FilterDropdown
            label="Chauffeur"
            options={chauffeurFilters}
            value={chauffeurFilter}
            onChange={setChauffeurFilter}
          />
          <FilterDropdown
            label="Paiement"
            options={paiementFilters}
            value={paiementFilter}
            onChange={setPaiementFilter}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border-subtle">
              <th className="text-left px-6 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                ID
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Client
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Partenaire
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Chauffeur
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Statut
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Montant
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Paiement
              </th>
              <th className="text-center px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                ETA
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                SLA
              </th>
              <th className="text-right px-6 py-3 text-[10px] font-semibold text-content-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border-subtle">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-surface-muted transition-colors">
                <td className="px-6 py-3">
                  <span className="text-xs font-bold text-content-primary">{order.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-content-primary">{order.clientName}</p>
                    <p className="text-[10px] text-content-muted">{order.commune}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-content-muted">{order.partnerName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-content-muted">{order.driverName}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} statusColor={order.statusColor} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold text-content-primary">
                    {formatAmount(order.amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Icon name="credit-card" className="w-3.5 h-3.5 text-content-faint" />
                    <span className="text-xs text-content-muted">{order.paymentMethod}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs text-content-muted">{order.eta}</span>
                </td>
                <td className="px-4 py-3">
                  <SlaIndicator sla={order.sla} slaColor={order.slaColor} />
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Voir"
                      className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
                    >
                      <Icon name="search" className="w-3.5 h-3.5 text-content-muted" />
                    </button>
                    <button
                      type="button"
                      title="Truth"
                      className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
                    >
                      <Icon name="shield-check" className="w-3.5 h-3.5 text-content-muted" />
                    </button>
                    <button
                      type="button"
                      title="Chat"
                      className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
                    >
                      <Icon name="chatBubble" className="w-3.5 h-3.5 text-content-muted" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <Icon name="search" className="w-8 h-8 text-content-faint mx-auto mb-2" />
          <p className="text-xs text-content-muted">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
