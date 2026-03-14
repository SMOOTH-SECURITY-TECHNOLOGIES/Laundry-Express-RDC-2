import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  barColor?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, barColor = 'bg-brand-blue', height = 300, valueFormatter }) => {
  if (!data || data.length === 0) {
    return null; // Don't render anything if there's no data
  }

  const maxValue = Math.max(...data.map(item => item.value), 0);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-brand-dark dark:text-slate-100">{title}</h2>
      <div className="flex items-end space-x-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const displayValue = valueFormatter ? valueFormatter(item.value) : item.value.toLocaleString();
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-dark text-white text-xs font-bold px-2 py-1 rounded-md pointer-events-none">
                {displayValue}
              </div>
              <div
                className={`w-full ${barColor} rounded-t-md transition-all duration-300 ease-in-out group-hover:opacity-80`}
                style={{
                  height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                }}
              >
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center break-words w-full h-8 flex items-start justify-center">
                  <span>{item.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};