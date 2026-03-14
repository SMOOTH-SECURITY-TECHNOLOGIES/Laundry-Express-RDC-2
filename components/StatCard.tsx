import React from 'react';
import { Icon } from './Icon';

// This is a union of all icons used across different dashboards' StatCards
// FIX: Add 'bell' to the union type for IconName to support its usage in StatCards.
type IconName = 'logo' | 'wash' | 'shirt' | 'user' | 'users' | 'check' | 'truck' | 'currencyDollar' | 'sparkles' | 'lifebuoy' | 'pencil' | 'calendar' | 'bell';


interface StatCardProps {
  title: string;
  value: string | number;
  iconName: IconName;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, iconName }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 flex items-center space-x-4">
        <div className="bg-brand-lightblue/50 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-lightblue rounded-full p-3">
            <Icon name={iconName} className="w-8 h-8"/>
        </div>
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-brand-dark dark:text-slate-100">{value}</p>
        </div>
    </div>
);
