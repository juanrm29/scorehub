import { NextRequest, NextResponse } from 'next/server';
import { fetchSheetNames, fetchSheetRows, appendRow, ensureSheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sheets
 * Read all sheets data for syncing into ScoreHub.
 */
export async function GET() {
  try {
    const sheetNames = await fetchSheetNames();
    const result: Record<string, any[][]> = {};

    await Promise.all(
      sheetNames.map(async (name) => {
        try {
          result[name] = await fetchSheetRows(name);
        } catch (err) {
          console.warn(`Failed to fetch sheet "${name}":`, err);
          result[name] = [];
        }
      })
    );

    return NextResponse.json({ sheets: result, fetchedAt: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/sheets
 * Write a new assessment row to Google Sheets.
 * 
 * Body:
 * {
 *   sheetName: string,       // tab name e.g. "SCORING 2025"
 *   row: (string|number)[]   // cell values to append
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetName, row } = body as { sheetName: string; row: (string | number | null)[] };

    if (!sheetName || !row || !Array.isArray(row)) {
      return NextResponse.json({ error: 'Missing sheetName or row' }, { status: 400 });
    }

    // Create sheet tab if it doesn't exist yet
    await ensureSheet(sheetName);

    // Append the row
    await appendRow(sheetName, row);

    return NextResponse.json({ success: true, sheetName, rowLength: row.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/sheets error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
