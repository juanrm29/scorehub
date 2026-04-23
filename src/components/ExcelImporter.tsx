'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, CheckCircle2, Loader2, Info, Cloud } from 'lucide-react';
import { Company, RepeatedCustomerInput, NewCustomerInput } from '@/lib/types';
import { addCompany, addRepeatedAssessment, addNewAssessment, getCompanies } from '@/lib/store';

interface ExcelImporterProps {
  onImportComplete: () => void;
}

// ─── Helper: parse Indonesian date string to Date object ──────────────────────
function parseIndonesianDate(str: string): Date | null {
  if (!str || typeof str !== 'string') return null;
  const months: Record<string, number> = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
  };
  const clean = str.trim().toLowerCase();
  // Format: "3 desember 2024"
  const m = clean.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (m) {
    const day = parseInt(m[1]);
    const month = months[m[2]];
    const year = parseInt(m[3]);
    if (month !== undefined) return new Date(year, month, day);
  }
  // Try direct parse
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Helper: diff days between two date strings ──────────────────────────────────
function diffDays(dateA: any, dateB: any): number | undefined {
  const toDate = (val: any): Date | null => {
    try {
      if (val === undefined || val === null || val === '') return null;
      // JS Date object (from cellDates:true) - normalize to midnight UTC
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return null;
        return new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()));
      }
      // Excel serial number fallback
      if (typeof val === 'number' && val > 1000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(epoch.getTime() + val * 86400000);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      }
      // String - try Indonesian then generic
      if (typeof val === 'string') {
        const d = parseIndonesianDate(val);
        if (d) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const d2 = new Date(val);
        if (!isNaN(d2.getTime())) return new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));
      }
    } catch { /* ignore */ }
    return null;
  };

  const dA = toDate(dateA);
  const dB = toDate(dateB);
  if (!dA || !dB) return undefined;
  return Math.round((dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24));
}


// ─── Helper: parse duration string like "28 Hari" → 28 ───────────────────────
function parseDuration(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return val;
  const m = String(val).match(/(\d+)/);
  return m ? parseInt(m[1]) : undefined;
}

// ─── Helper: parse fleet string like ">50" → 50 ──────────────────────────────
function parseFleet(val: any): number {
  if (val === undefined || val === null) return 10;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[^\d]/g, '');
  return parseInt(str) || 10;
}

// ─── Helper: convert percentage (0.35 → 35, or 35 → 35, or "35%" → 35) ─────
function pct(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  // Remove % sign if present
  const s = String(val).replace(/[%,\s]/g, '');
  const n = parseFloat(s);
  if (isNaN(n)) return undefined;
  return n <= 1 ? Math.round(n * 10000) / 100 : n; // 0.35 → 35.00
}

// ─── Helper: score "Approved Pekerjaan" → termPayment days ───────────────────
// Quotation = informal, treat as longest
// PO/SPK = formal, moderate
// Kontrak = best, treat as shortest
function approvalToTermDays(approval: string): number {
  const a = String(approval || '').toLowerCase();
  if (a.includes('kontrak')) return 14;    // Kontrak → DP 50% skor 5
  if (a.includes('spk')) return 30;        // SPK → skor 4
  if (a.includes('po')) return 30;         // PO → skor 4
  if (a.includes('quotation')) return 45;  // Quotation → skor 3
  return 45;
}

// ─── Helper: detect references ────────────────────────────────────────────────
function isReferral(val: any): boolean {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s !== '-' && s !== '' && s !== 'tidak' && s !== 'no' && s !== '0';
}

// ─── Helper: convert any cell value to ISO date string (YYYY-MM-DD) ───────────
function toISODate(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;
  try {
    // JS Date object (from cellDates:true)
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      return val.toISOString().split('T')[0];
    }
    // Excel serial number
    if (typeof val === 'number' && val > 1000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + val * 86400000);
      return d.toISOString().split('T')[0];
    }
    // String: try Indonesian then generic
    if (typeof val === 'string') {
      const id = parseIndonesianDate(val);
      if (id) return `${id.getFullYear()}-${String(id.getMonth()+1).padStart(2,'0')}-${String(id.getDate()).padStart(2,'0')}`;
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Main process ─────────────────────────────────────────────────────────────
export function ExcelImporter({ onImportComplete }: ExcelImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; notes: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcel = async (file: File) => {
    setLoading(true);
    setResult(null);

    // PERF-04 FIX: defer CPU-bound XLSX parsing to avoid freezing the UI thread.
    // setTimeout(0) yields to the browser event loop first so the loading spinner renders.
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    try {
      const data = await file.arrayBuffer();
      // cellDates:true → Excel date serials become JS Date objects (midnight UTC-normalized later)
      // Numbers (profit, nilai) stay as numbers with raw:true in sheet_to_json
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      let success = 0;
      let failed = 0;
      const notes: string[] = [];
      // Track earliest actual arrival per company (for registeredDate & lamaKerjasama)
      const earliestArrivalPerCompany = new Map<string, string>();

      // BUG-05 FIX: Build an in-memory company map ONCE at the start of import.
      // Old code called getCompanies() (full localStorage JSON.parse) on every single row,
      // causing 300-400 redundant deserializations during a 100-row import.
      const companyMap = new Map<string, ReturnType<typeof getCompanies>[number]>();
      getCompanies().forEach(c => companyMap.set(c.companyName.toLowerCase(), c));

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // raw:true keeps numbers as numbers (not strings), Date objects stay as Date objects
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as any[][];

        if (rows.length < 3) continue;

        // Find header row: look for "Perusahaan Client"
        let headerRowIdx = 1;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase()).join('|');
          if (rowStr.includes('perusahaan client') || rowStr.includes('contact person')) {
            headerRowIdx = i;
            break;
          }
        }

        // Build headers safely - sparse arrays may have holes/undefined
        const headers = Array.from({ length: (rows[headerRowIdx] || []).length }, (_, i) => {
          const h = (rows[headerRowIdx] || [])[i];
          return h != null ? String(h).toLowerCase().trim() : '';
        });
        // Sub-header row
        const subHeaders = Array.from({ length: (rows[headerRowIdx + 1] || []).length }, (_, i) => {
          const h = (rows[headerRowIdx + 1] || [])[i];
          return h != null ? String(h).toLowerCase().trim() : '';
        });

        // Find column indices safely
        const col = (search: string, startFrom = 0): number => {
          return headers.findIndex((h, i) => i >= startFrom && h != null && typeof h === 'string' && h.includes(search.toLowerCase()));
        };

        // Column indices - hardcoded based on diagnosed structure
        const COL = {
          no: col('no'),
          company: col('perusahaan'),
          contact: col('contact person'),
          email: col('email'),
          phone: col('telp'),
          location: col('alamat'),
          status: col('status'),
          legalDocs: col('kelengkapan'),
          fleet: col('jumlah fleet'),
          referral: col('referensi'),
          projectName: col('project name'),
          vesselType: col('jenis kapal'),
          techDocs: col('tehnical'),
          classBody: col('class'),
          repairList: col('repair list'),
          dockingStatus: col('status dock'),
          periode: col('periode'),
          approval: col('approved'),
          planArrival: col('plan arrival'),
          actualArrival: col('arrival'),
          naikDock: col('naik'),
          start: col('start'),
          turunDock: col('turun'),
          finish: col('finish'),
          // Durasi has Plan(col 24) and Actual(col 25)
          durasiPlan: 24,
          durasiActual: 25,
          nilaiProject: col('nilai project'),
          profit: col('persentasi profit'),
          omset: col('persentasi omset'),
          // Invoice/Payment data
          invoice1: col('invoice 1'),
          noInvoice1: col('no invoice 1'),
          payment1Plan: 31, // Plan payment date
          payment1Actual: 32, // Actual payment date
          invoice2: col('invoice 2'),
          noInvoice2: col('no invoice 2'),
          payment2Plan: 34,
          payment2Actual: 35,
          invoice3: col('invoice 3'),
          noInvoice3: col('no invoice 3'),
          payment3Plan: 38,
          payment3Actual: 39,
        };

        const getVal = (row: any[], idx: number) => {
          if (idx < 0 || idx >= row.length) return undefined;
          const v = row[idx];
          if (v === null || v === undefined || v === '') return undefined;
          return v;
        };

        for (let i = headerRowIdx + 2; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Skip sub-header rows ("Plan", "Actual", etc)
          const companyRaw = getVal(row, COL.company);
          if (!companyRaw || ['plan', 'actual', 'no', 'perusahaan client'].includes(String(companyRaw).toLowerCase().trim())) continue;
          const companyName = String(companyRaw).trim();
          if (companyName === '') continue;

          try {
            // ── COMPANY INFO ──────────────────────────────────────────────────
            const email = String(getVal(row, COL.email) || '');
            const phone = String(getVal(row, COL.phone) || '');
            const location = String(getVal(row, COL.location) || '');
            const contactPerson = String(getVal(row, COL.contact) || '');
            const fleetSize = parseFleet(getVal(row, COL.fleet));
            const referralVal = getVal(row, COL.referral);
            const hasReferral = isReferral(referralVal);

            // ── ACTUAL ARRIVAL DATE (used as assessment date + registered date) ─
            const actualArrivalRaw = getVal(row, COL.actualArrival);
            const planArrivalRaw = getVal(row, COL.planArrival);
            const actualArrivalISO = toISODate(actualArrivalRaw) || toISODate(planArrivalRaw);
            const finishISO = toISODate(getVal(row, COL.finish)) || toISODate(getVal(row, COL.turunDock));
            const assessmentDate = actualArrivalISO ? `${actualArrivalISO}T00:00:00.000Z` : new Date().toISOString();

            // Track earliest arrival per company for registeredDate & lamaKerjasama
            const companyKey = companyName.toLowerCase();
            if (actualArrivalISO) {
              const prev = earliestArrivalPerCompany.get(companyKey);
              if (!prev || actualArrivalISO < prev) {
                earliestArrivalPerCompany.set(companyKey, actualArrivalISO);
              }
            }

            // ── FIND OR CREATE COMPANY ────────────────────────────────────────
            // BUG-05 FIX: use in-memory companyMap instead of calling getCompanies() every row
            let existing = companyMap.get(companyName.toLowerCase());
            if (!existing) {
              // registeredDate = first actual arrival date for this company
              const registeredDate = earliestArrivalPerCompany.get(companyKey)
                ? `${earliestArrivalPerCompany.get(companyKey)}T00:00:00.000Z`
                : assessmentDate;
              existing = addCompany({
                companyName,
                contactPerson,
                email,
                phone,
                location,
                fleetSize,
                industry: 'Maritime',
                registeredDate,
              });
              companyMap.set(companyName.toLowerCase(), existing);
            } else {
              // Update fleet size if bigger (in-memory map update)
              if (fleetSize > existing.fleetSize) {
                existing = { ...existing, fleetSize };
                companyMap.set(companyName.toLowerCase(), existing);
              }
            }

            // ── PROJECT INFO ──────────────────────────────────────────────────
            const projectName = String(getVal(row, COL.projectName) || `Project ${sheetName}`);
            const periodeRaw = String(getVal(row, COL.periode) || sheetName);
            // Period: use actual arrival → finish dates if available, fallback to periode column
            const periodStart = actualArrivalISO || periodeRaw;
            const periodEnd   = finishISO || actualArrivalISO || periodeRaw;

            const parseRaw = (val: any): number | undefined => {
              if (val === undefined || val === null || val === '') return undefined;
              const s = String(val).replace(/[,\s]/g, '');
              const n = parseFloat(s);
              return isNaN(n) ? undefined : n;
            };
            const nilaiProject = parseRaw(getVal(row, COL.nilaiProject));
            const profitPct = pct(getVal(row, COL.profit));
            const omsetPct = pct(getVal(row, COL.omset));
            const legalDocs = String(getVal(row, COL.legalDocs) || '');
            const techDocs = String(getVal(row, COL.techDocs) || '');
            const approvalType = String(getVal(row, COL.approval) || 'Quotation');

            // ── SCHEDULE ANALYSIS ──────────────────────────────────────────
            // Priority 1: Duration overrun (actual - plan days) — most meaningful
            //   because arrivals are often on-time but work runs over
            // Priority 2: Arrival difference as fallback
            const scheduleArrivalVar = diffDays(planArrivalRaw, actualArrivalRaw); // +days = late
            const durasiPlan   = parseDuration(getVal(row, COL.durasiPlan));
            const durasiActual = parseDuration(getVal(row, COL.durasiActual));
            const durationOverrun = (durasiPlan !== undefined && durasiActual !== undefined)
              ? durasiActual - durasiPlan
              : undefined;
            // Prioritize duration overrun (the real operational signal)
            const effectiveScheduleVar = durationOverrun ?? scheduleArrivalVar;

            // ── PAYMENT ANALYSIS: Invoice date vs Payment date → keterlambatan ─
            // For each invoice: diff between Invoice date (plan) and Payment date (actual)
            // Positive = late payment, 0 = on time
            const inv1Date = getVal(row, COL.invoice1);
            const pay1Plan = getVal(row, COL.payment1Plan);
            const pay1Actual = getVal(row, COL.payment1Actual);
            const inv2Date = getVal(row, COL.invoice2);
            const pay2Plan = getVal(row, COL.payment2Plan);
            const pay2Actual = getVal(row, COL.payment2Actual);
            const inv3Date = getVal(row, COL.invoice3);
            const pay3Plan = getVal(row, COL.payment3Plan);
            const pay3Actual = getVal(row, COL.payment3Actual);

            // ── PAYMENT ANALYSIS ──────────────────────────────────────────────
            // Each invoice: delay = diffDays(payment_plan, payment_actual)
            // Positive = late, 0 = on-time, negative = early
            const d1 = diffDays(pay1Plan, pay1Actual);
            const d2 = diffDays(pay2Plan, pay2Actual);
            const d3 = diffDays(pay3Plan, pay3Actual);
            const delays: number[] = [];
            if (d1 !== undefined) delays.push(d1);
            if (d2 !== undefined) delays.push(d2);
            if (d3 !== undefined) delays.push(d3);
            // Use WEIGHTED AVERAGE delay — DP (first) matters most
            // If only 1 invoice, use that. If 2+, weight first invoice 50%, rest split equally.
            let worstPaymentDelay: number | undefined = undefined;
            if (delays.length === 1) {
              worstPaymentDelay = Math.max(0, delays[0]);
            } else if (delays.length === 2) {
              worstPaymentDelay = Math.max(0, Math.round(delays[0] * 0.6 + delays[1] * 0.4));
            } else if (delays.length >= 3) {
              worstPaymentDelay = Math.max(0, Math.round(delays[0] * 0.5 + delays[1] * 0.3 + delays[2] * 0.2));
            }

            // ── INVOICE / PENAGIHAN COUNT ─────────────────────────────────────
            // Penagihan = number of invoices where payment was LATE (actual > plan)
            // Having 3 invoices is normal (DP, Termin, Final) — not penagihan
            let penagihanCount = 0;
            if (d1 !== undefined && d1 > 0) penagihanCount++; // Invoice 1 was late
            if (d2 !== undefined && d2 > 0) penagihanCount++; // Invoice 2 was late
            if (d3 !== undefined && d3 > 0) penagihanCount++; // Invoice 3 was late
            // If no payment data at all, leave undefined (skip parameter)
            const penagihanFinal = delays.length > 0 ? penagihanCount : undefined;

            // ── REVISI INVOICE ────────────────────────────────────────────────
            // Only count explicit "revisi" / "rev" text in invoice numbers
            // Multiple invoices (DP, Termin, Final) are NORMAL — not revisions
            const noInv1 = String(getVal(row, COL.noInvoice1) || '');
            const noInv2 = String(getVal(row, COL.noInvoice2) || '');
            const noInv3 = String(getVal(row, COL.noInvoice3) || '');
            let revisiCount = 0;
            [noInv1, noInv2, noInv3].forEach(n => {
              if (n.toLowerCase().includes('revisi') || n.toLowerCase().includes('rev.')) revisiCount++;
            });

            // ── TERM PAYMENT: from Approval Type ─────────────────────────
            const termPaymentDays = approvalToTermDays(approvalType);

            // ── DECISION SPEED DERIVATION ─────────────────────────────────────
            // Proxy: gap between Actual Arrival and Naik Dock/Start
            // Shorter gap = client was better prepared = faster "decision"
            const arrivalToStart = diffDays(actualArrivalRaw, getVal(row, COL.start))
              ?? diffDays(actualArrivalRaw, getVal(row, COL.naikDock));
            // Convert gap to "days to decide" (1 = same/next day, etc.)
            const decisionSpeedDays = arrivalToStart !== undefined && arrivalToStart >= 0
              ? Math.max(1, arrivalToStart)
              : undefined;

            // ─────────────────────────────────────────────────────────────────
            // BUSINESS LOGIC:
            // - First project ever for this company → New Assessment + Repeated Assessment
            // - Subsequent projects WITHIN 3 years (still active) → Repeated only
            // - If last deal was > 3 years ago (lapsed) → New + Repeated again (re-assessment)
            // ─────────────────────────────────────────────────────────────────
            const THREE_YEARS_MS = 3 * 365.25 * 24 * 60 * 60 * 1000;
            const hasNoPreviousProjects = existing.newAssessments.length === 0 && existing.repeatedAssessments.length === 0;
            
            // Check if lapsed (last deal > 3 years ago)
            const lastDealStr = existing.lastDealDate;
            const lastDealDate = lastDealStr ? new Date(lastDealStr) : null;
            const isLapsed = lastDealDate ? (Date.now() - lastDealDate.getTime() > THREE_YEARS_MS) : false;
            
            const needsNewAssessment = hasNoPreviousProjects || isLapsed;

            // ── DUPLICATE DETECTION ──────────────────────────────────────────
            // Skip if assessment with same project name + similar date already exists
            const isDuplicateNew = existing.newAssessments.some(
              a => a.projectName === projectName && a.date.startsWith(actualArrivalISO || '____')
            );
            const isDuplicateRep = existing.repeatedAssessments.some(
              a => a.projectName === projectName && a.date.startsWith(actualArrivalISO || '____')
            );
            if (isDuplicateNew && isDuplicateRep) {
              notes.push(`⏭️ SKIP (duplikat): ${companyName} — ${projectName}`);
              success++;
              continue;
            }

            // ── NEW ASSESSMENT (Pre-judgement) ─────────────────────────────────
            // Created for: first-time client OR lapsed client (re-assessment)
            if (needsNewAssessment && !isDuplicateNew) {
              const newInput: NewCustomerInput = {
                companyName: existing.companyName,
                contactPerson: existing.contactPerson,
                email: existing.email,
                phone: existing.phone,
                location: existing.location,
                fleetSize,
                estimatedValue: nilaiProject,
                termPayment: termPaymentDays,
                legalDocuments: legalDocs,
                backgroundMedia: '',
                hasReference: hasReferral,
                technicalDocuments: techDocs,
                decisionSpeed: decisionSpeedDays,
              };
              addNewAssessment(
                existing.id,
                projectName,
                assessmentDate,  // ← use actual arrival date
                newInput,
                `Pre-judgement | Sheet: ${sheetName} | Arrival: ${actualArrivalISO ?? periodeRaw}`
              );
              notes.push(`✅ NEW: ${companyName} — ${projectName}`);
            }

            // ── REPEATED ASSESSMENT (Lanjutan/Follow-up) ──────────────────────
            // lamaKerjasama = years from earliest known arrival for this company
            // BUG-10 FIX: use assessmentDate (the project's date) as end reference,
            // NOT Date.now(). Importing historical 2020 data with Date.now() would
            // compute 5+ years instead of the correct 0-1 years at that project time.
            const earliestKnown = earliestArrivalPerCompany.get(companyKey);
            let lamaKerjasama = 1;
            if (earliestKnown && actualArrivalISO && actualArrivalISO !== earliestKnown) {
              const diffMs = new Date(actualArrivalISO).getTime() - new Date(earliestKnown).getTime();
              lamaKerjasama = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 365)));
            } else if (existing.repeatedAssessments.length > 0 || existing.newAssessments.length > 0) {
              // Fallback: compute from first known assessment relative to current project date
              const oldest = existing.repeatedAssessments[0]?.date || existing.newAssessments[0]?.date;
              const refDate = actualArrivalISO ? new Date(actualArrivalISO) : new Date();
              if (oldest) {
                const diffMs = refDate.getTime() - new Date(oldest).getTime();
                lamaKerjasama = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 365)));
              }
            }

            const repInput: RepeatedCustomerInput = {
              companyName: existing.companyName,
              contactPerson: existing.contactPerson,
              email: existing.email,
              phone: existing.phone,
              location: existing.location,
              fleetSize,
              hasReferral,
              // Revenue
              margin: profitPct,
              kontribusiOmset: omsetPct,
              // Payment (worst-case delay from invoice plan vs actual)
              ketepatanBayarHari: worstPaymentDelay,
              revisiInvoice: revisiCount > 0 ? revisiCount : undefined,
              penagihanCount: penagihanFinal,
              // Operational
              cancelOrder: undefined,
              scheduleVariance: effectiveScheduleVar,
              konflikQC: undefined,
              intervensi: undefined,
              // Relationship (manual input later)
              komunikasiPIC: undefined,
              claimCount: undefined,
              // Value Customer
              lamaKerjasama,
            };

            if (!isDuplicateRep) {
              addRepeatedAssessment(
                existing.id,
                projectName,
                assessmentDate,           // ← use actual arrival date
                periodStart, periodEnd,   // ← real project date range
                repInput,
                `Lanjutan | Sheet: ${sheetName} | Nilai: ${nilaiProject ? `Rp ${Number(nilaiProject).toLocaleString('id-ID')}` : 'N/A'} | Delay: ${worstPaymentDelay ?? '-'}d | Durasi: ${durasiPlan ?? '?'}→${durasiActual ?? '?'}d`
              );
              notes.push(`🔄 REP: ${companyName} — ${projectName}${needsNewAssessment && !isDuplicateNew ? ' (+ New)' : ''}`);
            }

            success++;
          } catch (err) {
            console.error('Row error:', err, 'Row:', row.slice(0, 5));
            failed++;
            notes.push(`❌ GAGAL: ${String(companyRaw)}`);
          }
        }
      }

      if (success > 0) {
        notes.push('☁️ Data otomatis di-sync ke Google Sheets di background.');
      }
      setResult({ success, failed, notes });
      if (success > 0) onImportComplete();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('ExcelImporter crash:', error);
      setResult({ success: 0, failed: 1, notes: [`❌ CRASH: ${msg}`, 'Cek browser console (F12) untuk detail lengkap.'] });
    } finally {
      setLoading(false);
    }
  };




  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-blue-400 text-sm font-semibold hover:border-blue-500/40 hover:from-blue-600/30 hover:to-purple-600/30 transition-all">
          <Upload className="w-4 h-4" /> Import Excel
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-[#555] px-3 py-1.5 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <Cloud className="w-3 h-3 text-emerald-500/60" />
          Auto-sync ke Sheets
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-[#888] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> Import Client Master Data
            </h2>
            <p className="text-sm text-[#888] mb-2">Upload file <strong>CLIENT MASTER DATA.xlsx</strong> atau <span className="text-emerald-400 font-semibold">sync langsung dari Google Sheets</span>.</p>

            {/* Info: auto sync */}
            <div className="w-full mb-4 py-2.5 px-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-xs flex items-center gap-2">
              <Cloud className="w-4 h-4 shrink-0" />
              Data akan otomatis di-sync ke Google Sheets setelah import selesai.
            </div>

            {/* Conversion notes */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5 text-xs text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Konversi Cerdas yang Dilakukan:</p>
              <p>• <strong>Payment Plan vs Actual</strong> → Ketepatan Bayar (weighted avg hari)</p>
              <p>• <strong>Invoice terlambat</strong> → Penagihan Count (hanya yang late)</p>
              <p>• <strong>Durasi Plan vs Actual</strong> → Schedule Variance (overrun hari)</p>
              <p>• <strong>Arrival → Start gap</strong> → Decision Speed (kesiapan client)</p>
              <p>• <strong>Approved Pekerjaan</strong> (Quotation/PO/SPK/Kontrak) → Term Payment</p>
              <p>• <strong>Kelengkapan Dokumen</strong> → Legal Score | <strong>Tehnical</strong> → Technical Score</p>
              <p>• <strong>Profit/Omset</strong> (0.35 → 35%) → Revenue | <strong>Duplikat</strong> → Auto-skip</p>
            </div>

            {!result ? (
              <div 
                className="border-2 border-dashed border-blue-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/60 hover:bg-blue-500/5 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                    <p className="text-sm font-medium text-blue-200">Memproses & mengkonversi data...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Klik atau Drag file Excel</p>
                    <p className="text-xs text-[#666]">Mendukung .xlsx, .xls</p>
                  </>
                )}
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processExcel(file);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3">
                  {result.success > 0
                    ? <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    : <span className="text-2xl">❌</span>
                  }
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {result.success > 0 ? 'Import Selesai!' : 'Import Gagal'}
                    </h3>
                    <p className="text-sm text-[#888]">
                      {result.success > 0 && <><strong className="text-emerald-400">{result.success}</strong> berhasil &nbsp;·&nbsp;</>}
                      {result.failed > 0 && <span className="text-pink-400">{result.failed} gagal</span>}
                    </p>
                  </div>
                </div>
                {result.notes.length > 0 && (
                  <div className="bg-black/30 rounded-lg p-3 max-h-48 overflow-y-auto text-xs space-y-1">
                    {result.notes.map((n, i) => (
                      <p key={i} className="text-[#aaa] font-mono break-all">{n}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {result.success === 0 && (
                    <button onClick={() => setResult(null)} className="flex-1 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold transition-colors">
                      Coba Lagi
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors">
                    {result.success > 0 ? 'Selesai & Lihat Data Master' : 'Tutup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
