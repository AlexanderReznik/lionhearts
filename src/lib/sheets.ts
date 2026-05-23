export interface Session {
  day: string;
  time: string;
  level: string;
  venue: string;
  price: string;
}

export function parseSessionsCSV(csv: string): Session[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    return Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()])) as unknown as Session;
  });
}

function splitCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export async function fetchSessions(sheetId: string): Promise<Session[]> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
  const csv = await res.text();
  return parseSessionsCSV(csv);
}
