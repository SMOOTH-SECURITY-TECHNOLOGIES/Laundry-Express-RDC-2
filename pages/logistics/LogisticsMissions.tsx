import React from 'react';
import { Icon } from '../../components/Icon';

export const LogisticsMissions: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-brand-dark flex items-center gap-2">
          <Icon name="shoppingBag" className="w-6 h-6 text-brand-blue" />
          Gestion des missions
        </h2>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Icon name="shoppingBag" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Page des missions en cours de développement</p>
      </div>
    </div>
  );
};
