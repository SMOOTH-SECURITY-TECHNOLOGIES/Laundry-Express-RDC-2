import {
  SubscriptionPlan,
  Partner,
  KpiCard,
} from "../../../lib/admin/subscriptions-types";
import { Icon } from "../../Icon";

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

function KpiCardComponent({ card }: { card: KpiCard }) {
  const changeColor = card.change.startsWith("+")
    ? "text-emerald-500"
    : card.change.startsWith("-")
      ? "text-red-500"
      : "text-gray-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{card.label}</span>
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon name={card.icon} className="w-5 h-5 text-gray-700" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{card.value}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${changeColor}`}>
            {card.change}
          </span>
          <MiniSparkline data={card.sparkline} color={card.color} />
        </div>
      </div>
    </div>
  );
}

const kpiCards: KpiCard[] = [
  {
    label: "Plans actifs",
    value: "3",
    change: "+0",
    icon: "chartBar",
    color: "#6366f1",
    sparkline: [40, 42, 45, 43, 47, 50, 48, 52, 55, 53],
  },
  {
    label: "Partenaires abonnés",
    value: "128",
    change: "+12%",
    icon: "users",
    color: "#8b5cf6",
    sparkline: [80, 85, 88, 92, 95, 98, 102, 108, 115, 128],
  },
  {
    label: "MRR",
    value: "$22,450",
    change: "+18%",
    icon: "currencyDollar",
    color: "#22c55e",
    sparkline: [12000, 13500, 14200, 15800, 16500, 18000, 19200, 20100, 21500, 22450],
  },
  {
    label: "ARR",
    value: "$269,400",
    change: "+18%",
    icon: "arrowRight",
    color: "#3b82f6",
    sparkline: [144000, 162000, 170400, 189600, 198000, 216000, 230400, 241200, 258000, 269400],
  },
  {
    label: "Conversion",
    value: "63%",
    change: "+5%",
    icon: "circle",
    color: "#f59e0b",
    sparkline: [45, 48, 50, 52, 54, 56, 58, 60, 62, 63],
  },
  {
    label: "Churn",
    value: "2.1%",
    change: "-0.45%",
    icon: "exclamation-circle",
    color: "#ef4444",
    sparkline: [3.2, 3.0, 2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1],
  },
];

export function SubscriptionKpiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiCards.map((card) => (
        <KpiCardComponent key={card.label} card={card} />
      ))}
    </div>
  );
}
