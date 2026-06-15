import { Icon } from '../../Icon';
import type { GrowthDashboardSummary } from '../../../lib/admin/campaigns-types';

function fmt(value: number): string {
  return value.toLocaleString('fr-FR');
}

function money(value: number): string {
  return `${value.toLocaleString('fr-FR')} $`;
}

function severityClass(severity: string): string {
  if (severity === 'high') return 'bg-red-50 text-red-700 border-red-200';
  if (severity === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

interface GrowthEnginePanelProps {
  growth: GrowthDashboardSummary;
  onPrepareAutomation?: (key: string) => void;
  onReviewPromoRisk?: (promoCode: string) => void;
  onSuspendPromo?: (promoCode: string) => void;
}

export function GrowthEnginePanel({
  growth,
  onPrepareAutomation,
  onReviewPromoRisk,
  onSuspendPromo,
}: GrowthEnginePanelProps) {
  const metrics = [
    { label: 'Acquisition', value: fmt(growth.acquisition), icon: 'users' as const },
    { label: 'Activation', value: fmt(growth.activation), icon: 'sparkles' as const },
    { label: 'Conversion', value: fmt(growth.conversion), icon: 'badge-check' as const },
    { label: 'Rétention', value: fmt(growth.retention), icon: 'heart' as const },
    { label: 'Referral', value: fmt(growth.referral), icon: 'share' as const },
    { label: 'Revenue', value: money(growth.revenue), icon: 'wallet' as const },
  ];

  const roi = [
    { label: 'Promo', value: money(growth.roi.promoRevenue) },
    { label: 'Fidélité', value: money(growth.roi.loyaltyRevenue) },
    { label: 'Parrainage', value: money(growth.roi.referralRevenue) },
    { label: 'Remarketing', value: money(growth.roi.remarketingRevenue) },
    { label: 'Réactivation', value: money(growth.roi.reactivationRevenue) },
    { label: 'ROI estimé', value: `${growth.roi.estimatedRoi}x` },
  ];

  return (
    <section className="space-y-4" aria-label="Growth Engine">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Growth Engine</h2>
          <p className="text-xs text-slate-500">Acquisition, rétention, ROI et risques calculés depuis le backend.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <Icon name="shield-check" className="h-3.5 w-3.5" />
          {growth.source}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Icon name={metric.icon} className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-slate-950 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-[10px] text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="chartBar" className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold">Segments RFM</h3>
          </div>
          <div className="space-y-3">
            {growth.rfmSegments.slice(0, 5).map((segment) => (
              <div key={segment.segmentKey} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{segment.segment}</p>
                  <span className="text-xs font-semibold">{fmt(segment.audienceSize)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{segment.recommendedAction}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="arrow-path" className="h-5 w-5 text-violet-600" />
            <h3 className="text-sm font-semibold">Automations Growth</h3>
          </div>
          <div className="space-y-3">
            {growth.automations.map((automation) => (
              <div key={automation.key} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{automation.name}</p>
                  <span className="text-xs font-semibold">{fmt(automation.eligibleCustomers)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{automation.nextAction}</p>
                {onPrepareAutomation && (
                  <button
                    type="button"
                    onClick={() => onPrepareAutomation(automation.key)}
                    className="mt-2 rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                  >
                    Préparer workflow
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="shield" className="h-5 w-5 text-rose-600" />
            <h3 className="text-sm font-semibold">Promo Fraud</h3>
          </div>
          <div className="space-y-3">
            {growth.promoFraudRisks.length === 0 && <p className="text-xs text-slate-500">Aucun risque promo détecté.</p>}
            {growth.promoFraudRisks.map((risk) => (
              <div key={risk.promoCode} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{risk.promoCode}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(risk.severity)}`}>
                    {risk.riskScore}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{risk.recommendedAction}</p>
                {(onReviewPromoRisk || onSuspendPromo) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {onReviewPromoRisk && (
                      <button
                        type="button"
                        onClick={() => onReviewPromoRisk(risk.promoCode)}
                        className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Revue
                      </button>
                    )}
                    {onSuspendPromo && (
                      <button
                        type="button"
                        onClick={() => onSuspendPromo(risk.promoCode)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="fire" className="h-5 w-5 text-orange-600" />
            <h3 className="text-sm font-semibold">Trending Offers</h3>
          </div>
          <div className="space-y-3">
            {growth.trendingOffers.length === 0 && <p className="text-xs text-slate-500">Aucune offre tendance pour le moment.</p>}
            {growth.trendingOffers.map((offer) => (
              <div key={offer.id} className="grid grid-cols-[1fr_auto] gap-3 border-b pb-3 text-xs last:border-b-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{offer.title}</p>
                  <p className="mt-1 text-slate-500">CTR {offer.ctr}% · Conv. {offer.conversionRate}% · {money(offer.revenue)}</p>
                </div>
                <p className="font-bold text-orange-600">{offer.score}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="currencyDollar" className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold">ROI Growth</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {roi.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-[10px] text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              <p className="text-[10px]">CAC estimé</p>
              <p className="mt-1 text-sm font-bold">{money(growth.roi.estimatedCac)}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-800">
              <p className="text-[10px]">LTV estimé</p>
              <p className="mt-1 text-sm font-bold">{money(growth.roi.estimatedLtv)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
