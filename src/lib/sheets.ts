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
 * The Google Sheet is the canonical source; this exists so the pages never
 * render an empty schedule. It mirrors the real weekly schedule so the
 * displayed cards, the hero copy ("Mon, Thu & Fri") and the derived JSON-LD
 * stay consistent when the live sheet is unavailable. Only day/time/level are
 * needed — venue and price default to the club constants in src/data/club.ts.
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

/**
 * Generic fetch — pulls any tab of a published Google Sheet as CSV.
 * gid defaults to '0' (leftmost tab).
 */
export async function fetchSheetCSV(sheetId: string, gid: string = '0'): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
  return res.text();
}

export async function fetchSessions(sheetId: string): Promise<Session[]> {
  const csv = await fetchSheetCSV(sheetId, '0');
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

/**
 * "7:00pm–9:00pm" → { range: "7 – 9", meridiem: "pm" } for the compact strip.
 * Collapses :00, pads the en-dash with thin spaces (U+2009) so the range reads
 * as two values, and — when both ends share a meridiem — returns it separately
 * so the UI can style it quietly. When the ends differ (e.g. "11am – 1pm") the
 * meridiems stay inline and `meridiem` is null. Unrecognised formats fall back
 * to a naive :00 strip with no thin spaces.
 */
export function abbreviateTime(time: string): { range: string; meridiem: string | null } {
  const match = time.match(/^(\d+)(?::(\d+))?(am|pm)\s*[–-]\s*(\d+)(?::(\d+))?(am|pm)$/i);
  if (!match) return { range: time.replace(/:00/g, ''), meridiem: null };
  const [, h1, m1, mer1, h2, m2, mer2] = match;
  const start = m1 && m1 !== '00' ? `${h1}:${m1}` : h1;
  const end = m2 && m2 !== '00' ? `${h2}:${m2}` : h2;
  const shared = mer1.toLowerCase() === mer2.toLowerCase();
  const range = shared
    ? `${start} – ${end}`
    : `${start}${mer1.toLowerCase()} – ${end}${mer2.toLowerCase()}`;
  return { range, meridiem: shared ? mer2.toLowerCase() : null };
}

// ── schema.org Event schedule derivation ───────────────────────────────────
// Lets /events build its JSON-LD from the live session data instead of a
// hardcoded block, so structured data can never drift from what's displayed.

const DAY_SCHEMA_URL: Record<string, string> = {
  monday: 'https://schema.org/Monday',
  tuesday: 'https://schema.org/Tuesday',
  wednesday: 'https://schema.org/Wednesday',
  thursday: 'https://schema.org/Thursday',
  friday: 'https://schema.org/Friday',
  saturday: 'https://schema.org/Saturday',
  sunday: 'https://schema.org/Sunday',
};

/** "8:00pm" → "20:00" (24-hour). Returns null if unparseable. */
export function to24Hour(clock: string): string | null {
  const m = clock.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (h < 1 || h > 12) return null;
  const min = m[2] ?? '00';
  if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12;
  if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

export interface SessionSchedule {
  byDay: string;      // schema.org day URL
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
}

/**
 * Convert a Session's day + "7:00pm–9:00pm" time into schema.org Schedule
 * parts. Returns null when the day or time can't be parsed, so callers can
 * skip emitting an invalid Event rather than producing broken JSON-LD.
 */
export function parseSessionSchedule(session: Session): SessionSchedule | null {
  const byDay = DAY_SCHEMA_URL[session.day.trim().toLowerCase()];
  if (!byDay) return null;
  const range = session.time.match(/^(.+?)\s*[–-]\s*(.+)$/);
  if (!range) return null;
  const startTime = to24Hour(range[1]);
  const endTime = to24Hour(range[2]);
  if (!startTime || !endTime) return null;
  return { byDay, startTime, endTime };
}

// ── Overheard quotes ──────────────────────────────────────────────────────

export interface Quote {
  quote: string;
  name: string;
  team: string;   // empty string when absent
}

/**
 * Hardcoded fallback used when the Overheard tab is unreachable.
 * One entry is enough to keep the section non-empty in dev.
 */
export const FALLBACK_QUOTES: Quote[] = [
  {
    quote: "I just heard 3 lightning strikes and was stuck in the shed cause of hail storms, I'm not going beach",
    name: 'Tope',
    team: "Men's Pride",
  },
];

export function parseQuotesCSV(csv: string): Quote[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1)
    .map(line => {
      const values = splitCSVLine(line);
      const raw: Record<string, string> = Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()]));
      return {
        quote: raw['quote'] ?? '',
        name:  raw['name']  ?? '',
        team:  raw['team']  ?? '',
      } satisfies Quote;
    })
    .filter(q => q.quote.length > 0);
}

/**
 * Returns quotes from the Overheard tab if both sheetId and gid are set,
 * otherwise from FALLBACK_QUOTES. Resolves `usingFallback` so callers can
 * surface a notice if needed (currently no UI for this — the component
 * just renders whatever it gets).
 */
export async function getQuotes(sheetId?: string, gid?: string): Promise<{ quotes: Quote[]; usingFallback: boolean }> {
  if (!sheetId || !gid) {
    return { quotes: FALLBACK_QUOTES, usingFallback: true };
  }
  try {
    const csv = await fetchSheetCSV(sheetId, gid);
    const parsed = parseQuotesCSV(csv);
    if (parsed.length === 0) {
      return { quotes: FALLBACK_QUOTES, usingFallback: true };
    }
    return { quotes: parsed, usingFallback: false };
  } catch (e) {
    console.warn('Google Sheets fetch failed for quotes, using fallback:', e);
    return { quotes: FALLBACK_QUOTES, usingFallback: true };
  }
}
