import React, { useMemo } from 'react';
import { Icon } from '../Icon';
import { Partner } from '../../types';

interface PickupSlotCardProps {
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  partner?: Partner | null;
}

function generateSlots(): { label: string; time: string; date: string; disabled: boolean }[] {
  const now = new Date();
  const currentHour = now.getHours();
  const slots: { label: string; time: string; date: string; disabled: boolean }[] = [];

  const timeRanges = [
    { start: 8, end: 10, label: '08h00 - 10h00' },
    { start: 10, end: 12, label: '10h00 - 12h00' },
    { start: 14, end: 16, label: '14h00 - 16h00' },
    { start: 16, end: 18, label: '16h00 - 18h00' },
    { start: 18, end: 20, label: '18h00 - 20h00' },
  ];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    const dayName = dayOffset === 0 ? "Aujourd'hui" : dayOffset === 1 ? 'Demain' : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

    for (const range of timeRanges) {
      const isToday = dayOffset === 0;
      const disabled = isToday && currentHour >= range.end;
      slots.push({
        label: dayName,
        time: range.label,
        date: `${dayName} ${range.label}`,
        disabled,
      });
    }
  }

  return slots;
}

export const PickupSlotCard: React.FC<PickupSlotCardProps> = ({ selectedSlot, onSlotSelect }) => {
  const slots = useMemo(() => generateSlots(), []);

  const visibleSlots = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return slots.filter((slot) => !slot.disabled).slice(0, 8);
  }, [slots]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
          <Icon name="calendar" className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Créneau de ramassage
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Quand devons-nous passer ?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {visibleSlots.map((slot) => {
          const isSelected = selectedSlot === slot.date;
          return (
            <button
              key={slot.date}
              type="button"
              onClick={() => onSlotSelect(slot.date)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/20'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-brand-blue/50 hover:bg-brand-blue/5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-brand-blue rounded-full flex items-center justify-center">
                  <Icon name="check" className="w-3 h-3 text-white" />
                </div>
              )}
              <p className={`text-xs font-semibold ${isSelected ? 'text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}>
                {slot.label}
              </p>
              <p className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-brand-blue' : 'text-gray-900 dark:text-white'}`}>
                {slot.time}
              </p>
              <span className="inline-block mt-1.5 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                Gratuit
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <Icon name="clock" className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Le chauffeur vous contactera avant son arrivée.
        </p>
      </div>
    </div>
  );
};
