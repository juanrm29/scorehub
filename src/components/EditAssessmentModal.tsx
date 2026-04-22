'use client';

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { NewAssessment, RepeatedAssessment, NewCustomerInput, RepeatedCustomerInput, KomunikasiLevel } from '@/lib/types';
import { updateNewAssessment, updateRepeatedAssessment } from '@/lib/store';

interface EditAssessmentModalProps {
  companyId: string;
  assessment: NewAssessment | RepeatedAssessment;
  type: 'NEW' | 'REPEATED';
  onClose: () => void;
  onSaved: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-[#666] uppercase tracking-widest block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder }: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-blue-500/50 transition-colors"
    />
  );
}

export function EditAssessmentModal({ companyId, assessment, type, onClose, onSaved }: EditAssessmentModalProps) {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(assessment.notes || '');

  // ─── NEW CUSTOMER STATE ──────────────────────────────────────────────────────
  const newInput = assessment.input as NewCustomerInput;
  const [newFleet, setNewFleet] = useState(String(newInput.fleetSize ?? ''));
  const [newEstValue, setNewEstValue] = useState(String(newInput.estimatedValue ?? ''));
  const [newTerm, setNewTerm] = useState(String(newInput.termPayment ?? ''));
  const [newLegal, setNewLegal] = useState(newInput.legalDocuments ?? '');
  const [newBg, setNewBg] = useState(newInput.backgroundMedia ?? '');
  const [newRef, setNewRef] = useState(newInput.hasReference ? 'ya' : 'tidak');
  const [newTech, setNewTech] = useState(newInput.technicalDocuments ?? '');
  const [newDecision, setNewDecision] = useState(String(newInput.decisionSpeed ?? ''));

  // ─── REPEATED CUSTOMER STATE ─────────────────────────────────────────────────
  const repInput = assessment.input as RepeatedCustomerInput;
  const repData = assessment as RepeatedAssessment;
  const [repProject, setRepProject] = useState(type === 'REPEATED' ? repData.projectName : '');
  const [repPeriodStart, setRepPeriodStart] = useState(type === 'REPEATED' ? repData.periodStart : '');
  const [repPeriodEnd, setRepPeriodEnd] = useState(type === 'REPEATED' ? repData.periodEnd : '');
  const [repMargin, setRepMargin] = useState(String(repInput.margin ?? ''));
  const [repOmset, setRepOmset] = useState(String(repInput.kontribusiOmset ?? ''));
  const [repKetepatan, setRepKetepatan] = useState(String(repInput.ketepatanBayarHari ?? ''));
  const [repRevisi, setRepRevisi] = useState(String(repInput.revisiInvoice ?? ''));
  const [repPenagihan, setRepPenagihan] = useState(String(repInput.penagihanCount ?? ''));
  const [repCancel, setRepCancel] = useState(String(repInput.cancelOrder ?? ''));
  const [repSchedule, setRepSchedule] = useState(String(repInput.scheduleVariance ?? ''));
  const [repKonflikQC, setRepKonflikQC] = useState(String(repInput.konflikQC ?? ''));
  const [repIntervensi, setRepIntervensi] = useState(String(repInput.intervensi ?? ''));
  const [repKomunikasi, setRepKomunikasi] = useState<KomunikasiLevel | ''>(repInput.komunikasiPIC ?? '');
  const [repClaim, setRepClaim] = useState(String(repInput.claimCount ?? ''));
  const [repLama, setRepLama] = useState(String(repInput.lamaKerjasama ?? ''));
  const [repFleet, setRepFleet] = useState(String(repInput.fleetSize ?? ''));
  const [repReferral, setRepReferral] = useState(repInput.hasReferral ? 'ya' : 'tidak');

  const n = (v: string) => v === '' ? undefined : parseFloat(v);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (type === 'NEW') {
        const input: NewCustomerInput = {
          companyName: newInput.companyName,
          contactPerson: newInput.contactPerson,
          email: newInput.email,
          phone: newInput.phone,
          location: newInput.location,
          fleetSize: n(newFleet),
          estimatedValue: n(newEstValue),
          termPayment: n(newTerm),
          legalDocuments: newLegal,
          backgroundMedia: newBg,
          hasReference: newRef === 'ya',
          technicalDocuments: newTech,
          decisionSpeed: n(newDecision),
        };
        updateNewAssessment(companyId, assessment.id, input, notes);
      } else {
        const input: RepeatedCustomerInput = {
          companyName: repInput.companyName,
          contactPerson: repInput.contactPerson,
          email: repInput.email,
          phone: repInput.phone,
          location: repInput.location,
          fleetSize: n(repFleet),
          hasReferral: repReferral === 'ya',
          margin: n(repMargin),
          kontribusiOmset: n(repOmset),
          ketepatanBayarHari: n(repKetepatan),
          revisiInvoice: n(repRevisi),
          penagihanCount: n(repPenagihan),
          cancelOrder: n(repCancel),
          scheduleVariance: n(repSchedule),
          konflikQC: n(repKonflikQC),
          intervensi: n(repIntervensi),
          komunikasiPIC: repKomunikasi || undefined,
          claimCount: n(repClaim),
          lamaKerjasama: n(repLama),
        };
        updateRepeatedAssessment(companyId, assessment.id, repProject, repPeriodStart, repPeriodEnd, input, notes);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan. Cek konsol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-2xl p-6 my-8 relative shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-t-2xl" />

        <button onClick={onClose} className="absolute top-5 right-5 text-[#555] hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-1 pr-8">
          {type === 'NEW' ? '✏️ Edit Pre-judgement Assessment' : '✏️ Edit Repeated Assessment'}
        </h2>
        <p className="text-xs text-[#555] mb-6">
          {type === 'NEW' ? (assessment as NewAssessment).projectName : repProject} · ID: {assessment.id}
        </p>

        {type === 'NEW' ? (
          <div className="space-y-5">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Commercial Potential (50%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fleet Size (vessels)"><Input value={newFleet} onChange={setNewFleet} type="number" placeholder="e.g. 44" /></Field>
              <Field label="Estimasi Nilai Project (IDR)"><Input value={newEstValue} onChange={setNewEstValue} type="number" placeholder="e.g. 500000000" /></Field>
              <Field label="Term Payment (hari)">
                <select value={newTerm} onChange={e => setNewTerm(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="">— Pilih —</option>
                  <option value="14">≤14 hari (Skor 5 — Kontrak/DP besar)</option>
                  <option value="30">≤30 hari (Skor 4 — SPK/PO termin)</option>
                  <option value="45">≤45 hari (Skor 3 — Quotation basis)</option>
                  <option value="60">≤60 hari (Skor 2 — Termin panjang)</option>
                  <option value="90">›60 hari (Skor 1)</option>
                </select>
              </Field>
              <Field label="Referensi">
                <select value={newRef} onChange={e => setNewRef(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="ya">Ya — Ada referral</option>
                  <option value="tidak">Tidak</option>
                </select>
              </Field>
            </div>

            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest pt-2">Credibility (30%)</p>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Legal Documents (pisahkan dengan koma)">
                <Input value={newLegal} onChange={setNewLegal} placeholder="Izin usaha, NPWP, CSMS, Norek, Kontrak" />
              </Field>
              <Field label="Background Media (pisahkan dengan koma)">
                <Input value={newBg} onChange={setNewBg} placeholder="Website, LinkedIn, Instagram" />
              </Field>
            </div>

            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest pt-2">Technical Clarity (20%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Technical Documents">
                <Input value={newTech} onChange={setNewTech} placeholder="Ship part, Surat laut, Repair list" />
              </Field>
              <Field label="Kecepatan Keputusan (hari)">
                <select value={newDecision} onChange={e => setNewDecision(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="">— Pilih —</option>
                  <option value="1">{'<2 hari (Skor 5)'}</option>
                  <option value="4">{'3–5 hari (Skor 4)'}</option>
                  <option value="6">{'5–7 hari (Skor 3)'}</option>
                  <option value="10">{'7–14 hari (Skor 2)'}</option>
                  <option value="20">{'>14 hari (Skor 1)'}</option>
                </select>
              </Field>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Project Name"><Input value={repProject} onChange={setRepProject} placeholder="TB. AZIZAH" /></Field>
              <Field label="Fleet Size"><Input value={repFleet} onChange={setRepFleet} type="number" placeholder="e.g. 44" /></Field>
              <Field label="Period Start"><Input value={repPeriodStart} onChange={setRepPeriodStart} placeholder="Januari 2025" /></Field>
              <Field label="Period End"><Input value={repPeriodEnd} onChange={setRepPeriodEnd} placeholder="Desember 2025" /></Field>
            </div>

            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest pt-2">Revenue Contribution (30%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Profit Margin (%)"><Input value={repMargin} onChange={setRepMargin} type="number" placeholder="e.g. 35.16" /></Field>
              <Field label="Kontribusi Omset (%)"><Input value={repOmset} onChange={setRepOmset} type="number" placeholder="e.g. 0.81" /></Field>
            </div>

            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest pt-2">Payment Behaviour (30%)</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Keterlambatan Bayar (hari)"><Input value={repKetepatan} onChange={setRepKetepatan} type="number" placeholder="0 = on time, 7 = telat 7 hari" /></Field>
              <Field label="Revisi Invoice (kali)"><Input value={repRevisi} onChange={setRepRevisi} type="number" placeholder="0 = tidak pernah" /></Field>
              <Field label="Penagihan {'>'} jatuh tempo (kali)"><Input value={repPenagihan} onChange={setRepPenagihan} type="number" placeholder="1 = sekali ditagih" /></Field>
            </div>

            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest pt-2">Operational Behaviour (15%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cancel Order (kali)"><Input value={repCancel} onChange={setRepCancel} type="number" placeholder="0 = tidak pernah" /></Field>
              <Field label="Schedule Variance (hari)">
                <Input value={repSchedule} onChange={setRepSchedule} type="number" placeholder="-3 = 3 hari awal, +3 = 3 hari telat" />
              </Field>
              <Field label="Konflik QC (kali)"><Input value={repKonflikQC} onChange={setRepKonflikQC} type="number" placeholder="0 = tidak ada" /></Field>
              <Field label="Intervensi Lapangan (kali)"><Input value={repIntervensi} onChange={setRepIntervensi} type="number" placeholder="0 = tidak ada" /></Field>
            </div>

            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest pt-2">Relationship Quality (15%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Komunikasi PIC">
                <select value={repKomunikasi} onChange={e => setRepKomunikasi(e.target.value as KomunikasiLevel)} className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="">— Belum diisi —</option>
                  <option value="SB">SB — Sangat Baik (Skor 5)</option>
                  <option value="B">B — Baik (Skor 4)</option>
                  <option value="C">C — Cukup (Skor 3)</option>
                  <option value="K">K — Kurang (Skor 2)</option>
                  <option value="SK">SK — Sangat Kurang (Skor 1)</option>
                </select>
              </Field>
              <Field label="Claim & Blame (kali)"><Input value={repClaim} onChange={setRepClaim} type="number" placeholder="0 = tidak pernah" /></Field>
            </div>

            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest pt-2">Value Customer (10%)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Lama Kerjasama (tahun)"><Input value={repLama} onChange={setRepLama} type="number" placeholder="e.g. 3" /></Field>
              <Field label="Referral">
                <select value={repReferral} onChange={e => setRepReferral(e.target.value)} className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="ya">Ya — Ada referral (Skor 5)</option>
                  <option value="tidak">Tidak (Skor 1)</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-[#1a1a2e]">
          <Field label="Catatan / Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#0d0d1a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
              placeholder="Catatan tambahan..."
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#2a2a3a] text-[#888] hover:text-white hover:border-[#3a3a4a] text-sm font-semibold transition-all">
            Batal
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan & Recalculate'}
          </button>
        </div>
      </div>
    </div>
  );
}
