'use client';

import React from 'react';

interface Holder {
  name: string;
  percentage: number;
  color: string;
}

const TopHoldersPieChart = () => {
  const holders: Holder[] = [
    { name: 'Holder 1', percentage: 35, color: '#111827' },
    { name: 'Holder 2', percentage: 25, color: '#374151' },
    { name: 'Holder 3', percentage: 15, color: '#6B7280' },
    { name: 'Holder 4', percentage: 12, color: '#9CA3AF' },
    { name: 'Others', percentage: 13, color: '#E5E7EB' },
  ];

  const size = 80;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let cumulativePercentage = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {holders.map((holder, index) => {
            const strokeDasharray = `${(holder.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            
            cumulativePercentage += holder.percentage;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={holder.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      </div>
      
      <div className="flex-1">
        <div className="space-y-1">
          {holders.slice(0, 3).map((holder, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: holder.color }}
              />
              <span className="text-gray-600">
                {holder.percentage}%
              </span>
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-1">
            +{holders.slice(3).length} more
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopHoldersPieChart;

