import React from 'react';
import { TimeBucket } from '../../features/statistics/statistics';

interface DistributionChartProps {
  distribution: TimeBucket[];
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ distribution }) => {
  if (distribution.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-neutral-400">
        No hay datos suficientes para la distribución
      </div>
    );
  }

  const maxPercentage = Math.max(...distribution.map((b) => b.percentage), 1);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
        Distribución de Tiempos
      </div>
      <div className="flex flex-col gap-2">
        {distribution.map((bucket) => {
          const widthRatio = (bucket.percentage / maxPercentage) * 100;

          return (
            <div key={bucket.label} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 text-right shrink-0">
                {bucket.label}
              </span>
              <div className="flex-1 h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden flex items-center">
                <div
                  style={{ width: `${Math.max(widthRatio, 3)}%` }}
                  className="h-full bg-neutral-900 dark:bg-[#00FF66] rounded-full transition-all duration-300"
                />
              </div>
              <span className="w-14 text-[11px] font-mono text-neutral-400 shrink-0 text-right">
                {bucket.count} ({bucket.percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
