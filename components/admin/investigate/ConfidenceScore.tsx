import React from 'react';

interface ConfidenceScoreProps {
  score: number;
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({ score }) => {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return { ring: '#22c55e', text: 'text-green-600', bg: 'bg-green-100', label: 'Élevé' };
    if (score >= 50) return { ring: '#eab308', text: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moyen' };
    return { ring: '#ef4444', text: 'text-red-600', bg: 'bg-red-100', label: 'Faible' };
  };

  const { ring, text, bg, label } = getColor();

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ring}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {score}%
        </text>
      </svg>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        {label}
      </span>
    </div>
  );
};
