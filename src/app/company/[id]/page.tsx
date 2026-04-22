'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCompanies, syncFromSheets } from '@/lib/store';
import { Company } from '@/lib/types';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getLevelColor, getStatusLabel, getStatusColor, daysSinceLastDeal, yearsUntilLapse, generateAIExecutiveSummary, calculateChurnRisk, calculateLTV } from '@/lib/scoring';
import { ScoreRing } from '@/components/ScoreRing';
import { LevelBadge } from '@/components/LevelBadge';
import { ArrowLeft, Building2, MapPin, User, Calendar, Ship, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, FileText, Download, Sparkles, Activity, Target, Edit2, Trash2 } from 'lucide-react';
import { exportCompanyReportPDF, exportAssessmentPDF } from '@/lib/exportPdf';
import { CompanyStatus, NewAssessment, RepeatedAssessment, NewCustomerInput, RepeatedCustomerInput } from '@/lib/types';
import { deleteAssessment } from '@/lib/store';
import { EditAssessmentModal } from '@/components/EditAssessmentModal';

function RawDataViewer({ input, type }: { input: any, type: 'NEW' | 'REPEATED' }) {
  const formatCurrency = (val?: number) => val !== undefined && val !== null ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val) : '-';
  const formatPercent = (val?: number) => val !== undefined && val !== null ? `${val}%` : '-';
  const formatStr = (val?: any) => (val !== undefined && val !== null && String(val).trim() !== '') ? String(val) : '-';
  const formatBool = (val?: boolean) => val === true ? 'Yes' : val === false ? 'No' : '-';

  if (type === 'NEW') {
    const d = input as NewCustomerInput;
    return (
      <div className="bg-[#11111a] rounded-lg p-4 mt-4 border border-[#2a2a3a]">
        <h4 className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-3">Raw Imported Data</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 text-xs">
          <div><span className="text-[#555] block mb-0.5">Est. Value (Project)</span><span className="font-semibold text-white">{formatCurrency(d.estimatedValue)}</span></div>
          <div><span className="text-[#555] block mb-0.5">Term Payment</span><span className="font-semibold text-white">{formatStr(d.termPayment)} hari</span></div>
          <div><span className="text-[#555] block mb-0.5">Fleet Size</span><span className="font-semibold text-white">{formatStr(d.fleetSize)} vessels</span></div>
          <div><span className="text-[#555] block mb-0.5">Reference</span><span className="font-semibold text-white">{formatBool(d.hasReference)}</span></div>
          <div className="col-span-2"><span className="text-[#555] block mb-0.5">Legal Documents</span><span className="font-semibold text-[#ccc]">{formatStr(d.legalDocuments)}</span></div>
          <div className="col-span-2"><span className="text-[#555] block mb-0.5">Technical Documents</span><span className="font-semibold text-[#ccc]">{formatStr(d.technicalDocuments)}</span></div>
        </div>
      </div>
    );
  }

  const r = input as RepeatedCustomerInput;
  return (
    <div className="bg-[#11111a] rounded-lg p-4 mt-4 border border-[#2a2a3a]">
      <h4 className="text-[10px] font-bold text-[#888] uppercase tracking-widest mb-3">Raw Imported Data</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-3 gap-x-4 text-xs">
        <div><span className="text-[#555] block mb-0.5">Profit Margin</span><span className="font-semibold text-white">{formatPercent(r.margin)}</span></div>
        <div><span className="text-[#555] block mb-0.5">Kontribusi Omset</span><span className="font-semibold text-white">{formatPercent(r.kontribusiOmset)}</span></div>
        <div><span className="text-[#555] block mb-0.5">Fleet Size</span><span className="font-semibold text-white">{formatStr(r.fleetSize)} vessels</span></div>
        <div><span className="text-[#555] block mb-0.5">Kerjasama</span><span className="font-semibold text-white">{formatStr(r.lamaKerjasama)} tahun</span></div>
        <div><span className="text-[#555] block mb-0.5">Referral</span><span className="font-semibold text-white">{formatBool(r.hasReferral)}</span></div>
        
        <div><span className="text-[#555] block mb-0.5">Ketepatan Bayar</span><span className="font-semibold text-white">{r.ketepatanBayarHari !== undefined && r.ketepatanBayarHari !== null ? `${r.ketepatanBayarHari} hari telat` : '-'}</span></div>
        <div><span className="text-[#555] block mb-0.5">Revisi Invoice</span><span className="font-semibold text-white">{formatStr(r.revisiInvoice)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Penagihan</span><span className="font-semibold text-white">{formatStr(r.penagihanCount)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Cancel Order</span><span className="font-semibold text-white">{formatStr(r.cancelOrder)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Schedule Variance</span><span className="font-semibold text-white">{r.scheduleVariance !== undefined && r.scheduleVariance !== null ? `${r.scheduleVariance} hari` : '-'}</span></div>
        
        <div><span className="text-[#555] block mb-0.5">Konflik QC</span><span className="font-semibold text-white">{formatStr(r.konflikQC)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Intervensi</span><span className="font-semibold text-white">{formatStr(r.intervensi)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Claim Count</span><span className="font-semibold text-white">{formatStr(r.claimCount)} kali</span></div>
        <div><span className="text-[#555] block mb-0.5">Komunikasi PIC</span><span className="font-semibold text-white">{formatStr(r.komunikasiPIC)}</span></div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : score >= 2 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#888]">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CompanyStatus }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  const icon = status === 'NEW_ONLY' ? '🆕' : status === 'ACTIVE_REPEATED' ? '🔄' : '⏰';
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border" style={{ borderColor: `${color}30`, background: `${color}10`, color }}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return <Minus className="w-4 h-4 text-[#555]" />;
  if (diff > 0) return <div className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-4 h-4" /><span className="text-xs font-mono">+{diff.toFixed(2)}</span></div>;
  return <div className="flex items-center gap-1 text-red-400"><TrendingDown className="w-4 h-4" /><span className="text-xs font-mono">{diff.toFixed(2)}</span></div>;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<{ data: NewAssessment | RepeatedAssessment; type: 'NEW' | 'REPEATED' } | null>(null);

  const refreshData = () => setCompanies(getCompanies());

  useEffect(() => {
    setCompanies(getCompanies());
    setMounted(true);
    syncFromSheets().then(c => setCompanies(c)).catch(() => {});
  }, []);

  if (!mounted) return null;

  const company = companies.find(c => c.id === params.id);

  const handleDeleteAssessment = (assessmentId: string, type: 'NEW' | 'REPEATED') => {
    const msg = `Hapus assessment ini? Data tidak bisa dikembalikan.`;
    if (window.confirm(msg)) {
      deleteAssessment(company!.id, assessmentId, type);
      refreshData();
    }
  };

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-[#555]">
        <Building2 className="w-16 h-16 mb-4" />
        <p className="text-lg">Company not found</p>
        <Link href="/data-master" className="mt-4 text-blue-400 text-sm hover:underline">← Back to Data Master</Link>
      </div>
    );
  }

  const status = getCompanyStatus(company);
  const currentScore = getCompanyCurrentScore(company);
  const currentLevel = getCompanyCurrentLevel(company);
  const daysLast = daysSinceLastDeal(company);
  const yrsLapse = yearsUntilLapse(company);

  // All assessments sorted by date
  const allAssessments = [
    ...company.newAssessments.map(a => ({ type: 'NEW' as const, data: a, date: a.date, score: a.scores.totalScore })),
    ...company.repeatedAssessments.map(a => ({ type: 'REPEATED' as const, data: a, date: a.date, score: a.scores.totalScore })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Score trend for sparkline
  const scoreTrend = allAssessments.map(a => a.score);
  const maxTrend = Math.max(...scoreTrend, 5);
  const minTrend = Math.min(...scoreTrend, 0);

  return (
    <div className="space-y-8 relative">
      {editingAssessment && company && (
        <EditAssessmentModal
          companyId={company.id}
          assessment={editingAssessment.data}
          type={editingAssessment.type}
          onClose={() => setEditingAssessment(null)}
          onSaved={refreshData}
        />
      )}
      <div className="fixed top-20 right-20 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/data-master" className="inline-flex items-center gap-1.5 text-sm text-[#666] hover:text-blue-400 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Data Master
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{company.companyName}</h1>
            <div className="flex items-center gap-4 mt-2">
              <StatusBadge status={status} />
              <LevelBadge level={currentLevel} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <ScoreRing score={currentScore} level={currentLevel} size={120} label="Current Score" />
            <button onClick={() => exportCompanyReportPDF(company)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:border-blue-500/40 hover:from-blue-600/30 hover:to-purple-600/30 transition-all">
              <Download className="w-3.5 h-3.5" /> Export Full Report (PDF)
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-6 gap-4">
        {[
          { icon: <User className="w-4 h-4 text-blue-400" />, label: 'Contact', value: company.contactPerson },
          { icon: <MapPin className="w-4 h-4 text-purple-400" />, label: 'Location', value: company.location },
          { icon: <Ship className="w-4 h-4 text-cyan-400" />, label: 'Fleet', value: `${company.fleetSize} vessels` },
          { icon: <Calendar className="w-4 h-4 text-emerald-400" />, label: 'Registered', value: new Date(company.registeredDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) },
          { icon: <FileText className="w-4 h-4 text-amber-400" />, label: 'Assessments', value: `${company.newAssessments.length + company.repeatedAssessments.length} total` },
          { icon: <Clock className="w-4 h-4 text-pink-400" />, label: 'Last Deal', value: daysLast !== null ? `${daysLast} days ago` : 'No deal yet' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-[10px] text-[#555] uppercase">{card.label}</span></div>
            <p className="text-sm font-medium">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Executive Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-indigo-300">
          <Sparkles className="w-4 h-4" /> AI Executive Summary
        </h2>
        <p className="text-sm text-[#ddd] leading-relaxed italic">
          "{generateAIExecutiveSummary(company)}"
        </p>
      </motion.div>

      {/* Predictive Intelligence */}
      {status === 'ACTIVE_REPEATED' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
          <div className="glass-strong rounded-2xl p-5 border border-white/[0.05]">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-rose-400" /> Churn Risk Analysis
            </h2>
            {(() => {
              const churn = calculateChurnRisk(company);
              const color = churn.risk === 'HIGH' ? 'text-red-400' : churn.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400';
              return (
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className={`text-2xl font-black ${color}`}>{churn.risk}</span>
                    <span className="text-xs text-[#888]">RISK LEVEL</span>
                  </div>
                  <p className="text-xs text-[#aaa]">{churn.message}</p>
                </div>
              );
            })()}
          </div>
          <div className="glass-strong rounded-2xl p-5 border border-white/[0.05]">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-emerald-400" /> Est. Lifetime Value (LTV)
            </h2>
            {(() => {
              const ltv = calculateLTV(company);
              const trendColor = ltv.potential === 'GROWING' ? 'text-emerald-400' : ltv.potential === 'DECLINING' ? 'text-red-400' : 'text-amber-400';
              return (
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-black font-mono text-emerald-300">
                      Rp {(ltv.ltvValue / 1_000_000_000).toFixed(1)} M
                    </span>
                    <span className="text-xs text-[#888]">Est. Potential</span>
                  </div>
                  <p className="text-xs text-[#aaa]">
                    Trend potensi: <span className={`font-semibold ${trendColor}`}>{ltv.potential}</span>
                  </p>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* 3-Year Rule Alert */}
      {status === 'NEW_ONLY' && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-cyan-400">Pre-judgement Only — Belum Ada Penilaian Lanjutan</p>
            <p className="text-xs text-[#888] mt-1">Perusahaan ini baru memiliki penilaian awal (New Customer). Belum ada deal/project yang terealisasi untuk dilakukan penilaian Repeated Customer.</p>
          </div>
        </div>
      )}
      {status === 'LAPSED' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Lapsed — Lebih dari 3 Tahun Tanpa Deal</p>
            <p className="text-xs text-[#888] mt-1">Terakhir deal pada {company.lastDealDate ? new Date(company.lastDealDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}. Jika ingin bekerja sama lagi, perusahaan ini harus dimulai dari penilaian New Customer kembali.</p>
          </div>
        </div>
      )}
      {status === 'ACTIVE_REPEATED' && yrsLapse !== null && yrsLapse < 1 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Approaching Lapse Window</p>
            <p className="text-xs text-[#888] mt-1">Sisa {yrsLapse.toFixed(1)} tahun sebelum status menjadi Lapsed. Pertimbangkan untuk segera melakukan deal baru.</p>
          </div>
        </div>
      )}

      {/* Score Trend Sparkline */}
      {scoreTrend.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-strong rounded-2xl p-6 gradient-border">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Score Progression
          </h2>
          <div className="flex items-end gap-1 h-24">
            {allAssessments.map((a, i) => {
              const height = ((a.score - minTrend) / (maxTrend - minTrend)) * 100;
              const color = a.type === 'NEW' ? '#06b6d4' : '#8b5cf6';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 bg-[#1a1a2e] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10" style={{ color }}>
                    {a.score.toFixed(2)} — {a.type}
                  </div>
                  <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${height}%`, background: color, minHeight: 4, opacity: 0.8 }} />
                  <span className="text-[9px] text-[#555] truncate w-full text-center">{new Date(a.date).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-cyan-500" /><span className="text-[10px] text-[#666]">New (Pre-judgement)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-purple-500" /><span className="text-[10px] text-[#666]">Repeated (Follow-up)</span></div>
          </div>
        </motion.div>
      )}

      {/* Assessment Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-strong rounded-2xl p-6 gradient-border">
        <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Assessment Timeline
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[#1a1a2e]" />

          <div className="space-y-6">
            {[...allAssessments].reverse().map((assessment, idx) => {
              const isNew = assessment.type === 'NEW';
              const color = isNew ? '#06b6d4' : '#8b5cf6';
              const prevScore = idx < allAssessments.length - 1 ? [...allAssessments].reverse()[idx + 1]?.score : null;

              return (
                <div key={`${assessment.type}-${idx}`} className="relative pl-16">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: color, background: `${color}20` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  </div>

                  <div className="rounded-xl border border-[#1a1a2e] p-5 hover:border-[#2a2a3a] transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: `${color}15`, color }}>
                            {isNew ? '🆕 NEW — Pre-judgement' : '🔄 REPEATED — Follow-up'}
                          </span>
                          {prevScore !== null && <TrendIndicator current={assessment.score} previous={prevScore} />}
                        </div>
                        <h3 className="font-semibold">{isNew ? (assessment.data as NewAssessment).projectName : (assessment.data as RepeatedAssessment).projectName}</h3>
                        <p className="text-xs text-[#555] mt-0.5">
                          {new Date(assessment.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                          {!isNew && ` • Period: ${(assessment.data as RepeatedAssessment).periodStart} — ${(assessment.data as RepeatedAssessment).periodEnd}`}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="text-2xl font-mono font-bold" style={{ color: getLevelColor(isNew ? (assessment.data as NewAssessment).scores.level : (assessment.data as RepeatedAssessment).scores.level) }}>
                          {assessment.score.toFixed(2)}
                        </span>
                        <div className="mt-1">
                          <LevelBadge level={isNew ? (assessment.data as NewAssessment).scores.level : (assessment.data as RepeatedAssessment).scores.level} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => setEditingAssessment({ data: assessment.data, type: assessment.type })}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(assessment.data.id, assessment.type)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                          <button onClick={() => exportAssessmentPDF(company, assessment.data as NewAssessment | RepeatedAssessment, assessment.type)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border border-[#2a2a3a] text-[#666] hover:text-blue-400 hover:border-blue-500/30 transition-all">
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {isNew ? (() => {
                      const s = (assessment.data as NewAssessment).scores;
                      return (
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#1a1a2e]">
                          <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Commercial (50%)</p>
                            <ScoreBar label="Fleet Size" score={s.fleetScore} />
                            <div className="mt-1"><ScoreBar label="Est. Value" score={s.valueScore} /></div>
                            <div className="mt-1"><ScoreBar label="Term Payment" score={s.termPaymentScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">Weighted: <span className="text-blue-400">{s.commercialPotentialWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-purple-400 uppercase mb-2">Credibility (30%)</p>
                            <ScoreBar label="Legal Docs" score={s.legalScore} />
                            <div className="mt-1"><ScoreBar label="Background" score={s.backgroundScore} /></div>
                            <div className="mt-1"><ScoreBar label="Reference" score={s.referenceScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">Weighted: <span className="text-purple-400">{s.credibilityWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-cyan-400 uppercase mb-2">Technical (20%)</p>
                            <ScoreBar label="Tech Docs" score={s.technicalScore} />
                            <div className="mt-1"><ScoreBar label="Decision Speed" score={s.decisionSpeedScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">Weighted: <span className="text-cyan-400">{s.technicalClarityWeighted.toFixed(2)}</span></p>
                          </div>
                        </div>
                      );
                    })() : (() => {
                      const s = (assessment.data as RepeatedAssessment).scores;
                      return (
                        <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-[#1a1a2e]">
                          <div>
                            <p className="text-[10px] font-bold text-green-400 uppercase mb-2">Revenue (30%)</p>
                            <ScoreBar label="Omset" score={s.kontribusiOmsetScore} />
                            <div className="mt-1"><ScoreBar label="Margin" score={s.marginScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">W: <span className="text-green-400">{s.revenueWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Payment (30%)</p>
                            <ScoreBar label="Bayar" score={s.ketepatanBayarScore} />
                            <div className="mt-1"><ScoreBar label="Revisi" score={s.revisiInvoiceScore} /></div>
                            <div className="mt-1"><ScoreBar label="Tagihan" score={s.penagihanScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">W: <span className="text-blue-400">{s.paymentWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-amber-400 uppercase mb-2">Ops (15%)</p>
                            <ScoreBar label="Cancel" score={s.cancelOrderScore} />
                            <div className="mt-1"><ScoreBar label="Schedule" score={s.scheduleVarianceScore} /></div>
                            <div className="mt-1"><ScoreBar label="QC" score={s.konflikQCScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">W: <span className="text-amber-400">{s.operationalWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-pink-400 uppercase mb-2">Relationship (15%)</p>
                            <ScoreBar label="Komunikasi" score={s.komunikasiScore} />
                            <div className="mt-1"><ScoreBar label="Claim" score={s.claimScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">W: <span className="text-pink-400">{s.relationshipWeighted.toFixed(2)}</span></p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-2">Value (10%)</p>
                            <ScoreBar label="Kerjasama" score={s.lamaKerjasamaScore} />
                            <div className="mt-1"><ScoreBar label="Fleet" score={s.fleetScore} /></div>
                            <div className="mt-1"><ScoreBar label="Referral" score={s.referralScore} /></div>
                            <p className="text-xs font-mono text-[#666] mt-2">W: <span className="text-emerald-400">{s.valueWeighted.toFixed(2)}</span></p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Notes */}
                    {(isNew ? (assessment.data as NewAssessment).notes : (assessment.data as RepeatedAssessment).notes) && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a2e]">
                        <p className="text-xs text-[#666] italic">💬 {isNew ? (assessment.data as NewAssessment).notes : (assessment.data as RepeatedAssessment).notes}</p>
                      </div>
                    )}

                    {/* Raw Input Details */}
                    <RawDataViewer input={assessment.data.input} type={assessment.type} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
