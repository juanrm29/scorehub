/**
 * pushToSheets.ts
 * Client-side utility: after saving an assessment, push a summary row
 * to the Google Sheets "SCORING LOG" tab via /api/sheets POST.
 *
 * This runs fire-and-forget — it won't block the UI if Sheets is down.
 */

import { Company, NewAssessment, RepeatedAssessment } from './types';

const SHEET_NAME = 'SCORING LOG';

function fmt(v: any): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return String(v);
  return String(v);
}

/**
 * Push a New Assessment row to Google Sheets.
 */
export async function pushNewAssessmentToSheets(
  company: Company,
  assessment: NewAssessment
): Promise<void> {
  const row = [
    new Date().toLocaleDateString('id-ID'),           // Tanggal Sync
    'NEW',                                             // Tipe
    fmt(company.companyName),
    fmt(company.contactPerson),
    fmt(company.email),
    fmt(company.phone),
    fmt(company.location),
    fmt(company.fleetSize),
    fmt(assessment.projectName),
    fmt(assessment.date),
    fmt(assessment.input.estimatedValue),
    fmt(assessment.input.termPayment),
    fmt(assessment.input.legalDocuments),
    fmt(assessment.input.hasReference ? 'Ya' : 'Tidak'),
    fmt(assessment.input.technicalDocuments),
    fmt(assessment.input.decisionSpeed),
    // Scores
    fmt(assessment.scores.totalScore),
    fmt(assessment.scores.level),
    fmt(assessment.scores.commercialPotentialWeighted),
    fmt(assessment.scores.credibilityWeighted),
    fmt(assessment.scores.technicalClarityWeighted),
    fmt(assessment.notes ?? ''),
  ];

  await postToSheets(row);
}

/**
 * Push a Repeated Assessment row to Google Sheets.
 */
export async function pushRepeatedAssessmentToSheets(
  company: Company,
  assessment: RepeatedAssessment
): Promise<void> {
  const row = [
    new Date().toLocaleDateString('id-ID'),           // Tanggal Sync
    'REPEATED',                                        // Tipe
    fmt(company.companyName),
    fmt(company.contactPerson),
    fmt(company.email),
    fmt(company.phone),
    fmt(company.location),
    fmt(company.fleetSize),
    fmt(assessment.projectName),
    fmt(assessment.date),
    fmt(assessment.periodStart),
    fmt(assessment.periodEnd),
    fmt(assessment.input.kontribusiOmset),
    fmt(assessment.input.margin),
    fmt(assessment.input.ketepatanBayarHari),
    fmt(assessment.input.revisiInvoice),
    fmt(assessment.input.penagihanCount),
    fmt(assessment.input.cancelOrder),
    fmt(assessment.input.scheduleVariance),
    fmt(assessment.input.konflikQC),
    fmt(assessment.input.intervensi),
    fmt(assessment.input.komunikasiPIC),
    fmt(assessment.input.claimCount),
    fmt(assessment.input.lamaKerjasama),
    // Scores
    fmt(assessment.scores.totalScore),
    fmt(assessment.scores.level),
    fmt(assessment.scores.revenueWeighted),
    fmt(assessment.scores.paymentWeighted),
    fmt(assessment.scores.operationalWeighted),
    fmt(assessment.scores.relationshipWeighted),
    fmt(assessment.scores.valueWeighted),
    fmt(assessment.notes ?? ''),
  ];

  await postToSheets(row);
}

async function postToSheets(row: string[]): Promise<void> {
  try {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetName: SHEET_NAME, row }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[pushToSheets] Failed:', err);
    }
  } catch (e) {
    // Fire-and-forget: log but don't crash the UI
    console.warn('[pushToSheets] Network error:', e);
  }
}
