import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSessionsCSV,
  parseQuotesCSV,
  parseTryoutsCSV,
  formatTryoutDate,
  getUpcomingTryouts,
  abbreviateDay,
  abbreviateTime,
  to24Hour,
  parseSessionSchedule,
  nextOccurrences,
  tryoutOccurrence,
  parsePriceGBP,
  getSessions,
  getJuniorSessions,
  getQuotes,
  FALLBACK_QUOTES,
  parseUKDate,
  type Session,
  type Tryout,
} from '../src/lib/sheets';

const makeSession = (over: Partial<Session> = {}): Session => ({
  day: 'Monday',
  time: '7:00pm–9:00pm',
  level: 'All Levels',
  venue: 'Mulberry Academy',
  price: '£8',
  ...over,
});

describe('parseSessionsCSV', () => {
  it('parses a valid CSV into session objects', () => {
    const csv = `day,time,level,venue,price
Monday,7:00pm–9:00pm,All Levels,Mulberry Academy,£8
Friday,8:00pm–10:00pm,Intermediate / Advanced,Mulberry Academy,£8`;

    const result = parseSessionsCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<Session>({
      day: 'Monday',
      time: '7:00pm–9:00pm',
      level: 'All Levels',
      venue: 'Mulberry Academy',
      price: '£8',
    });
    expect(result[1].level).toBe('Intermediate / Advanced');
  });

  it('returns empty array for empty string', () => {
    expect(parseSessionsCSV('')).toEqual([]);
  });

  it('returns empty array when only header row present', () => {
    expect(parseSessionsCSV('day,time,level,venue,price')).toEqual([]);
  });

  it('handles quoted fields containing commas', () => {
    const csv = `day,time,level,venue,price
Monday,7:00pm–9:00pm,All Levels,"Mulberry Academy, Shoreditch",£8`;

    const result = parseSessionsCSV(csv);
    expect(result[0].venue).toBe('Mulberry Academy, Shoreditch');
  });

  it('trims whitespace from field values', () => {
    const csv = `day,time,level,venue,price
 Monday , 7:00pm–9:00pm , All Levels , Mulberry Academy , £8 `;

    const result = parseSessionsCSV(csv);
    expect(result[0].day).toBe('Monday');
    expect(result[0].price).toBe('£8');
  });

  it('defaults venue and price when columns are absent', () => {
    const csv = `day,time,level
Monday,7:00pm–9:00pm,All Levels`;

    const result = parseSessionsCSV(csv);
    expect(result[0].venue).toBe('Mulberry Academy Shoreditch');
    expect(result[0].price).toBe('£8 cash / £10 card');
  });

  it('defaults venue and price when cells are blank', () => {
    const csv = `day,time,level,venue,price
Monday,7:00pm–9:00pm,All Levels,,`;

    const result = parseSessionsCSV(csv);
    expect(result[0].venue).toBe('Mulberry Academy Shoreditch');
    expect(result[0].price).toBe('£8 cash / £10 card');
  });

  it('uses per-row override when venue or price is filled', () => {
    const csv = `day,time,level,venue,price
Saturday,10:00am–12:00pm,Beach,Hyde Park Beach Courts,£12`;

    const result = parseSessionsCSV(csv);
    expect(result[0].venue).toBe('Hyde Park Beach Courts');
    expect(result[0].price).toBe('£12');
  });
});

describe('abbreviateDay', () => {
  it('returns first three characters', () => {
    expect(abbreviateDay('Monday')).toBe('Mon');
    expect(abbreviateDay('Thursday')).toBe('Thu');
    expect(abbreviateDay('Friday')).toBe('Fri');
  });
});

describe('abbreviateTime', () => {
  // U+2009 THIN SPACE pads the en-dash in the formatted range.
  const T = ' ';

  it('drops :00 minutes and returns a shared meridiem separately', () => {
    expect(abbreviateTime('7:00pm–9:00pm')).toEqual({ range: `7${T}–${T}9`, meridiem: 'pm' });
    expect(abbreviateTime('8:00pm–10:00pm')).toEqual({ range: `8${T}–${T}10`, meridiem: 'pm' });
  });

  it('keeps non-zero minutes', () => {
    expect(abbreviateTime('7:30pm–9:30pm')).toEqual({ range: `7:30${T}–${T}9:30`, meridiem: 'pm' });
  });

  it('keeps both meridiems inline (no separate meridiem) when they differ', () => {
    expect(abbreviateTime('11:00am–1:00pm')).toEqual({ range: `11am${T}–${T}1pm`, meridiem: null });
  });

  it('falls back gracefully on unrecognised formats', () => {
    expect(abbreviateTime('TBC')).toEqual({ range: 'TBC', meridiem: null });
    // 24h format not matched by the regex — naive :00 strip still kicks in
    expect(abbreviateTime('19:00–21:00')).toEqual({ range: '19–21', meridiem: null });
  });
});

describe('to24Hour', () => {
  it('converts pm times, leaving noon untouched', () => {
    expect(to24Hour('7:00pm')).toBe('19:00');
    expect(to24Hour('12:00pm')).toBe('12:00');
    expect(to24Hour('8pm')).toBe('20:00');
  });

  it('converts am times, mapping midnight correctly', () => {
    expect(to24Hour('9:30am')).toBe('09:30');
    expect(to24Hour('12:00am')).toBe('00:00');
  });

  it('returns null for unparseable or out-of-range input', () => {
    expect(to24Hour('TBC')).toBeNull();
    expect(to24Hour('19:00')).toBeNull();
    expect(to24Hour('13:00pm')).toBeNull();
  });
});

describe('parseSessionSchedule', () => {
  it('derives schema.org schedule parts from day + time', () => {
    expect(parseSessionSchedule(makeSession({ day: 'Friday', time: '8:00pm–10:00pm' }))).toEqual({
      byDay: 'https://schema.org/Friday',
      startTime: '20:00',
      endTime: '22:00',
    });
  });

  it('handles a plain hyphen separator', () => {
    expect(parseSessionSchedule(makeSession({ time: '7:00pm-9:00pm' }))?.endTime).toBe('21:00');
  });

  it('returns null for an unknown day', () => {
    expect(parseSessionSchedule(makeSession({ day: 'Someday' }))).toBeNull();
  });

  it('returns null for an unparseable time', () => {
    expect(parseSessionSchedule(makeSession({ time: 'TBC' }))).toBeNull();
  });
});

describe('parsePriceGBP', () => {
  it('extracts the first GBP amount from a plain price', () => {
    expect(parsePriceGBP('£3')).toBe('3');
  });

  it('takes the first (cash) amount from a compound price', () => {
    expect(parsePriceGBP('£8 cash / £10 card')).toBe('8');
  });

  it('handles decimals', () => {
    expect(parsePriceGBP('£7.50')).toBe('7.50');
  });

  it('returns null when there is no GBP amount', () => {
    expect(parsePriceGBP('Free')).toBeNull();
    expect(parsePriceGBP('')).toBeNull();
  });
});

describe('nextOccurrences', () => {
  // Monday 19:00–21:00, the standard adult session.
  const monday = {
    byDay: 'https://schema.org/Monday',
    startTime: '19:00',
    endTime: '21:00',
  };

  it('returns the next N weekly occurrences with GMT offset in winter', () => {
    // Wed 7 Jan 2026, midday UTC — London is on GMT (+00:00).
    const from = new Date('2026-01-07T12:00:00Z');
    expect(nextOccurrences(monday, 2, from)).toEqual([
      { startDate: '2026-01-12T19:00:00+00:00', endDate: '2026-01-12T21:00:00+00:00' },
      { startDate: '2026-01-19T19:00:00+00:00', endDate: '2026-01-19T21:00:00+00:00' },
    ]);
  });

  it('uses the BST offset in summer', () => {
    // Wed 15 Jul 2026 — London is on BST (+01:00).
    const from = new Date('2026-07-15T12:00:00Z');
    expect(nextOccurrences(monday, 1, from)).toEqual([
      { startDate: '2026-07-20T19:00:00+01:00', endDate: '2026-07-20T21:00:00+01:00' },
    ]);
  });

  it('includes today when the session has not ended yet', () => {
    // Monday 5 Jan 2026, 18:00 London (GMT) — session starts at 19:00.
    const from = new Date('2026-01-05T18:00:00Z');
    expect(nextOccurrences(monday, 1, from)[0].startDate).toBe('2026-01-05T19:00:00+00:00');
  });

  it('skips today once the session has ended', () => {
    // Monday 5 Jan 2026, 21:30 London — session ended at 21:00.
    const from = new Date('2026-01-05T21:30:00Z');
    expect(nextOccurrences(monday, 1, from)[0].startDate).toBe('2026-01-12T19:00:00+00:00');
  });

  it('crosses the GMT→BST transition with per-date offsets', () => {
    // DST starts Sun 29 Mar 2026. Friday session, from Wed 25 Mar 2026.
    const friday = { byDay: 'https://schema.org/Friday', startTime: '20:00', endTime: '22:00' };
    const from = new Date('2026-03-25T12:00:00Z');
    expect(nextOccurrences(friday, 2, from)).toEqual([
      { startDate: '2026-03-27T20:00:00+00:00', endDate: '2026-03-27T22:00:00+00:00' },
      { startDate: '2026-04-03T20:00:00+01:00', endDate: '2026-04-03T22:00:00+01:00' },
    ]);
  });

  it('resolves "today" in London time, not UTC', () => {
    // 23:30 UTC on Mon 13 Jul 2026 is already 00:30 Tue in London (BST),
    // so the Monday session must resolve to the following Monday.
    const from = new Date('2026-07-13T23:30:00Z');
    expect(nextOccurrences(monday, 1, from)[0].startDate).toBe('2026-07-20T19:00:00+01:00');
  });

  it('returns [] for an unknown byDay URL', () => {
    const bad = { ...monday, byDay: 'https://schema.org/Someday' };
    expect(nextOccurrences(bad, 2, new Date('2026-01-07T12:00:00Z'))).toEqual([]);
  });
});

describe('tryoutOccurrence', () => {
  const makeTryout = (over: Partial<Tryout> = {}): Tryout => ({
    date: '13/09/2026',
    dateObj: new Date(2026, 8, 13), // 13 Sep 2026, local midnight
    time: '6:00pm–8:00pm',
    team: "Men's Pride",
    venue: 'Mulberry Academy Shoreditch',
    form: 'https://forms.gle/abc',
    visible: true,
    ...over,
  });

  it('builds a dated occurrence from the tryout date + time (BST in September)', () => {
    expect(tryoutOccurrence(makeTryout())).toEqual({
      startDate: '2026-09-13T18:00:00+01:00',
      endDate: '2026-09-13T20:00:00+01:00',
    });
  });

  it('uses the GMT offset for a winter tryout', () => {
    expect(tryoutOccurrence(makeTryout({ dateObj: new Date(2026, 11, 5), date: '05/12/2026' }))).toEqual({
      startDate: '2026-12-05T18:00:00+00:00',
      endDate: '2026-12-05T20:00:00+00:00',
    });
  });

  it('handles a plain hyphen separator and minutes', () => {
    expect(tryoutOccurrence(makeTryout({ time: '6:30pm-8:30pm' }))).toEqual({
      startDate: '2026-09-13T18:30:00+01:00',
      endDate: '2026-09-13T20:30:00+01:00',
    });
  });

  it('returns null when the time is unparseable', () => {
    expect(tryoutOccurrence(makeTryout({ time: 'TBC' }))).toBeNull();
  });
});

describe('getSessions', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('returns fallback when no sheet ID is provided', async () => {
    const { sessions, usingFallback } = await getSessions();
    expect(usingFallback).toBe(true);
    // Fallback mirrors the real weekly schedule (Mon, Thu, Fri).
    expect(sessions.map(s => s.day)).toEqual(['Monday', 'Thursday', 'Friday']);
  });

  it('returns live data when the fetch succeeds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `day,time,level,venue,price\nTuesday,6:00pm–8:00pm,All Levels,Mulberry,£10`,
    } as Response);

    const { sessions, usingFallback } = await getSessions('test-sheet-id');
    expect(usingFallback).toBe(false);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].day).toBe('Tuesday');
  });

  it('falls back when the fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    const { sessions, usingFallback } = await getSessions('test-sheet-id');
    expect(usingFallback).toBe(true);
    expect(sessions).toHaveLength(3);
  });
});

describe('getJuniorSessions', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('returns fallback when sheet ID or gid is missing', async () => {
    const noId = await getJuniorSessions(undefined, '123');
    expect(noId.usingFallback).toBe(true);
    expect(noId.sessions.map(s => s.day)).toEqual(['Saturday']);

    const noGid = await getJuniorSessions('sheet-id');
    expect(noGid.usingFallback).toBe(true);
    expect(noGid.sessions).toHaveLength(1);
    // Juniors default to the £3 rate, not the adult open-session price.
    expect(noGid.sessions[0].price).toBe('£3');
  });

  it('returns live data and defaults the price to £3 when unspecified', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `day,time\nSaturday,1:30pm–3:30pm\nSunday,10:00am–12:00pm`,
    } as Response);

    const { sessions, usingFallback } = await getJuniorSessions('sheet-id', '123');
    expect(usingFallback).toBe(false);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].day).toBe('Saturday');
    expect(sessions.every(s => s.price === '£3')).toBe(true);
  });

  it('respects an explicit price column over the £3 default', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `day,time,price\nSaturday,1:30pm–3:30pm,£5`,
    } as Response);

    const { sessions } = await getJuniorSessions('sheet-id', '123');
    expect(sessions[0].price).toBe('£5');
  });

  it('falls back when the fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    const { sessions, usingFallback } = await getJuniorSessions('sheet-id', '123');
    expect(usingFallback).toBe(true);
    expect(sessions).toHaveLength(1);
  });
});

describe('parseQuotesCSV', () => {
  it('parses required + optional columns', () => {
    const csv = `quote,name,team
"Some weird thing",Tope,Men's Pride
"Another one",Sara,Women's Cats`;

    const result = parseQuotesCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ quote: 'Some weird thing', name: 'Tope', team: "Men's Pride" });
    expect(result[1].name).toBe('Sara');
  });

  it('defaults team to empty string when column is absent', () => {
    const csv = `quote,name
"Hello",Tope`;

    const result = parseQuotesCSV(csv);
    expect(result[0].team).toBe('');
  });

  it('defaults team to empty string when cell is blank', () => {
    const csv = `quote,name,team
"Hello",Tope,`;

    const result = parseQuotesCSV(csv);
    expect(result[0].team).toBe('');
  });

  it('skips rows where quote is blank', () => {
    const csv = `quote,name,team
"First one",Tope,Men's Pride
,Sara,Women's Cats
"Third one",Alex,Men's Roar`;

    const result = parseQuotesCSV(csv);
    expect(result).toHaveLength(2);
    expect(result.map(q => q.name)).toEqual(['Tope', 'Alex']);
  });

  it('handles quoted fields containing commas', () => {
    const csv = `quote,name,team
"It was raining, snowing, and hailing at once",Tope,Men's Pride`;

    const result = parseQuotesCSV(csv);
    expect(result[0].quote).toBe('It was raining, snowing, and hailing at once');
  });
});

describe('getQuotes', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('returns fallback when no sheet ID is provided', async () => {
    const { quotes, usingFallback } = await getQuotes();
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });

  it('returns fallback when no gid is provided', async () => {
    const { quotes, usingFallback } = await getQuotes('sheet-id');
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });

  it('returns live data when the fetch succeeds', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `quote,name,team\n"A live one",Sara,Women's Cats`,
    } as Response);

    const { quotes, usingFallback } = await getQuotes('sheet-id', '123');
    expect(usingFallback).toBe(false);
    expect(quotes).toHaveLength(1);
    expect(quotes[0].name).toBe('Sara');
  });

  it('falls back when the fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    const { quotes, usingFallback } = await getQuotes('sheet-id', '123');
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });

  it('falls back when fetch succeeds but returns no parseable rows', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `quote,name,team\n,Anonymous,`,
    } as Response);

    const { quotes, usingFallback } = await getQuotes('sheet-id', '123');
    expect(usingFallback).toBe(true);
    expect(quotes).toEqual(FALLBACK_QUOTES);
  });
});

describe('parseUKDate', () => {
  it('parses DD/MM/YYYY day-first into a local-midnight date', () => {
    const d = parseUKDate('13/09/2026');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(8); // September is month index 8
    expect(d!.getDate()).toBe(13);
    expect(d!.getHours()).toBe(0);
  });

  it('accepts single-digit day and month', () => {
    const d = parseUKDate('1/2/2026');
    expect(d!.getMonth()).toBe(1); // '1/2/2026' is 1 February (UK day-first) → month index 1
    expect(d!.getDate()).toBe(1);
  });

  it('respects leap years', () => {
    expect(parseUKDate('29/02/2024')).not.toBeNull(); // 2024 is a leap year
    expect(parseUKDate('29/02/2025')).toBeNull();      // 2025 is not
  });

  it('returns null for unparseable or impossible dates', () => {
    expect(parseUKDate('')).toBeNull();
    expect(parseUKDate('2026-09-13')).toBeNull(); // ISO not accepted
    expect(parseUKDate('31/02/2026')).toBeNull(); // Feb 31 overflows
    expect(parseUKDate('13/13/2026')).toBeNull(); // month 13
  });
});

describe('parseTryoutsCSV', () => {
  const header = 'date,time,team,venue,form,visible';

  it('parses a row into a Tryout, parsing visible truthiness', () => {
    const csv = `${header}\n13/09/2026,6:00pm–8:00pm,Men's NVL,The Castle,https://forms.gle/abc,TRUE`;
    const result = parseTryoutsCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<Tryout>>({
      date: '13/09/2026',
      time: '6:00pm–8:00pm',
      team: "Men's NVL",
      venue: 'The Castle',
      form: 'https://forms.gle/abc',
      visible: true,
    });
    expect(result[0].dateObj.getDate()).toBe(13);
  });

  it('defaults a blank venue to the club default and marks non-truthy visible false', () => {
    const csv = `${header}\n14/09/2026,2:00pm–4:00pm,Women's LVA,,https://forms.gle/xyz,FALSE`;
    const result = parseTryoutsCSV(csv);
    expect(result[0].venue).toBe('Mulberry Academy Shoreditch');
    expect(result[0].visible).toBe(false);
  });

  it('drops rows whose date will not parse', () => {
    const csv = `${header}\nTBC,6:00pm–8:00pm,Men's NVL,The Castle,https://forms.gle/abc,TRUE`;
    expect(parseTryoutsCSV(csv)).toHaveLength(0);
  });

  it('returns [] for empty or header-only input', () => {
    expect(parseTryoutsCSV('')).toEqual([]);
    expect(parseTryoutsCSV(header)).toEqual([]);
  });
});

describe('formatTryoutDate', () => {
  it('formats a date as "Wkd D Mon" deterministically', () => {
    // 13 Sep 2026 is a Sunday.
    expect(formatTryoutDate(new Date(2026, 8, 13))).toBe('Sun 13 Sep');
    // 1 Jan 2027 is a Friday.
    expect(formatTryoutDate(new Date(2027, 0, 1))).toBe('Fri 1 Jan');
  });
});

describe('getUpcomingTryouts', () => {
  const realFetch = globalThis.fetch;
  const header = 'date,time,team,venue,form,visible';

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('returns [] when sheet ID or gid is missing (no fetch attempted)', async () => {
    expect(await getUpcomingTryouts(undefined, 'gid')).toEqual([]);
    expect(await getUpcomingTryouts('sheet-id', undefined)).toEqual([]);
  });

  it('returns [] when the fetch fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);
    expect(await getUpcomingTryouts('sheet-id', 'gid')).toEqual([]);
  });

  it('keeps only visible, today-or-future rows and sorts soonest-first', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => [
        header,
        '20/09/2026,1:30pm–3:30pm,Juniors,,https://forms.gle/c,TRUE',  // future, visible → keep
        '13/09/2026,6:00pm–8:00pm,Men,The Castle,https://forms.gle/a,TRUE', // future, visible → keep (earlier)
        '14/09/2026,2:00pm–4:00pm,Women,,https://forms.gle/b,FALSE', // future but hidden → drop
        '01/01/2020,6:00pm–8:00pm,Past,,https://forms.gle/d,TRUE',   // past → drop
      ].join('\n'),
    } as Response);

    const now = new Date(2026, 8, 1); // 1 Sep 2026
    const result = await getUpcomingTryouts('sheet-id', 'gid', now);

    expect(result.map(t => t.team)).toEqual(['Men', 'Juniors']);
  });

  it('treats a tryout happening today as upcoming', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${header}\n15/09/2026,6:00pm–8:00pm,Today,,https://forms.gle/a,TRUE`,
    } as Response);
    // now is later in the same day; tryout date is midnight today.
    const now = new Date(2026, 8, 15, 18, 30);
    const result = await getUpcomingTryouts('sheet-id', 'gid', now);
    expect(result).toHaveLength(1);
  });
});
