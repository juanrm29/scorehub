'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateNewCustomer, calculateRepeatedCustomer, getLevelColor, getCompanyStatus, getCompanyCurrentScore } from '@/lib/scoring';
import { getCompanies, syncFromSheets, addNewAssessment, addRepeatedAssessment, addCompany } from '@/lib/store';
import { NewCustomerInput, RepeatedCustomerInput, KomunikasiLevel, Company } from '@/lib/types';
import { ScoreRing } from '@/components/ScoreRing';
import { LevelBadge } from '@/components/LevelBadge';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Calculator, Zap, UserPlus, RefreshCw, AlertTriangle, Info, CheckCircle2, Building2, Save, Plus, ArrowRight, Sparkles, CloudOff, Cloud, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Tab = 'new' | 'repeated';

const defaultNew: NewCustomerInput = {
  companyName: '', contactPerson: '', email: '', phone: '', location: '',
  fleetSize: 10, estimatedValue: 1_000_000_000, termPayment: 30,
  legalDocuments: '1,2,3', backgroundMedia: '1,2,3', hasReference: false,
  technicalDocuments: '1,2,3', decisionSpeed: 3,
};

const defaultRepeated: RepeatedCustomerInput = {
  companyName: '', contactPerson: '', email: '', phone: '', location: '',
  kontribusiOmset: 5, margin: 20,
  ketepatanBayarHari: 7, revisiInvoice: 1, penagihanCount: 2,
  cancelOrder: 0, scheduleVariance: 0, konflikQC: 0, intervensi: 0,
  komunikasiPIC: 'C', claimCount: 0,
  lamaKerjasama: 2, fleetSize: 10, hasReferral: false,
};

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 4 ? '#10b981' : score >= 3 ? '#3b82f6' : score >= 2 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-[#888]">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} style={{ background: color }} />
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const [tab, setTab] = useState<Tab>('new');
  const [searchCompanyTerm, setSearchCompanyTerm] = useState('');
  const [newInput, setNewInput] = useState(defaultNew);
  const [repInput, setRepInput] = useState(defaultRepeated);
  const [calculated, setCalculated] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [companies, setCompaniesState] = useState<Company[]>([]);

  // Save form fields
  const [projectName, setProjectName] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // New company fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');
  const [newCompanyFleet, setNewCompanyFleet] = useState(10);
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('Shipping');

  const [mounted, setMounted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    // Load from localStorage cache immediately for instant render
    setCompaniesState(getCompanies());
    setMounted(true);

    // Then fetch fresh data from Google Sheets in background
    setSyncStatus('syncing');
    syncFromSheets()
      .then(companies => {
        setCompaniesState(companies);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
      })
      .catch(() => setSyncStatus('error'));
  }, []);

  if (!mounted) return null;

  const newResult = calculateNewCustomer(newInput);
  const repResult = calculateRepeatedCustomer(repInput);

  const handleCalculate = () => { setCalculated(true); setSaved(false); setSavedId(null); };

  const matchedCompany = selectedCompany ? companies.find(c => c.id === selectedCompany) : null;
  const companyStatus = matchedCompany ? getCompanyStatus(matchedCompany) : null;

  const handleSelectCompany = (id: string) => {
    if (id === '__new__') {
      setIsNewCompany(true);
      setSelectedCompany('');
      return;
    }
    setIsNewCompany(false);
    setSelectedCompany(id);
    const c = companies.find(co => co.id === id);
    if (c) {
      if (tab === 'new') {
        setNewInput(prev => ({ ...prev, companyName: c.companyName, contactPerson: c.contactPerson, email: c.email, phone: c.phone, location: c.location, fleetSize: c.fleetSize }));
      } else {
        setRepInput(prev => ({ ...prev, companyName: c.companyName, contactPerson: c.contactPerson, email: c.email, phone: c.phone, location: c.location, fleetSize: c.fleetSize }));
      }
    }
    setCalculated(false);
    setSaved(false);
    setSavedId(null);
  };

  const handleSave = () => {
    if (!projectName.trim()) { alert('Project name is required'); return; }

    let targetCompanyId = selectedCompany;

    if (isNewCompany) {
      if (!newCompanyName.trim()) { alert('Company name is required'); return; }
      const created = addCompany({
        companyName: newCompanyName,
        contactPerson: newCompanyContact,
        email: newCompanyEmail || '-',
        phone: newCompanyPhone || '-',
        location: newCompanyLocation || '-',
        fleetSize: newCompanyFleet,
        industry: newCompanyIndustry || 'Shipping',
        registeredDate: new Date().toISOString().split('T')[0],
      });
      targetCompanyId = created.id;
    }

    if (!targetCompanyId) { alert('Please select or create a company'); return; }

    try {
      if (tab === 'new') {
        addNewAssessment(targetCompanyId, projectName, assessmentDate, newInput, notes || undefined);
        setSavedId(targetCompanyId);
      } else {
        if (!periodStart || !periodEnd) { alert('Period start and end are required for Repeated assessment'); return; }
        addRepeatedAssessment(targetCompanyId, projectName, assessmentDate, periodStart, periodEnd, repInput, notes || undefined);
        setSavedId(targetCompanyId);
      }
      setSaved(true);
      setCompaniesState(getCompanies());

      // Select the newly created company so it doesn't get stuck on Add New form
      if (isNewCompany) {
        setIsNewCompany(false);
        setSelectedCompany(targetCompanyId);
      }
    } catch (e: unknown) {
      alert('Error saving: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Ambient glow */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-80 w-80 h-80 bg-purple-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-[0.2em]">Scoring Engine</span>
          </div>
          {/* Sync Status Pill */}
          <div className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all duration-500 ${
            syncStatus === 'syncing' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
            syncStatus === 'synced'  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            syncStatus === 'error'   ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-white/5 border-white/10 text-[#555]'
          }`}>
            {syncStatus === 'syncing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {syncStatus === 'synced'  && <Cloud className="w-3 h-3" />}
            {syncStatus === 'error'   && <CloudOff className="w-3 h-3" />}
            {syncStatus === 'idle'    && <Cloud className="w-3 h-3" />}
            {syncStatus === 'syncing' ? 'Syncing from Sheets...' :
             syncStatus === 'synced'  ? 'Synced with Google Sheets' :
             syncStatus === 'error'   ? 'Offline — data from cache' :
             'Google Sheets'}
          </div>
        </div>
        <h1 className="text-3xl font-black text-gradient">Calculator &amp; Input</h1>
        <p className="text-[#555] mt-1 text-sm">Data tersimpan langsung ke Google Sheets — tidak tergantung browser</p>
      </motion.div>

      {/* Company Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-5 gradient-border">
        <div className="flex items-center gap-4">
          <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-[#666]">Select Company</label>
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-32 text-xs py-1 px-2 border-none bg-white/5 rounded-md focus:ring-1 ring-blue-500/50 outline-none"
                value={searchCompanyTerm}
                onChange={e => setSearchCompanyTerm(e.target.value)}
              />
            </div>
            <select value={isNewCompany ? '__new__' : selectedCompany} onChange={e => handleSelectCompany(e.target.value)} className="w-full">
              <option value="">— Select company —</option>
              <option value="__new__">➕ Add New Company</option>
              {companies.filter(c => c.companyName.toLowerCase().includes(searchCompanyTerm.toLowerCase())).map(c => {
                const st = getCompanyStatus(c);
                return <option key={c.id} value={c.id}>{c.companyName} [{st === 'NEW_ONLY' ? '🆕 New' : st === 'ACTIVE_REPEATED' ? '🔄 Repeated' : '⏰ Lapsed'}]</option>;
              })}
            </select>
          </div>
        </div>

        {/* New Company Form */}
        {isNewCompany && (
          <div className="mt-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">New Company Registration</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-[#666] mb-1">Company Name *</label><input type="text" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="PT. ..." /></div>
              <div><label className="block text-xs text-[#666] mb-1">Contact Person</label><input type="text" value={newCompanyContact} onChange={e => setNewCompanyContact(e.target.value)} placeholder="Mr./Mrs. ..." /></div>
              <div><label className="block text-xs text-[#666] mb-1">Email</label><input type="text" value={newCompanyEmail} onChange={e => setNewCompanyEmail(e.target.value)} placeholder="email@company.com" /></div>
              <div><label className="block text-xs text-[#666] mb-1">Phone</label><input type="text" value={newCompanyPhone} onChange={e => setNewCompanyPhone(e.target.value)} placeholder="08xx..." /></div>
              <div><label className="block text-xs text-[#666] mb-1">Location</label><input type="text" value={newCompanyLocation} onChange={e => setNewCompanyLocation(e.target.value)} placeholder="Kota, Provinsi" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-[#666] mb-1">Fleet</label><input type="number" value={newCompanyFleet} onChange={e => setNewCompanyFleet(+e.target.value)} /></div>
                <div><label className="block text-xs text-[#666] mb-1">Industry</label><input type="text" value={newCompanyIndustry} onChange={e => setNewCompanyIndustry(e.target.value)} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {matchedCompany && (
          <div className="mt-4">
            {companyStatus === 'NEW_ONLY' && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-cyan-400">🆕 Pre-judgement Only</p>
                  <p className="text-[11px] text-[#888] mt-0.5">Score: <span className="font-mono font-bold">{getCompanyCurrentScore(matchedCompany).toFixed(2)}</span> · {matchedCompany.newAssessments.length} new, {matchedCompany.repeatedAssessments.length} repeated</p>
                </div>
              </div>
            )}
            {companyStatus === 'ACTIVE_REPEATED' && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-purple-400">🔄 Active Repeated — {matchedCompany.repeatedAssessments.length} follow-up(s)</p>
                  <p className="text-[11px] text-[#888] mt-0.5">Score: <span className="font-mono font-bold">{getCompanyCurrentScore(matchedCompany).toFixed(2)}</span></p>
                </div>
              </div>
            )}
            {companyStatus === 'LAPSED' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-amber-400">⏰ Lapsed — Harus mulai dari New Customer</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Tab */}
      <div className="flex gap-2">
        {[
          { id: 'new' as Tab, label: 'New Customer (Pre-judgement)', icon: UserPlus },
          { id: 'repeated' as Tab, label: 'Repeated Customer (Follow-up)', icon: RefreshCw },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const disabled = t.id === 'repeated' && matchedCompany && companyStatus === 'LAPSED';
          return (
            <button key={t.id} onClick={() => { if (!disabled) { setTab(t.id); setCalculated(false); setSaved(false); } }}
              disabled={!!disabled}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                disabled ? 'opacity-30 cursor-not-allowed' :
                active ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-[#666] hover:text-[#999] border border-transparent hover:border-[#2a2a3a]'
              }`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Input Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="col-span-7 glass-strong rounded-2xl p-6 space-y-5 gradient-border">
          {/* Project Info */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Save className="w-3.5 h-3.5" /> Project / Assessment Info
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs text-[#666] mb-1">Project Name *</label>
                <input type="text" list={tab === 'repeated' ? "existing-projects" : undefined} value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Docking TB. XXX 01" />
                {tab === 'repeated' && matchedCompany && (
                  <datalist id="existing-projects">
                    {Array.from(new Set([
                      ...matchedCompany.newAssessments.map(a => a.projectName),
                      ...matchedCompany.repeatedAssessments.map(a => a.projectName)
                    ])).map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                )}
              </div>
              <div><label className="block text-xs text-[#666] mb-1">Assessment Date *</label><input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} /></div>
            </div>
            {tab === 'repeated' && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-[#666] mb-1">Period Start *</label><input type="month" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></div>
                <div><label className="block text-xs text-[#666] mb-1">Period End *</label><input type="month" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></div>
              </div>
            )}
            <div><label className="block text-xs text-[#666] mb-1">Notes (optional)</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tentang assessment ini..." /></div>
          </div>

          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Scoring Parameters
          </h2>

          {tab === 'new' ? (
            <div className="space-y-4">
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">Commercial Potential (50%) <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Fleet Size<InfoTooltip content="5: >20 Fleet\n4: 15 sd 20 Fleet\n3: 10 sd 15 Fleet\n2: 5 sd 10 Fleet\n1: < 5 Fleet" /></label><input type="number" placeholder="Kosongkan jika skip" value={newInput.fleetSize ?? ''} onChange={e => setNewInput({ ...newInput, fleetSize: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Estimated Value (IDR)<InfoTooltip content="5: >Rp 3 Miliar\n4: Rp 2M - 3M\n3: Rp 1M - 2M\n2: Rp 500jt - 1M\n1: <Rp 500jt" /></label><input type="number" placeholder="Mis: 1000000000" value={newInput.estimatedValue ?? ''} onChange={e => setNewInput({ ...newInput, estimatedValue: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Term Payment (Days)<InfoTooltip content="5: DP 50%, Final 50%\n4: DP 30%, Term 40%, Final 30%\n3: DP 0%, Final 100%\n2: DP 30%, Term 40%, Final 30% (30 Hari)\n1: DP 50%, Final 50% (30 Hari)" /></label><input type="number" placeholder="Mis: 30" value={newInput.termPayment ?? ''} onChange={e => setNewInput({ ...newInput, termPayment: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">Credibility (30%) <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Legal Documents<InfoTooltip content="5: 1,2,3,4,5 (Lengkap)\n4: 1,2,4,5\n3: 1,2,4\n2: 2,4\n1: < 2 Dokumen\n(1:Izin 2:NPWP 3:CSMS 4:Rek 5:SPK)" /></label><input type="text" value={newInput.legalDocuments ?? ''} onChange={e => setNewInput({ ...newInput, legalDocuments: e.target.value ? e.target.value : undefined })} placeholder="Akte, NIB, NPWP" /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Background Media<InfoTooltip content="5: Web, Linked, IG\n4: 2 Media\n3: 1 Media\n1: Kosong" /></label><input type="text" value={newInput.backgroundMedia ?? ''} onChange={e => setNewInput({ ...newInput, backgroundMedia: e.target.value ? e.target.value : undefined })} placeholder="Web, Social, News" /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Has Reference?<InfoTooltip content="5: Ada referensi relasi\n1: Tidak ada referensi" /></label><select value={newInput.hasReference === undefined ? '' : newInput.hasReference ? 'yes' : 'no'} onChange={e => setNewInput({ ...newInput, hasReference: e.target.value === '' ? undefined : e.target.value === 'yes' })}><option value="">— Skip —</option><option value="yes">Ya</option><option value="no">Tidak</option></select></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">Technical Clarity (20%) <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Technical Documents<InfoTooltip content="5: Ship part, Surat laut, Repair list\n4: Ship part & Repair list\n3: Ship part / Surat laut\n1: Kosong" /></label><input type="text" value={newInput.technicalDocuments ?? ''} onChange={e => setNewInput({ ...newInput, technicalDocuments: e.target.value ? e.target.value : undefined })} placeholder="Vessel Spec, Draw" /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Decision Speed (1-5)<InfoTooltip content="5: < 2 hari\n4: 3 sd 5 hari\n3: 5 sd 7 hari\n2: 7 sd 14 hari\n1: > 14 hari" /></label><input type="number" min={1} max={5} placeholder="1-5" value={newInput.decisionSpeed ?? ''} onChange={e => setNewInput({ ...newInput, decisionSpeed: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">Revenue Contribution (30%) <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Persentasi Omset (%)<InfoTooltip content="5: > 15%\n4: 15% sd 10%\n3: 10% sd 5%\n2: 5% sd 1%\n1: < 1%" /></label><input type="number" placeholder="Kosongkan jika skip" value={repInput.kontribusiOmset ?? ''} onChange={e => setRepInput({ ...repInput, kontribusiOmset: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Persentasi Profit (%)<InfoTooltip content="5: > 30%\n4: 30% sd 25%\n3: 25% sd 20%\n2: 20% sd 15%\n1: < 15%" /></label><input type="number" placeholder="Kosongkan jika skip" value={repInput.margin ?? ''} onChange={e => setRepInput({ ...repInput, margin: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">Payment Behaviour (30%) <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Keterlambatan Bayar (Hari)<InfoTooltip content="5: 0 day\n4: < 7 day\n3: < 14 day\n2: < 21 day\n1: > 21 day" /></label><input type="number" placeholder="Mis: 0" value={repInput.ketepatanBayarHari ?? ''} onChange={e => setRepInput({ ...repInput, ketepatanBayarHari: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Jumlah Revisi Invoice<InfoTooltip content="5: Tidak pernah\n4: Jarang\n3: Kadang\n2: Sering\n1: Selalu" /></label><input type="number" placeholder="Mis: 0" value={repInput.revisiInvoice ?? ''} onChange={e => setRepInput({ ...repInput, revisiInvoice: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Jumlah Penagihan<InfoTooltip content="5: 1 kali\n4: 2 kali\n3: 3 kali\n2: 4 kali\n1: > 4 kali" /></label><input type="number" placeholder="Mis: 1" value={repInput.penagihanCount ?? ''} onChange={e => setRepInput({ ...repInput, penagihanCount: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">Operational Behaviour (15%) <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-4 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Cancel Order<InfoTooltip content="5: 1 kali\n4: 2 kali\n3: 3 kali\n2: 4 kali\n1: > 4 kali" /></label><input type="number" placeholder="0" value={repInput.cancelOrder ?? ''} onChange={e => setRepInput({ ...repInput, cancelOrder: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Telat Jadwal (Hari)<InfoTooltip content="5: > 3 hari sebelum\n4: < 3 hari sebelum\n3: Sesuai schedule\n2: < 3 hari sesudah\n1: > 3 hari sesudah" /></label><input type="number" placeholder="0" value={repInput.scheduleVariance ?? ''} onChange={e => setRepInput({ ...repInput, scheduleVariance: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Konflik QC<InfoTooltip content="5: 0 kali\n4: 1 kali\n3: 2 kali\n2: 3 kali\n1: > 3 kali" /></label><input type="number" placeholder="0" value={repInput.konflikQC ?? ''} onChange={e => setRepInput({ ...repInput, konflikQC: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Intervensi<InfoTooltip content="5: 0 kali\n4: 1 kali\n3: 2 kali\n2: 3 kali\n1: > 3 kali" /></label><input type="number" placeholder="0" value={repInput.intervensi ?? ''} onChange={e => setRepInput({ ...repInput, intervensi: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">Relationship Quality (15%) <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Survey Komunikasi<InfoTooltip content="5: Sangat Baik\n4: Baik\n3: Cukup\n2: Kurang\n1: Sangat Kurang" /></label><select value={repInput.komunikasiPIC ?? ''} onChange={e => setRepInput({ ...repInput, komunikasiPIC: e.target.value ? e.target.value as KomunikasiLevel : undefined })}><option value="">— Skip Parameter —</option><option value="SB">Sangat Baik</option><option value="B">Baik</option><option value="C">Cukup</option><option value="K">Kurang</option><option value="SK">Sangat Kurang</option></select></div>
                  <div><label className="block text-xs text-[#666] mb-1">Jumlah Komplain/Claim<InfoTooltip content="5: 0 kali\n4: 1 kali\n3: 2 kali\n2: 3 kali\n1: > 3 kali" /></label><input type="number" placeholder="0" value={repInput.claimCount ?? ''} onChange={e => setRepInput({ ...repInput, claimCount: e.target.value ? +e.target.value : undefined })} /></div>
                </div>
              </div>
              <div className="border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">Value Customer (10%) <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-normal">Opsional</span></h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-[#666] mb-1">Lama Kerjasama (Tahun)<InfoTooltip content="5: > 3 tahun\n4: 3 tahun\n3: 2 tahun\n2: 1 tahun\n1: < 1 tahun" /></label><input type="number" placeholder="Mis: 2" value={repInput.lamaKerjasama ?? ''} onChange={e => setRepInput({ ...repInput, lamaKerjasama: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Jumlah Fleet<InfoTooltip content="5: > 20 Fleet\n4: 15 sd 20 Fleet\n3: 10 sd 15 Fleet\n2: 5 sd 10 Fleet\n1: < 5 Fleet" /></label><input type="number" placeholder="Mis: 5" value={repInput.fleetSize ?? ''} onChange={e => setRepInput({ ...repInput, fleetSize: e.target.value ? +e.target.value : undefined })} /></div>
                  <div><label className="block text-xs text-[#666] mb-1">Punya Referensi?<InfoTooltip content="5: Memberikan referral\n1: Tidak memberikan" /></label><select value={repInput.hasReferral === undefined ? '' : repInput.hasReferral ? 'yes' : 'no'} onChange={e => setRepInput({ ...repInput, hasReferral: e.target.value === '' ? undefined : e.target.value === 'yes' })}><option value="">— Skip —</option><option value="yes">Ya</option><option value="no">Tidak</option></select></div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCalculate} className="relative flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Zap className="w-4 h-4 relative z-10" /><span className="relative z-10">Calculate Score</span>
            </motion.button>
            {calculated && !saved && (selectedCompany || isNewCompany) && (
              <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSave} className="relative flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Save className="w-4 h-4 relative z-10" /><span className="relative z-10">Save Assessment</span>
              </motion.button>
            )}
          </div>

          {/* Saved confirmation */}
          {saved && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Assessment saved successfully!</p>
                  <p className="text-xs text-[#888]">{projectName} — {assessmentDate}</p>
                </div>
              </div>
              {savedId && (
                <Link href={`/company/${savedId}`} className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                  View Company <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Result Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="col-span-5 space-y-5">
          <div className={`rounded-2xl p-4 border ${tab === 'new' ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-purple-500/20 bg-purple-500/5'}`}>
            <div className="flex items-center gap-2">
              {tab === 'new' ? <UserPlus className="w-5 h-5 text-cyan-400" /> : <RefreshCw className="w-5 h-5 text-purple-400" />}
              <div>
                <p className={`text-sm font-semibold ${tab === 'new' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {tab === 'new' ? '🆕 Pre-judgement (New Customer)' : '🔄 Follow-up (Repeated Customer)'}
                </p>
                <p className="text-[11px] text-[#888] mt-0.5">
                  {tab === 'new' ? 'Penilaian awal — potensi komersial, kredibilitas, kejelasan teknis' : 'Penilaian performa — revenue, payment, operasional, relationship, value'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 gradient-border">
            <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Score Result
            </h2>
            {calculated ? (
              <div className="flex flex-col items-center">
                <ScoreRing score={tab === 'new' ? newResult.totalScore : repResult.totalScore} level={tab === 'new' ? newResult.level : repResult.level} size={160} />
                <div className="mt-4"><LevelBadge level={tab === 'new' ? newResult.level : repResult.level} /></div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-[#444]">
                <Calculator className="w-12 h-12 mb-3" />
                <p className="text-sm">Enter parameters and click calculate</p>
              </div>
            )}
          </div>

          {calculated && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Score Breakdown
              </h2>
              {tab === 'new' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-blue-400">COMMERCIAL POTENTIAL</span><span className="text-xs font-mono" style={{ color: getLevelColor(newResult.level) }}>{newResult.commercialPotentialWeighted.toFixed(2)} (50%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Fleet Size" score={newResult.fleetScore} /><ScoreBar label="Estimated Value" score={newResult.valueScore} /><ScoreBar label="Term Payment" score={newResult.termPaymentScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-purple-400">CREDIBILITY</span><span className="text-xs font-mono">{newResult.credibilityWeighted.toFixed(2)} (30%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Legal Documents" score={newResult.legalScore} /><ScoreBar label="Background" score={newResult.backgroundScore} /><ScoreBar label="Reference" score={newResult.referenceScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-cyan-400">TECHNICAL CLARITY</span><span className="text-xs font-mono">{newResult.technicalClarityWeighted.toFixed(2)} (20%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Technical Docs" score={newResult.technicalScore} /><ScoreBar label="Decision Speed" score={newResult.decisionSpeedScore} /></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-green-400">REVENUE</span><span className="text-xs font-mono">{repResult.revenueWeighted.toFixed(2)} (30%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Kontribusi Omset" score={repResult.kontribusiOmsetScore} /><ScoreBar label="Margin" score={repResult.marginScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-blue-400">PAYMENT</span><span className="text-xs font-mono">{repResult.paymentWeighted.toFixed(2)} (30%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Ketepatan Bayar" score={repResult.ketepatanBayarScore} /><ScoreBar label="Revisi Invoice" score={repResult.revisiInvoiceScore} /><ScoreBar label="Penagihan" score={repResult.penagihanScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-amber-400">OPERATIONAL</span><span className="text-xs font-mono">{repResult.operationalWeighted.toFixed(2)} (15%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Cancel Order" score={repResult.cancelOrderScore} /><ScoreBar label="Schedule" score={repResult.scheduleVarianceScore} /><ScoreBar label="Konflik QC" score={repResult.konflikQCScore} /><ScoreBar label="Intervensi" score={repResult.intervensiScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-pink-400">RELATIONSHIP</span><span className="text-xs font-mono">{repResult.relationshipWeighted.toFixed(2)} (15%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Komunikasi PIC" score={repResult.komunikasiScore} /><ScoreBar label="Claim Count" score={repResult.claimScore} /></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-emerald-400">VALUE</span><span className="text-xs font-mono">{repResult.valueWeighted.toFixed(2)} (10%)</span></div>
                    <div className="space-y-1.5"><ScoreBar label="Lama Kerjasama" score={repResult.lamaKerjasamaScore} /><ScoreBar label="Fleet Size" score={repResult.fleetScore} /><ScoreBar label="Referral" score={repResult.referralScore} /></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}