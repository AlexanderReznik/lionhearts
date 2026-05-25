import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSessionsCSV,
  abbreviateDay,
  abbreviateTime,
  getSessions,
  type Session,
} from '../src/lib/sheets';

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
});

describe('abbreviateDay', () => {
  it('returns first three characters', () => {
    expect(abbreviateDay('Monday')).toBe('Mon');
    expect(abbreviateDay('Thursday')).toBe('Thu');
    expect(abbreviateDay('Friday')).toBe('Fri');
  });
});

describe('abbreviateTime', () => {
  it('drops :00 minutes and dedupes the meridiem when both ends match', () => {
    expect(abbreviateTime('7:00pm–9:00pm')).toBe('7–9pm');
    expect(abbreviateTime('8:00pm–10:00pm')).toBe('8–10pm');
  });

  it('keeps non-zero minutes', () => {
    expect(abbreviateTime('7:30pm–9:30pm')).toBe('7:30–9:30pm');
  });

  it('keeps both meridiems when they differ', () => {
    expect(abbreviateTime('11:00am–1:00pm')).toBe('11am–1pm');
  });

  it('falls back gracefully on unrecognised formats', () => {
    expect(abbreviateTime('TBC')).toBe('TBC');
    // 24h format not matched by the regex — naive :00 strip still kicks in
    expect(abbreviateTime('19:00–21:00')).toBe('19–21');
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
    expect(sessions.length).toBe(3);
    expect(sessions[0].day).toBe('Monday');
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
    expect(sessions.length).toBe(3);
  });
});
