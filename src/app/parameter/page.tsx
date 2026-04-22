'use client';

import { motion } from 'framer-motion';
import { NEW_CUSTOMER_WEIGHTS, REPEATED_CUSTOMER_WEIGHTS, LEVEL_THRESHOLDS } from '@/lib/scoring';
import { SlidersHorizontal, BookOpen, Cpu, Scale, ArrowRight } from 'lucide-react';

export default function ParameterPage() {
  return (
    <div className="space-y-8 relative">
      <div className="fixed top-20 left-80 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-[0.2em]">Configuration</span>
        </div>
        <h1 className="text-3xl font-black text-gradient">Parameters</h1>
        <p className="text-[#555] mt-1 text-sm">Scoring weights, formulas, and threshold configuration</p>
      </motion.div>

      {/* Level Thresholds */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-6 gradient-border">
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          Client Level Thresholds
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {LEVEL_THRESHOLDS.map((t, i) => (
            <motion.div key={t.level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
              className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 hover:border-white/[0.08] transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm" style={{ color: t.color }}>
                  {t.level.replace('_', ' ')}
                </span>
                <span className="w-3 h-3 rounded-full" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}60` }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-mono font-bold" style={{ color: t.color }}>{t.min.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4 text-[#555]" />
                <span className="text-2xl font-mono font-bold" style={{ color: t.color }}>{t.max.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#555]">{t.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* New Customer Weights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-strong rounded-2xl p-6 gradient-border">
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          New Customer Scoring Weights
        </h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.04]">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Category</th>
                <th>Weight (%)</th>
                <th>Max Score</th>
                <th>Max Value</th>
                <th>Formula</th>
              </tr>
            </thead>
            <tbody>
              {NEW_CUSTOMER_WEIGHTS.map((w, i) => (
                <tr key={w.category}>
                  <td className="font-mono text-[#555]">{i + 1}</td>
                  <td className="font-semibold text-sm">{w.category}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">{w.weight}%</span>
                      <div className="w-20 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${w.weight}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="font-mono">5</td>
                  <td className="font-mono">{(5 * w.weight / 100).toFixed(2)}</td>
                  <td className="text-xs text-[#888]">{w.formula}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td></td>
                <td>TOTAL</td>
                <td className="text-blue-400 font-mono">100%</td>
                <td className="font-mono">5</td>
                <td className="font-mono">5.00</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Repeated Customer Weights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-strong rounded-2xl p-6 gradient-border">
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Repeated Customer Scoring Weights
        </h2>
        <div className="overflow-hidden rounded-xl border border-white/[0.04]">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Category</th>
                <th>Weight (%)</th>
                <th>Max Score</th>
                <th>Max Value</th>
                <th>Formula</th>
              </tr>
            </thead>
            <tbody>
              {REPEATED_CUSTOMER_WEIGHTS.map((w, i) => (
                <tr key={w.category}>
                  <td className="font-mono text-[#555]">{i + 1}</td>
                  <td className="font-semibold text-sm">{w.category}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-400">{w.weight}%</span>
                      <div className="w-20 h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${w.weight}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="font-mono">5</td>
                  <td className="font-mono">{(5 * w.weight / 100).toFixed(2)}</td>
                  <td className="text-xs text-[#888]">{w.formula}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td></td>
                <td>TOTAL</td>
                <td className="text-purple-400 font-mono">100%</td>
                <td className="font-mono">5</td>
                <td className="font-mono">5.00</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Scoring Logic Reference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-strong rounded-2xl p-6 gradient-border">
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Auto-Calculation Logic Reference
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* New Customer Formulas */}
          <div className="rounded-xl border border-[#1a1a2e] p-5 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">New Customer Formulas</h3>
            {[
              { name: 'Fleet Size', formula: 'IF(Fleet>20→5, ≥15→4, ≥10→3, ≥5→2, else→1)' },
              { name: 'Est. Value (IDR)', formula: 'IF(>3M→5, ≥2M→4, ≥1M→3, ≥500jt→2, else→1)' },
              { name: 'Term Payment', formula: 'IF(≤14hari→5, ≤30→4, ≤45→3, ≤60→2, else→1)' },
              { name: 'Decision Speed', formula: 'IF(≤2hari→5, ≤5→4, ≤7→3, ≤14→2, else→1)' },
              { name: 'Legal Docs', formula: 'Count docs: ≥5→5, ≥4→4, ≥3→3, ≥2→2, else→1' },
              { name: 'Technical Docs', formula: 'Count docs: ≥3→5, ≥2→4, ≥1→3, else→1' },
              { name: 'Background Media', formula: 'Count: ≥3→5, ≥2→4, ≥1→3, else→1' },
              { name: 'Reference', formula: 'IF(ada→5, tidak→2)' },
            ].map(f => (
              <div key={f.name} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#ccc]">{f.name}</p>
                  <p className="text-[11px] text-[#666] font-mono">{f.formula}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Repeated Customer Formulas */}
          <div className="rounded-xl border border-[#1a1a2e] p-5 space-y-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Repeated Customer Formulas</h3>
            {[
              { name: 'Kontribusi Omset', formula: 'IF(>15%→5, ≥10%→4, ≥5%→3, ≥1%→2, else→1)' },
              { name: 'Margin', formula: 'IF(>30%→5, ≥25%→4, ≥20%→3, ≥15%→2, else→1)' },
              { name: 'Ketepatan Bayar', formula: 'IF(0 hari→5, ≤7→4, ≤14→3, ≤21→2, else→1)' },
              { name: 'Revisi Invoice', formula: 'IF(0→5, ≤2→4, ≤4→3, ≤6→2, else→1)' },
              { name: 'Penagihan', formula: 'IF(1x→5, 2x→4, 3x→3, 4x→2, else→1)' },
              { name: 'Cancel Order', formula: 'IF(0→5, 1→4, 2→3, 3→2, else→1)' },
              { name: 'Schedule Var.', formula: 'IF(≤-3→5, <0→4, =0→3, ≤3→2, else→1)' },
              { name: 'Konflik QC', formula: 'IF(0→5, 1→4, 2→3, 3→2, else→1)' },
              { name: 'Komunikasi PIC', formula: 'SB→5, B→4, C→3, K→2, SK→1' },
              { name: 'Claim Count', formula: 'IF(0→5, 1→4, 2→3, 3→2, else→1)' },
              { name: 'Lama Kerjasama', formula: 'IF(>3thn→5, 3→4, 2→3, 1→2, else→1)' },
              { name: 'Referral', formula: 'IF(≥1→5, else→1)' },
            ].map(f => (
              <div key={f.name} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#ccc]">{f.name}</p>
                  <p className="text-[11px] text-[#666] font-mono">{f.formula}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
