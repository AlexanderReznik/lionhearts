import { describe, it, expect } from 'vitest';
import { validate, constraintsFor, type Placement } from '../../src/lib/rotation';

/** Hand-checked legal formation for rotation phase 1. */
const R2: Placement = {
  4: { x: 3.2, y: 5.6 },  // OH, passer
  3: { x: 4.8, y: 0.2 },  // OPP, front row
  2: { x: 7.6, y: 0.9 },  // MB, front row
  5: { x: 1.0, y: 7.0 },  // libero, passer
  6: { x: 6.5, y: 0.5 },  // setter
  1: { x: 7.0, y: 6.0 },  // OH, passer
};
const cs = constraintsFor(1);
const move = (p: Placement, slot: keyof Placement, d: Partial<{ x: number; y: number }>): Placement =>
  ({ ...p, [slot]: { ...p[slot], ...d } });
const kindsOf = (p: Placement) => validate(p, cs).map(v => v.kind);

describe('validate', () => {
  it('passes a legal formation', () => {
    expect(validate(R2, cs)).toEqual([]);
  });

  it('rejects a back-row player in front of their front-row partner', () => {
    // libero at P5 drifts in front of the outside at P4
    expect(kindsOf(move(R2, 5, { y: 5.2 }))).toContain('depthOrder');
  });

  it('accepts a back-row player exactly level — 7.4.3.1 allows it', () => {
    expect(kindsOf(move(R2, 5, { y: 5.6 }))).not.toContain('depthOrder');
  });

  it('rejects a row out of lateral order', () => {
    expect(kindsOf(move(R2, 4, { x: 5.5 }))).toContain('lateralOrder');
  });

  it('accepts two players exactly level laterally — 7.4.3.2 allows it', () => {
    expect(kindsOf(move(R2, 4, { x: 4.8 }))).not.toContain('lateralOrder');
  });

  it('rejects a player outside our half', () => {
    expect(kindsOf(move(R2, 1, { x: 9.4 }))).toContain('inCourt');
  });

  it('rejects two players standing on top of each other', () => {
    expect(kindsOf({ ...R2, 6: { x: 7.4, y: 1.1 } })).toContain('separation');
  });

  it('rejects a passer outside the 5-7m band', () => {
    expect(kindsOf(move(R2, 1, { y: 4.4 }))).toContain('depthBand');
  });

  it('rejects passers bunched closer than 2m', () => {
    expect(kindsOf(move(R2, 5, { x: 2.6, y: 6.2 }))).toContain('spread');
  });

  it('rejects a middle loitering off the net', () => {
    expect(kindsOf(move(R2, 2, { y: 2.4 }))).toContain('nearNet');
  });

  it('rejects a setter too far from their release point', () => {
    expect(kindsOf(move(R2, 6, { y: 4.4 }))).toContain('nearPoint');
  });

  it('names the implicated slots and reads in plain English', () => {
    const [v] = validate(move(R2, 5, { y: 5.2 }), cs);
    expect(v.slots).toEqual([4, 5]);
    expect(v.message).toMatch(/level with/i);
  });

  it('uses caller labels in messages when given', () => {
    const [v] = validate(move(R2, 5, { y: 5.2 }), cs, s => `#${({ 4: 12, 5: 10 } as Record<number, number>)[s] ?? s}`);
    expect(v.message).toContain('#10');
    expect(v.message).toContain('#12');
  });
});
