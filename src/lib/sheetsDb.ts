/**
 * sheetsDb.ts  (SERVER-SIDE ONLY — do not import in client components)
 *
 * Google Sheets is the single source of truth.
 * Provides typed helpers to:
 *   • ensureAllSheets()        – create tabs + header rows if missing
 *   • saveCompany()            – upsert a company row
 *   • saveNewAssessment()      – append / update a NEW_ASSESSMENTS row
 *   • saveRepeatedAssessment() – append / update a REPEATED_ASSESSMENTS row
 *   • loadAllData()            – read all three tabs → Company[]
 */

import {
  getSheetsClient,
  SPREADSHEET_ID,
  fetchSheetRows,
  ensureSheet,
} from './googleSheets';

import {
  COMPANIES_SHEET, COMPANIES_HEADER, COMPANIES_COLS,
  NEW_SHEET, NEW_HEADER, NEW_COLS,
  REPEATED_SHEET, REPEATED_HEADER, REPEATED_COLS,
} from './sheetsSchema';

import {
  Company, NewAssessment, RepeatedAssessment,
  NewCustomerInput, NewCustomerScores,
  RepeatedCustomerInput, RepeatedCustomerScores,
  KomunikasiLevel, ClientLevel,
} from './types';

// ── helpers ──────────────────────────────────────────────────────────────────

function s(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

function n(v: unknown): number | '' {
  if (v === undefined || v === null || v === '') return '';
  const num = Number(v);
  return isNaN(num) ? '' : num;
}

function b(v: unknown): string {
  if (v === true || v === 'true' || v === 'Ya' || v === 'yes') return 'Ya';
  if (v === false || v === 'false' || v === 'Tidak' || v === 'no') return 'Tidak';
  return '';
}

function parseBool(v: string): boolean | undefined {
  if (v === 'Ya' || v === 'true') return true;
  if (v === 'Tidak' || v === 'false') return false;
  return undefined;
}

function parseNum(v: string): number | undefined {
  if (!v || v === '') return undefined;
  const num = Number(v);
  return isNaN(num) ? undefined : num;
}

// ── Ensure sheets + header rows exist ───────────────────────────────────────

export async function ensureAllSheets(): Promise<void> {
  await ensureSheet(COMPANIES_SHEET);
  await ensureSheet(NEW_SHEET);
  await ensureSheet(REPEATED_SHEET);

  const sheets = getSheetsClient();

  // Write headers if row 1 is empty
  const sheetDefs = [
    { sheet: COMPANIES_SHEET, header: COMPANIES_HEADER },
    { sheet: NEW_SHEET,       header: NEW_HEADER },
    { sheet: REPEATED_SHEET,  header: REPEATED_HEADER },
  ];

  for (const { sheet, header } of sheetDefs) {
    const rows = await fetchSheetRows(sheet);
    if (!rows || rows.length === 0 || !rows[0] || rows[0].length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [header] },
      });
    }
  }
}

// ── Generic upsert (find row by col A = id, update in-place or append) ───────

async function upsertRow(
  sheetName: string,
  id: string,
  values: (string | number | null | '')[],
): Promise<void> {
  const sheets = getSheetsClient();
  const rows = await fetchSheetRows(sheetName);

  // Row 0 = header, data starts at row 1 (Sheets row 2)
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);

  if (idx !== -1) {
    // Update existing row (1-indexed sheet row)
    const sheetRow = idx + 1;
    const lastCol = String.fromCharCode(65 + values.length - 1);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${sheetRow}:${lastCol}${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  } else {
    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] },
    });
  }
}

// ── Save / Upsert a Company ──────────────────────────────────────────────────

export async function saveCompany(company: Company): Promise<void> {
  const row: (string | number | null | '')[] = [
    s(company.id),
    s(company.companyName),
    s(company.contactPerson),
    s(company.email),
    s(company.phone),
    s(company.location),
    n(company.fleetSize),
    s(company.industry),
    s(company.registeredDate),
    s(company.lastDealDate ?? ''),
  ];
  await upsertRow(COMPANIES_SHEET, company.id, row);
}

// ── Save / Upsert a New Assessment ──────────────────────────────────────────

export async function saveNewAssessment(
  company: Company,
  assessment: NewAssessment,
): Promise<void> {
  const inp = assessment.input;
  const sc  = assessment.scores;

  const row: (string | number | null | '')[] = [
    // Identity
    s(assessment.id),
    s(company.id),
    s(company.companyName),
    s(assessment.projectName),
    s(assessment.date),
    s(assessment.notes ?? ''),
    // Calculator inputs
    n(inp.fleetSize),
    n(inp.estimatedValue),
    n(inp.termPayment),
    s(inp.legalDocuments ?? ''),
    s(inp.backgroundMedia ?? ''),
    b(inp.hasReference),
    s(inp.technicalDocuments ?? ''),
    n(inp.decisionSpeed),
    // Scores
    n(sc.fleetScore),
    n(sc.valueScore),
    n(sc.termPaymentScore),
    n(sc.commercialPotentialAvg),
    n(sc.commercialPotentialWeighted),
    n(sc.legalScore),
    n(sc.backgroundScore),
    n(sc.referenceScore),
    n(sc.credibilityAvg),
    n(sc.credibilityWeighted),
    n(sc.technicalScore),
    n(sc.decisionSpeedScore),
    n(sc.technicalClarityAvg),
    n(sc.technicalClarityWeighted),
    n(sc.totalScore),
    s(sc.level),
  ];
  await upsertRow(NEW_SHEET, assessment.id, row);
}

// ── Save / Upsert a Repeated Assessment ─────────────────────────────────────

export async function saveRepeatedAssessment(
  company: Company,
  assessment: RepeatedAssessment,
): Promise<void> {
  const inp = assessment.input;
  const sc  = assessment.scores;

  const row: (string | number | null | '')[] = [
    // Identity
    s(assessment.id),
    s(company.id),
    s(company.companyName),
    s(assessment.projectName),
    s(assessment.date),
    s(assessment.periodStart),
    s(assessment.periodEnd),
    s(assessment.notes ?? ''),
    // Calculator inputs
    n(inp.kontribusiOmset),
    n(inp.margin),
    n(inp.ketepatanBayarHari),
    n(inp.revisiInvoice),
    n(inp.penagihanCount),
    n(inp.cancelOrder),
    n(inp.scheduleVariance),
    n(inp.konflikQC),
    n(inp.intervensi),
    s(inp.komunikasiPIC ?? ''),
    n(inp.claimCount),
    n(inp.lamaKerjasama),
    n(inp.fleetSize),
    b(inp.hasReferral),
    // Scores
    n(sc.kontribusiOmsetScore),
    n(sc.marginScore),
    n(sc.revenueAvg),
    n(sc.revenueWeighted),
    n(sc.ketepatanBayarScore),
    n(sc.revisiInvoiceScore),
    n(sc.penagihanScore),
    n(sc.paymentAvg),
    n(sc.paymentWeighted),
    n(sc.cancelOrderScore),
    n(sc.scheduleVarianceScore),
    n(sc.konflikQCScore),
    n(sc.intervensiScore),
    n(sc.operationalAvg),
    n(sc.operationalWeighted),
    n(sc.komunikasiScore),
    n(sc.claimScore),
    n(sc.relationshipAvg),
    n(sc.relationshipWeighted),
    n(sc.lamaKerjasamaScore),
    n(sc.fleetScore),
    n(sc.referralScore),
    n(sc.valueAvg),
    n(sc.valueWeighted),
    n(sc.totalScore),
    s(sc.level),
  ];
  await upsertRow(REPEATED_SHEET, assessment.id, row);
}

// ── Load all data → Company[] ────────────────────────────────────────────────

export async function loadAllData(): Promise<Company[]> {
  const [companyRows, newRows, repeatedRows] = await Promise.all([
    fetchSheetRows(COMPANIES_SHEET),
    fetchSheetRows(NEW_SHEET),
    fetchSheetRows(REPEATED_SHEET),
  ]);

  // Parse companies (skip header row 0)
  const companyMap = new Map<string, Company>();
  for (let i = 1; i < companyRows.length; i++) {
    const r = companyRows[i];
    if (!r || !r[0]) continue;
    const company: Company = {
      id:             s(r[0]),
      companyName:    s(r[1]),
      contactPerson:  s(r[2]),
      email:          s(r[3]),
      phone:          s(r[4]),
      location:       s(r[5]),
      fleetSize:      Number(r[6]) || 0,
      industry:       s(r[7]),
      registeredDate: s(r[8]),
      lastDealDate:   r[9] ? s(r[9]) : null,
      newAssessments: [],
      repeatedAssessments: [],
    };
    companyMap.set(company.id, company);
  }

  // Parse new assessments (skip header row 0)
  for (let i = 1; i < newRows.length; i++) {
    const r = newRows[i];
    if (!r || !r[0]) continue;

    const companyId = s(r[1]);
    const company = companyMap.get(companyId);
    if (!company) continue;

    const input: NewCustomerInput = {
      companyName:        s(r[2]),
      contactPerson:      company.contactPerson,
      email:              company.email,
      phone:              company.phone,
      location:           company.location,
      fleetSize:          parseNum(s(r[6])),
      estimatedValue:     parseNum(s(r[7])),
      termPayment:        parseNum(s(r[8])),
      legalDocuments:     s(r[9])  || undefined,
      backgroundMedia:    s(r[10]) || undefined,
      hasReference:       parseBool(s(r[11])),
      technicalDocuments: s(r[12]) || undefined,
      decisionSpeed:      parseNum(s(r[13])),
    };

    const scores: NewCustomerScores = {
      fleetScore:                    Number(r[14]) || 0,
      valueScore:                    Number(r[15]) || 0,
      termPaymentScore:              Number(r[16]) || 0,
      commercialPotentialAvg:        Number(r[17]) || 0,
      commercialPotentialWeighted:   Number(r[18]) || 0,
      legalScore:                    Number(r[19]) || 0,
      backgroundScore:               Number(r[20]) || 0,
      referenceScore:                Number(r[21]) || 0,
      credibilityAvg:                Number(r[22]) || 0,
      credibilityWeighted:           Number(r[23]) || 0,
      technicalScore:                Number(r[24]) || 0,
      decisionSpeedScore:            Number(r[25]) || 0,
      technicalClarityAvg:           Number(r[26]) || 0,
      technicalClarityWeighted:      Number(r[27]) || 0,
      totalScore:                    Number(r[28]) || 0,
      level:                         (s(r[29]) as ClientLevel) || 'HIGH_RISK',
    };

    const assessment: NewAssessment = {
      id:          s(r[0]),
      date:        s(r[4]),
      projectName: s(r[3]),
      input,
      scores,
      notes:       s(r[5]) || undefined,
    };

    company.newAssessments.push(assessment);
  }

  // Parse repeated assessments (skip header row 0)
  for (let i = 1; i < repeatedRows.length; i++) {
    const r = repeatedRows[i];
    if (!r || !r[0]) continue;

    const companyId = s(r[1]);
    const company = companyMap.get(companyId);
    if (!company) continue;

    const input: RepeatedCustomerInput = {
      companyName:      s(r[2]),
      contactPerson:    company.contactPerson,
      email:            company.email,
      phone:            company.phone,
      location:         company.location,
      kontribusiOmset:  parseNum(s(r[8])),
      margin:           parseNum(s(r[9])),
      ketepatanBayarHari: parseNum(s(r[10])),
      revisiInvoice:    parseNum(s(r[11])),
      penagihanCount:   parseNum(s(r[12])),
      cancelOrder:      parseNum(s(r[13])),
      scheduleVariance: parseNum(s(r[14])),
      konflikQC:        parseNum(s(r[15])),
      intervensi:       parseNum(s(r[16])),
      komunikasiPIC:    (s(r[17]) as KomunikasiLevel) || undefined,
      claimCount:       parseNum(s(r[18])),
      lamaKerjasama:    parseNum(s(r[19])),
      fleetSize:        parseNum(s(r[20])),
      hasReferral:      parseBool(s(r[21])),
    };

    const scores: RepeatedCustomerScores = {
      kontribusiOmsetScore:   Number(r[22]) || 0,
      marginScore:            Number(r[23]) || 0,
      revenueAvg:             Number(r[24]) || 0,
      revenueWeighted:        Number(r[25]) || 0,
      ketepatanBayarScore:    Number(r[26]) || 0,
      revisiInvoiceScore:     Number(r[27]) || 0,
      penagihanScore:         Number(r[28]) || 0,
      paymentAvg:             Number(r[29]) || 0,
      paymentWeighted:        Number(r[30]) || 0,
      cancelOrderScore:       Number(r[31]) || 0,
      scheduleVarianceScore:  Number(r[32]) || 0,
      konflikQCScore:         Number(r[33]) || 0,
      intervensiScore:        Number(r[34]) || 0,
      operationalAvg:         Number(r[35]) || 0,
      operationalWeighted:    Number(r[36]) || 0,
      komunikasiScore:        Number(r[37]) || 0,
      claimScore:             Number(r[38]) || 0,
      relationshipAvg:        Number(r[39]) || 0,
      relationshipWeighted:   Number(r[40]) || 0,
      lamaKerjasamaScore:     Number(r[41]) || 0,
      fleetScore:             Number(r[42]) || 0,
      referralScore:          Number(r[43]) || 0,
      valueAvg:               Number(r[44]) || 0,
      valueWeighted:          Number(r[45]) || 0,
      totalScore:             Number(r[46]) || 0,
      level:                  (s(r[47]) as ClientLevel) || 'HIGH_RISK',
    };

    const assessment: RepeatedAssessment = {
      id:          s(r[0]),
      date:        s(r[4]),
      projectName: s(r[3]),
      periodStart: s(r[5]),
      periodEnd:   s(r[6]),
      input,
      scores,
      notes:       s(r[7]) || undefined,
    };

    company.repeatedAssessments.push(assessment);

    // Keep lastDealDate in sync
    if (!company.lastDealDate || assessment.date > company.lastDealDate) {
      company.lastDealDate = assessment.date;
    }
  }

  return Array.from(companyMap.values());
}
