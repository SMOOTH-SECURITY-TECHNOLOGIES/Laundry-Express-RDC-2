import React from 'react';
import { Icon } from '../../components/Icon';

export const DispatchMap: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
          <Icon name="map" className="w-5 h-5 text-brand-blue" />
          Carte de dispatch
        </h2>
      </div>
      <div className="relative w-full h-64 rounded-xl bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon name="mapPin" className="w-10 h-10 text-brand-blue mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">Carte interactive</p>
            <p className="text-xs text-gray-400">Kinshasa, RDC</p>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Icon name="plus" className="w-4 h-4 text-gray-600" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Icon name="minus" className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="px-2 py-1 rounded-lg bg-white shadow-sm text-xs font-bold text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-blue" /> 18 actifs
          </span>
          <span className="px-2 py-1 rounded-lg bg-white shadow-sm text-xs font-bold text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> 4 en attente
          </span>
        </div>
      </div>
    </div>
  );
};

export default DispatchMap;
