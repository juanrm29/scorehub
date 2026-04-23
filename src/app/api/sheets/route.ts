/**
 * /api/sheets  — Google Sheets as the primary database
 *
 * GET  /api/sheets          → load all data → Company[]
 * POST /api/sheets          → save company / assessment to Sheets
 * DELETE /api/sheets        → hard delete company or assessment from Sheets
 *
 * POST body shapes:
 *   { action: 'init' }                               – ensure tabs + headers
 *   { action: 'save_company',  company }             – upsert company row
 *   { action: 'save_new',      company, assessment } – upsert new assessment
 *   { action: 'save_repeated', company, assessment } – upsert repeated assessment
 *
 * DELETE body shapes:
 *   { action: 'delete_assessment', assessmentId, type: 'NEW' | 'REPEATED' }
 *   { action: 'delete_company',    companyId }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ensureAllSheets,
  saveCompany,
  saveNewAssessment,
  saveRepeatedAssessment,
  loadAllData,
  deleteAssessmentRow,
  deleteCompanyRow,
} from '@/lib/sheetsDb';
import { Company, NewAssessment, RepeatedAssessment } from '@/lib/types';

export const dynamic = 'force-dynamic';

// ── SEC-01: Lightweight internal API key guard ────────────────────────────────
// Set INTERNAL_API_SECRET in .env.local to protect the endpoint.
// The client (store.ts) must send this header on every request.
// Falls back to permissive mode (no secret check) if the env var is absent (dev convenience).
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return true; // No secret configured → allow (dev / first-time setup)
  const header = req.headers.get('x-api-secret');
  return header === secret;
}

// ── GET: load all structured data ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureAllSheets();
    const companies = await loadAllData();
    return NextResponse.json({ companies, syncedAt: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/sheets error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST: write structured data ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    await ensureAllSheets();

    if (action === 'init') {
      return NextResponse.json({ ok: true, action: 'init' });
    }

    if (action === 'save_company') {
      const { company } = body as { company: Company };
      if (!company?.id) return NextResponse.json({ error: 'Missing company.id' }, { status: 400 });
      await saveCompany(company);
      return NextResponse.json({ ok: true, action: 'save_company', id: company.id });
    }

    if (action === 'save_new') {
      const { company, assessment } = body as {
        company: Company;
        assessment: NewAssessment;
      };
      if (!company?.id || !assessment?.id)
        return NextResponse.json({ error: 'Missing company or assessment' }, { status: 400 });
      await saveCompany(company);
      await saveNewAssessment(company, assessment);
      return NextResponse.json({ ok: true, action: 'save_new', id: assessment.id });
    }

    if (action === 'save_repeated') {
      const { company, assessment } = body as {
        company: Company;
        assessment: RepeatedAssessment;
      };
      if (!company?.id || !assessment?.id)
        return NextResponse.json({ error: 'Missing company or assessment' }, { status: 400 });
      await saveCompany(company);
      await saveRepeatedAssessment(company, assessment);
      return NextResponse.json({ ok: true, action: 'save_repeated', id: assessment.id });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/sheets error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE: hard delete a row from Sheets ──────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === 'delete_assessment') {
      const { assessmentId, type } = body as { assessmentId: string; type: 'NEW' | 'REPEATED' };
      if (!assessmentId || !type)
        return NextResponse.json({ error: 'Missing assessmentId or type' }, { status: 400 });
      await deleteAssessmentRow(assessmentId, type);
      return NextResponse.json({ ok: true, action, assessmentId });
    }

    if (action === 'delete_company') {
      const { companyId } = body as { companyId: string };
      if (!companyId)
        return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
      await deleteCompanyRow(companyId);
      return NextResponse.json({ ok: true, action, companyId });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('DELETE /api/sheets error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
