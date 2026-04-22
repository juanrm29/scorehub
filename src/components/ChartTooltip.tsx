'use client';

import { Info } from 'lucide-react';
import { ReactNode } from 'react';

export function ChartTooltip({ content }: { content: ReactNode }) {
  return (
    <div className="relative group cursor-help z-50">
      <Info className="w-4 h-4 text-[#666] group-hover:text-emerald-400 transition-colors" />
      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-[#1a1a24]/95 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-2xl origin-top-right scale-95 group-hover:scale-100 pointer-events-none">
        <div className="text-[10px] text-[#ccc] leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
