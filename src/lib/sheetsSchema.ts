/**
 * sheetsSchema.ts
 * Defines the EXACT column order for every Google Sheets tab.
 * These must match the calculator parameters 1-to-1.
 *
 * Tab 1: COMPANIES
 * Tab 2: NEW_ASSESSMENTS
 * Tab 3: REPEATED_ASSESSMENTS
 */

// ── COMPANIES tab ────────────────────────────────────────────────────────────
export const COMPANIES_SHEET = 'COMPANIES';

export const COMPANIES_COLS = [
  'id',              // A - unique ID (Date.now + random)
  'companyName',     // B
  'contactPerson',   // C
  'email',           // D
  'phone',           // E
  'location',        // F
  'fleetSize',       // G
  'industry',        // H
  'registeredDate',  // I
  'lastDealDate',    // J
] as const;

export type CompanyRow = (string | number | null)[];

// ── NEW_ASSESSMENTS tab ──────────────────────────────────────────────────────
export const NEW_SHEET = 'NEW_ASSESSMENTS';

export const NEW_COLS = [
  // --- Identity ---
  'id',                          // A
  'companyId',                   // B
  'companyName',                 // C  (denormalised for readability in Sheets)
  'projectName',                 // D
  'date',                        // E
  'notes',                       // F
  // --- Input Parameters (Calculator) ---
  'fleetSize',                   // G  Commercial Potential
  'estimatedValue',              // H
  'termPayment',                 // I
  'legalDocuments',              // J  Credibility
  'backgroundMedia',             // K
  'hasReference',                // L
  'technicalDocuments',          // M  Technical Clarity
  'decisionSpeed',               // N
  // --- Scores ---
  'score_fleetScore',            // O
  'score_valueScore',            // P
  'score_termPaymentScore',      // Q
  'score_commercialPotentialAvg',// R
  'score_commercialPotentialWeighted', // S
  'score_legalScore',            // T
  'score_backgroundScore',       // U
  'score_referenceScore',        // V
  'score_credibilityAvg',        // W
  'score_credibilityWeighted',   // X
  'score_technicalScore',        // Y
  'score_decisionSpeedScore',    // Z
  'score_technicalClarityAvg',   // AA
  'score_technicalClarityWeighted', // AB
  'score_totalScore',            // AC
  'score_level',                 // AD
] as const;

// ── REPEATED_ASSESSMENTS tab ─────────────────────────────────────────────────
export const REPEATED_SHEET = 'REPEATED_ASSESSMENTS';

export const REPEATED_COLS = [
  // --- Identity ---
  'id',                          // A
  'companyId',                   // B
  'companyName',                 // C
  'projectName',                 // D
  'date',                        // E
  'periodStart',                 // F
  'periodEnd',                   // G
  'notes',                       // H
  // --- Input Parameters (Calculator) ---
  'kontribusiOmset',             // I  Revenue Contribution (30%)
  'margin',                      // J
  'ketepatanBayarHari',          // K  Payment Behaviour (30%)
  'revisiInvoice',               // L
  'penagihanCount',              // M
  'cancelOrder',                 // N  Operational Behaviour (15%)
  'scheduleVariance',            // O
  'konflikQC',                   // P
  'intervensi',                  // Q
  'komunikasiPIC',               // R  Relationship Quality (15%)
  'claimCount',                  // S
  'lamaKerjasama',               // T  Value Customer (10%)
  'fleetSize',                   // U
  'hasReferral',                 // V
  // --- Scores ---
  'score_kontribusiOmsetScore',  // W
  'score_marginScore',           // X
  'score_revenueAvg',            // Y
  'score_revenueWeighted',       // Z
  'score_ketepatanBayarScore',   // AA
  'score_revisiInvoiceScore',    // AB
  'score_penagihanScore',        // AC
  'score_paymentAvg',            // AD
  'score_paymentWeighted',       // AE
  'score_cancelOrderScore',      // AF
  'score_scheduleVarianceScore', // AG
  'score_konflikQCScore',        // AH
  'score_intervensiScore',       // AI
  'score_operationalAvg',        // AJ
  'score_operationalWeighted',   // AK
  'score_komunikasiScore',       // AL
  'score_claimScore',            // AM
  'score_relationshipAvg',       // AN
  'score_relationshipWeighted',  // AO
  'score_lamaKerjasamaScore',    // AP
  'score_fleetScore',            // AQ
  'score_referralScore',         // AR
  'score_valueAvg',              // AS
  'score_valueWeighted',         // AT
  'score_totalScore',            // AU
  'score_level',                 // AV
] as const;

// ── Header rows (row 1 of each sheet) ───────────────────────────────────────
export const COMPANIES_HEADER: string[] = [...COMPANIES_COLS];
export const NEW_HEADER: string[] = [...NEW_COLS];
export const REPEATED_HEADER: string[] = [...REPEATED_COLS];
