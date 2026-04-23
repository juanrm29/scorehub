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
 *   • deleteCompanyRow()       – hard delete company + all its assessments
 *   • deleteAssessmentRow()    – hard delete one assessment row
 *   • deleteAllByStatus()      – hard delete multiple companies by status
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

/**
 * Convert a 0-based column index to a Sheets A1 column letter.
 * e.g. 0→'A', 25→'Z', 26→'AA', 47→'AV'
 * FIX BUG-03: old code used String.fromCharCode(65+n) which overflows after col 25 (Z)
 */
function colLetter(idx: number): string {
  let result = '';
  let n = idx;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

// ── Ensure sheets + header rows exist (cached to avoid 6+ API calls per request) ─

let _sheetsInitialized = false;
let _sheetsInitTimer: ReturnType<typeof setTimeout> | null = null;

/** Reset the init cache after 5 minutes so headers are re-verified periodically */
function scheduleInitReset() {
  if (_sheetsInitTimer) clearTimeout(_sheetsInitTimer);
  _sheetsInitTimer = setTimeout(() => { _sheetsInitialized = false; }, 5 * 60 * 1000);
}

export async function ensureAllSheets(): Promise<void> {
  if (_sheetsInitialized) return; // BUG-12 FIX: skip 6 API calls on every request

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

  _sheetsInitialized = true;
  scheduleInitReset();
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

  // BUG-03 FIX: use colLetter() for correct A1 notation beyond column Z
  const lastColLetter = colLetter(values.length - 1);

  if (idx !== -1) {
    // Update existing row (1-indexed sheet row)
    const sheetRow = idx + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${sheetRow}:${lastColLetter}${sheetRow}`,
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

// ── Hard Delete Helpers ──────────────────────────────────────────────────────

/**
 * Get the internal sheetId for a named sheet tab.
 */
async function getSheetId(sheetName: string): Promise<number> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const found = meta.data.sheets?.find(s => s.properties?.title === sheetName);
  if (!found?.properties?.sheetId) throw new Error(`Sheet not found: ${sheetName}`);
  return found.properties.sheetId;
}

/**
 * Delete a single row by ID from any sheet.
 * Finds the row where col A === id, then issues a DeleteDimensionRequest.
 */
async function deleteRowById(sheetName: string, id: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const rows = await fetchSheetRows(sheetName);
  // data rows start at index 1 (index 0 is header)
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (idx === -1) return false; // not found

  const sheetId = await getSheetId(sheetName);
  // Sheets row index is 0-based. idx is 0-based within our array = row idx in sheet.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: idx,      // 0-based, inclusive
            endIndex:   idx + 1,  // 0-based, exclusive
          },
        },
      }],
    },
  });
  return true;
}

/**
 * Hard delete one assessment row (NEW or REPEATED).
 */
export async function deleteAssessmentRow(
  assessmentId: string,
  type: 'NEW' | 'REPEATED',
): Promise<void> {
  const sheet = type === 'NEW' ? NEW_SHEET : REPEATED_SHEET;
  await deleteRowById(sheet, assessmentId);
}

/**
 * Hard delete a company row AND all its assessment rows.
 * FIX BUG-04: deleting rows one-by-one shifts indices. We collect ALL row indices
 * first across both sheets, then delete in reverse order so earlier indices stay valid.
 */
export async function deleteCompanyRow(companyId: string): Promise<void> {
  const [newRows, repRows] = await Promise.all([
    fetchSheetRows(NEW_SHEET),
    fetchSheetRows(REPEATED_SHEET),
  ]);

  const sheetId = await getSheetId(COMPANIES_SHEET);
  const newSheetId = await getSheetId(NEW_SHEET);
  const repSheetId = await getSheetId(REPEATED_SHEET);
  const companyRows = await fetchSheetRows(COMPANIES_SHEET);

  // Collect 0-based row indices (inclusive of header row offset)
  const newIndices = newRows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => i > 0 && r[1] === companyId)
    .map(({ i }) => i);

  const repIndices = repRows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => i > 0 && r[1] === companyId)
    .map(({ i }) => i);

  const companyIdx = companyRows.findIndex((r, i) => i > 0 && r[0] === companyId);

  const sheets = getSheetsClient();

  // Build batch delete requests — delete in reverse order to avoid index shifting
  const requests: object[] = [];

  // Sort descending so we delete bottom rows first
  const buildDeleteReqs = (indices: number[], sid: number) =>
    [...indices].sort((a, b) => b - a).map(idx => ({
      deleteDimension: {
        range: { sheetId: sid, dimension: 'ROWS', startIndex: idx, endIndex: idx + 1 },
      },
    }));

  requests.push(...buildDeleteReqs(repIndices, repSheetId));
  requests.push(...buildDeleteReqs(newIndices, newSheetId));
  if (companyIdx !== -1) {
    requests.push({
      deleteDimension: {
        range: { sheetId, dimension: 'ROWS', startIndex: companyIdx, endIndex: companyIdx + 1 },
      },
    });
  }

  if (requests.length === 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  });
}

