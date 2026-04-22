'use client';

/**
 * store.ts
 *
 * Architecture:
 *   Google Sheets  = single source of truth (server-side via /api/sheets)
 *   localStorage   = client-side cache for instant reads
 *
 * On first load  : syncFromSheets() → fetches Sheets → stores in localStorage
 * On every save  : write to localStorage immediately (instant UI),
 *                  then push to Sheets in background (fire-and-forget)
 */

import { Company, NewAssessment, RepeatedAssessment } from './types';
import { calculateNewCustomer, calculateRepeatedCustomer, getCompanyStatus } from './scoring';

const STORAGE_KEY = 'scorehub_companies_v2';

// ── localStorage helpers ─────────────────────────────────────────────────────

export function getCompanies(): Company[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored) as Company[]; } catch { return []; }
}

function saveLocal(companies: Company[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

// ── Unique ID ────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Sync: Google Sheets → localStorage ──────────────────────────────────────

/**
 * Call this once when the app mounts.
 * Returns the fresh Company[] from Sheets (and caches it).
 * Falls back to localStorage if Sheets is unreachable.
 */
export async function syncFromSheets(): Promise<Company[]> {
  try {
    const res = await fetch('/api/sheets', { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const companies: Company[] = data.companies ?? [];
    saveLocal(companies);
    return companies;
  } catch (e) {
    console.warn('[store] syncFromSheets failed, using localStorage cache:', e);
    return getCompanies();
  }
}

// ── Push helpers (background, non-blocking) ──────────────────────────────────

async function pushToSheets(action: string, payload: object) {
  try {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[store] pushToSheets(${action}) failed:`, err);
    }
  } catch (e) {
    console.warn(`[store] pushToSheets(${action}) network error:`, e);
  }
}

// ── Company operations ───────────────────────────────────────────────────────

export function addCompany(
  company: Omit<Company, 'id' | 'newAssessments' | 'repeatedAssessments' | 'lastDealDate'>
): Company {
  const all = getCompanies();
  const newCompany: Company = {
    ...company,
    id: uid(),
    newAssessments: [],
    repeatedAssessments: [],
    lastDealDate: null,
  };
  all.push(newCompany);
  saveLocal(all);
  // Sync to Sheets in background
  pushToSheets('save_company', { company: newCompany });
  return newCompany;
}

export function updateCompany(id: string, updates: Partial<Omit<Company, 'id' | 'newAssessments' | 'repeatedAssessments'>>) {
  const all = getCompanies();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  saveLocal(all);
  pushToSheets('save_company', { company: all[idx] });
}

// ── New Assessment ───────────────────────────────────────────────────────────

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
  saveLocal(all);

  // Sync to Sheets in background
  pushToSheets('save_new', { company, assessment });

  return assessment;
}

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
  saveLocal(all);

  pushToSheets('save_new', { company, assessment: company.newAssessments[idx] });

  return company.newAssessments[idx];
}

// ── Repeated Assessment ──────────────────────────────────────────────────────

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
  saveLocal(all);

  // Sync to Sheets in background
  pushToSheets('save_repeated', { company, assessment });

  return assessment;
}

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
  company.repeatedAssessments[idx] = {
    ...company.repeatedAssessments[idx],
    projectName, periodStart, periodEnd, input, scores, notes,
  };
  saveLocal(all);

  pushToSheets('save_repeated', { company, assessment: company.repeatedAssessments[idx] });

  return company.repeatedAssessments[idx];
}

// ── Delete operations ────────────────────────────────────────────────────────

export function deleteAssessment(companyId: string, assessmentId: string, type: 'NEW' | 'REPEATED') {
  const all = getCompanies();
  const company = all.find(c => c.id === companyId);
  if (!company) return;

  if (type === 'NEW') {
    company.newAssessments = company.newAssessments.filter(a => a.id !== assessmentId);
  } else {
    company.repeatedAssessments = company.repeatedAssessments.filter(a => a.id !== assessmentId);
    const sorted = [...company.repeatedAssessments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    company.lastDealDate = sorted[0]?.date ?? null;
  }
  saveLocal(all);

  // Hard delete from Google Sheets in background
  fetch('/api/sheets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_assessment', assessmentId, type }),
  })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) console.error('[store] deleteAssessment Sheets FAILED:', data);
      else console.log('[store] deleteAssessment Sheets OK:', data);
    })
    .catch(e => console.error('[store] deleteAssessment network error:', e));
}

export function deleteCompanies(category: 'ALL' | 'NEW_ONLY' | 'ACTIVE_REPEATED' | 'LAPSED') {
  const all = getCompanies();

  let toDelete: string[];
  if (category === 'ALL') {
    toDelete = all.map(c => c.id);
    saveLocal([]);
  } else {
    const removed = all.filter(c => getCompanyStatus(c) === category);
    toDelete = removed.map(c => c.id);
    saveLocal(all.filter(c => getCompanyStatus(c) !== category));
  }

  // Hard delete each company (+ its assessments) from Google Sheets in background
  toDelete.forEach(companyId => {
    fetch('/api/sheets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_company', companyId }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) console.error('[store] deleteCompany Sheets FAILED:', companyId, data);
        else console.log('[store] deleteCompany Sheets OK:', companyId, data);
      })
      .catch(e => console.error('[store] deleteCompany network error:', companyId, e));
  });
}

export function resetData() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}
