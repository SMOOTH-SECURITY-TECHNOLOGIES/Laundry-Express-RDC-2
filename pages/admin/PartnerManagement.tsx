import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  CatalogPartnerSummary,
  MarketplaceCompany,
  PartnerPricingSummary,
  realApi,
} from '../../services/real-api';
import { Icon } from '../../components/Icon';
import { CommissionManagement } from './CommissionManagement';

const PartnerCatalogCard: React.FC<{
  partner: CatalogPartnerSummary;
  summary?: PartnerPricingSummary | null;
}> = ({ partner, summary }) => {
  const { t } = useAppContext();

  const address = [
    partner.address_line_1,
    partner.address_line_2,
    partner.commune,
    partner.city,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">
            {partner.name}
          </h3>
          <p className="text-sm font-semibold text-brand-blue">
            {partner.business_name || partner.name}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t(`partnerTypeEnum.${partner.partner_type}`, { default: partner.partner_type })}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {address || t('partnerManagement.noAddress', { default: 'Address not available' })}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <p>{partner.status}</p>
          <p>
            {partner.is_verified
              ? t('partnerManagement.verified', { default: 'Verified' })
              : t('partnerManagement.unverified', { default: 'Unverified' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.services', { default: 'Services' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {summary?.services_count ?? partner.available_service_count}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.pricingRules', { default: 'Pricing rules' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {summary?.rules_count ?? 0}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.averagePrice', { default: 'Average price' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            ${(Number(summary?.average_price || 0)).toFixed(2)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.rating', { default: 'Rating' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {Number(partner.rating || 0).toFixed(1)} ({partner.total_reviews})
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {partner.is_featured ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            {t('partnerManagement.featured', { default: 'Featured' })}
          </span>
        ) : null}
        {partner.is_accepting_orders ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            {t('partnerManagement.acceptingOrders', { default: 'Accepting orders' })}
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {t('partnerManagement.notAcceptingOrders', { default: 'Not accepting orders' })}
          </span>
        )}
      </div>
    </div>
  );
};

const LogisticsCompanyCard: React.FC<{ company: MarketplaceCompany }> = ({ company }) => {
  const { t } = useAppContext();

  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">
            {company.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {company.email || company.phone || t('partnerManagement.noContact', { default: 'No contact details' })}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          <p>{company.status}</p>
          <p>{company.is_active ? 'active' : 'inactive'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.pickupSupport', { default: 'Pickup' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {company.supports_pickup ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.deliverySupport', { default: 'Delivery' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {company.supports_delivery ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.rating', { default: 'Rating' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {Number(company.rating_avg || 0).toFixed(1)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('partnerManagement.reviews', { default: 'Reviews' })}
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {company.rating_count}
          </p>
        </div>
      </div>
    </div>
  );
};

export const PartnerManagement: React.FC = () => {
  const { t, addNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'laundry' | 'logistics'>('laundry');
  const [partners, setPartners] = useState<CatalogPartnerSummary[]>([]);
  const [pricingSummaries, setPricingSummaries] = useState<Record<string, PartnerPricingSummary | null>>({});
  const [companies, setCompanies] = useState<MarketplaceCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [catalogPartners, marketplaceCompaniesResponse] = await Promise.all([
          realApi.getCatalogPartners(),
          realApi.getMarketplaceCompanies().catch(() => ({ companies: [], total: 0, page: 1, page_size: 20 })),
        ]);

        if (!isMounted) {
          return;
        }

        setPartners(catalogPartners || []);
        setCompanies(marketplaceCompaniesResponse.companies || []);

        const summaryEntries = await Promise.all(
          (catalogPartners || []).map(async (partner) => {
            try {
              const summary = await realApi.getPartnerPricingSummary(partner.id);
              return [partner.id, summary] as const;
            } catch {
              return [partner.id, null] as const;
            }
          })
        );

        if (isMounted) {
          setPricingSummaries(Object.fromEntries(summaryEntries));
        }
      } catch {
        if (isMounted) {
          setPartners([]);
          setCompanies([]);
          setPricingSummaries({});
          addNotification(
            t('partnerManagement.loadError', { default: 'Failed to load partner management data.' }),
            'error'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [addNotification, t]);

  const laundryStats = useMemo(() => {
    const verifiedCount = partners.filter((partner) => partner.is_verified).length;
    const featuredCount = partners.filter((partner) => partner.is_featured).length;
    const acceptingOrdersCount = partners.filter((partner) => partner.is_accepting_orders).length;

    return {
      verifiedCount,
      featuredCount,
      acceptingOrdersCount,
    };
  }, [partners]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('partnerManagement.title')}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t(
            'partnerManagement.readOnlyBackendNotice',
            {
              default:
                'This screen now reads real backend partners and logistics companies. Edit, approval, feature-toggle, and delete actions remain disabled here until their API contracts are fully aligned.',
            }
          )}
        </p>
      </div>

      <CommissionManagement />

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('laundry')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'laundry' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {t('partnerManagement.tabs.laundry')}
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logistics' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {t('partnerManagement.tabs.logistics')}
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span>{t('partnerManagement.loading', { default: 'Loading partner management data...' })}</span>
        </div>
      ) : null}

      {!isLoading && activeTab === 'laundry' ? (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('partnerManagement.activePartners', { count: partners.length })}
              </p>
              <p className="text-3xl font-bold mt-2">{partners.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('partnerManagement.verified', { default: 'Verified' })}
              </p>
              <p className="text-3xl font-bold mt-2">{laundryStats.verifiedCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('partnerManagement.featured', { default: 'Featured' })}
              </p>
              <p className="text-3xl font-bold mt-2">{laundryStats.featuredCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('partnerManagement.acceptingOrders', { default: 'Accepting orders' })}
              </p>
              <p className="text-3xl font-bold mt-2">{laundryStats.acceptingOrdersCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {t('partnerManagement.activePartners', { count: partners.length })}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-full">
                {t(
                  'partnerManagement.readOnly',
                  { default: 'Read-only until partner admin write routes are audited.' }
                )}
              </div>
            </div>

            {partners.length > 0 ? (
              <div className="space-y-4">
                {partners.map((partner) => (
                  <PartnerCatalogCard
                    key={partner.id}
                    partner={partner}
                    summary={pricingSummaries[partner.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                  {t('partnerManagement.noActivePartners')}
                </h3>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {!isLoading && activeTab === 'logistics' ? (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {t('partnerManagement.activeLogisticsPartners', { count: companies.length })}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-full">
                {t(
                  'partnerManagement.logisticsReadOnly',
                  { default: 'Logistics companies are live from marketplace; create/edit stays disabled here for now.' }
                )}
              </div>
            </div>

            {companies.length > 0 ? (
              <div className="space-y-4">
                {companies.map((company) => (
                  <LogisticsCompanyCard key={company.id} company={company} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                  {t('partnerManagement.noActiveLogisticsPartners', { default: 'No active logistics companies found.' })}
                </h3>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
