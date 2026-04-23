'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getCompanies, syncFromSheets } from '@/lib/store';
import { Company } from '@/lib/types';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getLevelColor, getLevelEmoji, yearsUntilLapse, calculateLTV, calculateChurnRisk } from '@/lib/scoring';
import { LevelBadge } from '@/components/LevelBadge';
import { LTVForecastChart } from '@/components/LTVForecastChart';
import { RiskMatrixChart } from '@/components/RiskMatrixChart';
import { ChartTooltip } from '@/components/ChartTooltip';
import { ClientLevel } from '@/lib/types';
import {
  Users, TrendingUp, AlertTriangle, Sparkles,
  Brain, Target, Zap, Clock, ShieldAlert, BarChart3,
  Activity, Eye, Lightbulb, Minus, TrendingDown,
  Layers, Globe, Shield, Crown, Rocket, Info,
} from 'lucide-react';

// ==================== SCORE RING ====================
function ScoreRing({ score, size = 140, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 5;

  useEffect(() => {
    setTimeout(() => setProgress(pct), 100);
  }, [pct]);

  const color = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : score >= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          className="transition-all duration-[2000ms] ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score.toFixed(2)}</span>
        <span className="text-[10px] text-[#666] uppercase tracking-wider mt-0.5">Portfolio</span>
      </div>
    </div>
  );
}

// ==================== RADAR CHART ====================
function RadarChartV2({ data }: { data: Record<string, number> }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 300); }, []);

  const labels = Object.keys(data);
  const values = Object.values(data);
  const n = labels.length;
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 90;

  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const points = values.map((v, i) => getPoint(i, show ? (v / 5) * maxR : 0));
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto">
      <defs>
        <radialGradient id="radarGlow">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[1, 2, 3, 4, 5].map(r => (
        <polygon key={r}
          points={Array.from({ length: n }, (_, i) => getPoint(i, (r / 5) * maxR)).map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke={r === 5 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'} strokeWidth={r === 5 ? 1.5 : 0.5} />
      ))}
      {labels.map((_, i) => (
        <line key={`l${i}`} x1={cx} y1={cy} x2={getPoint(i, maxR).x} y2={getPoint(i, maxR).y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
      ))}
      <polygon points={polygon} fill="url(#radarGlow)" stroke="#6366f1" strokeWidth={2} className="transition-all duration-1000" />
      {points.map((p, i) => (
        <g key={`p${i}`}>
          <circle cx={p.x} cy={p.y} r={5} fill="#6366f1" stroke="#0a0a0f" strokeWidth={2} className="transition-all duration-1000" />
          <circle cx={p.x} cy={p.y} r={8} fill="none" stroke="#6366f1" strokeWidth={1} opacity={0.3} className="transition-all duration-1000" />
        </g>
      ))}
      {labels.map((label, i) => {
        const p = getPoint(i, maxR + 28);
        return <text key={`t${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-[#888] font-medium uppercase tracking-wider">{label}</text>;
      })}
    </svg>
  );
}

// ==================== MINI BAR ====================
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(value / max) * 100}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
    </div>
  );
}

// ==================== KPI CARD ====================
function HexStat({ value, label, sub, color, icon: Icon, delay = 0 }: { value: string | number; label: string; sub: string; color: string; icon: React.ElementType; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);

  return (
    <div className={`relative group transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at center, ${color}08, transparent 70%)` }} />
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      className="relative glass rounded-2xl p-6 hover:border-[#2a2a3a] transition-all duration-300 overflow-hidden card-3d"
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
            <Icon className="w-5 h-5" style={{ color }} />
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `inset 0 0 20px ${color}10` }} />
          </div>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        </div>
        <p className="text-3xl font-black tracking-tight font-mono text-gradient-gold drop-shadow-md">{value}</p>
        <p className="text-xs text-[#888] mt-1 font-medium tracking-wide uppercase">{label}</p>
        <p className="text-[10px] text-[#555] mt-0.5">{sub}</p>
    </motion.div>
    </div>
  );
}

// ==================== ANALYTICS ====================
function useAnalytics(companies: Company[]) {
  // PERF-02 FIX: memoize all analytics computation — only recalculates when
  // companies array reference changes (after syncFromSheets or user actions).
  return useMemo(() => {
    // Helper: get the latest assessment by date without sorting the whole array (O(n) vs O(n log n))
    const latestByDate = <T extends { date: string }>(arr: T[]): T | undefined =>
      arr.length === 0 ? undefined : arr.reduce((best, cur) => (cur.date > best.date ? cur : best));

    const enriched = companies.map(c => {
      const status = getCompanyStatus(c);
      const score = getCompanyCurrentScore(c);
      const level = getCompanyCurrentLevel(c);
      const yrsLapse = yearsUntilLapse(c);

      // BUG-06 + correctness fix: hasImproved uses date-sorted top-2, not array position
      // (Sheets may return rows in any order)
      let hasImproved: boolean | null = null;
      if (c.repeatedAssessments.length >= 2 && status === 'ACTIVE_REPEATED') {
        const sorted2 = [...c.repeatedAssessments]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 2);
        hasImproved = sorted2[0].scores.totalScore > sorted2[1].scores.totalScore;
      }

      const latestRep = latestByDate(c.repeatedAssessments);

      return {
        ...c,
        status,
        score,
        level,
        yrsLapse,
        totalAssessments: c.newAssessments.length + c.repeatedAssessments.length,
        hasImproved,
        latestRepScores: latestRep?.scores ?? null,
        ltv: calculateLTV(c),
        churnRisk: calculateChurnRisk(c),
        zScore: 0,
      };
    });

    const total = enriched.length;
    const avgScore = enriched.reduce((a, c) => a + c.score, 0) / (total || 1);
    const stdDev = Math.sqrt(enriched.reduce((acc, c) => acc + Math.pow(c.score - avgScore, 2), 0) / (total || 1));

    // Assign Z-Score
    enriched.forEach(c => {
      c.zScore = stdDev > 0 ? (c.score - avgScore) / stdDev : 0;
    });

    const totalFleet = enriched.reduce((a, c) => a + c.fleetSize, 0);
    const totalLTV = enriched.reduce((a, c) => a + c.ltv.ltvValue, 0);
    const anomalies = enriched.filter(c => c.zScore <= -1.5 || (c.churnRisk.trend < 0 && c.score < 2.5));

    const byLevel = { STRATEGIC: 0, PREFERRED: 0, REGULAR: 0, HIGH_RISK: 0 };
    enriched.forEach(c => byLevel[c.level]++);

    const byStatus = { NEW_ONLY: 0, ACTIVE_REPEATED: 0, LAPSED: 0 };
    enriched.forEach(c => byStatus[c.status]++);

    const lapseRisk = enriched.filter(c => c.status === 'ACTIVE_REPEATED' && c.yrsLapse !== null && c.yrsLapse < 1).sort((a, b) => (a.yrsLapse ?? 99) - (b.yrsLapse ?? 99));
    const topPerformers = [...enriched].filter(c => c.status === 'ACTIVE_REPEATED').sort((a, b) => b.score - a.score).slice(0, 5);
    const awaitingFollowUp = enriched.filter(c => c.status === 'NEW_ONLY').sort((a, b) => b.score - a.score);

    const scoreRanges = [
      { range: '1.0-1.9', min: 1, max: 1.99, count: 0, color: '#ef4444' },
      { range: '2.0-2.9', min: 2, max: 2.99, count: 0, color: '#f59e0b' },
      { range: '3.0-3.4', min: 3, max: 3.49, count: 0, color: '#3b82f6' },
      { range: '3.5-3.9', min: 3.5, max: 3.99, count: 0, color: '#6366f1' },
      { range: '4.0-4.4', min: 4, max: 4.49, count: 0, color: '#10b981' },
      { range: '4.5-5.0', min: 4.5, max: 5, count: 0, color: '#059669' },
    ];
    enriched.forEach(c => {
      const r = scoreRanges.find(sr => c.score >= sr.min && c.score <= sr.max);
      if (r) r.count++;
    });

    // BUG-06 FIX: scope improving/declining to ACTIVE_REPEATED only.
    // Old code counted ALL companies with 2+ assessments (including LAPSED),
    // then subtracted from ACTIVE_REPEATED count → stableCount could go negative.
    const activeWithTrend = enriched.filter(c => c.status === 'ACTIVE_REPEATED' && c.hasImproved !== null);
    const improvingCount = activeWithTrend.filter(c => c.hasImproved === true).length;
    const decliningCount = activeWithTrend.filter(c => c.hasImproved === false).length;
    const stableCount = Math.max(0, byStatus.ACTIVE_REPEATED - improvingCount - decliningCount);

    const byLocation: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
    enriched.forEach(c => {
      const loc = c.location.split(',').pop()?.trim() || c.location || 'Unknown';
      if (!byLocation[loc]) byLocation[loc] = { count: 0, avgScore: 0, scores: [] };
      byLocation[loc].count++;
      byLocation[loc].scores.push(c.score);
    });
    Object.values(byLocation).forEach(v => { v.avgScore = v.scores.reduce((a, b) => a + b, 0) / v.scores.length; });

    const repCompanies = enriched.filter(c => c.latestRepScores);
    const categoryAvgs = repCompanies.length > 0 ? {
      Revenue: repCompanies.reduce((a, c) => a + (c.latestRepScores?.revenueAvg ?? 0), 0) / repCompanies.length,
      Payment: repCompanies.reduce((a, c) => a + (c.latestRepScores?.paymentAvg ?? 0), 0) / repCompanies.length,
      Operations: repCompanies.reduce((a, c) => a + (c.latestRepScores?.operationalAvg ?? 0), 0) / repCompanies.length,
      Relationship: repCompanies.reduce((a, c) => a + (c.latestRepScores?.relationshipAvg ?? 0), 0) / repCompanies.length,
      Value: repCompanies.reduce((a, c) => a + (c.latestRepScores?.valueAvg ?? 0), 0) / repCompanies.length,
    } : null;

    const conversionRate = total > 0 ? (byStatus.ACTIVE_REPEATED / total * 100) : 0;

    const insights: { type: 'warning' | 'success' | 'info'; message: string; action: string }[] = [];
    if (lapseRisk.length > 0) insights.push({ type: 'warning', message: `${lapseRisk.length} client mendekati batas 3 tahun lapse`, action: 'Prioritaskan deal baru' });
    if (awaitingFollowUp.length > 0) insights.push({ type: 'info', message: `${awaitingFollowUp.length} client baru belum ada penilaian lanjutan`, action: 'Tindak lanjuti' });
    if (decliningCount > 0) insights.push({ type: 'warning', message: `${decliningCount} client menunjukkan tren skor menurun`, action: 'Review & improvement' });
    if (improvingCount > 0) insights.push({ type: 'success', message: `${improvingCount} client menunjukkan tren skor meningkat`, action: 'Pertahankan' });
    if (byLevel.HIGH_RISK > 0) insights.push({ type: 'warning', message: `${byLevel.HIGH_RISK} client dalam kategori HIGH RISK`, action: 'Evaluasi kerjasama' });
    if (anomalies.length > 0) insights.push({ type: 'warning', message: `${anomalies.length} client menunjukkan anomali statistik penurunan ekstrem (Z-Score < -1.5)`, action: 'Investigasi Segera' });

    return {
      enriched, total, avgScore, totalFleet, byLevel, byStatus, lapseRisk,
      topPerformers, awaitingFollowUp, scoreRanges, improvingCount, decliningCount,
      stableCount, byLocation, categoryAvgs, conversionRate, insights, totalLTV, anomalies
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);
}

// ==================== MAIN DASHBOARD ====================
export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompanies(getCompanies()); // instant from cache
    setMounted(true);
    // Sync from Sheets in background
    syncFromSheets().then(companies => setCompanies(companies)).catch(() => {});
  }, []);

  const a = useAnalytics(companies);

  const healthScore = a.total > 0 ? Math.round(
    (a.byLevel.STRATEGIC * 100 + a.byLevel.PREFERRED * 75 + a.byLevel.REGULAR * 40 + a.byLevel.HIGH_RISK * 10) / a.total
  ) : 0;

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen">
      {/* Ambient Glow Orbs */}
      <div className="absolute rounded-full blur-3xl opacity-15 pointer-events-none w-[400px] h-[400px] bg-blue-500" style={{ top: '-5%', left: '10%', animation: 'float 12s ease-in-out infinite' }} />
      <div className="absolute rounded-full blur-3xl opacity-10 pointer-events-none w-[350px] h-[350px] bg-purple-500" style={{ top: '30%', left: '70%', animation: 'float 10s ease-in-out infinite 2s' }} />
      <div className="absolute rounded-full blur-3xl opacity-10 pointer-events-none w-[300px] h-[300px] bg-emerald-500" style={{ top: '60%', left: '5%', animation: 'float 14s ease-in-out infinite 4s' }} />

      <div className="relative z-10 space-y-8">

        {/* ====== HERO HEADER ====== */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.04] glass-strong"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05), rgba(16,185,129,0.03))' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%)' }} />
          <div className="relative flex items-center justify-between p-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] text-purple-400 font-semibold uppercase tracking-[0.15em]">Decision Intelligence</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400 font-medium">Live</span>
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent drop-shadow-sm"
                style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #a0a0c0 100%)' }}>
                SCOREHUB ANALYTICS
              </h1>
              <p className="text-[#555] mt-2 text-sm max-w-md">Maritime client portfolio intelligence — powered by multi-dimensional scoring algorithms</p>
            </div>
            <div className="flex items-center gap-10">
              <ScoreRing score={a.avgScore} />
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider">Portfolio Health</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-24 rounded-full bg-white/[0.03] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${healthScore}%`,
                          background: healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444',
                          boxShadow: `0 0 12px ${healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}40`,
                        }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {healthScore}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#555] uppercase tracking-wider font-mono">Conversion</p>
                  <p className="text-lg font-black text-purple-400 font-mono text-gradient">{a.conversionRate.toFixed(0)}%</p>
                </div>
                <div className="text-[10px] text-[#444]">
                  Updated {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ====== KPI CARDS ====== */}
        <div className="grid grid-cols-5 gap-4">
          <HexStat value={a.total} label="Total Companies" sub={`${a.totalFleet} fleet units`} color="#3b82f6" icon={Users} delay={100} />
          <HexStat value={a.avgScore.toFixed(2)} label="Portfolio Score" sub="Weighted average" color="#10b981" icon={Target} delay={200} />
          <HexStat value={`${a.conversionRate.toFixed(0)}%`} label="Conversion Rate" sub="New → Repeated" color="#8b5cf6" icon={Zap} delay={300} />
          <HexStat value={a.lapseRisk.length} label="At Risk" sub="Near 3yr lapse" color="#ef4444" icon={ShieldAlert} delay={400} />
          <HexStat value={a.byStatus.NEW_ONLY} label="Awaiting Follow-up" sub="Pre-judgement only" color="#f59e0b" icon={Clock} delay={500} />
        </div>

        {/* ====== AI INSIGHTS ====== */}
        {a.insights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.04] glass"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.03), rgba(139,92,246,0.03))' }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 via-purple-500 to-blue-500" />
            <div className="p-6 pl-8">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #fbbf24, #a78bfa)' }}>
                  AI Decision Insights
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {a.insights.map((ins, i) => (
                  <div key={i} className={`rounded-xl px-4 py-3 flex items-center justify-between border backdrop-blur-sm ${
                    ins.type === 'warning' ? 'border-amber-500/15 bg-amber-500/[0.03]' :
                    ins.type === 'success' ? 'border-emerald-500/15 bg-emerald-500/[0.03]' :
                    'border-blue-500/15 bg-blue-500/[0.03]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ins.type === 'warning' ? 'bg-amber-500/10' : ins.type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                      }`}>
                        {ins.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {ins.type === 'success' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                        {ins.type === 'info' && <Eye className="w-4 h-4 text-blue-400" />}
                      </div>
                      <span className="text-sm">{ins.message}</span>
                    </div>
                    <span className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold ${
                      ins.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      ins.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{ins.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ====== ADVANCED DATA SCIENCE ====== */}
        <div className="grid grid-cols-12 gap-5">
          {/* LTV Forecast */}
          <div className="col-span-7 glass-strong rounded-2xl p-6 relative overflow-hidden flex flex-col group">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
            <div className="relative z-10 flex-1">
              <LTVForecastChart currentLTV={a.totalLTV} historicalTrend={5.2} />
            </div>
            
            <div className="absolute top-6 right-6">
              <ChartTooltip content={
                <>
                  <strong className="text-emerald-400 block mb-1">Cara Membaca Grafik:</strong>
                  Grafik ini memproyeksikan <strong className="text-white">Lifetime Value (LTV)</strong> seluruh klien. Garis naik menunjukkan potensi pertumbuhan pendapatan, sementara area bercahaya adalah akumulasi aset berjalan.
                </>
              } />
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-[#666]">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Algoritma Prediksi Regresi</span>
              <span>Proyeksi 3-5 Tahun (Asumsi churn rate konstan)</span>
            </div>
          </div>

          {/* Risk vs Value Matrix */}
          <div className="col-span-5 glass rounded-2xl p-6 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />The Risk Matrix (Churn vs LTV)
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-amber-400 block mb-1">Cara Membaca Matrix:</strong>
                  • <strong className="text-red-400">Pojok Kanan Atas (Critical Alert)</strong>: Klien paling berharga tapi paling berisiko kabur.<br/>
                  • <strong className="text-emerald-400">Pojok Kanan Bawah (Safe VIP)</strong>: Klien paling setia dan menguntungkan.<br/>
                  • Titik berdenyut (<span className="text-red-400">Ping</span>) menandakan anomali statistik tiba-tiba.
                </>
              } />
            </div>
            <RiskMatrixChart data={a.enriched.map(c => ({
              id: c.id,
              name: c.companyName,
              ltv: c.ltv.ltvValue,
              churnProb: c.churnRisk.trend, // Map trend (0-100) as churnProb
              level: c.level,
              zScore: c.zScore || 0
            }))} />
          </div>
        </div>

        {/* ====== MAIN GRID ====== */}
        <div className="grid grid-cols-12 gap-5">
          {/* Pipeline */}
          <div className="col-span-3 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-32 opacity-5"
              style={{ background: 'linear-gradient(to top, #06b6d4, transparent)' }} />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />Client Pipeline
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-cyan-400 block mb-1">Client Pipeline:</strong>
                  Menampilkan status pergerakan klien (Pre-judgement, Active, Lapsed) beserta tren kenaikan atau penurunan performa secara keseluruhan.
                </>
              } />
            </div>
            <div className="space-y-4 relative">
              {[
                { label: 'Pre-judgement', count: a.byStatus.NEW_ONLY, color: '#06b6d4', icon: '🆕' },
                { label: 'Active Repeated', count: a.byStatus.ACTIVE_REPEATED, color: '#8b5cf6', icon: '🔄' },
                { label: 'Lapsed (>3yr)', count: a.byStatus.LAPSED, color: '#f59e0b', icon: '⏰' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs flex items-center gap-2 font-medium"><span className="text-base">{item.icon}</span>{item.label}</span>
                    <span className="text-lg font-black" style={{ color: item.color }}>{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max((item.count / a.total) * 100, 5)}%`, background: `linear-gradient(90deg, ${item.color}60, ${item.color})`, boxShadow: `0 0 12px ${item.color}30` }} />
                  </div>
                  <p className="text-[10px] text-[#555] mt-1 text-right">{(item.count / a.total * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-3">Trend Direction</h3>
              <div className="space-y-3">
                {[
                  { label: 'Improving', count: a.improvingCount, icon: TrendingUp, color: '#10b981' },
                  { label: 'Stable', count: a.stableCount, icon: Minus, color: '#666' },
                  { label: 'Declining', count: a.decliningCount, icon: TrendingDown, color: '#ef4444' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs"><t.icon className="w-3.5 h-3.5" style={{ color: t.color }} /><span style={{ color: t.color }}>{t.label}</span></span>
                    <span className="text-sm font-bold" style={{ color: t.color }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="col-span-5 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />Score Distribution
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-blue-400 block mb-1">Score Distribution:</strong>
                  Distribusi skor klien dalam portofolio Anda. Semakin banyak histogram yang condong ke kanan (hijau/biru), semakin sehat portofolio Anda.
                </>
              } />
            </div>
            <div className="flex items-end gap-3 h-36 mb-3">
              {a.scoreRanges.map((r, i) => {
                const maxCount = Math.max(...a.scoreRanges.map(sr => sr.count), 1);
                const height = (r.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    {r.count > 0 && <span className="text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: r.color }}>{r.count}</span>}
                    <div className="w-full rounded-xl transition-all duration-700 group-hover:scale-105 relative overflow-hidden" style={{ height: `${Math.max(height, 6)}%` }}>
                      <div className="absolute inset-0 rounded-xl" style={{ background: `linear-gradient(to top, ${r.color}90, ${r.color}40)` }} />
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `inset 0 0 20px ${r.color}30, 0 0 20px ${r.color}20` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              {a.scoreRanges.map((r, i) => <div key={i} className="flex-1 text-center text-[9px] text-[#555] font-mono">{r.range}</div>)}
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.04]">
              <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-4">Level Breakdown</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['STRATEGIC', 'PREFERRED', 'REGULAR', 'HIGH_RISK'] as ClientLevel[]).map(level => {
                  const count = a.byLevel[level];
                  const pct = (count / a.total) * 100;
                  const color = getLevelColor(level);
                  return (
                    <div key={level} className="rounded-xl border border-white/[0.04] p-3 hover:border-white/[0.08] transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{getLevelEmoji(level)}</span>
                        <span className="text-[11px] font-bold" style={{ color }}>{level.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-black">{count}</span>
                        <span className="text-[10px] font-mono text-[#555]">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2"><MiniBar value={pct} max={100} color={color} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Radar */}
          <div className="col-span-4 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 opacity-5" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />Portfolio Strength
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-purple-400 block mb-1">Portfolio Strength:</strong>
                  Radar chart rata-rata kekuatan armada klien berdasarkan kategori operasional, finansial, dan komunikasi.
                </>
              } />
            </div>
            {a.categoryAvgs ? (
              <>
                <RadarChartV2 data={a.categoryAvgs} />
                <div className="mt-4 space-y-2">
                  {Object.entries(a.categoryAvgs).map(([k, v]) => {
                    const color = v >= 4 ? '#10b981' : v >= 3 ? '#3b82f6' : '#f59e0b';
                    return (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-xs text-[#888] font-medium">{k}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20"><MiniBar value={v} max={5} color={color} /></div>
                          <span className="text-xs font-mono font-bold w-8 text-right" style={{ color }}>{v.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-[#333]">
                <Layers className="w-10 h-10 mb-3" /><p className="text-sm">No repeated data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ====== RISK + TOP + FOLLOWUP ====== */}
        <div className="grid grid-cols-3 gap-5">
          {/* Lapse Risk */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />Lapse Risk Alert
                {a.lapseRisk.length > 0 && <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">{a.lapseRisk.length}</span>}
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-red-400 block mb-1">Lapse Risk Alert:</strong>
                  Daftar klien yang masa aktif penilaiannya hampir melewati batas kedaluwarsa 3 tahun. Hubungi segera untuk *re-assessment*.
                </>
              } />
            </div>
            {a.lapseRisk.length > 0 ? (
              <div className="space-y-2">
                {a.lapseRisk.map(c => (
                  <Link key={c.id} href={`/company/${c.id}`} className="block rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4 hover:border-red-500/25 hover:bg-red-500/[0.05] transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold group-hover:text-red-400 transition-colors">{c.companyName}</p>
                        <p className="text-[10px] text-[#555] mt-0.5">{c.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-red-400">{c.yrsLapse?.toFixed(1)}yr</p>
                        <p className="text-[10px] text-[#555]">{c.score.toFixed(2)} pts</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-[#333]">
                <Shield className="w-10 h-10 mb-3" /><p className="text-xs font-medium">All clear — no lapse risks</p>
              </div>
            )}
            {a.byStatus.LAPSED > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <h3 className="text-xs font-bold text-amber-400 mb-2">⏰ Already Lapsed</h3>
                {a.enriched.filter(c => c.status === 'LAPSED').map(c => (
                  <Link key={c.id} href={`/company/${c.id}`} className="block rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3 mt-2 hover:border-amber-500/25 transition-all">
                    <p className="text-sm font-bold">{c.companyName}</p>
                    <p className="text-[10px] text-[#555]">Restart as New Customer</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />Top Performing Clients
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-amber-400 block mb-1">Top Performing Clients:</strong>
                  Peringkat klien aktif dengan skor paling tinggi. Sangat direkomendasikan untuk diberikan prioritas layanan (VIP).
                </>
              } />
            </div>
            <div className="space-y-2">
              {a.topPerformers.map((c, i) => (
                <Link key={c.id} href={`/company/${c.id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.04] p-3.5 hover:border-white/[0.08] hover:bg-white/[0.01] transition-all group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: i === 0 ? 'linear-gradient(135deg, #fbbf2420, #f59e0b10)' : 'rgba(255,255,255,0.02)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{c.companyName}</p>
                    <p className="text-[10px] text-[#555]">{c.repeatedAssessments.length} assessments · Fleet {c.fleetSize}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-black" style={{ color: getLevelColor(c.level) }}>{c.score.toFixed(2)}</span>
                    <div className="mt-0.5"><LevelBadge level={c.level} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Awaiting Follow-up */}
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Rocket className="w-4 h-4 text-cyan-400" />Awaiting Follow-up
                <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">{a.awaitingFollowUp.length}</span>
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-cyan-400 block mb-1">Awaiting Follow-up:</strong>
                  Klien yang baru dinilai satu kali (Pre-judgement) dan belum memiliki sejarah penilaian berkelanjutan.
                </>
              } />
            </div>
            <div className="space-y-2">
              {a.awaitingFollowUp.slice(0, 6).map(c => (
                <Link key={c.id} href={`/company/${c.id}`} className="flex items-center gap-3 rounded-xl border border-white/[0.04] p-3.5 hover:border-cyan-500/15 hover:bg-cyan-500/[0.02] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0"><span className="text-base">🆕</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-cyan-400 transition-colors">{c.companyName}</p>
                    <p className="text-[10px] text-[#555]">Pre-judgement: {new Date(c.newAssessments[0]?.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-mono font-bold text-cyan-400">{c.score.toFixed(2)}</span>
                    <p className="text-[10px] text-amber-400 mt-0.5">No deal yet</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ====== GEO + REFERENCE ====== */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />Geographic Portfolio
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-emerald-400 block mb-1">Geographic Portfolio:</strong>
                  Perbandingan rata-rata skor performa berdasarkan lokasi operasional (*base*) klien.
                </>
              } />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(a.byLocation).sort((x, y) => y[1].count - x[1].count).map(([loc, data]) => {
                const color = data.avgScore >= 4 ? '#10b981' : data.avgScore >= 3 ? '#3b82f6' : '#f59e0b';
                return (
                  <div key={loc} className="rounded-xl border border-white/[0.04] p-4 hover:border-white/[0.08] transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at bottom, ${color}05, transparent 70%)` }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold">{loc}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}15`, color }}>{data.count}</span>
                      </div>
                      <p className="text-2xl font-black" style={{ color }}>{data.avgScore.toFixed(2)}</p>
                      <p className="text-[10px] text-[#555] mt-0.5 mb-2">avg score</p>
                      <MiniBar value={data.avgScore} max={5} color={color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-4 glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />Scoring Levels
              </h2>
              <ChartTooltip content={
                <>
                  <strong className="text-amber-400 block mb-1">Scoring Levels:</strong>
                  Klasifikasi level klien berdasarkan perhitungan akhir skor ScoreHub. Menentukan perlakuan strategi bisnis Anda terhadap mereka.
                </>
              } />
            </div>
            <div className="space-y-3">
              {[
                { level: 'STRATEGIC', range: '> 4.00', desc: 'VIP treatment', color: '#10b981', emoji: '🏆' },
                { level: 'PREFERRED', range: '≥ 3.00', desc: 'Maintain relationship', color: '#3b82f6', emoji: '⭐' },
                { level: 'REGULAR', range: '≥ 2.00', desc: 'Monitor & evaluate', color: '#f59e0b', emoji: '📊' },
                { level: 'HIGH RISK', range: '< 2.00', desc: 'Reconsider', color: '#ef4444', emoji: '⚠️' },
              ].map((t) => (
                <div key={t.level} className="flex items-center gap-3 rounded-xl border border-white/[0.04] p-3.5 hover:border-white/[0.08] transition-all">
                  <span className="text-xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: t.color }}>{t.level}</p>
                    <p className="text-[10px] text-[#555]">{t.desc}</p>
                  </div>
                  <span className="text-sm font-mono font-black" style={{ color: t.color }}>{t.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
