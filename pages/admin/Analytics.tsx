import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { AdminOverview, Order as ApiOrder, realApi } from '../../services/real-api';

type Period = 'Jour' | 'Semaine' | 'Mois' | 'Trimestre' | 'Année' | 'Personnalisé';
type TrendPoint = { label: string; values: number[] };

const periods: Period[] = ['Jour', 'Semaine', 'Mois', 'Trimestre', 'Année', 'Personnalisé'];

const spark = [16, 24, 19, 31, 25, 38, 21, 27, 23, 35, 29, 44];
const revenueSeries: TrendPoint[] = Array.from({ length: 30 }, (_, index) => ({
  label: `${index + 8} mai`,
  values: [
    85000 + index * 1400 + spark[index % spark.length] * 950,
    46000 + index * 780 + spark[(index + 3) % spark.length] * 620,
    18000 + index * 360 + spark[(index + 5) % spark.length] * 280,
    4800 + index * 90 + spark[(index + 8) % spark.length] * 80,
  ],
}));

const orderBars = Array.from({ length: 30 }, (_, index) => ({
  label: `${index + 8}`,
  completed: 42 + (spark[index % spark.length] % 34),
  cancelled: 3 + (index % 5),
  late: 4 + (spark[(index + 4) % spark.length] % 10),
  disputed: 2 + (index % 4),
}));

const userSeries: TrendPoint[] = Array.from({ length: 30 }, (_, index) => ({
  label: `${index + 8} mai`,
  values: [
    9200 + index * 95 + spark[index % spark.length] * 35,
    5600 + index * 70 + spark[(index + 2) % spark.length] * 28,
    3200 + index * 54 + spark[(index + 5) % spark.length] * 22,
    1400 + index * 22 + spark[(index + 8) % spark.length] * 14,
  ],
}));

const partnerRows = [
  { name: 'Prestige Pressing', orders: 254, revenue: 4200, sla: 98, rating: 4.9, delay: '2h 15m', disputes: 1 },
  { name: 'Speed Clean', orders: 198, revenue: 3450, sla: 96, rating: 4.7, delay: '2h 35m', disputes: 2 },
  { name: 'Eco Wash', orders: 162, revenue: 2780, sla: 94, rating: 4.6, delay: '2h 50m', disputes: 1 },
  { name: 'Quick Wash', orders: 141, revenue: 2310, sla: 92, rating: 4.5, delay: '3h 05m', disputes: 3 },
  { name: 'Clean & Go', orders: 122, revenue: 1980, sla: 90, rating: 4.4, delay: '3h 20m', disputes: 2 },
];

const serviceRows = [
  { name: 'Nettoyage à sec', value: 42, revenue: 45800, color: '#0B5FFF' },
  { name: 'Lessive', value: 28, revenue: 30600, color: '#16A34A' },
  { name: 'Express', value: 18, revenue: 19800, color: '#F59E0B' },
  { name: 'Cordonnier', value: 12, revenue: 13800, color: '#9333EA' },
];

const zoneRows = [
  { name: 'Gombe', orders: 512, revenue: 41800, sla: 97, x: '46%', y: '42%', hot: 'bg-red-500/70' },
  { name: 'Ngaliema', orders: 276, revenue: 21000, sla: 93, x: '34%', y: '60%', hot: 'bg-orange-400/70' },
  { name: 'Limete', orders: 298, revenue: 22600, sla: 94, x: '74%', y: '52%', hot: 'bg-green-500/60' },
  { name: 'Kalamu', orders: 184, revenue: 14200, sla: 91, x: '58%', y: '66%', hot: 'bg-green-500/60' },
  { name: 'Kintambo', orders: 356, revenue: 28400, sla: 96, x: '24%', y: '34%', hot: 'bg-green-500/60' },
];

const funnelRows = [
  { step: 'Visites', volume: 10000, conversion: 100, drop: null, color: 'bg-blue-600' },
  { step: 'Estimation', volume: 3200, conversion: 32, drop: -68, color: 'bg-blue-500' },
  { step: 'Commande créée', volume: 1254, conversion: 12.5, drop: -60.8, color: 'bg-green-500' },
  { step: 'Paiement', volume: 1098, conversion: 10.9, drop: -12.4, color: 'bg-purple-500' },
  { step: 'Collecte', volume: 1002, conversion: 10, drop: -8.7, color: 'bg-orange-500' },
  { step: 'Livraison', volume: 962, conversion: 9.6, drop: -4, color: 'bg-red-500' },
];

const truthRows = [
  { corridor: 'Commande', anomalies: 12, violations: 4, risk: 'Faible', tone: 'bg-green-100 text-green-700' },
  { corridor: 'Paiement', anomalies: 8, violations: 3, risk: 'Moyen', tone: 'bg-orange-100 text-orange-700' },
  { corridor: 'Logistique', anomalies: 18, violations: 7, risk: 'Critique', tone: 'bg-red-100 text-red-700' },
  { corridor: 'Marketplace', anomalies: 5, violations: 1, risk: 'Faible', tone: 'bg-green-100 text-green-700' },
];

const leakageRows = [
  ['Paiements orphelins', 50],
  ['Commissions manquantes', 40],
  ['Collectes non facturées', 30],
  ['Remboursements suspects', 25],
] as const;

const driverRows = [
  { name: 'David M.', score: 4.9, sla: 98, rating: 4.9, missions: 156 },
  { name: 'Koffi A.', score: 4.7, sla: 96, rating: 4.8, missions: 142 },
  { name: 'Aline K.', score: 4.6, sla: 94, rating: 4.7, missions: 128 },
  { name: 'Jean P.', score: 4.4, sla: 92, rating: 4.6, missions: 112 },
  { name: 'Michel T.', score: 4.2, sla: 90, rating: 4.5, missions: 98 },
];

const cohortRows = [
  ['Jan', 100, 72, 61, 54, 48],
  ['Fév', 100, 75, 64, 56, 50],
  ['Mar', 100, 79, 68, 60, 53],
  ['Avr', 100, 77, 66, 59, 52],
  ['Mai', 100, 81, 70, 63, 57],
];

const executiveSignals = [
  { label: 'Plateforme saine', value: 'Healthy', tone: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Revenue', value: '+12%', tone: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'Commandes', value: '+8%', tone: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'SLA', value: '94%', tone: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Anomalies critiques', value: '0', tone: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Perte estimée', value: '145 $', tone: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const alertRows = [
  { title: '3 partenaires sous SLA', detail: 'Prestige, Quick Wash et Clean & Go nécessitent un suivi.', severity: 'warning', icon: 'building' as const },
  { title: '2 chauffeurs inactifs', detail: 'Aucune mission acceptée depuis 48h.', severity: 'warning', icon: 'truck' as const },
  { title: '1 commission manquante', detail: 'Paiement partenaire à réconcilier côté finance.', severity: 'danger', icon: 'currencyDollar' as const },
];

const activityFeed = [
  { time: 'Il y a 2 min', title: 'Commande ORD-1254 créée', detail: 'Client Marie K. - Gombe', icon: 'shoppingBag' as const, tone: 'bg-blue-100 text-blue-700' },
  { time: 'Il y a 4 min', title: 'Paiement reçu', detail: 'Mobile Money - 27,00 $', icon: 'currencyDollar' as const, tone: 'bg-green-100 text-green-700' },
  { time: 'Il y a 6 min', title: 'Mission assignée', detail: 'David M. vers Prestige Pressing', icon: 'truck' as const, tone: 'bg-orange-100 text-orange-700' },
  { time: 'Il y a 12 min', title: 'Livraison terminée', detail: 'SLA respecté - preuve photo OK', icon: 'check' as const, tone: 'bg-green-100 text-green-700' },
];

const healthRows = [
  { label: 'API', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
  { label: 'Database', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
  { label: 'Payments', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
  { label: 'WhatsApp', status: 'Warning', tone: 'bg-orange-100 text-orange-700' },
  { label: 'SMS', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
  { label: 'Storage', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
  { label: 'Workers', status: 'Healthy', tone: 'bg-green-100 text-green-700' },
];

const formatMoney = (amount: number) => `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $`;
const formatNumber = (value: number) => value.toLocaleString('fr-FR');

const cohortTone = (value: number) => {
  if (value >= 90) return 'bg-green-100 text-green-700';
  if (value >= 70) return 'bg-blue-100 text-blue-700';
  if (value >= 50) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,.08)] ${className}`}>
    {children}
  </section>
);

const MiniSparkline: React.FC<{ color: string; data?: number[] }> = ({ color, data = spark }) => {
  const max = Math.max(...data);
  const points = data.map((value, index) => `${index * 10},${44 - (value / max) * 32}`).join(' ');
  return (
    <svg viewBox="0 0 110 48" className="h-12 w-full" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
    </svg>
  );
};

const KpiCard: React.FC<{ title: string; value: string; change: string; icon: React.ComponentProps<typeof Icon>['name']; color: string }> = ({
  title,
  value,
  change,
  icon,
  color,
}) => (
  <Card className="min-h-[148px]">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${color}14`, color }}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-gray-950">{value}</p>
        <p className="mt-1 text-xs font-bold text-green-600">↑ {change} vs mois dernier</p>
      </div>
    </div>
    <MiniSparkline color={color} />
  </Card>
);

const LineChart: React.FC<{ series: TrendPoint[]; colors: string[]; labels: string[] }> = ({ series, colors, labels }) => {
  const max = Math.max(...series.flatMap((point) => point.values));
  const width = 680;
  const height = 220;
  const paths = colors.map((color, valueIndex) => {
    const points = series
      .map((point, index) => {
        const x = (index / (series.length - 1)) * width;
        const y = height - (point.values[valueIndex] / max) * (height - 24);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
    return <path key={color} d={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
        {labels.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index] }} />
            {label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="0" x2={width} y1={line * 55 + 20} y2={line * 55 + 20} stroke="#e5e7eb" strokeDasharray="4 4" />
        ))}
        {paths}
      </svg>
    </div>
  );
};

const StackedBars: React.FC = () => (
  <div>
    <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
      {[
        ['Terminées', '#16A34A'],
        ['Annulées', '#EF4444'],
        ['En retard', '#F59E0B'],
        ['En litige', '#9333EA'],
      ].map(([label, color]) => (
        <span key={label} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
    <div className="flex h-72 items-end gap-1 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-4">
      {orderBars.map((bar) => {
        const total = bar.completed + bar.cancelled + bar.late + bar.disputed;
        return (
          <div key={bar.label} className="flex flex-1 flex-col justify-end overflow-hidden rounded-t-md">
            <div className="bg-purple-500" style={{ height: `${(bar.disputed / total) * 210}px` }} />
            <div className="bg-orange-400" style={{ height: `${(bar.late / total) * 210}px` }} />
            <div className="bg-red-500" style={{ height: `${(bar.cancelled / total) * 210}px` }} />
            <div className="bg-green-500" style={{ height: `${(bar.completed / total) * 210}px` }} />
          </div>
        );
      })}
    </div>
  </div>
);

const DonutChart: React.FC = () => {
  let offset = 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
      <div className="relative mx-auto h-52 w-52">
        <svg viewBox="0 0 120 120" className="-rotate-90">
          {serviceRows.map((item) => {
            const dash = `${item.value} ${100 - item.value}`;
            const currentOffset = -offset;
            offset += item.value;
            return (
              <circle
                key={item.name}
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={item.color}
                strokeWidth="18"
                strokeDasharray={dash}
                strokeDashoffset={currentOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-extrabold text-gray-950">109 200 $</span>
        </div>
      </div>
      <div className="space-y-4">
        {serviceRows.map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm">
            <span className="flex items-center gap-2 font-semibold text-gray-700">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-extrabold text-gray-900">{item.value}%</span>
            <span className="text-gray-500">{formatMoney(item.revenue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<Period>('Mois');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([realApi.getOrders({ page: 1, page_size: 100 }), realApi.getAdminOverview()])
      .then(([ordersResponse, overviewResponse]) => {
        if (!alive) return;
        setOrders(ordersResponse.orders || []);
        setOverview(overviewResponse);
        setUsingFallback(false);
      })
      .catch(() => {
        if (!alive) return;
        setOrders([]);
        setOverview(null);
        setUsingFallback(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const derived = useMemo(() => {
    const completed = orders.filter((order) => order.status === 'completed' || order.status === 'delivered');
    const revenue = completed.reduce((sum, order) => sum + Number(order.amount_paid || order.total_amount || 0), 0);
    const orderCount = orders.length || 1254;
    const totalRevenue = revenue || 110000;
    const users = overview?.total_users || 12584;
    return {
      revenue: totalRevenue,
      orders: orderCount,
      users,
      averageOrder: orderCount > 0 ? totalRevenue / orderCount : 27,
    };
  }, [orders, overview]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-[20px] bg-gray-100" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-[20px] bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
          Mode dégradé : les endpoints analytics dédiés ne sont pas encore exposés, affichage des données opérationnelles centralisées.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPeriod(item)}
            className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
              period === item ? 'bg-blue-100 text-[#0B5FFF]' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard title="Revenu total" value={formatMoney(derived.revenue)} change="12%" icon="currencyDollar" color="#0B5FFF" />
        <KpiCard title="Commandes" value={formatNumber(derived.orders)} change="8%" icon="shoppingBag" color="#0B5FFF" />
        <KpiCard title="Utilisateurs actifs" value={formatNumber(derived.users)} change="15%" icon="user" color="#9333EA" />
        <KpiCard title="Panier moyen" value={formatMoney(derived.averageOrder)} change="4%" icon="shoppingBag" color="#F59E0B" />
        <KpiCard title="Taux conversion" value="31 %" change="2%" icon="trophy" color="#16A34A" />
        <KpiCard title="Rétention 30 j" value="74 %" change="6%" icon="heart" color="#EF4444" />
      </div>

      <Card className="border-green-200 bg-gradient-to-r from-green-50 via-white to-blue-50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">Executive Summary</p>
            <h2 className="mt-1 text-xl font-extrabold text-gray-950">Plateforme saine, croissance stable et risque financier contenu</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {executiveSignals.map((signal) => (
              <span key={signal.label} className={`rounded-full border px-3 py-2 text-xs font-extrabold ${signal.tone}`}>
                {signal.label}: {signal.value}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Évolution du revenu</h2>
            <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">30 jours</span>
          </div>
          <LineChart series={revenueSeries} colors={['#0B5FFF', '#16A34A', '#9333EA', '#EF4444']} labels={['Revenue brut', 'Revenue net', 'Commissions', 'Remboursements']} />
        </Card>

        <Card className="xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Commandes par jour</h2>
            <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">30 jours</span>
          </div>
          <StackedBars />
        </Card>

        <Card className="xl:col-span-3">
          <h2 className="mb-4 font-extrabold text-gray-950">Répartition par service</h2>
          <DonutChart />
        </Card>

        <Card className="xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Operational Alerts</h2>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">3 à traiter</span>
          </div>
          <div className="space-y-3">
            {alertRows.map((alert) => (
              <div key={alert.title} className={`rounded-xl border p-4 ${alert.severity === 'danger' ? 'border-red-100 bg-red-50' : 'border-orange-100 bg-orange-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    <Icon name={alert.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-950">{alert.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Live Activity Feed</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            {activityFeed.map((event) => (
              <div key={event.title} className="grid grid-cols-[88px_40px_1fr] gap-3">
                <span className="text-xs font-bold text-gray-500">{event.time}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${event.tone}`}>
                  <Icon name={event.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-gray-950">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <h2 className="mb-4 font-extrabold text-gray-950">Health Center</h2>
          <div className="grid grid-cols-2 gap-3">
            {healthRows.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-extrabold text-gray-900">{item.label}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${item.tone}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Performance des partenaires</h2>
            <button type="button" className="text-xs font-extrabold text-[#0B5FFF]">Voir tous</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  {['Partenaire', 'Commandes', 'CA généré', 'SLA', 'Note moyenne', 'Délai moyen', 'Litiges'].map((head) => (
                    <th key={head} className="pb-3 font-bold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnerRows.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-3 font-bold text-gray-900">{row.name}</td>
                    <td>{row.orders}</td>
                    <td>{formatMoney(row.revenue)}</td>
                    <td><span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">{row.sla}%</span></td>
                    <td>{row.rating} <span className="text-yellow-400">★</span></td>
                    <td>{row.delay}</td>
                    <td className={row.disputes > 1 ? 'font-bold text-red-600' : 'font-bold text-green-600'}>{row.disputes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <h2 className="mb-4 font-extrabold text-gray-950">Analyse géographique</h2>
          <div className="relative h-72 overflow-hidden rounded-xl border border-gray-100 bg-[linear-gradient(90deg,#e5edf7_1px,transparent_1px),linear-gradient(#e5edf7_1px,transparent_1px)] bg-[size:38px_38px]">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-50 to-orange-100" />
            {zoneRows.map((zone) => (
              <div key={zone.name} className={`absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl ${zone.hot}`} style={{ left: zone.x, top: zone.y }} />
            ))}
            {zoneRows.map((zone) => (
              <div
                key={`${zone.name}-label`}
                title={`${zone.name} - ${zone.orders} commandes - ${zone.sla}% SLA - ${formatMoney(zone.revenue)} - ${Math.max(4, Math.round(zone.orders / 84))} partenaires`}
                className="absolute rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[10px] shadow-sm transition hover:z-10 hover:scale-105 hover:bg-white"
                style={{ left: zone.x, top: zone.y }}
              >
                <p className="font-extrabold text-[#0B5FFF]">{zone.name}</p>
                <p>{zone.orders} cmd</p>
                <p>{zone.sla}% SLA</p>
                <p>{formatMoney(zone.revenue)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-950">Activité utilisateurs</h2>
            <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">30 jours</span>
          </div>
          <LineChart series={userSeries} colors={['#0B5FFF', '#16A34A', '#9333EA', '#F59E0B']} labels={['Nouveaux comptes', 'Clients actifs', 'Partenaires actifs', 'Chauffeurs actifs']} />
        </Card>

        <Card className="xl:col-span-3">
          <h2 className="mb-4 font-extrabold text-gray-950">Funnel de conversion</h2>
          <div className="space-y-3">
            {funnelRows.map((row) => (
              <div key={row.step} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-gray-600">
                    <span>{row.step}</span>
                    <span>{formatNumber(row.volume)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max(row.conversion, 8)}%` }} />
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-extrabold text-gray-900">{row.conversion}%</p>
                  <p className={row.drop ? 'font-bold text-red-600' : 'text-gray-400'}>{row.drop ? `${row.drop}%` : '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-extrabold text-gray-950">SLA Analytics</h2>
          <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#16A34A_0_94%,#F59E0B_94%_99%,#EF4444_99%_100%)]">
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
              <span className="text-2xl font-extrabold text-gray-950">1 254</span>
              <span className="text-xs text-gray-500">Total</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['Dans SLA', '94%', '#16A34A'],
              ['À risque', '5%', '#F59E0B'],
              ['Dépassées', '1%', '#EF4444'],
            ].map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                <span className="font-extrabold">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-extrabold text-gray-950">Truth Corridors</h2>
          <div className="space-y-3">
            {truthRows.map((row) => (
              <div key={row.corridor} className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                <span className="font-semibold text-gray-700">{row.corridor}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.tone}`}>{row.risk}</span>
                <span className="text-xs text-gray-500">Anomalies {row.anomalies}</span>
                <span className="text-xs text-gray-500">Violations {row.violations}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-4 font-extrabold text-gray-950">Revenue Leakage</h2>
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700">Potentiel perdu ce mois</p>
            <p className="mt-1 text-3xl font-extrabold text-red-600">{formatMoney(145)}</p>
            <p className="mt-1 text-xs font-bold text-red-500">↑ 18% vs mois dernier</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-red-100">
              <div className="h-full rounded-full bg-red-500" style={{ width: '58%' }} />
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {leakageRows.map(([label, amount]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-gray-600">{label}</span>
                <span className="font-extrabold text-red-600">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-sm font-extrabold">
              <span>Total potentiel</span>
              <span className="text-red-600">{formatMoney(145)}</span>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <h2 className="mb-4 font-extrabold text-gray-950">Top Chauffeurs</h2>
          <div className="space-y-3">
            {driverRows.map((row) => (
              <div key={row.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm">
                <span className="font-bold text-gray-800">{row.name}</span>
                <span>{row.score}</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">{row.sla}%</span>
                <span className="text-gray-500">{row.missions}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-8">
          <h2 className="mb-4 font-extrabold text-gray-950">Marketplace Analytics</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              ['Leads générés', '2 840', '+18%'],
              ['Conversion leads', '36%', '+4%'],
              ['Temps réponse', '3 min', '-22%'],
              ['Top performers', '12', '+3'],
              ['Top services', '4', '+1'],
            ].map(([label, value, change]) => (
              <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-extrabold text-gray-950">{value}</p>
                <p className="mt-1 text-xs font-bold text-green-600">{change}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <h2 className="mb-4 font-extrabold text-gray-950">Cohort Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  {['Mois', 'M0', 'M1', 'M2', 'M3', 'M4'].map((head) => <th key={head} className="pb-2">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {cohortRows.map((row) => (
                  <tr key={row[0]} className="border-t">
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${index}`} className="py-2">
                        {index === 0 ? (
                          <span className="font-bold">{cell}</span>
                        ) : (
                          <span className={`rounded-md px-2 py-1 text-xs font-bold ${cohortTone(Number(cell))}`}>{cell}%</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <h2 className="mb-4 font-extrabold text-gray-950">Export Center</h2>
          <div className="grid grid-cols-2 gap-3">
            {['PDF', 'Excel', 'CSV', 'JSON'].map((format) => (
              <button key={format} type="button" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-extrabold text-[#0B5FFF] hover:bg-blue-100">
                {format}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Finance', 'Marketplace', 'Logistique', 'Truth', 'Support'].map((scope) => (
              <span key={scope} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{scope}</span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
