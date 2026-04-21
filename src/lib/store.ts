'use client';

import { Company, NewAssessment, RepeatedAssessment } from './types';
import { companies as staticCompanies } from './data';
import { calculateNewCustomer, calculateRepeatedCustomer } from './scoring';

const STORAGE_KEY = 'scorehub_companies';

// Deep clone static data and merge with localStorage
export function getCompanies(): Company[] {
  if (typeof window === 'undefined') return structuredClone(staticCompanies);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(staticCompanies);

  try {
    const parsed = JSON.parse(stored) as Company[];
    // Merge: start from static, overlay stored additions
    const map = new Map<string, Company>();
    staticCompanies.forEach(c => map.set(c.id, structuredClone(c)));
    parsed.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
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

// Reset to static data
export function resetData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
