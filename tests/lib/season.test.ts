import { describe, it, expect } from 'vitest';
import { isChristmasSeason } from '../../src/lib/season';

const at = (iso: string) => new Date(iso);

describe('isChristmasSeason', () => {
  it('is off on 30 November', () => {
    expect(isChristmasSeason(at('2026-11-30T12:00:00Z'))).toBe(false);
    expect(isChristmasSeason(at('2026-11-30T23:59:59Z'))).toBe(false);
  });
  it('turns on at the first moment of 1 December, London time', () => {
    expect(isChristmasSeason(at('2026-12-01T00:00:00Z'))).toBe(true);
  });
  it('stays on through Christmas and New Year', () => {
    for (const iso of ['2026-12-25T12:00:00Z', '2026-12-31T23:59:59Z', '2027-01-01T00:00:00Z']) {
      expect(isChristmasSeason(at(iso))).toBe(true);
    }
  });
  it('stays on until the end of 5 January, London time', () => {
    expect(isChristmasSeason(at('2027-01-05T23:59:59Z'))).toBe(true);
  });
  it('is off from 6 January', () => {
    expect(isChristmasSeason(at('2027-01-06T00:00:00Z'))).toBe(false);
  });
  it('is off mid-year', () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'))).toBe(false);
  });
  it("forces on with 'on'", () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'), 'on')).toBe(true);
  });
  it("forces off with 'off'", () => {
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), 'off')).toBe(false);
  });
  it('falls back to the date for any other override value', () => {
    expect(isChristmasSeason(at('2026-07-15T12:00:00Z'), 'true')).toBe(false);
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), 'ON')).toBe(true);
    expect(isChristmasSeason(at('2026-12-25T12:00:00Z'), '')).toBe(true);
  });
});
