import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../Icon';

interface Mission {
  id: string;
  client: string;
  clientPhone: string;
  pickupAddress: string;
  pickupCommune: string;
  deliveryAddress: string;
  deliveryCommune: string;
  distance: number;
  amount: number;
  time: string;
  status: string;
  priority?: 'high' | 'normal' | 'low';
}

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  commune: string;
  status: string;
  occupation: number;
  avgTime: number;
}

interface MissionAssignModalProps {
  isOpen: boolean;
  mission: Mission | null;
  drivers: Driver[];
  onConfirm: (missionId: string, driverId: string) => void;
  onClose: () => void;
  formatPrice: (price: number) => string;
}

interface DriverScore {
  driver: Driver;
  distanceFromPickup: number;
  estimatedMinutes: number;
  proximityScore: number;
  ratingScore: number;
  availabilityScore: number;
  totalScore: number;
}

function computeScores(mission: Mission, drivers: Driver[]): DriverScore[] {
  return drivers
    .map((driver) => {
      const distanceFromPickup = +(Math.random() * 7 + 1).toFixed(1);
      const estimatedMinutes = Math.round(5 + distanceFromPickup * 2.5 + Math.random() * 5);

      const proximityScore = Math.max(0, 100 - distanceFromPickup * 12);
      const ratingScore = (driver.rating / 5) * 100;
      const availabilityScore = Math.max(0, 100 - driver.occupation);

      const totalScore =
        proximityScore * 0.4 + ratingScore * 0.3 + availabilityScore * 0.3;

      return {
        driver,
        distanceFromPickup,
        estimatedMinutes,
        proximityScore,
        ratingScore,
        availabilityScore,
        totalScore,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-500';
}

export const MissionAssignModal: React.FC<MissionAssignModalProps> = ({
  isOpen,
  mission,
  drivers,
  onConfirm,
  onClose,
  formatPrice,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDriverId(null);
  }, [isOpen, mission?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const scoredDrivers = useMemo(() => {
    if (!mission) return [];
    return computeScores(mission, drivers);
  }, [mission, drivers]);

  const handleConfirm = () => {
    if (mission && selectedDriverId) {
      onConfirm(mission.id, selectedDriverId);
      onClose();
    }
  };

  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-dark">
            Assigner la mission #{mission.id}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Icon name="xmark" className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium text-gray-700">{mission.pickupCommune}</span>
              </span>
              <Icon name="arrowRight" className="w-4 h-4 text-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="font-medium text-gray-700">{mission.deliveryCommune}</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{mission.distance} km</span>
              <span>{formatPrice(mission.amount)}</span>
              <span>{mission.time}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Sélectionner un chauffeur
            </h3>
            <div className="space-y-2">
              {scoredDrivers.map((sd) => {
                const isSelected = selectedDriverId === sd.driver.id;
                return (
                  <button
                    key={sd.driver.id}
                    onClick={() => setSelectedDriverId(sd.driver.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-brand-blue bg-brand-blue/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-brand-dark">
                          {sd.driver.name}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
                          <Icon name="star" className="w-3 h-3 text-yellow-400" />
                          {sd.driver.rating.toFixed(1)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-blue flex items-center justify-center">
                          <Icon name="check" className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{sd.driver.vehicle}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{sd.distanceFromPickup} km</span>
                      <span>~{sd.estimatedMinutes} min</span>
                      <span>Occupation: {sd.driver.occupation}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDriverId && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Dispatch Score
              </h4>
              {(() => {
                const sd = scoredDrivers.find((s) => s.driver.id === selectedDriverId);
                if (!sd) return null;
                return (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className={`text-lg font-bold ${scoreColor(sd.proximityScore)}`}>
                        {Math.round(sd.proximityScore)}
                      </div>
                      <div className="text-[10px] text-gray-500">Proximité 40%</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${scoreColor(sd.ratingScore)}`}>
                        {Math.round(sd.ratingScore)}
                      </div>
                      <div className="text-[10px] text-gray-500">Note 30%</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${scoreColor(sd.availabilityScore)}`}>
                        {Math.round(sd.availabilityScore)}
                      </div>
                      <div className="text-[10px] text-gray-500">Dispo 30%</div>
                    </div>
                  </div>
                );
              })()}
              <div className="text-center pt-1">
                <span className="text-xs text-gray-500">Score total: </span>
                <span className={`text-sm font-bold ${scoreColor(
                  scoredDrivers.find((s) => s.driver.id === selectedDriverId)?.totalScore ?? 0
                )}`}>
                  {Math.round(
                    scoredDrivers.find((s) => s.driver.id === selectedDriverId)?.totalScore ?? 0
                  )}
                  /100
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDriverId}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-blue/90"
          >
            Confirmer assignation
          </button>
        </div>
      </div>
    </div>
  );
};
