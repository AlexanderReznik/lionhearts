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

/**
 * Defaults applied to a parsed session when its `venue`/`price` cells are blank
 * (or the columns are absent). Juniors override the price default to £3.
 */
interface SessionDefaults {
  venue?: string;
  price?: string;
}

/**
 * Parse CSV text into rows keyed by their lowercased header name (cells trimmed,
 * quoted fields honoured via splitCSVLine). Empty or header-only input → [].
 * Shared by every parse*CSV below so the line/header/quote handling lives once.
 */
function parseCSVRows(csv: string): Record<string, string>[] {
  if (!csv.trim()) return [];

  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const keys = lines[0].split(',').map(k => k.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    return Object.fromEntries(keys.map((k, i) => [k, (values[i] ?? '').trim()]));
  });
}

export function parseSessionsCSV(csv: string, defaults: SessionDefaults = {}): Session[] {
  const venueDefault = defaults.venue ?? DEFAULT_VENUE;
  const priceDefault = defaults.price ?? DEFAULT_PRICE;

  return parseCSVRows(csv).map(raw => ({
    day:   raw['day']   ?? '',
    time:  raw['time']  ?? '',
    level: raw['level'] ?? '',
    venue: raw['venue'] || venueDefault,
    price: raw['price'] || priceDefault,
  } satisfies Session));
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

/**
 * Hardcoded fallback for the junior sessions, used when GOOGLE_SHEET_ID /
 * GOOGLE_JUNIORS_GID are unset or the fetch fails. Juniors live on a separate
 * tab of the same sheet (its own gid) and only carry day + time — level/venue
 * /price default via parseSessionsCSV the same way the adult sessions do.
 */
export const JUNIOR_FALLBACK_CSV = `day,time
Saturday,1:30pm–3:30pm`;

/** Juniors are cheaper than the adult open sessions — default when unspecified. */
export const JUNIOR_DEFAULT_PRICE = '£3';
const JUNIOR_DEFAULTS: SessionDefaults = { price: JUNIOR_DEFAULT_PRICE };

/**
 * Returns the junior sessions from the dedicated juniors tab (its own gid) if
 * both sheetId and gid are set, otherwise from JUNIOR_FALLBACK_CSV. Mirrors
 * getSessions, resolving `usingFallback` so callers can surface a notice.
 * Blank price cells default to £3 (the junior rate), not the adult default.
 */
export async function getJuniorSessions(sheetId?: string, gid?: string): Promise<{ sessions: Session[]; usingFallback: boolean }> {
  if (!sheetId || !gid) {
    return { sessions: parseSessionsCSV(JUNIOR_FALLBACK_CSV, JUNIOR_DEFAULTS), usingFallback: true };
  }
  try {
    return { sessions: parseSessionsCSV(await fetchSheetCSV(sheetId, gid), JUNIOR_DEFAULTS), usingFallback: false };
  } catch (e) {
    console.warn('Google Sheets fetch failed, using fallback junior session data:', e);
    return { sessions: parseSessionsCSV(JUNIOR_FALLBACK_CSV, JUNIOR_DEFAULTS), usingFallback: true };
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
  return parseCSVRows(csv)
    .map(raw => ({
      quote: raw['quote'] ?? '',
      name:  raw['name']  ?? '',
      team:  raw['team']  ?? '',
    } satisfies Quote))
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

// ── Tryouts ────────────────────────────────────────────────────────────────
// One-off, dated tryout events for a specific team, managed on a dedicated tab
// of the same Google Sheet. Unlike sessions there is NO fallback: if the sheet
// is unreachable or has no upcoming visible rows, nothing renders. We must never
// advertise a tryout that may not be real, and the empty state is the normal
// off-season case.

export interface Tryout {
  date: string;    // raw cell, e.g. "13/09/2026"
  dateObj: Date;   // parsed, local midnight
  time: string;    // "6:00pm–8:00pm"
  team: string;
  venue: string;   // defaults to DEFAULT_VENUE when blank
  form: string;    // Google Form URL ("" when blank)
  visible: boolean;
}

/** Parse a UK day-first "DD/MM/YYYY" date to a local-midnight Date, or null. */
export function parseUKDate(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Reject overflow rollovers like 31/02 (which JS would shift into March).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

const TRYOUT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRYOUT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a tryout date for display, e.g. "Sat 13 Sep". Components may split on
 *  spaces to reuse the parts (weekday / day / month) without re-deriving them. */
export function formatTryoutDate(d: Date): string {
  return `${TRYOUT_WEEKDAYS[d.getDay()]} ${d.getDate()} ${TRYOUT_MONTHS[d.getMonth()]}`;
}

const TRYOUT_TRUTHY = ['true', 'yes', '1'];

/**
 * Parse the tryouts tab CSV into Tryout objects. Rows whose `date` cell can't be
 * parsed as UK day-first are dropped (so a half-filled planning row never breaks
 * the page). Blank `venue` falls back to DEFAULT_VENUE.
 */
export function parseTryoutsCSV(csv: string): Tryout[] {
  return parseCSVRows(csv).flatMap(raw => {
    const dateObj = parseUKDate(raw['date'] ?? '');
    if (!dateObj) return [];
    return [{
      date:    raw['date'] ?? '',
      dateObj,
      time:    raw['time'] ?? '',
      team:    raw['team'] ?? '',
      venue:   raw['venue'] || DEFAULT_VENUE,
      form:    raw['form'] ?? '',
      visible: TRYOUT_TRUTHY.includes((raw['visible'] ?? '').toLowerCase()),
    } satisfies Tryout];
  });
}

/**
 * Returns upcoming, visible tryouts from the dedicated tryouts tab (its own gid),
 * sorted soonest-first. Returns [] when sheetId/gid are unset or the fetch fails
 * — there is intentionally NO fallback (see the Tryouts section note above).
 * `now` is injectable for testing.
 */
export async function getUpcomingTryouts(
  sheetId?: string,
  gid?: string,
  now: Date = new Date(),
): Promise<Tryout[]> {
  if (!sheetId || !gid) return [];

  let csv: string;
  try {
    csv = await fetchSheetCSV(sheetId, gid);
  } catch (e) {
    console.warn('Google Sheets fetch failed for tryouts, hiding the section:', e);
    return [];
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return parseTryoutsCSV(csv)
    .filter(t => t.visible && t.dateObj.getTime() >= startOfToday.getTime())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}
