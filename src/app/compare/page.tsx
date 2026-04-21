'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companies as allCompanies } from '@/lib/data';
import {
  getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel,
  getLevelColor, getLevelEmoji, getStatusLabel,
} from '@/lib/scoring';
import { Company, ClientLevel } from '@/lib/types';
import { LevelBadge } from '@/components/LevelBadge';
import {
  GitCompareArrows, Plus, X, Search, Building2, Trophy, TrendingUp,
  TrendingDown, Minus, ChevronDown, BarChart3, Radar, ArrowRight,
  Sparkles, Shield, Wallet, Settings, Heart, Gem, Users,
} from 'lucide-react';
import Link from 'next/link';

// ==================== RADAR CHART ====================
const RADAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

function CompareRadar({ datasets, labels }: { datasets: { name: string; values: number[]; color: string }[]; labels: string[] }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 400); }, []);

  const n = labels.length;
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 130;

  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {[1, 2, 3, 4, 5].map(r => (
        <polygon key={r}
          points={Array.from({ length: n }, (_, i) => getPoint(i, (r / 5) * maxR)).map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke={r === 5 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)'} strokeWidth={r === 5 ? 1.5 : 0.5} />
      ))}
      {/* Spokes */}
      {labels.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={getPoint(i, maxR).x} y2={getPoint(i, maxR).y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
      ))}
      {/* Data polygons */}
      {datasets.map((ds, di) => {
        const pts = ds.values.map((v, i) => getPoint(i, show ? (v / 5) * maxR : 0));
        const polygon = pts.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <g key={di}>
            <polygon points={polygon} fill={`${ds.color}10`} stroke={ds.color} strokeWidth={2}
              className="transition-all duration-1000" style={{ transitionDelay: `${di * 150}ms` }} />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill={ds.color} stroke="#0a0a0f" strokeWidth={2}
                className="transition-all duration-1000" style={{ transitionDelay: `${di * 150}ms` }} />
            ))}
          </g>
        );
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(i, maxR + 30);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            className="text-[10px] fill-[#888] font-medium uppercase tracking-wider">{label}</text>
        );
      })}
    </svg>
  );
}

// ==================== SCORE BAR COMPARE ====================
function CompareBar({ label, values, colors, icon: Icon }: { label: string; values: number[]; colors: string[]; icon?: React.ElementType }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#555]" />}
        <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">{label}</span>
      </div>
      {values.map((v, i) => {
        const pct = (v / 5) * 100;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/[0.03] overflow-hidden">
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                style={{ background: `linear-gradient(90deg, ${colors[i]}80, ${colors[i]})`, boxShadow: `0 0 8px ${colors[i]}30` }} />
            </div>
            <span className="text-xs font-mono font-bold w-8 text-right" style={{ color: colors[i] }}>{v.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== METRIC COMPARE ====================
function MetricRow({ label, values, colors, format = 'score', icon: Icon }: {
  label: string; values: (number | string)[]; colors: string[];
  format?: 'score' | 'number' | 'text'; icon?: React.ElementType;
}) {
  const best = format === 'score'
    ? Math.max(...values.filter(v => typeof v === 'number') as number[])
    : null;

  return (
    <div className="flex items-center py-3 border-b border-white/[0.03] last:border-0">
      <div className="w-44 flex items-center gap-2 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#555]" />}
        <span className="text-xs text-[#888] font-medium">{label}</span>
      </div>
      {values.map((v, i) => {
        const isNum = typeof v === 'number';
        const isBest = isNum && v === best && values.filter(x => x === v).length === 1;
        return (
          <div key={i} className="flex-1 text-center">
            <span className={`text-sm font-mono font-bold ${isBest ? 'relative' : ''}`} style={{ color: colors[i] }}>
              {isNum ? (format === 'score' ? (v as number).toFixed(2) : v) : v}
              {isBest && <Trophy className="w-3 h-3 text-amber-400 inline ml-1 -mt-0.5" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== COMPANY SELECTOR ====================
function CompanySelector({ index, selected, onSelect, onRemove, color }: {
  index: number; selected: Company | null; onSelect: (c: Company) => void; onRemove: () => void; color: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allCompanies.slice(0, 15);
    const q = search.toLowerCase();
    return allCompanies.filter(c => c.companyName.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)).slice(0, 15);
  }, [search]);

  if (selected) {
    const score = getCompanyCurrentScore(selected);
    const level = getCompanyCurrentLevel(selected);
    const status = getCompanyStatus(selected);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl p-5 border overflow-hidden group"
        style={{ borderColor: `${color}25`, background: `linear-gradient(135deg, ${color}08, ${color}03)` }}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <button onClick={onRemove} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.03] hover:bg-red-500/10 text-[#555] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>Company {index + 1}</span>
        </div>
        <h3 className="text-lg font-black truncate">{selected.companyName}</h3>
        <p className="text-[11px] text-[#555] mt-1">{selected.contactPerson} · {selected.location}</p>
        <div className="flex items-center gap-3 mt-4">
          <div className="text-center">
            <p className="text-2xl font-black" style={{ color: getLevelColor(level) }}>{score.toFixed(2)}</p>
            <p className="text-[9px] text-[#555] uppercase">Score</p>
          </div>
          <div className="text-center">
            <LevelBadge level={level} />
          </div>
          <div className="text-center ml-auto">
            <p className="text-sm font-bold">{selected.fleetSize}</p>
            <p className="text-[9px] text-[#555] uppercase">Fleet</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-[#555]">
          <span>{selected.newAssessments.length} new</span>
          <span>·</span>
          <span>{selected.repeatedAssessments.length} repeated</span>
          <span>·</span>
          <span>{getStatusLabel(status)}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setSearchOpen(!searchOpen)}
        className="w-full rounded-2xl border-2 border-dashed border-white/[0.06] hover:border-white/[0.12] p-8 flex flex-col items-center justify-center gap-3 transition-all group"
        style={{ minHeight: 200 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
          style={{ background: `${color}10`, boxShadow: `0 0 20px ${color}05` }}>
          <Plus className="w-6 h-6" style={{ color }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color }}>Add Company {index + 1}</p>
          <p className="text-[11px] text-[#444] mt-0.5">Click to select</p>
        </div>
      </button>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,25,0.98), rgba(10,10,18,0.98))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
              <Search className="w-4 h-4 text-[#555]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#444]" autoFocus />
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5">
              {filtered.map(c => {
                const sc = getCompanyCurrentScore(c);
                const lv = getCompanyCurrentLevel(c);
                return (
                  <button key={c.id} onClick={() => { onSelect(c); setSearchOpen(false); setSearch(''); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all text-left">
                    <Building2 className="w-4 h-4 text-[#555] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.companyName}</p>
                      <p className="text-[10px] text-[#555]">{c.location} · Fleet {c.fleetSize}</p>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: getLevelColor(lv) }}>{sc.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function ComparePage() {
  const [slots, setSlots] = useState<(Company | null)[]>([null, null, null]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const selected = slots.filter(Boolean) as Company[];
  const colors = selected.map((_, i) => RADAR_COLORS[i]);

  // Build comparison data for repeated customers
  const comparisonData = selected.map((c, i) => {
    const rep = c.repeatedAssessments;
    const latest = rep.length > 0 ? rep[rep.length - 1] : null;
    const score = getCompanyCurrentScore(c);
    const level = getCompanyCurrentLevel(c);
    const status = getCompanyStatus(c);

    return {
      company: c,
      score, level, status,
      color: RADAR_COLORS[i],
      latestRep: latest?.scores ?? null,
      latestNew: c.newAssessments.length > 0 ? c.newAssessments[c.newAssessments.length - 1].scores : null,
      totalAssessments: c.newAssessments.length + c.repeatedAssessments.length,
      trend: rep.length >= 2
        ? rep[rep.length - 1].scores.totalScore > rep[rep.length - 2].scores.totalScore ? 'up'
        : rep[rep.length - 1].scores.totalScore < rep[rep.length - 2].scores.totalScore ? 'down' : 'stable'
        : 'none' as const,
    };
  });

  // Radar data — use repeated scores if available, else new scores
  const hasRepeated = comparisonData.some(d => d.latestRep);
  const radarLabels = hasRepeated
    ? ['Revenue', 'Payment', 'Operational', 'Relationship', 'Value']
    : ['Commercial', 'Credibility', 'Technical'];

  const radarDatasets = comparisonData.map(d => ({
    name: d.company.companyName,
    color: d.color,
    values: hasRepeated
      ? d.latestRep
        ? [d.latestRep.revenueAvg, d.latestRep.paymentAvg, d.latestRep.operationalAvg, d.latestRep.relationshipAvg, d.latestRep.valueAvg]
        : radarLabels.map(() => 0)
      : d.latestNew
        ? [d.latestNew.commercialPotentialAvg, d.latestNew.credibilityAvg, d.latestNew.technicalClarityAvg]
        : radarLabels.map(() => 0),
  }));

  const setSlot = (idx: number, c: Company | null) => {
    setSlots(prev => { const n = [...prev]; n[idx] = c; return n; });
  };

  return (
    <div className="space-y-6 relative">
      {/* Ambient */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-80 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-pink-500/20 flex items-center justify-center">
            <GitCompareArrows className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-[0.2em]">Benchmarking</span>
        </div>
        <h1 className="text-3xl font-black text-gradient">Company Compare</h1>
        <p className="text-[#555] mt-1 text-sm">Select up to 3 companies to compare side-by-side</p>
      </motion.div>

      {/* Company Selector Grid */}
      <div className="grid grid-cols-3 gap-5">
        {slots.map((slot, i) => (
          <CompanySelector key={i} index={i} selected={slot} color={RADAR_COLORS[i]}
            onSelect={c => setSlot(i, c)} onRemove={() => setSlot(i, null)} />
        ))}
      </div>

      {/* Comparison Content */}
      <AnimatePresence>
        {selected.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }} className="space-y-6">

            {/* Score Overview Cards */}
            <div className="grid grid-cols-3 gap-5">
              {comparisonData.map((d, i) => {
                const TrendIcon = d.trend === 'up' ? TrendingUp : d.trend === 'down' ? TrendingDown : Minus;
                const trendColor = d.trend === 'up' ? '#10b981' : d.trend === 'down' ? '#ef4444' : '#666';
                return (
                  <motion.div key={d.company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${d.color}, transparent)` }} />
                    <div className="relative w-28 h-28 mx-auto mb-4">
                      <svg width={112} height={112} className="-rotate-90">
                        <circle cx={56} cy={56} r={48} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={8} />
                        <circle cx={56} cy={56} r={48} fill="none" stroke={getLevelColor(d.level)} strokeWidth={8}
                          strokeDasharray={2 * Math.PI * 48} strokeDashoffset={2 * Math.PI * 48 * (1 - d.score / 5)}
                          strokeLinecap="round" className="transition-all duration-1000"
                          style={{ filter: `drop-shadow(0 0 6px ${getLevelColor(d.level)}60)` }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black" style={{ color: getLevelColor(d.level) }}>{d.score.toFixed(2)}</span>
                      </div>
                    </div>
                    <LevelBadge level={d.level} />
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
                      <span className="text-[11px] font-medium" style={{ color: trendColor }}>
                        {d.trend === 'up' ? 'Improving' : d.trend === 'down' ? 'Declining' : d.trend === 'stable' ? 'Stable' : 'N/A'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Radar + Detail Grid */}
            <div className="grid grid-cols-12 gap-5">
              {/* Radar Chart */}
              <div className="col-span-5 glass rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Radar className="w-4 h-4 text-indigo-400" />
                  Strength Comparison
                </h2>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {comparisonData.map(d => (
                    <div key={d.company.id} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[10px] text-[#888] font-medium truncate max-w-24">{d.company.companyName.split(' ').slice(0, 3).join(' ')}</span>
                    </div>
                  ))}
                </div>
                <CompareRadar datasets={radarDatasets} labels={radarLabels} />
              </div>

              {/* Detailed Metrics */}
              <div className="col-span-7 glass rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                <h2 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Detailed Metrics
                </h2>

                {/* Header */}
                <div className="flex items-center py-2 border-b border-white/[0.06] mb-1">
                  <div className="w-44 shrink-0"><span className="text-[10px] font-bold text-[#444] uppercase tracking-wider">Metric</span></div>
                  {comparisonData.map(d => (
                    <div key={d.company.id} className="flex-1 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-[10px] font-bold truncate max-w-20" style={{ color: d.color }}>
                          {d.company.companyName.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* General Metrics */}
                <MetricRow label="Total Score" icon={Sparkles} values={comparisonData.map(d => d.score)} colors={colors} />
                <MetricRow label="Fleet Size" icon={Users} values={comparisonData.map(d => d.company.fleetSize)} colors={colors} format="number" />
                <MetricRow label="Assessments" icon={BarChart3} values={comparisonData.map(d => d.totalAssessments)} colors={colors} format="number" />
                <MetricRow label="Status" icon={Shield} values={comparisonData.map(d => getStatusLabel(d.status))} colors={colors} format="text" />

                {/* Repeated Category Scores */}
                {hasRepeated && (
                  <>
                    <div className="mt-4 mb-2 pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] font-bold text-[#444] uppercase tracking-wider">Category Breakdown (Repeated)</span>
                    </div>
                    <MetricRow label="Revenue" icon={Wallet}
                      values={comparisonData.map(d => d.latestRep?.revenueAvg ?? 0)} colors={colors} />
                    <MetricRow label="Payment" icon={Wallet}
                      values={comparisonData.map(d => d.latestRep?.paymentAvg ?? 0)} colors={colors} />
                    <MetricRow label="Operational" icon={Settings}
                      values={comparisonData.map(d => d.latestRep?.operationalAvg ?? 0)} colors={colors} />
                    <MetricRow label="Relationship" icon={Heart}
                      values={comparisonData.map(d => d.latestRep?.relationshipAvg ?? 0)} colors={colors} />
                    <MetricRow label="Value" icon={Gem}
                      values={comparisonData.map(d => d.latestRep?.valueAvg ?? 0)} colors={colors} />
                  </>
                )}
              </div>
            </div>

            {/* Category Bar Comparison */}
            {hasRepeated && (
              <div className="glass rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                <h2 className="text-sm font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Visual Score Comparison
                </h2>
                {/* Legend */}
                <div className="flex gap-4 mb-6">
                  {comparisonData.map(d => (
                    <div key={d.company.id} className="flex items-center gap-2">
                      <div className="w-3 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-[#888]">{d.company.companyName.split(' ').slice(0, 3).join(' ')}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-6">
                  {[
                    { label: 'Revenue', key: 'revenueAvg' as const, icon: Wallet },
                    { label: 'Payment', key: 'paymentAvg' as const, icon: Wallet },
                    { label: 'Operational', key: 'operationalAvg' as const, icon: Settings },
                    { label: 'Relationship', key: 'relationshipAvg' as const, icon: Heart },
                    { label: 'Value', key: 'valueAvg' as const, icon: Gem },
                  ].map(cat => (
                    <CompareBar key={cat.label} label={cat.label} icon={cat.icon}
                      values={comparisonData.map(d => d.latestRep?.[cat.key] ?? 0)}
                      colors={comparisonData.map(d => d.color)} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="flex gap-3">
              {comparisonData.map(d => (
                <Link key={d.company.id} href={`/company/${d.company.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-sm font-medium"
                  style={{ color: d.color }}>
                  View {d.company.companyName.split(' ').slice(0, 2).join(' ')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {selected.length < 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-16 text-center">
          <GitCompareArrows className="w-16 h-16 mx-auto mb-4 text-[#222]" />
          <h3 className="text-lg font-bold text-[#555]">Select at least 2 companies</h3>
          <p className="text-sm text-[#444] mt-2">Pick companies from the slots above to start comparing their scores and performance metrics</p>
        </motion.div>
      )}
    </div>
  );
}
