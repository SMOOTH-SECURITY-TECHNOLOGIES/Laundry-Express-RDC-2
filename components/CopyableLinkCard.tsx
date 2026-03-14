import React from 'react';
import { Icon } from './Icon';

interface CopyableLinkCardProps {
    title: string;
    description: string;
    value: string;
    buttonText: string;
    buttonColorClass?: string;
    onCopy: () => void;
}

export const CopyableLinkCard: React.FC<CopyableLinkCardProps> = ({
    title,
    description,
    value,
    buttonText,
    buttonColorClass = 'bg-brand-blue',
    onCopy,
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{description}</p>
            <div className="flex items-center space-x-2 p-3 border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/50">
                <input
                    type="text"
                    readOnly
                    value={value}
                    className="flex-grow bg-transparent outline-none text-slate-700 dark:text-slate-200 text-sm font-mono"
                    aria-label={title}
                />
                <button
                    onClick={onCopy}
                    className={`px-3 py-1.5 text-white text-sm font-semibold rounded-md hover:bg-opacity-90 flex items-center space-x-2 ${buttonColorClass}`}
                >
                    <Icon name="share" className="w-4 h-4" />
                    <span>{buttonText}</span>
                </button>
            </div>
        </div>
    );
};
