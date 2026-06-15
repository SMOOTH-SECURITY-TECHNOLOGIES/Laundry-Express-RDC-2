import { SubscriptionPlan } from "../../../lib/admin/subscriptions-types";
import { Icon } from "../../Icon";

const badgeColorMap: Record<string, string> = {
  "Populaire": "bg-blue-100 text-blue-700",
  "Recommandé": "bg-violet-100 text-violet-700",
  "Premium": "bg-amber-100 text-amber-700",
};

const plans: SubscriptionPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    tier: "essential",
    badge: "Populaire",
    price: 29,
    interval: "monthly",
    description: "Plan de base pour les petites entreprises",
    features: [
      "Gestion des commandes",
      "Tableau de bord de base",
      "Support par email",
      "Rapports mensuels",
    ],
    disabledFeatures: ["Multi-utilisateurs", "API accès"],
    partnerCount: 45,
  },
  {
    id: "professionnel",
    name: "Professionnel",
    tier: "professional",
    badge: "Recommandé",
    price: 79,
    interval: "monthly",
    description: "Plan intermédiaire pour les entreprises en croissance",
    features: [
      "Gestion des commandes",
      "Tableau de bord avancé",
      "Support prioritaire",
      "Rapports hebdomadaires",
      "Multi-utilisateurs (5)",
    ],
    disabledFeatures: ["API accès"],
    partnerCount: 52,
  },
  {
    id: "entreprise",
    name: "Entreprise",
    tier: "enterprise",
    badge: "Premium",
    price: 199,
    interval: "monthly",
    description: "Plan complet pour les grandes entreprises",
    features: [
      "Gestion des commandes",
      "Tableau de bord personnalisé",
      "Support dédié 24/7",
      "Rapports en temps réel",
      "Multi-utilisateurs illimité",
      "API accès complet",
    ],
    disabledFeatures: [],
    partnerCount: 31,
  },
];

function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        {plan.badge && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColorMap[plan.badge] ?? "bg-gray-100 text-gray-700"}`}>
            {plan.badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
        <span className="text-sm text-gray-500">/mois</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
        {plan.disabledFeatures.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Icon name="xmark" className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-sm text-gray-400">{feature}</span>
          </li>
        ))}
      </ul>

      <button className="mt-auto w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        Modifier plan
      </button>
    </div>
  );
}

export function PlanCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
