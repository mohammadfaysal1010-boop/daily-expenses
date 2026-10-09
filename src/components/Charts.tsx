import React, { useState } from 'react';
import { formatBDT } from '../utils/formatters';

interface BarData {
  label: string;
  sublabel?: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export const SimpleBarChart: React.FC<{
  data: BarData[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}> = ({ data, height = 200, valuePrefix = '৳', valueSuffix = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-stone-400">
        No expense data recorded for this period
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full flex flex-col justify-end pt-6" style={{ minHeight: `${height}px` }}>
      {/* Tooltip bar */}
      <div className="h-6 mb-2 flex items-center justify-between text-xs">
        {hoveredIdx !== null ? (
          <div className="flex items-center gap-2 font-semibold text-stone-800 dark:text-stone-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{data[hoveredIdx].label}:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {valuePrefix}
              {formatBDT(data[hoveredIdx].value, { showSymbol: false })}
              {valueSuffix}
            </span>
            {data[hoveredIdx].sublabel && (
              <span className="text-stone-400 text-[11px]">({data[hoveredIdx].sublabel})</span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-stone-400">Hover or tap any bar for details</span>
        )}
      </div>

      {/* Bars container */}
      <div className="flex items-end gap-1.5 sm:gap-3 h-36 border-b border-stone-200 dark:border-stone-800 pb-1">
        {data.map((item, idx) => {
          const heightPercent = Math.max(4, Math.round((item.value / maxValue) * 100));
          const isHovered = hoveredIdx === idx;
          const barColor = item.color || '#10b981';

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(idx)}
            >
              <div
                className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 relative ${
                  isHovered ? 'brightness-110 shadow-lg' : 'opacity-90 hover:opacity-100'
                }`}
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: barColor,
                }}
              >
                {/* Value top tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none">
                    {valuePrefix}
                    {formatBDT(item.value, { showSymbol: false })}
                  </div>
                )}
              </div>
              <div className="w-full text-center mt-2 text-[10px] font-semibold text-stone-500 dark:text-stone-400 truncate">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CategoryProgressList: React.FC<{
  items: {
    name: string;
    amount: number;
    color?: string;
    count?: number;
    percentage: number;
  }[];
}> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-stone-400">
        No category transactions found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((cat, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color || '#10b981' }}
              />
              <span className="font-semibold text-stone-800 dark:text-stone-200">{cat.name}</span>
              {cat.count !== undefined && (
                <span className="text-[10px] text-stone-400">({cat.count} tx)</span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {formatBDT(cat.amount)}
              </span>
              <span className="text-[11px] text-stone-400 w-9 text-right font-sans">
                {cat.percentage}%
              </span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(1, cat.percentage))}%`,
                backgroundColor: cat.color || '#10b981',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Donut / Pie chart
export const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="w-40 h-40 rounded-full border-4 border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-xs text-stone-400">
        No data
      </div>
    );
  }

  let cumulativeAngle = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 24;

  const slices = data.map((slice) => {
    const angle = (slice.value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // SVG arc calculation
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = (((startAngle + angle) - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData =
      angle >= 359.9
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    return {
      ...slice,
      pathData,
      percentage: Math.round((slice.value / total) * 100),
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.pathData}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Total</span>
        <span className="text-xs font-black text-stone-900 dark:text-stone-100">
          {formatBDT(total)}
        </span>
      </div>
    </div>
  );
};
