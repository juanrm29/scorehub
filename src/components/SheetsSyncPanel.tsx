'use client';

/**
 * SheetsSyncPanel.tsx
 *
 * Shows Google Sheets sync status + a "Push All to Sheets" button
 * to migrate any locally-stored data up to Google Sheets.
 *
 * Usage: drop into Data Master page or any admin view.
 */

import { useState } from 'react';
import { getCompanies } from '@/lib/store';
import { Cloud, CloudOff, Loader2, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

type Status = 'idle' | 'pushing' | 'done' | 'error';

export function SheetsSyncPanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [detail, setDetail] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const pushAll = async () => {
    setStatus('pushing');
    setDetail('');
    setProgress({ done: 0, total: 0 });

    const companies = getCompanies();
    const total =
      companies.length +
      companies.reduce((a, c) => a + c.newAssessments.length + c.repeatedAssessments.length, 0);
    setProgress({ done: 0, total });

    let done = 0;
    let errors = 0;

    for (const company of companies) {
      // Save company
      try {
        await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_company', company }),
        });
      } catch {
        errors++;
      }
      done++;
      setProgress({ done, total });

      // Save new assessments
      for (const assessment of company.newAssessments) {
        try {
          await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_new', company, assessment }),
          });
        } catch {
          errors++;
        }
        done++;
        setProgress({ done, total });
      }

      // Save repeated assessments
      for (const assessment of company.repeatedAssessments) {
        try {
          await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_repeated', company, assessment }),
          });
        } catch {
          errors++;
        }
        done++;
        setProgress({ done, total });
      }
    }

    if (errors === 0) {
      setStatus('done');
      setDetail(`${total} records berhasil di-sync ke Google Sheets.`);
    } else {
      setStatus('error');
      setDetail(`${done - errors}/${total} berhasil, ${errors} gagal. Cek koneksi dan coba lagi.`);
    }
  };

  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="glass-strong rounded-2xl p-5 border border-white/[0.04] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Google Sheets Sync</p>
            <p className="text-[10px] text-[#555] mt-0.5">Push semua data lokal ke Sheets</p>
          </div>
        </div>

        <button
          onClick={pushAll}
          disabled={status === 'pushing'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            status === 'pushing'
              ? 'bg-blue-500/5 border-blue-500/20 text-blue-400 cursor-not-allowed'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          {status === 'pushing' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {status === 'pushing' ? 'Uploading...' : 'Push All to Sheets'}
        </button>
      </div>

      {/* Progress bar */}
      {status === 'pushing' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-[#666]">
            <span>Progress</span>
            <span className="font-mono">{progress.done} / {progress.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Result message */}
      {status === 'done' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">{detail}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{detail}</p>
        </div>
      )}

      <p className="text-[10px] text-[#444] border-t border-white/[0.04] pt-3">
        💡 Jalankan ini sekali untuk migrasi data lama dari browser ke Sheets. 
        Setelah itu setiap save otomatis langsung ke Sheets.
      </p>
    </div>
  );
}
