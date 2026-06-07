import React, { useState } from 'react';
import { Icon } from '../../components/Icon';

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        enabled ? 'bg-brand-blue' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export const LogisticsSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    newMission: true,
    delay: true,
    payment: false,
    driverOffline: true,
    dailyReport: true,
    weeklyReport: false,
  });

  const [dispatchStart, setDispatchStart] = useState('06:00');
  const [dispatchEnd, setDispatchEnd] = useState('22:00');
  const [coverageRadius, setCoverageRadius] = useState('15');
  const [delayThreshold, setDelayThreshold] = useState('15');
  const [idleThreshold, setIdleThreshold] = useState('30');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-dark">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez les options de la plateforme logistique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Icon name="bell" className="h-5 w-5 text-brand-blue" />
            </span>
            <h2 className="text-lg font-bold text-brand-dark">Notifications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <Toggle
              label="Nouvelle mission"
              description="Recevoir une alerte pour chaque nouvelle mission"
              enabled={notifications.newMission}
              onToggle={() => setNotifications(p => ({ ...p, newMission: !p.newMission }))}
            />
            <Toggle
              label="Retards"
              description="Alerte quand une mission est en retard de plus de 10 min"
              enabled={notifications.delay}
              onToggle={() => setNotifications(p => ({ ...p, delay: !p.delay }))}
            />
            <Toggle
              label="Paiements échoués"
              description="Notification en cas de problème de paiement"
              enabled={notifications.payment}
              onToggle={() => setNotifications(p => ({ ...p, payment: !p.payment }))}
            />
            <Toggle
              label="Chauffeur hors ligne"
              description="Alerte quand un chauffeur actif se déconnecte"
              enabled={notifications.driverOffline}
              onToggle={() => setNotifications(p => ({ ...p, driverOffline: !p.driverOffline }))}
            />
            <Toggle
              label="Rapport quotidien"
              description="Recevoir le résumé chaque soir"
              enabled={notifications.dailyReport}
              onToggle={() => setNotifications(p => ({ ...p, dailyReport: !p.dailyReport }))}
            />
            <Toggle
              label="Rapport hebdomadaire"
              description="Recevoir l'analyse chaque lundi"
              enabled={notifications.weeklyReport}
              onToggle={() => setNotifications(p => ({ ...p, weeklyReport: !p.weeklyReport }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50">
              <Icon name="clock" className="h-5 w-5 text-green-600" />
            </span>
            <h2 className="text-lg font-bold text-brand-dark">Horaires de dispatch</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Heure de début</label>
              <input
                type="time"
                value={dispatchStart}
                onChange={(e) => setDispatchStart(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Heure de fin</label>
              <input
                type="time"
                value={dispatchEnd}
                onChange={(e) => setDispatchEnd(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
            <p className="text-xs text-gray-400">Les missions seront automatiquement assignées pendant ces heures</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
              <Icon name="mapPin" className="h-5 w-5 text-orange-600" />
            </span>
            <h2 className="text-lg font-bold text-brand-dark">Zone de couverture</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rayon maximal (km)</label>
              <input
                type="number"
                value={coverageRadius}
                onChange={(e) => setCoverageRadius(e.target.value)}
                min="5"
                max="50"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Communes couvertes :</p>
              <div className="flex flex-wrap gap-2">
                {['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete', 'Limete', 'Ngaliema'].map(commune => (
                  <span key={commune} className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-medium">
                    {commune}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <Icon name="warning" className="h-5 w-5 text-red-500" />
            </span>
            <h2 className="text-lg font-bold text-brand-dark">Seuils d'alerte</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Retard maximum (min)</label>
              <input
                type="number"
                value={delayThreshold}
                onChange={(e) => setDelayThreshold(e.target.value)}
                min="5"
                max="60"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Inactivité chauffeur (min)</label>
              <input
                type="number"
                value={idleThreshold}
                onChange={(e) => setIdleThreshold(e.target.value)}
                min="10"
                max="120"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
            <p className="text-xs text-gray-400">Une alerte sera déclenchée cuando ces seuils seront dépassés</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90">
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default LogisticsSettings;
