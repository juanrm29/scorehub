// ==================== SCORING SYSTEM TYPES ====================

export type ClientLevel = 'STRATEGIC' | 'PREFERRED' | 'REGULAR' | 'HIGH_RISK';
export type CustomerType = 'NEW' | 'REPEATED';
export type VesselType = 'Tug Boat' | 'Barge' | 'Oil Barge' | 'Self Propeller Oil Barge' | 'Landing Craft Tank' | 'Bulk Carrier' | 'Accommodation Work Barge' | 'Other';
export type ClassificationBody = 'BKI' | 'RINA' | 'Other';
export type SurveyType = 'IS' | 'SS' | 'URGENT';
export type KomunikasiLevel = 'SB' | 'B' | 'C' | 'K' | 'SK';
export type CompanyStatus = 'NEW_ONLY' | 'ACTIVE_REPEATED' | 'LAPSED';

// ==================== NEW CUSTOMER ====================
export interface NewCustomerInput {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  fleetSize: number;
  estimatedValue: number;
  termPayment: number;
  legalDocuments: string;
  backgroundMedia: string;
  hasReference: boolean;
  technicalDocuments: string;
  decisionSpeed: number;
}

export interface NewCustomerScores {
  fleetScore: number;
  valueScore: number;
  termPaymentScore: number;
  commercialPotentialAvg: number;
  commercialPotentialWeighted: number;
  legalScore: number;
  backgroundScore: number;
  referenceScore: number;
  credibilityAvg: number;
  credibilityWeighted: number;
  technicalScore: number;
  decisionSpeedScore: number;
  technicalClarityAvg: number;
  technicalClarityWeighted: number;
  totalScore: number;
  level: ClientLevel;
}

// ==================== REPEATED CUSTOMER ====================
export interface RepeatedCustomerInput {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  kontribusiOmset: number;
  margin: number;
  ketepatanBayarHari: number;
  revisiInvoice: number;
  penagihanCount: number;
  cancelOrder: number;
  scheduleVariance: number;
  konflikQC: number;
  intervensi: number;
  komunikasiPIC: KomunikasiLevel;
  claimCount: number;
  lamaKerjasama: number;
  fleetSize: number;
  hasReferral: boolean;
}

export interface RepeatedCustomerScores {
  kontribusiOmsetScore: number;
  marginScore: number;
  revenueAvg: number;
  revenueWeighted: number;
  ketepatanBayarScore: number;
  revisiInvoiceScore: number;
  penagihanScore: number;
  paymentAvg: number;
  paymentWeighted: number;
  cancelOrderScore: number;
  scheduleVarianceScore: number;
  konflikQCScore: number;
  intervensiScore: number;
  operationalAvg: number;
  operationalWeighted: number;
  komunikasiScore: number;
  claimScore: number;
  relationshipAvg: number;
  relationshipWeighted: number;
  lamaKerjasamaScore: number;
  fleetScore: number;
  referralScore: number;
  valueAvg: number;
  valueWeighted: number;
  totalScore: number;
  level: ClientLevel;
}

// ==================== ASSESSMENT RECORDS ====================
export interface NewAssessment {
  id: string;
  date: string;
  projectName: string;
  input: NewCustomerInput;
  scores: NewCustomerScores;
  notes?: string;
}

export interface RepeatedAssessment {
  id: string;
  date: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  input: RepeatedCustomerInput;
  scores: RepeatedCustomerScores;
  notes?: string;
}

// ==================== COMPANY PROFILE ====================
export interface Company {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  fleetSize: number;
  industry: string;
  registeredDate: string;
  newAssessments: NewAssessment[];
  repeatedAssessments: RepeatedAssessment[];
  lastDealDate: string | null;
}

// Legacy compat
export interface ClientMaster {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  customerType: CustomerType;
  fleetSize: number;
  legalDocuments: string;
  technicalDocuments: string;
  vesselCount: number;
  lastScore: number;
  level: ClientLevel;
  createdAt: string;
  updatedAt: string;
}

// ==================== PARAMETER CONFIG ====================
export interface ScoringWeight {
  id: string;
  category: string;
  weight: number;
  maxScore: number;
  maxValue: number;
  formula: string;
  customerType: CustomerType;
}

export interface ScoringThreshold {
  level: ClientLevel;
  minScore: number;
  maxScore: number;
  description: string;
  color: string;
}
