import {
  constraintsFor, validate, type Constraint, type Phase, type Placement, type Slot, type SlotLabel,
} from './rotation';

export const PHASES: Phase[] = [0, 1, 2, 3, 4, 5];

/**
 * The positional law (FIVB 7.4) only. The passing band, passer spread and
 * setter radius in `constraintsFor` are our club's receive system — a referee
 * would never call them, so the judge game must not either.
 */
export function lawConstraintsFor(phase: Phase): Constraint[] {
  return constraintsFor(phase).filter(c =>
    c.kind === 'depthOrder' || c.kind === 'lateralOrder'
    || c.kind === 'inCourt' || c.kind === 'separation');
}

export type FaultPair = readonly [Slot, Slot];
export interface Fault { pair: FaultPair; message: string; kind: 'depthOrder' | 'lateralOrder' }

/**
 * The overlapping pair, or null when the formation is legal. Only ordering
 * violations can name a fault: `inCourt` and `separation` are invariants the
 * generator guarantees, so they never reach a player.
 */
export function faultIn(p: Placement, phase: Phase, label?: SlotLabel): Fault | null {
  const v = validate(p, lawConstraintsFor(phase), label)
    .find((x): x is typeof x & { kind: 'depthOrder' | 'lateralOrder' } =>
      x.kind === 'depthOrder' || x.kind === 'lateralOrder');
  return v ? { pair: [v.slots[0], v.slots[1]] as const, message: v.message, kind: v.kind } : null;
}

export const samePair = (a: FaultPair, b: FaultPair): boolean =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
