import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSessionsCSV,
  parseQuotesCSV,
  abbreviateDay,
  abbreviateTime,
  to24Hour,
  parseSessionSchedule,
  getSessions,
  getJuniorSessions,
  getQuotes,
  FALLBACK_QUOTES,
  type Session,
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
