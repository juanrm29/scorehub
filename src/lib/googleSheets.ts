import { google } from 'googleapis';

/**
 * Returns an authenticated Google Sheets client using Service Account credentials.
 * Credentials must be set in environment variables:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  - service account email
 *   GOOGLE_PRIVATE_KEY            - private key (from JSON, with \n replaced by actual newlines)
 *   GOOGLE_SPREADSHEET_ID         - the spreadsheet ID from the sheet URL
 */
export function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY environment variables');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets', // read + write
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID ?? '';

/**
 * Fetch all rows from a specific sheet tab.
 */
export async function fetchSheetRows(sheetName: string): Promise<any[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}`,
  });
  return (res.data.values ?? []) as any[][];
}

/**
 * Fetch list of all sheet tab names in the spreadsheet.
 */
export async function fetchSheetNames(): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  return (res.data.sheets ?? []).map((s: any) => s.properties?.title ?? '').filter(Boolean);
}

/**
 * Append a new row to a sheet tab.
 * Used when a new assessment/company is saved from the web app.
 */
export async function appendRow(sheetName: string, values: (string | number | null)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

/**
 * Update a specific row in a sheet tab (by row number, 1-indexed).
 */
export async function updateRow(sheetName: string, rowNumber: number, values: (string | number | null)[]): Promise<void> {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A${rowNumber}:AZ${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

/**
 * Ensure a sheet tab exists; create it if not.
 */
export async function ensureSheet(sheetName: string): Promise<void> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets?.some((s: any) => s.properties?.title === sheetName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
  }
}
