import { describe, it, expect } from 'vitest';
import { parseSessionsCSV, type Session } from '../src/lib/sheets';

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
