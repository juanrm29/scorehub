'use client';

import { Company, NewAssessment, RepeatedAssessment } from './types';
import { companies as staticCompanies } from './data';
import { calculateNewCustomer, calculateRepeatedCustomer, getCompanyStatus } from './scoring';

const STORAGE_KEY = 'scorehub_companies';

// Initialize or get companies
export function getCompanies(): Company[] {
  if (typeof window === 'undefined') return structuredClone(staticCompanies);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staticCompanies));
    return structuredClone(staticCompanies);
  }

  try {
    return JSON.parse(stored) as Company[];
  } catch {
    return structuredClone(staticCompanies);
  }
}

function save(companies: Company[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// Generate unique ID
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Add a new company
export function addCompany(company: Omit<Company, 'id' | 'newAssessments' | 'repeatedAssessments' | 'lastDealDate'>): Company {
  const all = getCompanies();
  const newCompany: Company = {
    ...company,
    id: uid(),
    newAssessments: [],
    repeatedAssessments: [],
    lastDealDate: null,
  };
  all.push(newCompany);
  save(all);
  return newCompany;
}

// Add a New Customer assessment to a company
export function addNewAssessment(
  companyId: string,
  projectName: string,
  date: string,
  input: Parameters<typeof calculateNewCustomer>[0],
  notes?: string,
): NewAssessment {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) throw new Error('Company not found');

  const scores = calculateNewCustomer(input);
  const assessment: NewAssessment = {
    id: `n-${uid()}`,
    date,
    projectName,
    input,
    scores,
    notes,
  };
  company.newAssessments.push(assessment);
  save(all);
  return assessment;
}

// Add a Repeated Customer assessment to a company
export function addRepeatedAssessment(
  companyId: string,
  projectName: string,
  date: string,
  periodStart: string,
  periodEnd: string,
  input: Parameters<typeof calculateRepeatedCustomer>[0],
  notes?: string,
): RepeatedAssessment {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) throw new Error('Company not found');

  const scores = calculateRepeatedCustomer(input);
  const assessment: RepeatedAssessment = {
    id: `r-${uid()}`,
    date,
    projectName,
    periodStart,
    periodEnd,
    input,
    scores,
    notes,
  };
  company.repeatedAssessments.push(assessment);
  company.lastDealDate = date;
  save(all);
  return assessment;
}

// Update an existing New Assessment
export function updateNewAssessment(
  companyId: string,
  assessmentId: string,
  input: Parameters<typeof calculateNewCustomer>[0],
  notes?: string,
): NewAssessment {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) throw new Error('Company not found');
  const idx = company.newAssessments.findIndex(a => a.id === assessmentId);
  if (idx === -1) throw new Error('Assessment not found');

  const scores = calculateNewCustomer(input);
  company.newAssessments[idx] = { ...company.newAssessments[idx], input, scores, notes };
  save(all);
  return company.newAssessments[idx];
}

// Update an existing Repeated Assessment
export function updateRepeatedAssessment(
  companyId: string,
  assessmentId: string,
  projectName: string,
  periodStart: string,
  periodEnd: string,
  input: Parameters<typeof calculateRepeatedCustomer>[0],
  notes?: string,
): RepeatedAssessment {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) throw new Error('Company not found');
  const idx = company.repeatedAssessments.findIndex(a => a.id === assessmentId);
  if (idx === -1) throw new Error('Assessment not found');

  const scores = calculateRepeatedCustomer(input);
  company.repeatedAssessments[idx] = { ...company.repeatedAssessments[idx], projectName, periodStart, periodEnd, input, scores, notes };
  save(all);
  return company.repeatedAssessments[idx];
}

// Delete a single assessment
export function deleteAssessment(companyId: string, assessmentId: string, type: 'NEW' | 'REPEATED') {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) return;
  if (type === 'NEW') {
    company.newAssessments = company.newAssessments.filter(a => a.id !== assessmentId);
  } else {
    company.repeatedAssessments = company.repeatedAssessments.filter(a => a.id !== assessmentId);
    // Update lastDealDate
    const sorted = [...company.repeatedAssessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    company.lastDealDate = sorted[0]?.date ?? null;
  }
  save(all);
}

// Reset to static data
export function resetData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Delete companies by category or all
export function deleteCompanies(category: 'ALL' | 'NEW_ONLY' | 'ACTIVE_REPEATED' | 'LAPSED') {
  if (category === 'ALL') {
    save([]); // Completely empty
    return;
  }

  const all = getCompanies();
  const filtered = all.filter(c => {
    const status = getCompanyStatus(c);
    return status !== category; // keep those that DO NOT match the category
  });
  save(filtered);
}
