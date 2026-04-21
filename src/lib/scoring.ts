import {
  ClientLevel,
  KomunikasiLevel,
  NewCustomerInput,
  NewCustomerScores,
  RepeatedCustomerInput,
  RepeatedCustomerScores,
  Company,
  CompanyStatus,
} from './types';

// ==================== SCORE HELPERS ====================
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// ==================== LEVEL DETERMINATION ====================
export function getLevel(score: number): ClientLevel {
  if (score > 4) return 'STRATEGIC';
  if (score >= 3) return 'PREFERRED';
  if (score >= 2) return 'REGULAR';
  return 'HIGH_RISK';
}

export function getLevelColor(level: ClientLevel): string {
  switch (level) {
    case 'STRATEGIC': return '#10b981';
    case 'PREFERRED': return '#3b82f6';
    case 'REGULAR': return '#f59e0b';
    case 'HIGH_RISK': return '#ef4444';
  }
}

export function getLevelEmoji(level: ClientLevel): string {
  switch (level) {
    case 'STRATEGIC': return '🏆';
    case 'PREFERRED': return '⭐';
    case 'REGULAR': return '📊';
    case 'HIGH_RISK': return '⚠️';
  }
}

// ==================== NEW CUSTOMER SCORING ====================
export function scoreFleetSize(fleet: number): number {
  if (fleet > 20) return 5;
  if (fleet >= 15) return 4;
  if (fleet >= 10) return 3;
  if (fleet >= 5) return 2;
  return 1;
}

export function scoreEstimatedValue(value: number): number {
  // Value in IDR per vessel
  if (value > 3_000_000_000) return 5;
  if (value >= 2_000_000_000) return 4;
  if (value >= 1_000_000_000) return 3;
  if (value >= 500_000_000) return 2;
  return 1;
}

export function scoreTermPayment(days: number): number {
  if (days <= 14) return 5;
  if (days <= 30) return 4;
  if (days <= 45) return 3;
  if (days <= 60) return 2;
  return 1;
}

export function scoreLegalDocuments(docs: string): number {
  const docSet = docs.split(',').map(d => d.trim()).filter(Boolean);
  if (docSet.length >= 5) return 5;
  if (docSet.length >= 4) return 4;
  if (docSet.length >= 3) return 3;
  if (docSet.length >= 2) return 2;
  return 1;
}

export function scoreTechnicalDocuments(docs: string): number {
  const docSet = docs.split(',').map(d => d.trim()).filter(Boolean);
  if (docSet.length >= 3) return 5;
  if (docSet.length >= 2) return 4;
  if (docSet.length >= 1) return 3;
  return 1;
}

export function scoreBackgroundMedia(media: string): number {
  // 1=Website, 2=LinkedIn, 3=Instagram
  const items = media.split(',').map(d => d.trim()).filter(Boolean);
  if (items.length >= 3) return 5;
  if (items.length >= 2) return 4;
  if (items.length >= 1) return 3;
  return 1;
}

export function calculateNewCustomer(input: NewCustomerInput): NewCustomerScores {
  // Commercial Potential (50%) — sub-weights: Estimasi 40%, Fleet 20%, Term 40%
  const fleetScore = scoreFleetSize(input.fleetSize);
  const valueScore = scoreEstimatedValue(input.estimatedValue);
  const termPaymentScore = scoreTermPayment(input.termPayment);
  const commercialPotentialAvg = (valueScore * 40 + fleetScore * 20 + termPaymentScore * 40) / 100;
  const commercialPotentialWeighted = commercialPotentialAvg * 0.5;

  // Credibility (30%) — sub-weights: Legal 50%, Background 50% (Reference is informational only)
  const legalScore = scoreLegalDocuments(input.legalDocuments);
  const backgroundScore = scoreBackgroundMedia(input.backgroundMedia);
  const referenceScore = input.hasReference ? 5 : 2;
  const credibilityAvg = (legalScore * 50 + backgroundScore * 50) / 100;
  const credibilityWeighted = credibilityAvg * 0.3;

  // Technical Clarity (20%)
  const technicalScore = scoreTechnicalDocuments(input.technicalDocuments);
  const decisionSpeedScore = clamp(input.decisionSpeed, 1, 5);
  const technicalClarityAvg = (technicalScore + decisionSpeedScore) / 2;
  const technicalClarityWeighted = technicalClarityAvg * 0.2;

  const totalScore = Math.round((commercialPotentialWeighted + credibilityWeighted + technicalClarityWeighted) * 100) / 100;
  const level = getLevel(totalScore);

  return {
    fleetScore, valueScore, termPaymentScore, commercialPotentialAvg, commercialPotentialWeighted,
    legalScore, backgroundScore, referenceScore, credibilityAvg, credibilityWeighted,
    technicalScore, decisionSpeedScore, technicalClarityAvg, technicalClarityWeighted,
    totalScore, level,
  };
}

// ==================== REPEATED CUSTOMER SCORING ====================
export function scoreKontribusiOmset(pct: number): number {
  if (pct > 15) return 5;
  if (pct >= 10) return 4;
  if (pct >= 5) return 3;
  if (pct >= 1) return 2;
  return 1;
}

export function scoreMargin(pct: number): number {
  if (pct > 30) return 5;
  if (pct >= 25) return 4;
  if (pct >= 20) return 3;
  if (pct >= 15) return 2;
  return 1;
}

export function scoreKetepatanBayar(days: number): number {
  if (days === 0) return 5;
  if (days <= 7) return 4;
  if (days <= 14) return 3;
  if (days <= 21) return 2;
  return 1;
}

export function scoreRevisiInvoice(count: number): number {
  if (count === 0) return 5;
  if (count <= 2) return 4;
  if (count <= 4) return 3;
  if (count <= 6) return 2;
  return 1;
}

export function scorePenagihan(count: number): number {
  if (count === 1) return 5;
  if (count === 2) return 4;
  if (count === 3) return 3;
  if (count === 4) return 2;
  return 1;
}

export function scoreCancelOrder(count: number): number {
  if (count <= 1) return 5;
  if (count === 2) return 4;
  if (count === 3) return 3;
  if (count === 4) return 2;
  return 1;
}

export function scoreScheduleVariance(days: number): number {
  if (days <= -3) return 5;
  if (days < 0) return 4;
  if (days === 0) return 3;
  if (days <= 3) return 2;
  return 1;
}

export function scoreKonflikQC(count: number): number {
  if (count === 0) return 5;
  if (count === 1) return 4;
  if (count === 2) return 3;
  if (count === 3) return 2;
  return 1;
}

export function scoreIntervensi(count: number): number {
  if (count === 0) return 5;
  if (count === 1) return 4;
  if (count === 2) return 3;
  if (count === 3) return 2;
  return 1;
}

export function scoreKomunikasiPIC(level: KomunikasiLevel): number {
  switch (level) {
    case 'SB': return 5;
    case 'B': return 4;
    case 'C': return 3;
    case 'K': return 2;
    case 'SK': return 1;
  }
}

export function scoreClaimCount(count: number): number {
  if (count === 0) return 5;
  if (count === 1) return 4;
  if (count === 2) return 3;
  if (count === 3) return 2;
  return 1;
}

export function scoreLamaKerjasama(years: number): number {
  if (years > 3) return 5;
  if (years === 3) return 4;
  if (years === 2) return 3;
  if (years === 1) return 2;
  return 1;
}

export function scoreReferral(has: boolean): number {
  return has ? 5 : 1;
}

export function calculateRepeatedCustomer(input: RepeatedCustomerInput): RepeatedCustomerScores {
  // Revenue Contribution (30%)
  const kontribusiOmsetScore = scoreKontribusiOmset(input.kontribusiOmset);
  const marginScore = scoreMargin(input.margin);
  const revenueAvg = (kontribusiOmsetScore + marginScore) / 2;
  const revenueWeighted = revenueAvg * 0.3;

  // Payment Behaviour (30%) — sub-weights: Ketepatan 50%, Revisi 30%, Penagihan 20%
  const ketepatanBayarScore = scoreKetepatanBayar(input.ketepatanBayarHari);
  const revisiInvoiceScore = scoreRevisiInvoice(input.revisiInvoice);
  const penagihanScore = scorePenagihan(input.penagihanCount);
  const paymentAvg = (ketepatanBayarScore * 50 + revisiInvoiceScore * 30 + penagihanScore * 20) / 100;
  const paymentWeighted = paymentAvg * 0.3;

  // Operational Behaviour (15%) — sub-weights: Cancel 30%, Schedule 30%, QC 20%, Intervensi 20%
  const cancelOrderScore = scoreCancelOrder(input.cancelOrder);
  const scheduleVarianceScore = scoreScheduleVariance(input.scheduleVariance);
  const konflikQCScore = scoreKonflikQC(input.konflikQC);
  const intervensiScore = scoreIntervensi(input.intervensi);
  const operationalAvg = (cancelOrderScore * 30 + scheduleVarianceScore * 30 + konflikQCScore * 20 + intervensiScore * 20) / 100;
  const operationalWeighted = operationalAvg * 0.15;

  // Relationship Quality (15%)
  const komunikasiScore = scoreKomunikasiPIC(input.komunikasiPIC);
  const claimScore = scoreClaimCount(input.claimCount);
  const relationshipAvg = (komunikasiScore + claimScore) / 2;
  const relationshipWeighted = relationshipAvg * 0.15;

  // Value Customer (10%) — sub-weights: Lama 40%, Fleet 40%, Referral 20%
  const lamaKerjasamaScore = scoreLamaKerjasama(input.lamaKerjasama);
  const fleetScore = scoreFleetSize(input.fleetSize);
  const referralScore = scoreReferral(input.hasReferral);
  const valueAvg = (lamaKerjasamaScore * 40 + fleetScore * 40 + referralScore * 20) / 100;
  const valueWeighted = valueAvg * 0.1;

  const totalScore = Math.round((revenueWeighted + paymentWeighted + operationalWeighted + relationshipWeighted + valueWeighted) * 100) / 100;
  const level = getLevel(totalScore);

  return {
    kontribusiOmsetScore, marginScore, revenueAvg, revenueWeighted,
    ketepatanBayarScore, revisiInvoiceScore, penagihanScore, paymentAvg, paymentWeighted,
    cancelOrderScore, scheduleVarianceScore, konflikQCScore, intervensiScore, operationalAvg, operationalWeighted,
    komunikasiScore, claimScore, relationshipAvg, relationshipWeighted,
    lamaKerjasamaScore, fleetScore, referralScore, valueAvg, valueWeighted,
    totalScore, level,
  };
}

// ==================== DEFAULT WEIGHTS ====================
export const NEW_CUSTOMER_WEIGHTS = [
  { category: 'Commercial Potential', weight: 50, formula: 'Estimasi Nilai (40%) + Fleet Size (20%) + Term Payment (40%)' },
  { category: 'Credibility', weight: 30, formula: 'Legal Perusahaan (50%) + Background Media (50%)' },
  { category: 'Clarity of Technical Info', weight: 20, formula: 'Dokumen Teknis (50%) + Decision Speed (50%)' },
];

export const REPEATED_CUSTOMER_WEIGHTS = [
  { category: 'Revenue Contribution', weight: 30, formula: 'Kontribusi Omset (50%) + Margin (50%)' },
  { category: 'Payment Behaviour', weight: 30, formula: 'Ketepatan Bayar (50%) + Revisi Invoice (30%) + Penagihan (20%)' },
  { category: 'Operational Behaviour', weight: 15, formula: 'Cancel Order (30%) + Schedule (30%) + QC (20%) + Intervensi (20%)' },
  { category: 'Relationship Quality', weight: 15, formula: 'Komunikasi PIC (50%) + Claim Culture (50%)' },
  { category: 'Value Customer', weight: 10, formula: 'Lama Kerjasama (40%) + Fleet Size (40%) + Referral (20%)' },
];

export const LEVEL_THRESHOLDS = [
  { level: 'STRATEGIC' as ClientLevel, min: 4.01, max: 5, description: 'Client prioritas utama', color: '#10b981' },
  { level: 'PREFERRED' as ClientLevel, min: 3, max: 4, description: 'Client dengan potensi baik', color: '#3b82f6' },
  { level: 'REGULAR' as ClientLevel, min: 2, max: 2.99, description: 'Client standar', color: '#f59e0b' },
  { level: 'HIGH_RISK' as ClientLevel, min: 0, max: 1.99, description: 'Client berisiko tinggi', color: '#ef4444' },
];

// ==================== COMPANY HELPERS ====================
const THREE_YEARS_MS = 3 * 365.25 * 24 * 60 * 60 * 1000;

export function getCompanyStatus(company: Company, referenceDate: Date = new Date()): CompanyStatus {
  if (company.repeatedAssessments.length === 0) return 'NEW_ONLY';
  const lastDeal = company.lastDealDate ? new Date(company.lastDealDate) : null;
  if (!lastDeal) return 'NEW_ONLY';
  const elapsed = referenceDate.getTime() - lastDeal.getTime();
  if (elapsed > THREE_YEARS_MS) return 'LAPSED';
  return 'ACTIVE_REPEATED';
}

export function getCompanyCurrentScore(company: Company): number {
  const status = getCompanyStatus(company);
  if (status === 'ACTIVE_REPEATED' && company.repeatedAssessments.length > 0) {
    const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].scores.totalScore;
  }
  if (company.newAssessments.length > 0) {
    const sorted = [...company.newAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].scores.totalScore;
  }
  return 0;
}

export function getCompanyCurrentLevel(company: Company): ClientLevel {
  return getLevel(getCompanyCurrentScore(company));
}

export function getStatusLabel(status: CompanyStatus): string {
  switch (status) {
    case 'NEW_ONLY': return 'Pre-judgement Only';
    case 'ACTIVE_REPEATED': return 'Active Repeated';
    case 'LAPSED': return 'Lapsed (>3yr)';
  }
}

export function getStatusColor(status: CompanyStatus): string {
  switch (status) {
    case 'NEW_ONLY': return '#06b6d4';
    case 'ACTIVE_REPEATED': return '#8b5cf6';
    case 'LAPSED': return '#f59e0b';
  }
}

export function daysSinceLastDeal(company: Company): number | null {
  if (!company.lastDealDate) return null;
  return Math.floor((Date.now() - new Date(company.lastDealDate).getTime()) / (1000 * 60 * 60 * 24));
}

export function yearsUntilLapse(company: Company): number | null {
  if (!company.lastDealDate) return null;
  const elapsed = Date.now() - new Date(company.lastDealDate).getTime();
  const remaining = THREE_YEARS_MS - elapsed;
  return Math.max(0, remaining / (365.25 * 24 * 60 * 60 * 1000));
}
