'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCompanies, syncFromSheets } from '@/lib/store';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getLevelColor, getStatusLabel, getStatusColor } from '@/lib/scoring';
import { Company, CompanyStatus, ClientLevel, NewAssessment, RepeatedAssessment } from '@/lib/types';
import { LevelBadge } from '@/components/LevelBadge';

import Link from 'next/link';
import {
  BarChart3, Building2, FileText, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, Eye
} from 'lucide-react';

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : score >= 2 ? '#f59e0b' : '#ef4444';
  return (
    <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden w-20">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

type ViewMode = 'projects' | 'companies';
type SortField = 'date' | 'score' | 'company' | 'project';
type SortDir = 'asc' | 'desc';

interface ProjectRow {
  companyId: string;
  companyName: string;
  type: 'NEW' | 'REPEATED';
  projectName: string;
  date: string;
  score: number;
  level: ClientLevel;
  assessment: NewAssessment | RepeatedAssessment;
}

interface CompanyRow {
  company: Company;
  status: CompanyStatus;
  currentScore: number;
  currentLevel: ClientLevel;
  totalAssessments: number;
  newCount: number;
  repCount: number;
  firstDate: string;
  lastDate: string;
  trend: 'up' | 'down' | 'stable' | 'none';
}

export default function ScoringPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [view, setView] = useState<ViewMode>('projects');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<ClientLevel | ''>('');
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | ''>('');
  const [filterType, setFilterType] = useState<'NEW' | 'REPEATED' | ''>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCompanies(getCompanies());
    setMounted(true);
    syncFromSheets().then(c => setCompanies(c)).catch(() => {});
  }, []);

  if (!mounted) return null;

  // Build project rows
  const projectRows: ProjectRow[] = companies.flatMap(c => [
    ...c.newAssessments.map(a => ({
      companyId: c.id, companyName: c.companyName, type: 'NEW' as const,
      projectName: a.projectName, date: a.date, score: a.scores.totalScore,
      level: a.scores.level, assessment: a,
    })),
    ...c.repeatedAssessments.map(a => ({
      companyId: c.id, companyName: c.companyName, type: 'REPEATED' as const,
      projectName: a.projectName, date: a.date, score: a.scores.totalScore,
      level: a.scores.level, assessment: a,
    })),
  ]);

  // Build company rows
  const companyRows: CompanyRow[] = companies.map(c => {
    const allScores = [
      ...c.newAssessments.map(a => ({ date: a.date, score: a.scores.totalScore })),
      ...c.repeatedAssessments.map(a => ({ date: a.date, score: a.scores.totalScore })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let trend: 'up' | 'down' | 'stable' | 'none' = 'none';
    if (allScores.length >= 2) {
      const diff = allScores[allScores.length - 1].score - allScores[allScores.length - 2].score;
      trend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';
    }

    return {
      company: c,
      status: getCompanyStatus(c),
      currentScore: getCompanyCurrentScore(c),
      currentLevel: getCompanyCurrentLevel(c),
      totalAssessments: c.newAssessments.length + c.repeatedAssessments.length,
      newCount: c.newAssessments.length,
      repCount: c.repeatedAssessments.length,
      firstDate: allScores[0]?.date || c.registeredDate,
      lastDate: allScores[allScores.length - 1]?.date || c.registeredDate,
      trend,
    };
  });

  // Filter project rows
  const filteredProjects = projectRows.filter(p => {
    if (search && !p.companyName.toLowerCase().includes(search.toLowerCase()) && !p.projectName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel && p.level !== filterLevel) return false;
    if (filterType && p.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    else if (sortField === 'score') cmp = a.score - b.score;
    else if (sortField === 'company') cmp = a.companyName.localeCompare(b.companyName);
    else if (sortField === 'project') cmp = a.projectName.localeCompare(b.projectName);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Filter company rows
  const filteredCompanies = companyRows.filter(r => {
    if (search && !r.company.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterLevel && r.currentLevel !== filterLevel) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime();
    else if (sortField === 'score') cmp = a.currentScore - b.currentScore;
    else if (sortField === 'company') cmp = a.company.companyName.localeCompare(b.company.companyName);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 cursor-pointer ${sortField === field ? 'text-blue-400' : 'text-[#555]'}`} onClick={() => toggleSort(field)} />
  );

  return (
    <div className="space-y-6 relative">
      {/* Ambient glow */}
      <div className="fixed top-32 right-32 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-[0.2em]">Scoring View</span>
        </div>
        <h1 className="text-3xl font-black text-gradient">Scoring per Project &amp; Company</h1>
        <p className="text-[#555] mt-1 text-sm">Lihat scoring detail per project (assessment) dan scoring keseluruhan per perusahaan</p>
      </motion.div>

      {/* View Toggle + Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-4 flex items-center gap-4 flex-wrap gradient-border">
        <div className="flex gap-1 bg-[#1a1a2e] rounded-xl p-1">
          <button onClick={() => setView('projects')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'projects' ? 'bg-blue-500/20 text-blue-400' : 'text-[#666] hover:text-[#999]'}`}>
            <FileText className="w-4 h-4 inline mr-1.5" />Per Project
          </button>
          <button onClick={() => setView('companies')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'companies' ? 'bg-purple-500/20 text-purple-400' : 'text-[#666] hover:text-[#999]'}`}>
            <Building2 className="w-4 h-4 inline mr-1.5" />Per Company
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or project..." className="pl-9 w-full" />
        </div>

        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as ClientLevel | '')} className="text-sm">
          <option value="">All Levels</option>
          <option value="STRATEGIC">🏆 Strategic</option>
          <option value="PREFERRED">⭐ Preferred</option>
          <option value="REGULAR">📊 Regular</option>
          <option value="HIGH_RISK">⚠️ High Risk</option>
        </select>

        {view === 'projects' ? (
          <select value={filterType} onChange={e => setFilterType(e.target.value as 'NEW' | 'REPEATED' | '')} className="text-sm">
            <option value="">All Types</option>
            <option value="NEW">🆕 New</option>
            <option value="REPEATED">🔄 Repeated</option>
          </select>
        ) : (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as CompanyStatus | '')} className="text-sm">
            <option value="">All Status</option>
            <option value="NEW_ONLY">🆕 New Only</option>
            <option value="ACTIVE_REPEATED">🔄 Active Repeated</option>
            <option value="LAPSED">⏰ Lapsed</option>
          </select>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { val: projectRows.length, label: 'Total Assessments', color: '#3b82f6' },
          { val: companies.length, label: 'Total Companies', color: '#8b5cf6' },
          { val: projectRows.filter(p => p.type === 'NEW').length, label: 'New Assessments', color: '#06b6d4' },
          { val: projectRows.filter(p => p.type === 'REPEATED').length, label: 'Repeated Assessments', color: '#a855f7' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
            className="glass-strong rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <p className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* PROJECT VIEW */}
      {view === 'projects' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-strong rounded-2xl overflow-hidden gradient-border">
          <table>
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => toggleSort('date')}>Date <SortIcon field="date" /></th>
                <th className="cursor-pointer" onClick={() => toggleSort('company')}>Company <SortIcon field="company" /></th>
                <th className="cursor-pointer" onClick={() => toggleSort('project')}>Project <SortIcon field="project" /></th>
                <th>Type</th>
                <th className="cursor-pointer" onClick={() => toggleSort('score')}>Score <SortIcon field="score" /></th>
                <th>Level</th>
                <th>Breakdown</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p, i) => (
                <tr key={`${p.companyId}-${p.date}-${i}`} className="hover:bg-[#111118] transition-colors">
                  <td className="font-mono text-xs text-[#888]">{new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <Link href={`/company/${p.companyId}`} className="text-sm font-medium hover:text-blue-400 transition-colors">{p.companyName}</Link>
                  </td>
                  <td className="text-sm">{p.projectName}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${p.type === 'NEW' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {p.type === 'NEW' ? '🆕 New' : '🔄 Repeated'}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono font-bold text-sm" style={{ color: getLevelColor(p.level) }}>{p.score.toFixed(2)}</span>
                  </td>
                  <td><LevelBadge level={p.level} /></td>
                  <td>
                    {p.type === 'NEW' ? (
                      <div className="flex items-center gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">COM</span><ScoreBar score={(p.assessment as NewAssessment).scores.commercialPotentialAvg} /></div>
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">CRE</span><ScoreBar score={(p.assessment as NewAssessment).scores.credibilityAvg} /></div>
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">TEC</span><ScoreBar score={(p.assessment as NewAssessment).scores.technicalClarityAvg} /></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">REV</span><ScoreBar score={(p.assessment as RepeatedAssessment).scores.revenueAvg} /></div>
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">PAY</span><ScoreBar score={(p.assessment as RepeatedAssessment).scores.paymentAvg} /></div>
                          <div className="flex items-center gap-1"><span className="text-[9px] text-[#666] w-8">OPS</span><ScoreBar score={(p.assessment as RepeatedAssessment).scores.operationalAvg} /></div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    <Link href={`/company/${p.companyId}`} className="text-[#555] hover:text-blue-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-[#555]">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No assessments found</p>
            </div>
          )}
        </motion.div>
      )}

      {/* COMPANY VIEW */}
      {view === 'companies' && (
        <div className="space-y-3">
          {filteredCompanies.map(row => {
            const expanded = expandedCompany === row.company.id;
            const allAssessments = [
              ...row.company.newAssessments.map(a => ({ type: 'NEW' as const, a, date: a.date, score: a.scores.totalScore, level: a.scores.level, project: a.projectName })),
              ...row.company.repeatedAssessments.map(a => ({ type: 'REPEATED' as const, a, date: a.date, score: a.scores.totalScore, level: a.scores.level, project: a.projectName })),
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <motion.div key={row.company.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl overflow-hidden gradient-border">
                {/* Company Header */}
                <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-[#111118] transition-colors"
                  onClick={() => setExpandedCompany(expanded ? null : row.company.id)}>
                  <div className="shrink-0">
                    {expanded ? <ChevronDown className="w-5 h-5 text-[#555]" /> : <ChevronRight className="w-5 h-5 text-[#555]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg truncate">{row.company.companyName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium border shrink-0" style={{ borderColor: `${getStatusColor(row.status)}30`, background: `${getStatusColor(row.status)}10`, color: getStatusColor(row.status) }}>
                        {getStatusLabel(row.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#666]">
                      <span>{row.company.location}</span>
                      <span>Fleet: {row.company.fleetSize}</span>
                      <span>{row.totalAssessments} assessments ({row.newCount} new, {row.repCount} rep)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {row.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                    {row.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                    {row.trend === 'stable' && <Minus className="w-4 h-4 text-[#555]" />}

                    <div className="text-right">
                      <span className="text-xl font-mono font-bold" style={{ color: getLevelColor(row.currentLevel) }}>{row.currentScore.toFixed(2)}</span>
                      <div className="mt-1"><LevelBadge level={row.currentLevel} /></div>
                    </div>

                    <Link href={`/company/${row.company.id}`} onClick={e => e.stopPropagation()} className="text-[#555] hover:text-blue-400 transition-colors p-2">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Expanded: Assessment list */}
                {expanded && (
                  <div className="border-t border-[#1a1a2e] p-4">
                    {/* Score progression mini chart */}
                    {allAssessments.length > 1 && (
                      <div className="mb-4">
                        <p className="text-xs text-[#666] mb-2">Score Progression</p>
                        <div className="flex items-end gap-1 h-16">
                          {[...allAssessments].reverse().map((a, i) => {
                            const height = (a.score / 5) * 100;
                            const color = a.type === 'NEW' ? '#06b6d4' : '#8b5cf6';
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                                <div className="absolute -top-6 bg-[#1a1a2e] border border-[#2a2a3a] rounded px-1.5 py-0.5 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ color }}>
                                  {a.score.toFixed(2)}
                                </div>
                                <div className="w-full rounded-t" style={{ height: `${height}%`, background: color, opacity: 0.7, minHeight: 4 }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-xs py-2 px-3">Date</th>
                          <th className="text-left text-xs py-2 px-3">Project</th>
                          <th className="text-left text-xs py-2 px-3">Type</th>
                          <th className="text-left text-xs py-2 px-3">Score</th>
                          <th className="text-left text-xs py-2 px-3">Level</th>
                          <th className="text-left text-xs py-2 px-3">Categories</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAssessments.map((a, i) => (
                          <tr key={i} className="border-t border-[#1a1a2e]">
                            <td className="text-xs font-mono text-[#888] py-2.5 px-3">{new Date(a.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="text-sm py-2.5 px-3">{a.project}</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-md ${a.type === 'NEW' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                {a.type === 'NEW' ? '🆕 New' : '🔄 Rep'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold" style={{ color: getLevelColor(a.level) }}>{a.score.toFixed(2)}</span>
                            </td>
                            <td className="py-2.5 px-3"><LevelBadge level={a.level} /></td>
                            <td className="py-2.5 px-3">
                              {a.type === 'NEW' ? (
                                <div className="flex gap-3 text-[10px]">
                                  <span>COM: <span className="font-mono font-bold text-blue-400">{(a.a as NewAssessment).scores.commercialPotentialAvg.toFixed(1)}</span></span>
                                  <span>CRE: <span className="font-mono font-bold text-purple-400">{(a.a as NewAssessment).scores.credibilityAvg.toFixed(1)}</span></span>
                                  <span>TEC: <span className="font-mono font-bold text-cyan-400">{(a.a as NewAssessment).scores.technicalClarityAvg.toFixed(1)}</span></span>
                                </div>
                              ) : (
                                <div className="flex gap-2 text-[10px]">
                                  <span>REV: <span className="font-mono font-bold text-green-400">{(a.a as RepeatedAssessment).scores.revenueAvg.toFixed(1)}</span></span>
                                  <span>PAY: <span className="font-mono font-bold text-blue-400">{(a.a as RepeatedAssessment).scores.paymentAvg.toFixed(1)}</span></span>
                                  <span>OPS: <span className="font-mono font-bold text-amber-400">{(a.a as RepeatedAssessment).scores.operationalAvg.toFixed(1)}</span></span>
                                  <span>REL: <span className="font-mono font-bold text-pink-400">{(a.a as RepeatedAssessment).scores.relationshipAvg.toFixed(1)}</span></span>
                                  <span>VAL: <span className="font-mono font-bold text-emerald-400">{(a.a as RepeatedAssessment).scores.valueAvg.toFixed(1)}</span></span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            );
          })}

          {filteredCompanies.length === 0 && (
            <div className="glass-strong rounded-2xl text-center py-12 text-[#555]">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No companies found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
