'use client';

import { motion } from 'framer-motion';

export function LTVForecastChart({ currentLTV, historicalTrend }: { currentLTV: number, historicalTrend: number }) {
  // Generate some synthetic data points based on current LTV and trend
  const dataPoints = 12;
  const points = [];
  let currentVal = currentLTV * 0.6; // Start from 60% of current for visual effect
  let min = currentVal;
  let max = currentVal;

  for (let i = 0; i < dataPoints; i++) {
    points.push(currentVal);
    if (currentVal < min) min = currentVal;
    if (currentVal > max) max = currentVal;
    
    // Add some noise and trend
    const noise = (Math.random() - 0.4) * (currentLTV * 0.05);
    const growth = (currentLTV * 0.4) / dataPoints;
    currentVal += growth + noise;
  }
  
  max = Math.max(max, currentLTV * 1.2);
  const range = max - min;

  // Map to SVG coordinates (1000x300 viewBox)
  const w = 1000;
  const h = 300;
  
  const coords = points.map((val, i) => {
    const x = (i / (dataPoints - 1)) * w;
    const y = h - ((val - min) / range) * (h * 0.8) - (h * 0.1);
    return { x, y };
  });

  const d = `M 0 ${h} ` + 
    coords.map((p, i) => i === 0 ? `L ${p.x} ${p.y}` : `C ${coords[i-1].x + 40} ${coords[i-1].y}, ${p.x - 40} ${p.y}, ${p.x} ${p.y}`).join(' ') +
    ` L ${w} ${h} Z`;

  const lineD = coords.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${coords[i-1].x + 40} ${coords[i-1].y}, ${p.x - 40} ${p.y}, ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative w-full h-full min-h-[160px] flex items-end">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }} />

      {/* The SVG Area Chart */}
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[120%] absolute bottom-0 left-0">
        <defs>
          <linearGradient id="ltvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Fill Area */}
        <motion.path
          d={d}
          fill="url(#ltvGrad)"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Line */}
        <motion.path
          d={lineD}
          fill="none"
          stroke="#10b981"
          strokeWidth="4"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Glowing End Dot */}
        <motion.circle
          cx={coords[coords.length-1].x}
          cy={coords[coords.length-1].y}
          r="6"
          fill="#fff"
          stroke="#10b981"
          strokeWidth="3"
          filter="url(#glow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, type: "spring" }}
        />
      </svg>
      
      {/* Floating Info */}
      <div className="absolute top-4 left-4">
        <p className="text-[10px] text-[#888] font-mono tracking-wider uppercase mb-1">Projected Portfolio LTV</p>
        <p className="text-3xl font-black font-mono text-emerald-400 drop-shadow-md">
          Rp {new Intl.NumberFormat('id-ID').format(Math.round(currentLTV))}
        </p>
      </div>
    </div>
  );
}
