import React, { useState, useMemo } from 'react';
import { Solve } from '../../types/solve';
import { calculateRollingAverages } from '../../features/statistics/averages';
import { formatTime } from '../../utils/formatTime';

interface ProgressChartProps {
  solvesRecentFirst: Solve[];
}

type RangeOption = 50 | 100 | 500 | 'all';

export const ProgressChart: React.FC<ProgressChartProps> = ({ solvesRecentFirst }) => {
  const [range, setRange] = useState<RangeOption>(50);
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    solveNum: number;
    timeMs: number;
    ao5: number | null;
    ao12: number | null;
    x: number;
    y: number;
  } | null>(null);

  // Solves in chronological order
  const chronologicalSolves = useMemo(() => {
    return [...solvesRecentFirst].reverse();
  }, [solvesRecentFirst]);

  // Filtered by range
  const filteredSolves = useMemo(() => {
    if (range === 'all' || chronologicalSolves.length <= range) {
      return chronologicalSolves;
    }
    return chronologicalSolves.slice(-range);
  }, [chronologicalSolves, range]);

  // Rolling Ao5 and Ao12
  const rollingAo5 = useMemo(() => {
    return calculateRollingAverages(filteredSolves, 5);
  }, [filteredSolves]);

  const rollingAo12 = useMemo(() => {
    return calculateRollingAverages(filteredSolves, 12);
  }, [filteredSolves]);

  if (filteredSolves.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500">
        Se necesitan al menos 2 solves para generar el gráfico
      </div>
    );
  }

  // Calculate scales
  const validTimes = filteredSolves
    .map((s) => s.finalTime)
    .filter((t): t is number => t !== null);

  if (validTimes.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500">
        No hay tiempos válidos para graficar
      </div>
    );
  }

  const minTime = Math.min(...validTimes);
  const maxTime = Math.max(...validTimes);
  // Add 5% padding
  const padding = (maxTime - minTime) * 0.08 || 1000;
  const yMin = Math.max(0, minTime - padding);
  const yMax = maxTime + padding;

  const width = 600;
  const height = 220;
  const margin = { top: 15, right: 20, bottom: 25, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (filteredSolves.length <= 1) return margin.left;
    return margin.left + (index / (filteredSolves.length - 1)) * innerWidth;
  };

  const getY = (timeMs: number | null) => {
    if (timeMs === null) return null;
    const clamped = Math.max(yMin, Math.min(yMax, timeMs));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return margin.top + innerHeight - ratio * innerHeight;
  };

  // Generate SVG path for series
  const buildPath = (data: (number | null)[]) => {
    let path = '';
    let isDrawing = false;

    data.forEach((val, i) => {
      const y = getY(val);
      if (y !== null) {
        const x = getX(i);
        if (!isDrawing) {
          path += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          isDrawing = true;
        } else {
          path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      } else {
        isDrawing = false;
      }
    });

    return path;
  };

  const rawTimes = filteredSolves.map((s) => s.finalTime);
  const rawPath = buildPath(rawTimes);
  const ao5Path = buildPath(rollingAo5);
  const ao12Path = buildPath(rollingAo12);

  // Y-axis ticks (4 ticks)
  const yTicks = [
    yMin,
    yMin + (yMax - yMin) * 0.33,
    yMin + (yMax - yMin) * 0.66,
    yMax,
  ];

  const totalSolvesCount = chronologicalSolves.length;
  const startIndex = totalSolvesCount - filteredSolves.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Range selector & legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-neutral-400 dark:bg-neutral-600 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Solves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#00FF66] rounded" />
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Ao5</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 rounded" />
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Ao12</span>
          </div>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl border border-black/[0.05] dark:border-white/[0.08]">
          {([50, 100, 500, 'all'] as RangeOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={`px-2.5 py-0.5 text-[11px] font-medium rounded-lg transition-all ${
                range === opt
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {opt === 'all' ? 'Todos' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden bg-black/[0.02] dark:bg-black/40 rounded-2xl border border-black/[0.05] dark:border-white/[0.07] p-2.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid lines */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            if (y === null) return null;
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  className="text-neutral-200 dark:text-neutral-800/80"
                />
                <text
                  x={margin.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-neutral-400 dark:fill-neutral-500 font-mono"
                >
                  {(val / 1000).toFixed(1)}s
                </text>
              </g>
            );
          })}

          {/* Raw solves line */}
          {rawPath && (
            <path
              d={rawPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-neutral-300 dark:text-neutral-700"
            />
          )}

          {/* Ao12 line */}
          {ao12Path && (
            <path
              d={ao12Path}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Ao5 line */}
          {ao5Path && (
            <path
              d={ao5Path}
              fill="none"
              stroke="#00FF66"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive invisible hover overlays for points */}
          {filteredSolves.map((s, i) => {
            const y = getY(s.finalTime);
            if (y === null) return null;
            const x = getX(i);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g key={s.id}>
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    setHoveredPoint({
                      index: i,
                      solveNum: startIndex + i + 1,
                      timeMs: s.finalTime!,
                      ao5: rollingAo5[i],
                      ao12: rollingAo12[i],
                      x,
                      y,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(10, hoveredPoint.y - 45)}px`,
            }}
            className="absolute transform -translate-x-1/2 pointer-events-none z-20 px-2 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] rounded-md shadow-md border border-neutral-700 whitespace-nowrap"
          >
            <div className="font-mono">
              #{hoveredPoint.solveNum}: {formatTime(hoveredPoint.timeMs)}
            </div>
            {hoveredPoint.ao5 && (
              <div className="text-emerald-400 text-[10px]">
                Ao5: {formatTime(hoveredPoint.ao5)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
