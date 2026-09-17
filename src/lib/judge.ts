import { constraintsFor, type Constraint, type Phase } from './rotation';

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
