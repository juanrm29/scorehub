'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { companies } from '@/lib/data';
import { LevelBadge } from '@/components/LevelBadge';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getLevelColor, getStatusLabel, getStatusColor } from '@/lib/scoring';
import { Database, Search, Filter, ChevronDown, Plus, Ship, Building2, ChevronRight, Clock, AlertTriangle, Download } from 'lucide-react';
import { exportDataMasterExcel } from '@/lib/exportExcel';

export default function DataMasterPage() {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const enriched = companies.map(c => ({
    ...c,
    status: getCompanyStatus(c),
    currentScore: getCompanyCurrentScore(c),
    currentLevel: getCompanyCurrentLevel(c),
    totalAssessments: c.newAssessments.length + c.repeatedAssessments.length,
  }));

  const filtered = enriched.filter(c => {
    const matchSearch = c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'ALL' || c.currentLevel === filterLevel;
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchLevel && matchStatus;
  });

  const newOnly = enriched.filter(c => c.status === 'NEW_ONLY').length;
  const activeRep = enriched.filter(c => c.status === 'ACTIVE_REPEATED').length;
  const lapsed = enriched.filter(c => c.status === 'LAPSED').length;

  return (
    <div className="space-y-8 relative">
      <div className="fixed top-20 right-40 w-80 h-80 bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-[0.2em]">Master Data</span>
          </div>
          <h1 className="text-3xl font-black text-gradient">Data Master</h1>
          <p className="text-[#555] mt-1 text-sm">Click any company row to view detailed assessment history</p>
        </div>
        <button onClick={() => exportDataMasterExcel(companies)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:border-emerald-500/40 hover:from-emerald-600/30 hover:to-cyan-600/30 transition-all">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </motion.div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <p className="text-xs text-[#555] mb-1">Total Companies</p>
          <p className="text-xl font-black text-blue-400">{enriched.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong rounded-xl p-4 cursor-pointer hover:border-cyan-500/20 transition-all relative overflow-hidden" onClick={() => setFilterStatus(filterStatus === 'NEW_ONLY' ? 'ALL' : 'NEW_ONLY')}>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <div className="flex items-center gap-1.5 mb-1"><span className="text-xs">🆕</span><p className="text-xs text-[#555]">Pre-judgement Only</p></div>
          <p className="text-xl font-black text-cyan-400">{newOnly}</p>
          <p className="text-[10px] text-[#555]">Belum ada penilaian lanjutan</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong rounded-xl p-4 cursor-pointer hover:border-purple-500/20 transition-all relative overflow-hidden" onClick={() => setFilterStatus(filterStatus === 'ACTIVE_REPEATED' ? 'ALL' : 'ACTIVE_REPEATED')}>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <div className="flex items-center gap-1.5 mb-1"><span className="text-xs">🔄</span><p className="text-xs text-[#555]">Active Repeated</p></div>
          <p className="text-xl font-black text-purple-400">{activeRep}</p>
          <p className="text-[10px] text-[#555]">Deal dalam 3 tahun terakhir</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-strong rounded-xl p-4 cursor-pointer hover:border-amber-500/20 transition-all relative overflow-hidden" onClick={() => setFilterStatus(filterStatus === 'LAPSED' ? 'ALL' : 'LAPSED')}>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="flex items-center gap-1.5 mb-1"><span className="text-xs">⏰</span><p className="text-xs text-[#555]">Lapsed (&gt;3yr)</p></div>
          <p className="text-xl font-black text-amber-400">{lapsed}</p>
          <p className="text-[10px] text-[#555]">Perlu penilaian ulang dari New</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-strong rounded-2xl p-5 gradient-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input type="text" placeholder="Search company, contact, location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="pl-10 pr-10 w-44">
              <option value="ALL">All Levels</option>
              <option value="STRATEGIC">Strategic</option>
              <option value="PREFERRED">Preferred</option>
              <option value="REGULAR">Regular</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
          </div>
          <div className="relative">
            <Ship className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-10 w-52">
              <option value="ALL">All Status</option>
              <option value="NEW_ONLY">Pre-judgement Only</option>
              <option value="ACTIVE_REPEATED">Active Repeated</option>
              <option value="LAPSED">Lapsed (&gt;3yr)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-strong rounded-2xl overflow-hidden border border-white/[0.04] gradient-border">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Company</th>
                <th>Status</th>
                <th>Fleet</th>
                <th>Assessments</th>
                <th>Score</th>
                <th>Level</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className="cursor-pointer group" onClick={() => window.location.href = `/company/${c.id}`}>
                  <td className="font-mono text-[#555] text-xs">{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <div className="font-semibold text-sm group-hover:text-blue-400 transition-colors">{c.companyName}</div>
                    <div className="text-xs text-[#555]">{c.contactPerson} · {c.location}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: `${getStatusColor(c.status)}10`, color: getStatusColor(c.status) }}>
                      {c.status === 'NEW_ONLY' ? '🆕' : c.status === 'ACTIVE_REPEATED' ? '🔄' : '⏰'}
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="font-mono text-sm">{c.fleetSize}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{c.newAssessments.length} new</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{c.repeatedAssessments.length} rep</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: getLevelColor(c.currentLevel) }}>{c.currentScore.toFixed(2)}</span>
                      <div className="w-12 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(c.currentScore / 5) * 100}%`, background: getLevelColor(c.currentLevel) }} />
                      </div>
                    </div>
                  </td>
                  <td><LevelBadge level={c.currentLevel} /></td>
                  <td><ChevronRight className="w-4 h-4 text-[#555] group-hover:text-blue-400 transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-[#444]">
            <Database className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm">No companies found matching your filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
