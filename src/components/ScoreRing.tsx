'use client';

import { getLevelColor } from '@/lib/scoring';
import { ClientLevel } from '@/lib/types';

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  level: ClientLevel;
  label?: string;
}

export function ScoreRing({ score, maxScore = 5, size = 140, level, label }: ScoreRingProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - progress);
  const color = getLevelColor(level);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1a1a2e" strokeWidth="8" />
          <circle
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out', filter: `drop-shadow(0 0 8px ${color}50)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score.toFixed(2)}</span>
          <span className="text-[10px] text-[#666] uppercase tracking-widest">{level.replace('_', ' ')}</span>
        </div>
      </div>
      {label && <span className="text-xs text-[#666]">{label}</span>}
    </div>
  );
}
