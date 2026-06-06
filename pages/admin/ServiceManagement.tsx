import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  CatalogResponse,
  CatalogServiceCategory,
  CatalogServiceType,
  realApi,
} from '../../services/real-api';
import { Icon } from '../../components/Icon';

const CatalogCategoryCard: React.FC<{ category: CatalogServiceCategory }> = ({ category }) => {
  const { t } = useAppContext();

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-brand-dark dark:text-slate-100">{category.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{category.slug}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {category.description || t('serviceManagement.noDescription', { default: 'No description available.' })}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            category.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
          }`}
        >
          {category.is_active
            ? t('serviceManagement.active', { default: 'Active' })
            : t('serviceManagement.inactive', { default: 'Inactive' })}
        </span>
      </div>
    </div>
  );
};

const CatalogTypeCard: React.FC<{ serviceType: CatalogServiceType }> = ({ serviceType }) => {
  const { t } = useAppContext();

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-brand-dark dark:text-slate-100">{serviceType.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{serviceType.slug}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            {serviceType.description || t('serviceManagement.noDescription', { default: 'No description available.' })}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            serviceType.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
          }`}
        >
          {serviceType.is_active
            ? t('serviceManagement.active', { default: 'Active' })
            : t('serviceManagement.inactive', { default: 'Inactive' })}
        </span>
      </div>
    </div>
  );
};

export const ServiceManagement: React.FC = () => {
  const { t, addNotification } = useAppContext();
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    realApi
      .getCatalog()
      .then((response) => {
        if (isMounted) {
          setCatalog(response);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCatalog({ service_categories: [], service_types: [] });
          addNotification(
            t('serviceManagement.loadError', { default: 'Failed to load service catalog.' }),
            'error'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [addNotification, t]);

  const activeCounts = useMemo(() => {
    const categories = catalog?.service_categories || [];
    const serviceTypes = catalog?.service_types || [];

    return {
      categories: categories.filter((item) => item.is_active).length,
      serviceTypes: serviceTypes.filter((item) => item.is_active).length,
    };
  }, [catalog]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t('serviceManagement.title')}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t(
              'serviceManagement.readOnlyBackendNotice',
              {
                default:
                  'This screen now reflects the real backend catalog. Create and edit actions stay disabled until the legacy modal is realigned with catalog categories and service types.',
              }
            )}
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-full">
          {t('serviceManagement.readOnly', { default: 'Read-only' })}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700 flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span>{t('serviceManagement.loading', { default: 'Loading service catalog...' })}</span>
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('serviceManagement.totalCategories', { default: 'Categories' })}
              </p>
              <p className="text-3xl font-bold mt-2">{catalog?.service_categories.length || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('serviceManagement.activeCategories', { default: 'Active categories' })}
              </p>
              <p className="text-3xl font-bold mt-2">{activeCounts.categories}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('serviceManagement.totalTypes', { default: 'Service types' })}
              </p>
              <p className="text-3xl font-bold mt-2">{catalog?.service_types.length || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('serviceManagement.activeTypes', { default: 'Active types' })}
              </p>
              <p className="text-3xl font-bold mt-2">{activeCounts.serviceTypes}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">
              {t('serviceManagement.platformCategories', { default: 'Platform service categories' })}
            </h2>
            <div className="space-y-4">
              {(catalog?.service_categories || []).length > 0 ? (
                catalog!.service_categories.map((category) => (
                  <CatalogCategoryCard key={category.id} category={category} />
                ))
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                  <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {t('serviceManagement.noCategories', { default: 'No service categories found.' })}
                  </h3>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">
              {t('serviceManagement.platformServiceTypes', { default: 'Platform service types' })}
            </h2>
            <div className="space-y-4">
              {(catalog?.service_types || []).length > 0 ? (
                catalog!.service_types.map((serviceType) => (
                  <CatalogTypeCard key={serviceType.id} serviceType={serviceType} />
                ))
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                  <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                    {t('serviceManagement.noServiceTypes', { default: 'No service types found.' })}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
