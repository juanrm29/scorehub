/**
 * /api/sheets  — Google Sheets as the primary database
 *
 * GET  /api/sheets          → load all data → Company[]
 * POST /api/sheets          → save company / assessment to Sheets
 *
 * POST body shapes:
 *   { action: 'init' }                               – ensure tabs + headers
 *   { action: 'save_company',  company }             – upsert company row
 *   { action: 'save_new',      company, assessment } – upsert new assessment
 *   { action: 'save_repeated', company, assessment } – upsert repeated assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ensureAllSheets,
  saveCompany,
  saveNewAssessment,
  saveRepeatedAssessment,
  loadAllData,
} from '@/lib/sheetsDb';
import { Company, NewAssessment, RepeatedAssessment } from '@/lib/types';

export const dynamic = 'force-dynamic';

// ── GET: load all structured data ────────────────────────────────────────────

export async function GET() {
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
