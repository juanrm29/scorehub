'use client';

import { motion } from 'framer-motion';

export function RiskMatrixChart({ 
  data 
}: { 
  data: { id: string, name: string, ltv: number, churnProb: number, level: string, zScore: number }[] 
}) {
  // Normalize LTV to find max for X-axis
  const maxLTV = Math.max(...data.map(d => d.ltv), 1000);
  
  return (
    <div className="relative w-full h-[300px] bg-black/20 rounded-xl border border-white/5 p-4 overflow-hidden group">
      {/* Grid Lines */}
      <div className="absolute inset-0 p-8">
        <div className="w-full h-full border-l border-b border-white/10 relative">
          {/* Quadrant backgrounds */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500/[0.03] transition-colors group-hover:bg-red-500/[0.05]" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-500/[0.02]" />
          
          {/* Middle lines */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 border-t border-dashed border-white/10" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/5 border-l border-dashed border-white/10" />
          
          {/* Axis Labels */}
          <span className="absolute -bottom-6 right-0 text-[9px] text-[#555] uppercase tracking-wider font-mono">High LTV</span>
          <span className="absolute -left-6 top-0 -rotate-90 text-[9px] text-[#555] uppercase tracking-wider font-mono origin-top-left">High Risk</span>
          
          <span className="absolute top-2 right-2 text-[10px] font-bold text-red-500/50 uppercase tracking-widest">Critical Alert</span>
          <span className="absolute bottom-2 right-2 text-[10px] font-bold text-emerald-500/30 uppercase tracking-widest">Safe VIPs</span>

          {/* Dots */}
          {data.map((d, i) => {
            const x = (d.ltv / maxLTV) * 100;
            const y = d.churnProb; // Assuming churnProb is 0-100
            
            // Color based on risk quadrant
            const isRedZone = x > 50 && y > 50;
            const isAnomalous = d.zScore <= -1.5;
            
            let color = '#3b82f6';
            if (isRedZone) color = '#ef4444';
            else if (x > 50) color = '#10b981';
            else if (y > 50) color = '#f59e0b';
            
            if (isAnomalous) color = '#ef4444';

            return (
              <motion.div
                key={d.id}
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full cursor-pointer group/dot"
                style={{ 
                  left: `${x}%`, 
                  bottom: `${y}%`,
                  background: color,
                  boxShadow: `0 0 10px ${color}80`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                whileHover={{ scale: 1.5, zIndex: 10 }}
              >
                {isAnomalous && (
                  <div className="absolute inset-0 rounded-full border border-red-500 animate-ping" />
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <p className="text-xs font-bold text-white mb-1">{d.name}</p>
                  <p className="text-[10px] font-mono text-[#aaa]">LTV: Rp {new Intl.NumberFormat('id-ID').format(Math.round(d.ltv))}</p>
                  <p className="text-[10px] font-mono text-[#aaa]">Risk: {d.churnProb.toFixed(0)}%</p>
                  {isAnomalous && <p className="text-[9px] font-bold text-red-400 mt-1 uppercase">Z-Score Anomaly</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
