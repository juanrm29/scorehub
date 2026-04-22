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
  const shapeType = VESSEL_FACTORS[category].shape.type;
  const [view, setView] = useState<'PLAN' | 'PROFILE'>('PLAN');
  
  const stations = useMemo(() => {
    try {
      if (!dim.L || !dim.B || !dim.D || dim.L <= 0 || dim.B <= 0 || dim.D <= 0) return null;
      return calculateWorkload(category, condition, dim, { mh: 0, material: 0, coating: 0, disposal: 0 }).stations;
    } catch {
      return null;
    }
  }, [category, dim, condition]);

  const planPath = useMemo(() => {
    if (!stations || stations.length === 0) return 'M 0,50 L 300,50 Z';
    
    const ptsUpper = stations.map(st => {
      const x = (st.pos / dim.L) * 300;
      const y = 50 - ((st.halfBreadth / (dim.B / 2)) * 40);
      return `${x},${y}`;
    });
    const ptsLower = [...stations].reverse().map(st => {
      const x = (st.pos / dim.L) * 300;
      const y = 50 + ((st.halfBreadth / (dim.B / 2)) * 40);
      return `${x},${y}`;
    });
    
    return `M ${ptsUpper.join(' L ')} L ${ptsLower.join(' L ')} Z`;
  }, [stations, dim]);

  const profilePath = useMemo(() => {
    const shapeType = VESSEL_FACTORS[category].shape.type;
    
    // x=0 is stern, x=300 is bow. Deck y=30, Keel y=90
    let d = `M 0,30 L 300,30 L 300,90 L 0,90 Z`; 
    
    if (shapeType === 'ROUNDED' || shapeType === 'SLENDER') {
      d = `M 0,30 L 300,30 L 270,90 L 20,90 Q 0,90 0,60 Z`;
    } else if (shapeType === 'STANDARD' || shapeType === 'FULL') {
      d = `M 0,30 L 300,30 L 280,90 L 10,90 Z`;
    } else if (shapeType === 'FLAT' || shapeType === 'BOXY') {
      d = `M 10,30 L 290,30 L 300,90 L 0,90 Z`; 
    }
    return d;
  }, [category]);

  return (
    <div className="relative w-full h-44 bg-black/20 rounded-xl border border-white/[0.05] flex flex-col items-center justify-center overflow-hidden group">
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
      
      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-[#1a1a2e] rounded-md p-1 border border-white/10">
        <button onClick={() => setView('PLAN')} className={`text-[9px] px-2 py-0.5 rounded ${view==='PLAN'?'bg-blue-500/20 text-blue-400 font-bold':'text-[#555]'}`}>PLAN</button>
        <button onClick={() => setView('PROFILE')} className={`text-[9px] px-2 py-0.5 rounded ${view==='PROFILE'?'bg-rose-500/20 text-rose-400 font-bold':'text-[#555]'}`}>PROFILE</button>
      </div>

      <svg viewBox="-20 0 340 100" className={`w-full h-full p-4 transition-colors duration-500 ${view==='PLAN'?'text-blue-500/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]':'text-rose-500/80 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}>
        {view === 'PLAN' && (
          <>
            <motion.path 
              d={planPath}
              initial={false}
              animate={{ d: planPath }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              fill="currentColor" 
              fillOpacity="0.1"
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
            {stations && stations.map((st, i) => (
              <line key={i} x1={(st.pos/dim.L)*300} y1={50 - ((st.halfBreadth / (dim.B / 2)) * 40)} x2={(st.pos/dim.L)*300} y2={50 + ((st.halfBreadth / (dim.B / 2)) * 40)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            ))}
          </>
        )}
        
        {view === 'PROFILE' && (
          <>
            <line x1="-20" y1="70" x2="320" y2="70" stroke="rgba(59,130,246,0.4)" strokeWidth="1" strokeDasharray="2 2" />
            <text x="-15" y="66" fill="rgba(59,130,246,0.6)" fontSize="6" fontFamily="monospace">WATERLINE</text>
            <motion.path 
              d={profilePath}
              initial={false}
              animate={{ d: profilePath }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              fill="currentColor" 
              fillOpacity="0.1"
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
      
      <div className="absolute top-2 left-3 flex flex-col">
        <span className="text-[9px] text-[#888] font-mono tracking-widest uppercase text-left">{view} VIEW</span>
        <span className="text-xs font-bold text-white text-left">{shapeType} HULL</span>
      </div>
      <div className="absolute bottom-2 right-3 text-[9px] text-[#555] font-mono flex flex-col items-end">
        <span>Cb: {VESSEL_FACTORS[category].cb.toFixed(2)}</span>
        {dim.L && dim.B && <span>L/B: {(dim.L/dim.B).toFixed(2)}</span>}
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
                      Simpson vs Parametric Error: <span className="font-mono text-white">{(result.validations.simpsonError * 100).toFixed(2)}%</span>
                    </p>
                  </div>
                </div>
                {!result.validations.allPassed && (
                  <div className="text-[10px] text-[#888] space-y-0.5 text-right font-mono">
                    {!result.validations.simpsonValid && <p className="text-amber-400">Simpson Error &gt; 5%</p>}
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
                  <CardValue label="Total B&P Area" value={result.technical.totalBP_Area.toFixed(1)} unit="m²" color="#3b82f6" subtitle={`WSA Simpson: ${result.technical.wsaSimpson.toFixed(1)} m²`} />
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
                      <Waves className="w-3.5 h-3.5" /> Hull Shape Integration (Simpson's Rule)
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
                          <div className="flex justify-between text-xs text-[#ccc]"><span>Skeg (Tugboat Only)</span> <span className="font-mono">{result.bnpBreakdown.underwater.skeg.toFixed(1)} m²</span></div>
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
