import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';
import { DayWorkingHours, Partner, WorkingHours } from '../types';

// Enhanced type-safe day mapping
const dayMap = {
  0: 'sunday',
  1: 'monday', 
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
} as const;

type DayKey = keyof typeof dayMap;
type DayName = typeof dayMap[DayKey];

// Helper functions
const getDayWorkingHours = (partner: Partner, date: Date): DayWorkingHours | null => {
  const dayKey = dayMap[date.getDay() as DayKey];
  return partner.workingHours?.[dayKey] || null;
};

const isPartnerUnavailable = (partner: Partner, date: Date): { isUnavailable: boolean; period?: { startDate: string; endDate: string } } => {
  if (!partner.unavailability) return { isUnavailable: false };
  
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  const unavailablePeriod = partner.unavailability.find(period => {
    const startDate = new Date(period.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(period.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    return selectedDate >= startDate && selectedDate <= endDate;
  });
  
  return { 
    isUnavailable: !!unavailablePeriod,
    period: unavailablePeriod
  };
};

const calculateMinTime = (dayHours: DayWorkingHours, selectedDate: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // If not today, use normal opening time
  if (selectedDate.getTime() !== today.getTime()) {
    return dayHours.open;
  }
  
  // If today, ensure pickup is at least 1 hour from now
  const now = new Date();
  const earliestPickup = new Date(now.getTime() + 60 * 60 * 1000);
  const earliestPickupTime = `${String(earliestPickup.getHours()).padStart(2, '0')}:${String(earliestPickup.getMinutes()).padStart(2, '0')}`;
  
  return earliestPickupTime > dayHours.open ? earliestPickupTime : dayHours.open;
};

const validateDate = (selectedDate: string): boolean => {
  const date = new Date(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

const formatPickupTime = (date: string, time: string): string => {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  return `${formattedDate} à ${time}`;
};

// Error message helper
const getErrorMessage = (
  errorType: 'noWorkingHours' | 'unavailable' | 'closed' | 'tooLate' | 'unknown', 
  partner?: Partner,
  period?: { startDate: string; endDate: string }
): string => {
  const errorMessages = {
    noWorkingHours: 'schedulePicker.partnerHoursUnavailable',
    unavailable: 'schedulePicker.partnerUnavailable',
    closed: 'schedulePicker.partnerClosed',
    tooLate: 'schedulePicker.tooLateToday',
    unknown: 'schedulePicker.unknownError',
  };
  
  const messageKey = errorMessages[errorType];
  
  if (errorType === 'unavailable' && period) {
    return `schedulePicker.partnerUnavailable`; // The interpolation will happen in the component with t()
  }
  
  return messageKey;
};

export const SchedulePicker: React.FC = () => {
  const { updateOrderDraft, orderDraft, t } = useAppContext();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [availabilityError, setAvailabilityError] = useState('');
  const [timeConstraints, setTimeConstraints] = useState({ min: '00:00', max: '23:59' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoized time options based on constraints
  const timeOptions = useMemo(() => {
    if (!timeConstraints.min || !timeConstraints.max) return [];
    
    const options: string[] = [];
    const [minHour, minMinute] = timeConstraints.min.split(':').map(Number);
    const [maxHour, maxMinute] = timeConstraints.max.split(':').map(Number);
    
    let currentHour = minHour;
    let currentMinute = minMinute;
    
    while (currentHour < maxHour || (currentHour === maxHour && currentMinute <= maxMinute)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      options.push(timeString);
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }
    
    return options;
  }, [timeConstraints]);

  // Handle date change with validation
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (validateDate(newDate)) {
      setDate(newDate);
    }
  }, []);

  // Handle time change
  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  }, []);

  // Main availability effect
  useEffect(() => {
    const partner = orderDraft.partner;
    
    if (!partner?.workingHours) {
      setAvailabilityError(t('schedulePicker.partnerHoursUnavailable'));
      return;
    }

    setIsLoading(true);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Check unavailability
    const { isUnavailable, period } = isPartnerUnavailable(partner, selectedDate);
    if (isUnavailable && period) {
      setAvailabilityError(t('schedulePicker.partnerUnavailable', { 
        start: new Date(period.startDate).toLocaleDateString('fr-FR'), 
        end: new Date(period.endDate).toLocaleDateString('fr-FR')
      }));
      setIsLoading(false);
      return;
    }

    // Check working hours
    const dayHours = getDayWorkingHours(partner, selectedDate);
    if (!dayHours || dayHours.isClosed) {
      setAvailabilityError(t('schedulePicker.partnerClosed'));
      setIsLoading(false);
      return;
    }

    const minTime = calculateMinTime(dayHours, selectedDate);
    
    // Check if it's too late for today
    if (minTime >= dayHours.close) {
      setAvailabilityError(t('schedulePicker.tooLateToday'));
      setIsLoading(false);
      return;
    }
    
    setAvailabilityError('');
    setTimeConstraints({ min: minTime, max: dayHours.close });
    
    // Adjust current time selection if needed
    setTime(currentTime => {
      if (currentTime < minTime) return minTime;
      if (currentTime > dayHours.close) return minTime;
      return currentTime;
    });
    
    setIsLoading(false);
  }, [date, orderDraft.partner, t]);

  // Update order draft effect
  useEffect(() => {
    if (availabilityError) {
      updateOrderDraft({ pickupTime: undefined });
    } else {
      updateOrderDraft({ pickupTime: formatPickupTime(date, time) });
    }
  }, [date, time, availabilityError, updateOrderDraft]);

  // Get minimum date for the date picker (today)
  const minDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">{t('schedulePicker.schedulePickup')}</h2>
      <div className="max-w-sm mx-auto space-y-6">
        {/* Date Picker */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('schedulePicker.pickupDate')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon 
                name="calendar" 
                className="h-5 w-5 text-gray-400 dark:text-slate-400" 
              />
            </div>
            <input
              type="date"
              id="date"
              value={date}
              onChange={handleDateChange}
              min={minDate}
              required
              disabled={isLoading}
              className="w-full pl-10 p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed transition-colors duration-200"
            />
          </div>
        </div>

        {/* Time Picker */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('schedulePicker.pickupTime')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon 
                name="clock" 
                className={`h-5 w-5 ${isLoading ? 'text-gray-300 dark:text-slate-500' : 'text-gray-400 dark:text-slate-400'}`} 
              />
            </div>
            <input
              type="time"
              id="time"
              value={time}
              onChange={handleTimeChange}
              required
              min={timeConstraints.min}
              max={timeConstraints.max}
              list="timeOptions"
              disabled={!!availabilityError || isLoading}
              className="w-full pl-10 p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-100 transition-colors duration-200"
            />
            {/* Time suggestions dropdown */}
            <datalist id="timeOptions">
              {timeOptions.map((timeOption) => (
                <option key={timeOption} value={timeOption} />
              ))}
            </datalist>
          </div>
          
          {/* Time constraints hint */}
          {!availabilityError && !isLoading && (
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {t('schedulePicker.availableBetween', { 
                min: timeConstraints.min, 
                max: timeConstraints.max 
              })}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">
              {t('schedulePicker.checkingAvailability')}
            </span>
          </div>
        )}

        {/* Error Message */}
        {availabilityError && !isLoading && (
          <div 
            role="alert"
            aria-live="polite"
            className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-sm text-yellow-800 dark:text-yellow-300 rounded-r-lg"
          >
            <div className="flex items-start">
              <Icon name="warning" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>{availabilityError}</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {!availabilityError && !isLoading && (
          <div 
            role="status"
            aria-live="polite"
            className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 text-sm text-green-800 dark:text-green-300 rounded-r-lg"
          >
            <div className="flex items-start">
              <Icon name="check" className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p>
                {t('schedulePicker.pickupScheduledFor', { 
                  datetime: formatPickupTime(date, time) 
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};