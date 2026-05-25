import { DEFAULT_VENUE, DEFAULT_PRICE } from '../data/club.ts';

export interface Session {
  day: string;
  time: string;
  level: string;
  venue: string;
  price: string;
}

/**
 * Hardcoded fallback used when GOOGLE_SHEET_ID is unset or the fetch fails.
 * Only day/time/level are needed — venue and price default to the club
 * constants in src/data/club.ts.
 */
export const FALLBACK_CSV = `day,time,level
Monday,7:00pm–9:00pm,All Levels
Thursday,7:00pm–9:00pm,All Levels
Friday,8:00pm–10:00pm,Intermediate / Advanced`;

export function parseSessionsCSV(csv: string): Session[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const raw: Record<string, string> = Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()]));
    return {
      day:   raw['day']   ?? '',
      time:  raw['time']  ?? '',
      level: raw['level'] ?? '',
      venue: raw['venue'] || DEFAULT_VENUE,
      price: raw['price'] || DEFAULT_PRICE,
    } satisfies Session;
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

/**
 * Returns sessions from the live Google Sheet if GOOGLE_SHEET_ID is set,
 * otherwise from the hardcoded fallback. Resolves the `usingFallback` flag
 * so callers can show a notice when the live data isn't loaded.
 */
export async function getSessions(sheetId?: string): Promise<{ sessions: Session[]; usingFallback: boolean }> {
  if (!sheetId) {
    return { sessions: parseSessionsCSV(FALLBACK_CSV), usingFallback: true };
  }
  try {
    return { sessions: await fetchSessions(sheetId), usingFallback: false };
  } catch (e) {
    console.warn('Google Sheets fetch failed, using fallback session data:', e);
    return { sessions: parseSessionsCSV(FALLBACK_CSV), usingFallback: true };
  }
}

/** "Monday" → "Mon" */
export function abbreviateDay(day: string): string {
  return day.slice(0, 3);
}

/** "7:00pm–9:00pm" → "7–9pm" (collapses :00 and dedupes the meridiem when both ends share it). */
export function abbreviateTime(time: string): string {
  const match = time.match(/^(\d+)(?::(\d+))?(am|pm)\s*[–-]\s*(\d+)(?::(\d+))?(am|pm)$/i);
  if (!match) return time.replace(/:00/g, '');
  const [, h1, m1, mer1, h2, m2, mer2] = match;
  const start = m1 && m1 !== '00' ? `${h1}:${m1}` : h1;
  const end = m2 && m2 !== '00' ? `${h2}:${m2}` : h2;
  return mer1.toLowerCase() === mer2.toLowerCase()
    ? `${start}–${end}${mer2.toLowerCase()}`
    : `${start}${mer1.toLowerCase()}–${end}${mer2.toLowerCase()}`;
}
