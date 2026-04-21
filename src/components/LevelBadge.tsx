'use client';

interface LevelBadgeProps {
  level: string;
}

const config: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  STRATEGIC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  PREFERRED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  REGULAR: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  HIGH_RISK: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
};

export function LevelBadge({ level }: LevelBadgeProps) {
  const c = config[level] || config.REGULAR;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {level.replace('_', ' ')}
    </span>
  );
}
