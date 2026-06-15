import { Icon } from "../../Icon";
import type { OrderKpis } from "../../../lib/admin/orders-types";

interface OrderKpiCardsProps {
  kpis: OrderKpis;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 60;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OrderKpiCards({ kpis }: OrderKpiCardsProps) {
  const cards = [
    {
      label: "Total commandes",
      value: kpis.total.toLocaleString(),
      change: "+12%",
      icon: "shoppingBag" as const,
      color: "#6366f1",
      bgClass: "bg-indigo-100",
      textClass: "text-indigo-600",
      sparkline: [980, 1020, 1080, 1120, 1150, 1190, 1210, 1240, 1254],
    },
    {
      label: "Commandes actives",
      value: kpis.active.toLocaleString(),
      change: "+8",
      icon: "clock" as const,
      color: "#f59e0b",
      bgClass: "bg-amber-100",
      textClass: "text-amber-600",
      sparkline: [60, 65, 68, 72, 75, 78, 80, 82, 84],
    },
    {
      label: "En collecte",
      value: kpis.inPickup.toLocaleString(),
      change: "+5",
      icon: "truck" as const,
      color: "#3b82f6",
      bgClass: "bg-blue-100",
      textClass: "text-blue-600",
      sparkline: [20, 22, 24, 25, 28, 29, 30, 31, 32],
    },
    {
      label: "En nettoyage",
      value: kpis.inCleaning.toLocaleString(),
      change: "+3",
      icon: "sparkles" as const,
      color: "#8b5cf6",
      bgClass: "bg-violet-100",
      textClass: "text-violet-600",
      sparkline: [18, 19, 20, 21, 22, 23, 24, 25, 26],
    },
    {
      label: "En livraison",
      value: kpis.inDelivery.toLocaleString(),
      change: "+2",
      icon: "mapPin" as const,
      color: "#14b8a6",
      bgClass: "bg-teal-100",
      textClass: "text-teal-600",
      sparkline: [12, 13, 14, 15, 15, 16, 17, 17, 18],
    },
    {
      label: "Litiges",
      value: kpis.disputes.toLocaleString(),
      change: "-1",
      icon: "exclamation-circle" as const,
      color: "#ef4444",
      bgClass: "bg-red-100",
      textClass: "text-red-600",
      sparkline: [8, 7, 7, 6, 6, 5, 5, 4, 4],
    },
    {
      label: "SLA global",
      value: `${kpis.slaGlobal}%`,
      change: "+2%",
      icon: "shield-check" as const,
      color: "#22c55e",
      bgClass: "bg-emerald-100",
      textClass: "text-emerald-600",
      sparkline: [90, 91, 92, 93, 93, 94, 95, 95, 96],
    },
    {
      label: "Revenus du jour",
      value: `$${kpis.revenueToday.toLocaleString()}`,
      change: "+15%",
      icon: "currencyDollar" as const,
      color: "#10b981",
      bgClass: "bg-green-100",
      textClass: "text-green-600",
      sparkline: [1800, 1900, 2000, 2100, 2200, 2300, 2350, 2400, 2450],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-full ${card.bgClass} flex items-center justify-center`}>
              <Icon name={card.icon} className={`w-5 h-5 ${card.textClass}`} />
            </div>
            <MiniSparkline data={card.sparkline} color={card.color} />
          </div>
          <p className="text-2xl font-bold text-content-primary">{card.value}</p>
          <p className="text-xs text-content-muted mt-1">{card.label}</p>
          <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">
            {card.change}
          </span>
        </div>
      ))}
    </div>
  );
}
