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
  // Commercial Potential (50%)
  const fleetScore = input.fleetSize != null ? scoreFleetSize(input.fleetSize) : undefined;
  const valueScore = input.estimatedValue != null ? scoreEstimatedValue(input.estimatedValue) : undefined;
  const termPaymentScore = input.termPayment != null ? scoreTermPayment(input.termPayment) : undefined;
  const commercialPotentialAvg = calcDynamicAverage([
    { score: valueScore, weight: 40 },
    { score: fleetScore, weight: 20 },
    { score: termPaymentScore, weight: 40 }
  ]);
  const commercialPotentialWeighted = commercialPotentialAvg * 0.5;

  // Credibility (30%)
  const legalScore = input.legalDocuments != null ? scoreLegalDocuments(input.legalDocuments) : undefined;
  const backgroundScore = input.backgroundMedia != null ? scoreBackgroundMedia(input.backgroundMedia) : undefined;
  const referenceScore = input.hasReference != null ? (input.hasReference ? 5 : 2) : undefined;
  const credibilityAvg = calcDynamicAverage([
    { score: legalScore, weight: 50 },
    { score: backgroundScore, weight: 50 }
  ]);
  const credibilityWeighted = credibilityAvg * 0.3;

  // Technical Clarity (20%)
  const technicalScore = input.technicalDocuments != null ? scoreTechnicalDocuments(input.technicalDocuments) : undefined;
  const decisionSpeedScore = input.decisionSpeed != null ? clamp(input.decisionSpeed, 1, 5) : undefined;
  const technicalClarityAvg = calcDynamicAverage([
    { score: technicalScore, weight: 50 },
    { score: decisionSpeedScore, weight: 50 }
  ]);
  const technicalClarityWeighted = technicalClarityAvg * 0.2;

  const categoryAverages = calcDynamicAverage([
    { score: commercialPotentialAvg > 0 ? commercialPotentialAvg : undefined, weight: 50 },
    { score: credibilityAvg > 0 ? credibilityAvg : undefined, weight: 30 },
    { score: technicalClarityAvg > 0 ? technicalClarityAvg : undefined, weight: 20 }
  ]);

  const totalScore = Math.round(categoryAverages * 100) / 100;
  const level = getLevel(totalScore);

  return {
    fleetScore: fleetScore || 0, 
    valueScore: valueScore || 0, 
    termPaymentScore: termPaymentScore || 0, 
    commercialPotentialAvg, commercialPotentialWeighted,
    legalScore: legalScore || 0, 
    backgroundScore: backgroundScore || 0, 
    referenceScore: referenceScore || 0, 
    credibilityAvg, credibilityWeighted,
    technicalScore: technicalScore || 0, 
    decisionSpeedScore: decisionSpeedScore || 0, 
    technicalClarityAvg, technicalClarityWeighted,
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

export interface WeightedScore {
  score: number | undefined;
  weight: number;
}

export function calcDynamicAverage(scores: WeightedScore[]): number {
  let totalScore = 0;
  let totalWeight = 0;
  for (const s of scores) {
    if (s.score !== undefined && s.score !== null && !isNaN(s.score)) {
      totalScore += s.score * s.weight;
      totalWeight += s.weight;
    }
  }
  if (totalWeight === 0) return 0;
  return totalScore / totalWeight;
}

export function calculateRepeatedCustomer(input: RepeatedCustomerInput): RepeatedCustomerScores {
  // Revenue Contribution (30%)
  const kontribusiOmsetScore = input.kontribusiOmset != null ? scoreKontribusiOmset(input.kontribusiOmset) : undefined;
  const marginScore = input.margin != null ? scoreMargin(input.margin) : undefined;
  const revenueAvg = calcDynamicAverage([
    { score: kontribusiOmsetScore, weight: 50 },
    { score: marginScore, weight: 50 }
  ]);
  const revenueWeighted = revenueAvg * 0.3;

  // Payment Behaviour (30%)
  const ketepatanBayarScore = input.ketepatanBayarHari != null ? scoreKetepatanBayar(input.ketepatanBayarHari) : undefined;
  const revisiInvoiceScore = input.revisiInvoice != null ? scoreRevisiInvoice(input.revisiInvoice) : undefined;
  const penagihanScore = input.penagihanCount != null ? scorePenagihan(input.penagihanCount) : undefined;
  const paymentAvg = calcDynamicAverage([
    { score: ketepatanBayarScore, weight: 50 },
    { score: revisiInvoiceScore, weight: 30 },
    { score: penagihanScore, weight: 20 }
  ]);
  const paymentWeighted = paymentAvg * 0.3;

  // Operational Behaviour (15%)
  const cancelOrderScore = input.cancelOrder != null ? scoreCancelOrder(input.cancelOrder) : undefined;
  const scheduleVarianceScore = input.scheduleVariance != null ? scoreScheduleVariance(input.scheduleVariance) : undefined;
  const konflikQCScore = input.konflikQC != null ? scoreKonflikQC(input.konflikQC) : undefined;
  const intervensiScore = input.intervensi != null ? scoreIntervensi(input.intervensi) : undefined;
  const operationalAvg = calcDynamicAverage([
    { score: cancelOrderScore, weight: 30 },
    { score: scheduleVarianceScore, weight: 30 },
    { score: konflikQCScore, weight: 20 },
    { score: intervensiScore, weight: 20 }
  ]);
  const operationalWeighted = operationalAvg * 0.15;

  // Relationship Quality (15%)
  const komunikasiScore = input.komunikasiPIC != null ? scoreKomunikasiPIC(input.komunikasiPIC) : undefined;
  const claimScore = input.claimCount != null ? scoreClaimCount(input.claimCount) : undefined;
  const relationshipAvg = calcDynamicAverage([
    { score: komunikasiScore, weight: 50 },
    { score: claimScore, weight: 50 }
  ]);
  const relationshipWeighted = relationshipAvg * 0.15;

  // Value Customer (10%)
  const lamaKerjasamaScore = input.lamaKerjasama != null ? scoreLamaKerjasama(input.lamaKerjasama) : undefined;
  const fleetScore = input.fleetSize != null ? scoreFleetSize(input.fleetSize) : undefined;
  const referralScore = input.hasReferral != null ? scoreReferral(input.hasReferral) : undefined;
  const valueAvg = calcDynamicAverage([
    { score: lamaKerjasamaScore, weight: 40 },
    { score: fleetScore, weight: 40 },
    { score: referralScore, weight: 20 }
  ]);
  const valueWeighted = valueAvg * 0.1;

  // Calculate final score dynamically based on available categories
  const categoryAverages = calcDynamicAverage([
    { score: revenueAvg > 0 ? revenueAvg : undefined, weight: 30 },
    { score: paymentAvg > 0 ? paymentAvg : undefined, weight: 30 },
    { score: operationalAvg > 0 ? operationalAvg : undefined, weight: 15 },
    { score: relationshipAvg > 0 ? relationshipAvg : undefined, weight: 15 },
    { score: valueAvg > 0 ? valueAvg : undefined, weight: 10 }
  ]);
  
  const totalScore = Math.round(categoryAverages * 100) / 100;
  const level = getLevel(totalScore);

  return {
    kontribusiOmsetScore: kontribusiOmsetScore || 0, 
    marginScore: marginScore || 0, 
    revenueAvg, revenueWeighted,
    ketepatanBayarScore: ketepatanBayarScore || 0, 
    revisiInvoiceScore: revisiInvoiceScore || 0, 
    penagihanScore: penagihanScore || 0, 
    paymentAvg, paymentWeighted,
    cancelOrderScore: cancelOrderScore || 0, 
    scheduleVarianceScore: scheduleVarianceScore || 0, 
    konflikQCScore: konflikQCScore || 0, 
    intervensiScore: intervensiScore || 0, 
    operationalAvg, operationalWeighted,
    komunikasiScore: komunikasiScore || 0, 
    claimScore: claimScore || 0, 
    relationshipAvg, relationshipWeighted,
    lamaKerjasamaScore: lamaKerjasamaScore || 0, 
    fleetScore: fleetScore || 0, 
    referralScore: referralScore || 0, 
    valueAvg, valueWeighted,
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
  // STATUS logic:
  // - NEW_ONLY  : company has only 1 deal/project (0 or 1 repeated assessment)
  //               Even if they have a Repeated (lanjutan) for that 1 project, status is still NEW
  // - ACTIVE_REPEATED : company has had 2+ deals/projects (2+ repeated assessments)
  // - LAPSED    : last deal was > 3 years ago

  const repCount = company.repeatedAssessments.length;

  // No repeated assessment at all → NEW_ONLY (pre-judgement only, not yet completed a project)
  if (repCount === 0) return 'NEW_ONLY';

  // Only 1 repeated assessment (= 1 project completed) → still NEW_ONLY
  // because they haven't established a recurring relationship yet
  if (repCount === 1) return 'NEW_ONLY';

  // 2+ repeated assessments → check lapse
  const lastDeal = company.lastDealDate ? new Date(company.lastDealDate) : null;
  if (!lastDeal) return 'NEW_ONLY';
  const elapsed = referenceDate.getTime() - lastDeal.getTime();
  if (elapsed > THREE_YEARS_MS) return 'LAPSED';
  return 'ACTIVE_REPEATED';
}

export function getCompanyCurrentScore(company: Company): number {
  const status = getCompanyStatus(company);
  // Always prefer the latest Repeated assessment score if available,
  // because it reflects actual project performance (more accurate than pre-judgement)
  if (company.repeatedAssessments.length > 0) {
    const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].scores.totalScore;
  }
  // Fall back to New (pre-judgement) score if no repeated yet
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

// ==================== AI & PREDICTIVE INTELLIGENCE ====================

export function calculateChurnRisk(company: Company): { risk: 'LOW' | 'MEDIUM' | 'HIGH', trend: number, message: string } {
  if (company.repeatedAssessments.length < 2) {
    return { risk: 'LOW', trend: 0, message: 'Data historis tidak cukup untuk prediksi Churn.' };
  }
  const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const current = sorted[0].scores;
  const previous = sorted[1].scores;
  
  const scoreTrend = current.totalScore - previous.totalScore;
  const paymentTrend = current.paymentAvg - previous.paymentAvg;
  
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let message = 'Risiko Churn rendah. Klien menunjukkan performa stabil atau meningkat.';
  
  if (scoreTrend < -0.5 || paymentTrend <= -1.0) {
    risk = 'HIGH';
    message = 'Risiko Churn TINGGI! Terjadi penurunan drastis pada skor total atau kualitas pembayaran.';
  } else if (scoreTrend < -0.2 || paymentTrend < -0.5) {
    risk = 'MEDIUM';
    message = 'Risiko Churn Sedang. Perlu perhatian pada penurunan tren pembayaran atau operasional.';
  }
  
  return { risk, trend: scoreTrend, message };
}

export function calculateLTV(company: Company): { ltvValue: number, potential: 'STAGNANT' | 'GROWING' | 'DECLINING' } {
  if (company.repeatedAssessments.length === 0) return { ltvValue: 0, potential: 'STAGNANT' };
  
  const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0].scores;
  
  // Basic LTV formula: Score Kontribusi Omset (1-5) * Score Lama Kerjasama (1-5) * Base Multiplier
  const baseMultiplier = 500_000_000; // 500 jt IDR base unit for LTV representation
  const ltvValue = latest.kontribusiOmsetScore * latest.lamaKerjasamaScore * baseMultiplier;
  
  let potential: 'STAGNANT' | 'GROWING' | 'DECLINING' = 'STAGNANT';
  if (sorted.length > 1) {
    const prev = sorted[1].scores;
    if (latest.kontribusiOmsetScore > prev.kontribusiOmsetScore) potential = 'GROWING';
    else if (latest.kontribusiOmsetScore < prev.kontribusiOmsetScore) potential = 'DECLINING';
  }
  
  return { ltvValue, potential };
}

export function generateAIExecutiveSummary(company: Company): string {
  const status = getCompanyStatus(company);
  if (status === 'NEW_ONLY' && company.newAssessments.length > 0) {
    const latest = [...company.newAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const s = latest.scores;
    
    const params = [
      { name: 'Fleet Size', score: s.fleetScore },
      { name: 'Term Payment', score: s.termPaymentScore },
      { name: 'Legal Documents', score: s.legalScore },
      { name: 'Technical Docs', score: s.technicalScore },
      { name: 'Decision Speed', score: s.decisionSpeedScore }
    ].sort((a, b) => a.score - b.score);
    
    return `Berdasarkan penilaian Pre-Judgement, ${company.companyName} mendapatkan skor awal ${s.totalScore.toFixed(2)} (${getLevel(s.totalScore).replace('_', ' ')}). Kelemahan utama yang perlu dimitigasi sebelum kesepakatan adalah pada aspek ${params[0].name} (Skor: ${params[0].score.toFixed(1)}). Pendekatan komersial harus disesuaikan dengan profil risiko ini.`;
  }
  
  if (company.repeatedAssessments.length > 0) {
    const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    const s = latest.scores;
    
    let trendMsg = '';
    if (sorted.length > 1) {
      const prev = sorted[1].scores;
      const diff = s.totalScore - prev.totalScore;
      if (diff > 0.2) trendMsg = `menunjukkan tren peningkatan performa yang positif (+${diff.toFixed(2)}).`;
      else if (diff < -0.2) trendMsg = `mengalami penurunan performa yang perlu diwaspadai (${diff.toFixed(2)}).`;
      else trendMsg = `menunjukkan performa yang relatif stabil.`;
    } else {
      trendMsg = `telah menyelesaikan penilaian pasca-proyek pertamanya.`;
    }
    
    const params = [
      { name: 'Ketepatan Bayar', score: s.ketepatanBayarScore },
      { name: 'Revisi Invoice', score: s.revisiInvoiceScore },
      { name: 'Konflik QC', score: s.konflikQCScore },
      { name: 'Komunikasi PIC', score: s.komunikasiScore },
      { name: 'Kontribusi Omset', score: s.kontribusiOmsetScore },
      { name: 'Cancel Order', score: s.cancelOrderScore }
    ].sort((a, b) => a.score - b.score);
    
    const weakest = params[0];
    const strongest = params[params.length - 1];
    
    return `Evaluasi terbaru untuk ${company.companyName} ${trendMsg} Klien saat ini berada di level ${getLevel(s.totalScore).replace('_', ' ')}. Kekuatan utama mereka ada pada aspek ${strongest.name} (Skor: ${strongest.score.toFixed(1)}), namun perlu intervensi manajerial segera pada aspek ${weakest.name} yang mencatat skor terendah (${weakest.score.toFixed(1)}). Direkomendasikan evaluasi term pembayaran atau kebijakan pada project berikutnya.`;
  }
  
  return "Belum ada data penilaian yang cukup untuk menghasilkan Executive Summary.";
}

