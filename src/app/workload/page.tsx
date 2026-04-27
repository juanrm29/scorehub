'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Anchor, Calculator, Settings, Ship, AlertTriangle, CheckCircle2, DollarSign, Waves, Cog, Package, ChevronRight, Droplet, Sun, Maximize, Circle, Shield, Home } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { 
  VesselCategory, VesselCondition, InputDimensions, 
  calculateWorkload, CalculationResult, VESSEL_FACTORS 
} from '@/lib/workloadEngine';

const CATEGORIES: VesselCategory[] = [
  'Tongkang/Barge', 'Tugboat', 'LCT/Landing Craft', 'Cargo Ship', 
  'Tanker', 'Bulk Carrier', 'Passenger Ship', 'Fishing Vessel', 'Supply Vessel'
];
const CONDITIONS: VesselCondition[] = ['Baik', 'Sedang', 'Buruk', 'Sangat Buruk'];

function CardValue({ label, value, unit, color, subtitle }: { label: string; value: string | number; unit: string; color: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <p className="text-xs text-[#666] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black font-mono" style={{ color }}>{value}</span>
        <span className="text-xs text-[#888] font-mono">{unit}</span>
      </div>
      {subtitle && <p className="text-[10px] text-[#555] mt-1">{subtitle}</p>}
    </div>
  );
}

function VesselShapeVisualizer({ category, dim, condition }: { category: VesselCategory, dim: InputDimensions, condition: VesselCondition }) {
  const [view, setView] = useState<'PLAN' | 'PROFILE'>('PLAN');
  const factors = VESSEL_FACTORS[category];
  const { shape, cb, draftRatio } = factors;
  const condColor = condition === 'Baik' ? '#10b981' : condition === 'Sedang' ? '#f59e0b' : condition === 'Buruk' ? '#f97316' : '#ef4444';

  const W = 300, H = 110; // SVG viewport
  const L = dim.L || 72;
  const B = dim.B || 18;
  const D = dim.D || 4.9;
  const T = D * draftRatio; // draft

  // ── PLAN VIEW paths (top-down, centerline horizontal) ──────────────────────
  // All shapes fit in viewBox 0 0 300 110, centered at y=55
  // x: 0=stern, 300=bow; y: 55=centerline, 55±halfB scaled

  const getPlanPath = (): string => {
    const cy = 55; // centerline
    const maxHB = 45; // max half-breadth in SVG units
    const bFactor = Math.min(1, (B / L) * 6); // scale halfbreadth to look correct

    // Control half-breadth at bow/mid/stern from shape params
    const hbStern = maxHB * shape.stern * bFactor;
    const hbMid = maxHB * shape.mid * bFactor;
    const hbBow = maxHB * shape.bow * bFactor;

    switch (shape.type) {
      case 'BOXY': // Barge/LCT: near-rectangular, blunt ends
        return `M 10,${cy - hbStern * 0.9} 
          C 0,${cy - hbStern * 0.9} 0,${cy + hbStern * 0.9} 10,${cy + hbStern * 0.9}
          L 280,${cy + hbMid}
          C 295,${cy + hbBow * 0.5} 300,${cy} 300,${cy}
          C 300,${cy} 295,${cy - hbBow * 0.5} 280,${cy - hbMid}
          Z`;
      case 'FLAT': // LCT: flat bow ramp
        return `M 5,${cy - hbStern} 
          L 0,${cy - hbStern}  L 0,${cy + hbStern}  L 5,${cy + hbStern}
          L 275,${cy + hbMid}
          L 300,${cy + hbBow * 0.3}  L 300,${cy - hbBow * 0.3}
          L 275,${cy - hbMid}
          Z`;
      case 'FULL': // Tanker/Bulk: very full, parallel midbody
        return `M 20,${cy - hbStern}
          C 5,${cy - hbStern} 0,${cy - hbStern * 0.8} 0,${cy}
          C 0,${cy + hbStern * 0.8} 5,${cy + hbStern} 20,${cy + hbStern}
          L 250,${cy + hbMid}
          C 270,${cy + hbMid} 290,${cy + hbBow * 0.6} 300,${cy}
          C 290,${cy - hbBow * 0.6} 270,${cy - hbMid} 250,${cy - hbMid}
          Z`;
      case 'ROUNDED': // Tugboat/Fishing: compact, round
        return `M 40,${cy - hbStern}
          C 15,${cy - hbStern} 0,${cy - hbStern * 0.7} 0,${cy}
          C 0,${cy + hbStern * 0.7} 15,${cy + hbStern} 40,${cy + hbStern}
          L 200,${cy + hbMid}
          C 240,${cy + hbMid} 280,${cy + hbBow * 0.5} 300,${cy}
          C 280,${cy - hbBow * 0.5} 240,${cy - hbMid} 200,${cy - hbMid}
          Z`;
      case 'SLENDER': // Passenger: slim, sharp ends
        return `M 50,${cy - hbStern * 0.6}
          C 20,${cy - hbStern * 0.6} 5,${cy - hbStern * 0.3} 0,${cy}
          C 5,${cy + hbStern * 0.3} 20,${cy + hbStern * 0.6} 50,${cy + hbStern * 0.6}
          L 220,${cy + hbMid}
          C 260,${cy + hbMid * 0.8} 290,${cy + hbBow * 0.3} 300,${cy}
          C 290,${cy - hbBow * 0.3} 260,${cy - hbMid * 0.8} 220,${cy - hbMid}
          Z`;
      default: // STANDARD: moderate ends
        return `M 30,${cy - hbStern}
          C 8,${cy - hbStern} 0,${cy - hbStern * 0.6} 0,${cy}
          C 0,${cy + hbStern * 0.6} 8,${cy + hbStern} 30,${cy + hbStern}
          L 230,${cy + hbMid}
          C 265,${cy + hbMid * 0.7} 292,${cy + hbBow * 0.4} 300,${cy}
          C 292,${cy - hbBow * 0.4} 265,${cy - hbMid * 0.7} 230,${cy - hbMid}
          Z`;
    }
  };

  // ── PROFILE VIEW paths (side elevation) ────────────────────────────────────
  // x: 0=stern, 300=bow; deck at y=20, keel at y=90
  // Waterline at y = 90 - (T/D)*(90-20) = 90 - draftRatio*70

  const getProfilePath = (): string => {
    const keel = 90, deck = 20;
    const wl = keel - draftRatio * (keel - deck); // waterline y
    const deckH = deck; // deck top
    const midDeck = (deck + keel) / 2;

    switch (shape.type) {
      case 'BOXY': // Barge: flat bottom, square ends, low freeboard
        return `M 0,${deckH + 5} L 5,${deckH} L 295,${deckH} L 300,${deckH + 5}
          L 300,${keel} L 0,${keel} Z`;
      case 'FLAT': // LCT: bow ramp slopes down to waterline
        return `M 0,${deckH + 5} L 5,${deckH} L 285,${deckH}
          L 300,${wl + 2} L 300,${keel} L 0,${keel} Z`;
      case 'FULL': // Tanker: nearly box-shaped, gentle flare
        return `M 0,${deckH + 8} C 0,${deckH + 3} 5,${deckH} 15,${deckH}
          L 285,${deckH} C 295,${deckH} 300,${deckH + 5} 300,${deckH + 15}
          L 300,${keel - 3} C 300,${keel} 297,${keel} 290,${keel}
          L 10,${keel} C 3,${keel} 0,${keel} 0,${keel - 5} Z`;
      case 'ROUNDED': // Tugboat: low stern, raised bow, curved keel
        return `M 0,${deckH + 18} C 0,${deckH + 10} 5,${deckH + 4} 20,${deckH}
          C 80,${deckH - 4} 180,${deckH - 4} 260,${deckH}
          C 285,${deckH + 2} 300,${deckH + 8} 300,${deckH + 16}
          L 300,${keel - 12} C 298,${keel - 4} 290,${keel} 275,${keel}
          L 25,${keel} C 10,${keel} 0,${keel - 4} 0,${keel - 12} Z`;
      case 'SLENDER': // Passenger: high deck, sharp bow, elegant stern
        return `M 0,${deckH + 12} C 0,${deckH + 6} 5,${deckH + 2} 20,${deckH}
          L 250,${deckH} C 275,${deckH} 295,${deckH + 4} 300,${deckH + 14}
          L 300,${keel - 8} C 296,${keel} 285,${keel} 270,${keel}
          L 30,${keel} C 15,${keel} 4,${keel} 0,${keel - 8} Z`;
      default: // STANDARD cargo
        return `M 0,${deckH + 10} C 0,${deckH + 4} 8,${deckH} 22,${deckH}
          L 270,${deckH} C 288,${deckH} 300,${deckH + 6} 300,${deckH + 18}
          L 300,${keel - 5} C 298,${keel} 290,${keel} 278,${keel}
          L 22,${keel} C 10,${keel} 0,${keel} 0,${keel - 5} Z`;
    }
  };

  const planPath = getPlanPath();
  const profilePath = getProfilePath();
  const wlY = 90 - draftRatio * 70; // waterline Y in profile SVG

  const isNew = !dim.L || !dim.B || !dim.D;
  const color = view === 'PLAN' ? '#3b82f6' : '#f43f5e';

  return (
    <div className="relative w-full bg-black/20 rounded-xl border border-white/[0.07] overflow-hidden" style={{ height: 180 }}>
      {/* Grid background */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

      {/* Tab switcher */}
      <div className="absolute top-2 right-2 z-10 flex gap-0.5 bg-black/40 rounded-lg p-0.5 border border-white/10 backdrop-blur-sm">
        <button onClick={() => setView('PLAN')} className={`text-[9px] px-2.5 py-1 rounded-md font-bold tracking-wider transition-all ${view === 'PLAN' ? 'bg-blue-500/30 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'text-[#555] hover:text-[#888]'}`}>PLAN</button>
        <button onClick={() => setView('PROFILE')} className={`text-[9px] px-2.5 py-1 rounded-md font-bold tracking-wider transition-all ${view === 'PROFILE' ? 'bg-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'text-[#555] hover:text-[#888]'}`}>PROFILE</button>
      </div>

      {/* Top-left label */}
      <div className="absolute top-2 left-3 z-10">
        <p className="text-[8px] text-[#666] font-mono tracking-[0.15em] uppercase">{view} View · {shape.type} Hull</p>
        <p className="text-[10px] font-bold text-white leading-tight">{category}</p>
      </div>

      {/* SVG drawing */}
      <svg viewBox="-10 5 320 105" className="w-full h-full px-2 py-2" style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}>
        <defs>
          <linearGradient id="hullGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* PLAN VIEW */}
        {view === 'PLAN' && (
          <motion.g key="plan" initial={{ opacity: 0, scaleY: 0.6 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            {/* Centerline */}
            <line x1="0" y1="55" x2="300" y2="55" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="5 4" />
            {/* BOW label */}
            <text x="302" y="58" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">BOW</text>
            <text x="-18" y="58" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">STN</text>
            {/* Hull fill */}
            <motion.path d={planPath} fill="url(#fillGrad)" initial={false} animate={{ d: planPath }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
            {/* Hull outline */}
            <motion.path d={planPath} fill="none" stroke="url(#hullGrad)" strokeWidth="2" strokeLinejoin="round" initial={false} animate={{ d: planPath }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
            {/* Beam annotation */}
            {dim.B && (
              <>
                <line x1="150" y1="15" x2="150" y2="95" stroke={color} strokeOpacity="0.2" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x="153" y="20" fill={color} fontSize="7" fontFamily="monospace" fillOpacity="0.7">B={dim.B}m</text>
              </>
            )}
            {/* Length annotation */}
            {dim.L && (
              <text x="5" y="106" fill={color} fontSize="6.5" fontFamily="monospace" fillOpacity="0.6">L={dim.L}m  Cb={cb.toFixed(2)}</text>
            )}
          </motion.g>
        )}

        {/* PROFILE VIEW */}
        {view === 'PROFILE' && (
          <motion.g key="profile" initial={{ opacity: 0, scaleX: 0.7 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            {/* Waterline */}
            <line x1="-10" y1={wlY} x2="310" y2={wlY} stroke="#3b82f6" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 3" />
            <text x="-8" y={wlY - 2} fill="#3b82f6" fontSize="5.5" fontFamily="monospace" fillOpacity="0.7">WL</text>
            {/* Baseline */}
            <line x1="0" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            {/* BOW / STERN labels */}
            <text x="302" y="58" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">BOW</text>
            <text x="-18" y="58" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">STN</text>
            {/* Hull fill */}
            <motion.path d={profilePath} fill="url(#fillGrad)" initial={false} animate={{ d: profilePath }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
            {/* Hull outline */}
            <motion.path d={profilePath} fill="none" stroke="url(#hullGrad)" strokeWidth="2" strokeLinejoin="round" initial={false} animate={{ d: profilePath }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
            {/* Draft annotation */}
            <line x1="308" y1={wlY} x2="308" y2="90" stroke={condColor} strokeOpacity="0.7" strokeWidth="1.5" />
            <line x1="304" y1={wlY} x2="312" y2={wlY} stroke={condColor} strokeOpacity="0.7" strokeWidth="1" />
            <line x1="304" y1="90" x2="312" y2="90" stroke={condColor} strokeOpacity="0.7" strokeWidth="1" />
            <text x="313" y={((wlY + 90) / 2) + 2} fill={condColor} fontSize="6" fontFamily="monospace">T={T.toFixed(1)}m</text>
            {/* Depth annotation */}
            <text x="5" y="106" fill={color} fontSize="6.5" fontFamily="monospace" fillOpacity="0.6">D={dim.D}m  T={T.toFixed(1)}m  T/D={draftRatio.toFixed(2)}</text>
          </motion.g>
        )}

        {/* Condition dot */}
        <circle cx="292" cy="18" r="3" fill={condColor} opacity="0.9" />
        <circle cx="292" cy="18" r="5" fill={condColor} opacity="0.2">
          <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Bottom condition label */}
      <div className="absolute bottom-1.5 left-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: condColor }} />
        <span className="text-[9px] font-semibold" style={{ color: condColor }}>{condition}</span>
        <span className="text-[9px] text-[#555]">· L/B={dim.L && dim.B ? (dim.L/dim.B).toFixed(1) : '–'}</span>
      </div>
    </div>
  );
}

export default function WorkloadPage() {
  const [category, setCategory] = useState<VesselCategory>('Tongkang/Barge');
  const [condition, setCondition] = useState<VesselCondition>('Sedang');
  const [dim, setDim] = useState<InputDimensions>({ L: 72, B: 18, D: 4.9 });
  
  const [rates, setRates] = useState({
    mh: 50000,
    material: 32000,
    coating: 120000,
    disposal: 500000
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  const handleCalculate = () => {
    if (!dim.L || !dim.B || !dim.D) return;
    const res = calculateWorkload(category, condition, dim, rates);
    setResult(res);
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.stations.map(st => ({
      station: `St.${st.station}`,
      x: st.pos.toFixed(1),
      halfBreadth: st.halfBreadth,
      fullBreadth: st.halfBreadth * 2,
    }));
  }, [result]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Ambient */}
      <div className="fixed top-32 right-32 w-80 h-80 bg-rose-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-32 left-40 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
            <Anchor className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-xs text-rose-400 font-semibold uppercase tracking-[0.2em]">Naval Architecture Engine</span>
        </div>
        <h1 className="text-3xl font-black text-gradient">Workload Calculator</h1>
        <p className="text-[#555] mt-1 text-sm">Advanced estimation for repair scope, material weight, and commercial budgeting</p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* INPUT PANEL */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="col-span-4 space-y-5">
          <div className="glass-strong rounded-2xl p-5 gradient-border space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Ship className="w-4 h-4 text-blue-400" /> Vessel Specifications
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#666] mb-1">Vessel Type</label>
                <select value={category} onChange={e => setCategory(e.target.value as VesselCategory)} className="w-full">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-[#666] mb-1">Vessel Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value as VesselCondition)} className="w-full">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[10px] text-[#555] mt-1 italic">Mempengaruhi faktor pengali Man-Hour kerja.</p>
              </div>

              {/* Interactive Visualizer */}
              <VesselShapeVisualizer category={category} dim={dim} condition={condition} />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#666] mb-1">Length (L)</label>
                  <div className="relative">
                    <input type="number" value={dim.L || ''} onChange={e => setDim({...dim, L: +e.target.value})} className="w-full pr-6" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555]">m</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1">Breadth (B)</label>
                  <div className="relative">
                    <input type="number" value={dim.B || ''} onChange={e => setDim({...dim, B: +e.target.value})} className="w-full pr-6" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555]">m</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1">Depth (D)</label>
                  <div className="relative">
                    <input type="number" value={dim.D || ''} onChange={e => setDim({...dim, D: +e.target.value})} className="w-full pr-6" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555]">m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-5 gradient-border space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Settings className="w-4 h-4 text-emerald-400" /> Pricing Rates (IDR)
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#666] mb-1">Man-Hour Rate</label>
                <input type="number" value={rates.mh} onChange={e => setRates({...rates, mh: +e.target.value})} className="w-full text-sm font-mono text-emerald-400" />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Steel Material (/kg)</label>
                <input type="number" value={rates.material} onChange={e => setRates({...rates, material: +e.target.value})} className="w-full text-sm font-mono text-emerald-400" />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Coating (/m²)</label>
                <input type="number" value={rates.coating} onChange={e => setRates({...rates, coating: +e.target.value})} className="w-full text-sm font-mono text-emerald-400" />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Disposal Est.</label>
                <input type="number" value={rates.disposal} onChange={e => setRates({...rates, disposal: +e.target.value})} className="w-full text-sm font-mono text-emerald-400" />
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleCalculate}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
          >
            <Calculator className="w-4 h-4" /> Generate Engineering Estimation
          </motion.button>
        </motion.div>

        {/* RESULTS PANEL */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="col-span-8 space-y-5">
          {!result ? (
            <div className="glass-strong rounded-2xl h-full flex flex-col items-center justify-center text-[#555] py-20">
              <Anchor className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-[#888]">Engine Ready</p>
              <p className="text-sm text-[#555]">Input parameters and click generate to calculate workload</p>
            </div>
          ) : (
            <>
              {/* Validation Banner */}
              <div className={`rounded-xl p-3 border flex items-center justify-between ${
                result.validations.allPassed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  {result.validations.allPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${result.validations.allPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.validations.allPassed ? 'All Engineering Validations Passed' : 'Validation Warnings Detected'}
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5">
                      Gauss-Legendre vs Parametric Error: <span className="font-mono text-white">{(result.validations.errorMargin * 100).toFixed(2)}%</span>
                    </p>
                  </div>
                </div>
                {!result.validations.allPassed && (
                  <div className="text-[10px] text-[#888] space-y-0.5 text-right font-mono">
                    {!result.validations.methodValid && <p className="text-amber-400">Integration Error &gt; 10%</p>}
                    {!result.validations.lbRatioValid && <p className="text-amber-400">L/B Ratio Abnormal</p>}
                    {!result.validations.btRatioValid && <p className="text-amber-400">B/T Ratio Abnormal</p>}
                    {!result.validations.wsaRatioValid && <p className="text-amber-400">WSA Ratio Abnormal</p>}
                  </div>
                )}
              </div>

              {/* Technical / PPIC View */}
              <div className="glass-strong rounded-2xl p-6 gradient-border">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <Cog className="w-4 h-4 text-blue-400" /> PPIC / Technical Estimation
                </h2>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <CardValue label="Total B&P Area" value={result.technical.totalBP_Area.toFixed(1)} unit="m²" color="#3b82f6" subtitle={`eWSA (Ensemble): ${result.technical.wsaEnsemble.toFixed(1)} m²`} />
                  <CardValue label="Total Structure Weight" value={result.technical.totalStructureTon.toFixed(1)} unit="ton" color="#8b5cf6" subtitle={`For ${category}`} />
                  <CardValue label="Replating Estimate" value={result.technical.replatingWeightKg.toFixed(0)} unit="kg" color="#06b6d4" subtitle="5% rule of thumb" />
                  <CardValue label="Total Man-Day" value={result.technical.manDayBP.toFixed(1)} unit="MD" color="#10b981" subtitle={`@ 8 MH/day`} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Structure Breakdown Table */}
                  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a3a]">
                    <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Structure Breakdown
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Bottom Shell', val: result.structure.bottom },
                        { label: 'Side Shell', val: result.structure.side },
                        { label: 'Topside', val: result.structure.topside },
                        { label: 'Main Deck', val: result.structure.mainDeck },
                        { label: 'Superstructure', val: result.structure.superstructure },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-white/[0.03] pb-1.5 last:border-0">
                          <span className="text-xs text-[#ccc]">{item.label}</span>
                          <span className="text-xs font-mono font-bold">{item.val.toFixed(1)} <span className="text-[#666]">ton</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simpson Integration Chart */}
                  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a3a] flex flex-col">
                    <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Waves className="w-3.5 h-3.5" /> Hull Shape Profile
                    </h3>
                    <div className="flex-1 min-h-[150px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="station" stroke="#555" fontSize={10} tickMargin={8} />
                          <YAxis stroke="#555" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a3a', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${Number(value).toFixed(2)} m`, 'Full Breadth']}
                          />
                          <Area type="monotone" dataKey="fullBreadth" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorArea)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Detailed B&P Breakdown Table */}
                <div className="bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a3a] mt-6">
                  <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Detailed Blasting & Painting Breakdown (16 Components)
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5"><Droplet className="w-3 h-3"/> 1. Underwater</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Lambung Bawah</span> <span className="font-mono">{result.bnpBreakdown.underwater.lambungBawah.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Skeg / Rudder Protector</span> <span className="font-mono">{result.bnpBreakdown.underwater.skeg.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Underwater</span> <span className="font-mono text-blue-300">{result.bnpBreakdown.underwater.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5"><Sun className="w-3 h-3"/> 2. Topside</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Topside (Lambung Atas)</span> <span className="font-mono">{result.bnpBreakdown.topside.topside.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Transom (Buritan)</span> <span className="font-mono">{result.bnpBreakdown.topside.transom.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Haluan (Trapesium)</span> <span className="font-mono">{result.bnpBreakdown.topside.haluan.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Topside</span> <span className="font-mono text-rose-300">{result.bnpBreakdown.topside.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5"><Maximize className="w-3 h-3"/> 3. Bulwark</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Bulwark Luar</span> <span className="font-mono">{result.bnpBreakdown.bulwark.luar.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Bulwark Dalam</span> <span className="font-mono">{result.bnpBreakdown.bulwark.dalam.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Bulwark</span> <span className="font-mono text-emerald-300">{result.bnpBreakdown.bulwark.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5"><Circle className="w-3 h-3"/> 4. Deck</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Main Deck (External)</span> <span className="font-mono">{result.bnpBreakdown.deck.mainDeck.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Internal Deck</span> <span className="font-mono">{result.bnpBreakdown.deck.internalDeck.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Deck</span> <span className="font-mono text-purple-300">{result.bnpBreakdown.deck.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5"><Home className="w-3 h-3"/> 5. Superstructure</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Rumah Winch</span> <span className="font-mono">{result.bnpBreakdown.superstructure.rumahWinch.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Anjungan/Bridge</span> <span className="font-mono">{result.bnpBreakdown.superstructure.anjungan.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Struktur Lainnya</span> <span className="font-mono">{result.bnpBreakdown.superstructure.strukturLain.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Superstructure</span> <span className="font-mono text-amber-300">{result.bnpBreakdown.superstructure.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>

                      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                        <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5"><Package className="w-3 h-3"/> 6. Tangki (Internal)</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Tangki Ballast</span> <span className="font-mono">{result.bnpBreakdown.tangki.ballast.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Tangki BBM</span> <span className="font-mono">{result.bnpBreakdown.tangki.bbm.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Tangki Air Tawar</span> <span className="font-mono">{result.bnpBreakdown.tangki.airTawar.toFixed(1)} m²</span></div>
                          <div className="flex justify-between text-xs font-bold text-white pt-1.5 mt-1 border-t border-white/10"><span>Total Tangki</span> <span className="font-mono text-cyan-300">{result.bnpBreakdown.tangki.total.toFixed(1)} m²</span></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Commercial View */}
              <div className="glass-strong rounded-2xl p-6 gradient-border">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-rose-400" /> Commercial Estimation / Quick Quote
                </h2>

                <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3a] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                        <th className="text-left font-semibold text-[#888] py-2 px-4 text-xs uppercase">Cost Item</th>
                        <th className="text-right font-semibold text-[#888] py-2 px-4 text-xs uppercase">Volume</th>
                        <th className="text-right font-semibold text-[#888] py-2 px-4 text-xs uppercase">Unit Price</th>
                        <th className="text-right font-semibold text-[#888] py-2 px-4 text-xs uppercase">Total Cost (IDR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#ccc]">Man-Hour Labour</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{result.technical.manHourBP.toFixed(0)} MH</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{formatCurrency(rates.mh)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(result.commercial.costMH)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#ccc]">Steel Materials</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{result.technical.replatingWeightKg.toFixed(0)} kg</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{formatCurrency(rates.material)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(result.commercial.costMaterial)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#ccc]">Blasting & Coating</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{result.technical.totalBP_Area.toFixed(1)} m²</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{formatCurrency(rates.coating)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(result.commercial.costCoating)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#ccc]">Disposal (Limbah B3)</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">5 Est.</td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#888]">{formatCurrency(rates.disposal)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">{formatCurrency(result.commercial.costDisposal)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="bg-black/20 p-4 border-t border-white/[0.05] space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#888]">Subtotal Biaya Produksi</span>
                      <span className="font-mono">{formatCurrency(result.commercial.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#888]">Overhead (15%)</span>
                      <span className="font-mono text-amber-400">{formatCurrency(result.commercial.overhead)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#888]">Margin (25%)</span>
                      <span className="font-mono text-emerald-400">{formatCurrency(result.commercial.margin)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.05]">
                      <span className="font-bold text-rose-400">GRAND TOTAL PENAWARAN</span>
                      <span className="font-black font-mono text-lg text-rose-400">{formatCurrency(result.commercial.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
